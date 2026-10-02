from langchain_core.messages import ToolMessage

from langgraph.graph import END, START, MessagesState, StateGraph


def create_react_agent(model, tools, checkpointer=None):
    """Prebuilt ReAct loop: model -> (tool calls? run tools -> model) -> answer."""
    by_name = {t.name: t for t in tools}
    llm = model.bind_tools(tools)

    def agent(state):
        return {"messages": [llm.invoke(state["messages"])]}

    def run_tools(state):
        out = []
        for call in state["messages"][-1].tool_calls:
            res = by_name[call["name"]].invoke({"type": "tool_call", **call})
            out.append(res if isinstance(res, ToolMessage) else ToolMessage(str(res), tool_call_id=call.get("id")))
        return {"messages": out}

    def route(state) -> str:
        return "tools" if state["messages"][-1].tool_calls else END

    g = StateGraph(MessagesState)
    g.add_node("agent", agent)
    g.add_node("tools", run_tools)
    g.add_edge(START, "agent")
    g.add_conditional_edges("agent", route, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    return g.compile(checkpointer=checkpointer)
