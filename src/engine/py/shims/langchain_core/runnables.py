import asyncio


class Runnable:
    """Base of everything composable with `|` (LangChain Expression Language)."""

    def invoke(self, input, config=None, **kwargs):
        raise NotImplementedError

    async def ainvoke(self, input, config=None, **kwargs):
        return self.invoke(input, config)

    def batch(self, inputs, config=None, **kwargs):
        return [self.invoke(i, config) for i in inputs]

    async def abatch(self, inputs, config=None, **kwargs):
        return await asyncio.gather(*[self.ainvoke(i, config) for i in inputs])

    def stream(self, input, config=None, **kwargs):
        yield from self._stream(input, config)

    def _stream(self, input, config=None):
        yield self.invoke(input, config)

    def _transform(self, chunks, config=None):
        items = list(chunks)
        if len(items) == 1:
            merged = items[0]
        elif items and all(isinstance(c, str) for c in items):
            merged = "".join(items)
        elif items:
            from .messages import AIMessage
            merged = AIMessage("".join(str(getattr(c, "content", c)) for c in items))
        else:
            merged = None
        yield self.invoke(merged, config)

    def pipe(self, *others):
        seq = self
        for o in others:
            seq = seq | o
        return seq

    def __or__(self, other):
        return RunnableSequence(self, coerce(other))

    def __ror__(self, other):
        return RunnableSequence(coerce(other), self)

    def with_config(self, **kwargs):
        return self


class RunnableSequence(Runnable):
    def __init__(self, *steps):
        flat = []
        for s in steps:
            flat.extend(s.steps if isinstance(s, RunnableSequence) else [s])
        self.steps = flat

    def invoke(self, input, config=None, **kwargs):
        for step in self.steps:
            input = step.invoke(input, config)
        return input

    def _stream(self, input, config=None):
        it = self.steps[0]._stream(input, config)
        for step in self.steps[1:]:
            it = step._transform(it, config)
        yield from it

    def __repr__(self):
        return " | ".join(repr(s) for s in self.steps)


class RunnableLambda(Runnable):
    def __init__(self, func):
        self.func = func

    def invoke(self, input, config=None, **kwargs):
        return self.func(input)

    async def ainvoke(self, input, config=None, **kwargs):
        r = self.func(input)
        if asyncio.iscoroutine(r):
            r = await r
        return r

    def __repr__(self):
        return f"RunnableLambda({getattr(self.func, '__name__', 'lambda')})"


class RunnablePassthrough(Runnable):
    def invoke(self, input, config=None, **kwargs):
        return input

    @classmethod
    def assign(cls, **kwargs):
        return RunnableAssign(kwargs)

    def __repr__(self):
        return "RunnablePassthrough()"


class RunnableAssign(Runnable):
    def __init__(self, mapping):
        self.mapping = {k: coerce(v) for k, v in mapping.items()}

    def invoke(self, input, config=None, **kwargs):
        out = dict(input)
        for k, r in self.mapping.items():
            out[k] = r.invoke(input, config)
        return out


class RunnableParallel(Runnable):
    def __init__(self, steps=None, **kwargs):
        merged = dict(steps or {})
        merged.update(kwargs)
        self.steps = {k: coerce(v) for k, v in merged.items()}

    def invoke(self, input, config=None, **kwargs):
        return {k: r.invoke(input, config) for k, r in self.steps.items()}

    def __repr__(self):
        return "RunnableParallel(" + ", ".join(self.steps) + ")"


def coerce(x):
    if isinstance(x, Runnable):
        return x
    if isinstance(x, dict):
        return RunnableParallel(x)
    if callable(x):
        return RunnableLambda(x)
    raise TypeError(f"Expected a Runnable, callable or dict, got {type(x).__name__}")
