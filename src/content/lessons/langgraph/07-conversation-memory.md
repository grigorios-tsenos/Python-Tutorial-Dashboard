---
id: lg-memory
track: langgraph
order: 7
title: Remember the Conversation
tagline: Append new turns without mixing up different people.
kind: build
xp: 60
minutes: 8
---
@@body
# Messages need both a reducer and a checkpointer

`MessagesState` appends new messages; a `MemorySaver` keeps that state between invocations, keyed by `thread_id`. Send only the new user message each turn — resending the history would duplicate it.

> **Mission:** implement `make_chat()` to return a compiled `MessagesState` graph with one node named `reply` and a fresh `MemorySaver`. The node counts **human messages** in the saved conversation and appends an `AIMessage` with content `turn N: TEXT`, where `N` is that count and `TEXT` is the newest human message in uppercase. Wire `START → reply → END`.

A second turn in the same thread must remember the first; a different thread, or a newly built chat, starts at turn 1.
@@starter
from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver

def make_chat():
    def reply(state):
        # TODO: count human messages and append the next assistant reply
        return {"messages": [AIMessage("turn 1: HELLO")]}

    graph = StateGraph(MessagesState)
    graph.add_node("reply", reply)
    graph.add_edge(START, "reply")
    graph.add_edge("reply", END)
    # TODO: compile with a fresh checkpointer
    return graph.compile()

chat = make_chat()
config = {"configurable": {"thread_id": "demo"}}
chat.invoke({"messages": [("user", "hello")]}, config)
print(chat.invoke({"messages": [("user", "again")]}, config)["messages"][-1].content)
@@solution
from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import MemorySaver

def make_chat():
    def reply(state):
        humans = [message for message in state["messages"] if message.type == "human"]
        return {"messages": [AIMessage(f"turn {len(humans)}: {humans[-1].content.upper()}")]}

    graph = StateGraph(MessagesState)
    graph.add_node("reply", reply)
    graph.add_edge(START, "reply")
    graph.add_edge("reply", END)
    return graph.compile(checkpointer=MemorySaver())

chat = make_chat()
config = {"configurable": {"thread_id": "demo"}}
chat.invoke({"messages": [("user", "hello")]}, config)
print(chat.invoke({"messages": [("user", "again")]}, config)["messages"][-1].content)
@@check
probe_chat = make_chat()
alice = {"configurable": {"thread_id": "alice"}}
bob = {"configurable": {"thread_id": "bob"}}
first = probe_chat.invoke({"messages": [("user", "alpha")]}, alice)
second = probe_chat.invoke({"messages": [("user", "beta")]}, alice)
other = probe_chat.invoke({"messages": [("user", "different person")]}, bob)
third = probe_chat.invoke({"messages": [("user", "gamma")]}, alice)
test("new conversation starts with its own text", lambda: first["messages"][-1].content == "turn 1: ALPHA")
test("the second turn counts humans rather than every message", lambda: second["messages"][-1].content == "turn 2: BETA")
test("messages append in conversation order", lambda: [m.type for m in second["messages"]] == ["human", "ai", "human", "ai"] and [m.content for m in second["messages"]] == ["alpha", "turn 1: ALPHA", "beta", "turn 2: BETA"])
test("different thread IDs keep independent conversations", lambda: other["messages"][-1].content == "turn 1: DIFFERENT PERSON" and third["messages"][-1].content == "turn 3: GAMMA")
test("the checkpointer stores the full conversation", lambda: len(probe_chat.get_state(alice).values["messages"]) == 6 and len(probe_chat.get_state(bob).values["messages"]) == 2)
fresh = make_chat().invoke({"messages": [("user", "new app")]}, alice)
test("newly built chats do not share memory", lambda: fresh["messages"][-1].content == "turn 1: NEW APP")
@@hint
Filter `state["messages"]` for messages whose `.type` is `"human"`. Their count is the turn number and the last one holds the newest user text.
@@hint
Return only the new `AIMessage` in `{"messages": [...]}`; the reducer appends it. Compile with `checkpointer=MemorySaver()` inside `make_chat` so each new app has its own memory.
@@q
Why send only the newest user message to a saved thread?
@@a
The checkpointer already has the earlier messages, and MessagesState appends the new ones.
@@real
A real chat node passes the saved messages to a model. Durable checkpointers keep the same thread isolation when a service restarts.
