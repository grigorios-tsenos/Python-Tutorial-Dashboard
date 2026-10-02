import inspect
import json
import operator  # noqa: F401
import typing
from typing import Annotated, TypedDict

import orbit
from langchain_core.messages import BaseMessage, to_message

from langgraph.errors import GraphRecursionError, InvalidUpdateError
from .message import add_messages

START = "__start__"
END = "__end__"


class MessagesState(TypedDict):
    messages: Annotated[list, add_messages]


def _channels(schema):
    """Return {key: reducer-or-None} and {key: default} from a TypedDict-style schema."""
    try:
        hints = typing.get_type_hints(schema, include_extras=True)
    except Exception:  # noqa: BLE001
        return {}, {}
    reducers, defaults = {}, {}
    for key, tp in hints.items():
        red = None
        if typing.get_origin(tp) is Annotated:
            base, *meta = typing.get_args(tp)
            for m in meta:
                if callable(m):
                    red = m
            if red is not None:
                origin = typing.get_origin(base) or base
                if origin in (list, dict, set):
                    defaults[key] = origin()
                elif origin in (int, float):
                    defaults[key] = origin()
                elif origin is str:
                    defaults[key] = ""
        reducers[key] = red
    return reducers, defaults


def _json_safe(v):
    def default(o):
        if isinstance(o, BaseMessage):
            return f"{type(o).__name__}: {o.content}" + (f" tool_calls={o.tool_calls}" if o.tool_calls else "")
        return repr(o)

    try:
        return json.loads(json.dumps(v, default=default))
    except Exception:  # noqa: BLE001
        return repr(v)


class StateSnapshot:
    def __init__(self, values, next_nodes):
        self.values = values
        self.next = tuple(next_nodes)

    def __repr__(self):
        return f"StateSnapshot(values={self.values!r}, next={self.next!r})"


class StateGraph:
    def __init__(self, state_schema):
        self.schema = state_schema
        self.nodes = {}
        self.edges = []
        self.conditional = []

    def add_node(self, name_or_fn, fn=None):
        if fn is None:
            fn, name = name_or_fn, name_or_fn.__name__
        else:
            name = name_or_fn
        if name in (START, END):
            raise ValueError(f"Node name '{name}' is reserved")
        if name in self.nodes:
            raise ValueError(f"Node `{name}` already present.")
        self.nodes[name] = fn
        return self

    def add_edge(self, start, end):
        self.edges.append((start, end))
        return self

    def add_conditional_edges(self, source, path, path_map=None):
        self.conditional.append((source, path, path_map))
        return self

    def set_entry_point(self, node):
        return self.add_edge(START, node)

    def set_finish_point(self, node):
        return self.add_edge(node, END)

    def compile(self, checkpointer=None, interrupt_before=None):
        known = set(self.nodes) | {START, END}
        for a, b in self.edges:
            for n in (a, b):
                if n not in known:
                    raise ValueError(f"Found edge {'starting' if n == a else 'ending'} at unknown node `{n}`")
        for src, _, pm in self.conditional:
            if src not in known:
                raise ValueError(f"Found edge starting at unknown node `{src}`")
            if isinstance(pm, dict):
                for t in pm.values():
                    if t not in known:
                        raise ValueError(f"Found edge ending at unknown node `{t}`")
        if not any(a == START for a, _ in self.edges) and not any(s == START for s, _, _ in self.conditional):
            raise ValueError("Graph must have an entrypoint: add at least one edge from START to another node")
        return CompiledStateGraph(self, checkpointer, list(interrupt_before or []))


class CompiledStateGraph:
    def __init__(self, g, checkpointer, interrupt_before):
        self.g = g
        self.checkpointer = checkpointer
        self.interrupt_before = interrupt_before
        self.reducers, self.defaults = _channels(g.schema)

    # ----- state helpers
    def _apply(self, state, update):
        for k, v in update.items():
            red = self.reducers.get(k)
            if red is not None and k in state:
                state[k] = red(state[k], v)
            elif red is not None:
                state[k] = red(self.defaults.get(k, []), v) if k in self.defaults else v
            else:
                state[k] = v

    def _initial(self):
        return {k: (v.copy() if hasattr(v, "copy") else v) for k, v in self.defaults.items()}

    def _thread(self, config):
        if self.checkpointer is None:
            return None
        try:
            return config["configurable"]["thread_id"]
        except (TypeError, KeyError):
            raise ValueError("Checkpointer requires config={'configurable': {'thread_id': ...}}") from None

    def _successors(self, node, state, observed):
        out = []
        for a, b in self.g.edges:
            if a == node:
                out.append(b)
        for src, path, pm in self.g.conditional:
            if src != node:
                continue
            r = path(state)
            rs = r if isinstance(r, (list, tuple)) else [r]
            for x in rs:
                tgt = pm[x] if isinstance(pm, dict) else x
                if tgt not in self.g.nodes and tgt != END:
                    raise ValueError(f"Router for node '{node}' returned unknown node {tgt!r}")
                out.append(tgt)
                observed.add((node, tgt, True))
        return out

    # ----- execution
    def _run(self, input, config, mode):
        config = config or {}
        limit = config.get("recursion_limit", 25)
        tid = self._thread(config)
        store = self.checkpointer.storage if self.checkpointer else None
        observed = set()
        steps = []

        if tid is not None and tid in store:
            cp = store[tid]
            state, pending = cp["state"], list(cp["next"])
            if input is not None:
                self._apply(state, input)
                pending = [n for n in self._successors(START, state, observed)]
            resuming = input is None
        else:
            state = self._initial()
            if input is None:
                raise ValueError("No saved state for this thread; pass an input")
            self._apply(state, input)
            pending = self._successors(START, state, observed)
            resuming = False

        n_steps = 0
        interrupted = False
        while True:
            pending = [p for p in dict.fromkeys(pending) if p != END]
            if not pending:
                break
            if n_steps >= limit:
                raise GraphRecursionError(f"Recursion limit of {limit} reached without hitting a stop condition. You can increase the limit by setting the `recursion_limit` config key.")
            if not resuming and any(p in self.interrupt_before for p in pending):
                interrupted = True
                break
            resuming = False
            snapshot = {k: (list(v) if isinstance(v, list) else v) for k, v in state.items()}
            updates = []
            for node in pending:
                res = self.g.nodes[node](snapshot)
                if res is None:
                    res = {}
                if not isinstance(res, dict):
                    raise InvalidUpdateError(f"Expected dict, got {res!r} for node '{node}'. Nodes must return a dict of state updates.")
                updates.append((node, res))
            nxt = []
            for node, upd in updates:
                self._apply(state, upd)
            for node, upd in updates:
                nxt.extend(self._successors(node, state, observed))
                steps.append({"node": node, "update": _json_safe(upd), "state": _json_safe(state)})
                if mode == "updates":
                    yield {node: upd}
            if mode == "values":
                yield dict(state)
            pending = nxt
            n_steps += 1

        if tid is not None:
            store[tid] = {"state": state, "next": [p for p in pending if p != END] if interrupted else []}
        self._emit(steps, observed, interrupted, pending if interrupted else [])
        self._final = dict(state)

    def _emit(self, steps, observed, interrupted, waiting):
        edges = [{"from": a, "to": b, "conditional": False} for a, b in self.g.edges]
        for src, path, pm in self.g.conditional:
            targets = list(pm.values()) if isinstance(pm, dict) else (list(pm) if pm else [])
            if not targets:
                try:
                    ret = typing.get_type_hints(path).get("return")
                    targets = list(typing.get_args(ret))
                except Exception:  # noqa: BLE001
                    targets = []
            for t in targets:
                edges.append({"from": src, "to": t, "conditional": True})
        have = {(e["from"], e["to"]) for e in edges}
        for a, b, c in observed:
            if (a, b) not in have:
                edges.append({"from": a, "to": b, "conditional": c})
        orbit.emit("graph_trace", {"nodes": list(self.g.nodes), "edges": edges, "steps": steps,
                                   "interrupted": interrupted, "waiting": waiting})

    def stream(self, input, config=None, stream_mode="updates"):
        yield from self._run(input, config, stream_mode)

    def invoke(self, input, config=None, **kwargs):
        for _ in self._run(input, config, "none"):
            pass
        return self._final

    async def ainvoke(self, input, config=None, **kwargs):
        return self.invoke(input, config)

    def get_state(self, config):
        if self.checkpointer is None:
            raise ValueError("No checkpointer set. Compile with graph.compile(checkpointer=MemorySaver()).")
        tid = self._thread(config)
        cp = self.checkpointer.storage.get(tid)
        if cp is None:
            return StateSnapshot({}, [])
        return StateSnapshot(dict(cp["state"]), cp["next"])

    def update_state(self, config, values):
        tid = self._thread(config)
        cp = self.checkpointer.storage.setdefault(tid, {"state": self._initial(), "next": []})
        self._apply(cp["state"], values)
        return config
