import { describe, it, expect } from 'vitest'
import { run } from './pyodide-node'

describe('langchain shim', () => {
  it('LCEL chain', async () => {
    const r = await run(`
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.language_models import FakeListChatModel
chain = ChatPromptTemplate.from_template("Say hi to {name}") | FakeListChatModel(responses=["Hello Ada!"]) | StrOutputParser()
print(chain.invoke({"name": "Ada"}))
print(list(chain.stream({"name":"Ada"}))[:3])
print(chain.batch([{"name":"a"},{"name":"b"}]))
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toContain("Hello Ada!")
    expect(r.stdout).toContain("['H', 'e', 'l']")
  })
  it('tools + react agent + graph trace', async () => {
    const r = await run(`
from langchain_core.tools import tool
from langchain_core.messages import AIMessage
from langchain_core.language_models import GenericFakeChatModel
from langgraph.prebuilt import create_react_agent
@tool
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b
print(add.name, add.description, add.args)
model = GenericFakeChatModel(messages=iter([AIMessage("", tool_calls=[{"name":"add","args":{"a":2,"b":3},"id":"c1"}]), AIMessage("It is 5")]))
agent = create_react_agent(model, [add])
out = agent.invoke({"messages": [("user", "2+3?")]})
print([m.content for m in out["messages"]])
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toContain("['2+3?', '', '5', 'It is 5']")
    expect(r.emits.find((e) => e.kind === 'graph_trace')!.data.steps.length).toBe(3)
  })
  it('memory + interrupt + recursion', async () => {
    const r = await run(`
import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
class S(TypedDict):
    log: Annotated[list, operator.add]
    n: int
def a(s): return {"log": ["a"], "n": s.get("n", 0) + 1}
def b(s): return {"log": ["b"]}
g = StateGraph(S); g.add_node("a", a); g.add_node("b", b)
g.add_edge(START, "a"); g.add_edge("a", "b"); g.add_edge("b", END)
app = g.compile(checkpointer=MemorySaver(), interrupt_before=["b"])
cfg = {"configurable": {"thread_id": "t"}}
print(app.invoke({"log": []}, cfg), app.get_state(cfg).next)
print(app.invoke(None, cfg))
loop = StateGraph(S); loop.add_node("a", a); loop.add_edge(START, "a")
loop.add_conditional_edges("a", lambda s: "a")
try:
    loop.compile().invoke({"log": []})
except Exception as e:
    print(type(e).__name__)
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toContain("{'log': ['a'], 'n': 1} ('b',)")
    expect(r.stdout).toContain("{'log': ['a', 'b'], 'n': 1}")
    expect(r.stdout).toContain('GraphRecursionError')
  })
  it('parallel writes need a reducer', async () => {
    const r = await run(`
import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.errors import InvalidUpdateError

def build(reduced):
    class S(TypedDict):
        items: Annotated[list, operator.add] if reduced else list
    g = StateGraph(S)
    g.add_node("a", lambda s: {"items": ["a"]})
    g.add_node("b", lambda s: {"items": ["b"]})
    g.add_node("join", lambda s: {})
    for n in ("a", "b"):
        g.add_edge(START, n)
        g.add_edge(n, "join")
    g.add_edge("join", END)
    return g.compile()

print(sorted(build(True).invoke({})["items"]))
try:
    build(False).invoke({"items": []})
except InvalidUpdateError as e:
    print("InvalidUpdateError", "items" in str(e))
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toBe("['a', 'b']\nInvalidUpdateError True\n")
  })
})
