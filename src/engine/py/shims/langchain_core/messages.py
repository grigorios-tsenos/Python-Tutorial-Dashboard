class BaseMessage:
    type = "base"

    def __init__(self, content="", *, tool_calls=None, tool_call_id=None, name=None, id=None, **kwargs):
        self.content = content
        self.tool_calls = list(tool_calls or [])
        self.tool_call_id = tool_call_id
        self.name = name
        self.id = id
        self.additional_kwargs = kwargs

    def __repr__(self):
        extra = f", tool_calls={self.tool_calls!r}" if self.tool_calls else ""
        return f"{type(self).__name__}(content={self.content!r}{extra})"

    def __eq__(self, other):
        return type(self) is type(other) and self.content == other.content and self.tool_calls == other.tool_calls

    def __hash__(self):
        return hash((type(self).__name__, str(self.content)))

    def pretty_repr(self):
        return f"{self.type.upper()}: {self.content}"

    def pretty_print(self):
        print(self.pretty_repr())


class HumanMessage(BaseMessage):
    type = "human"


class AIMessage(BaseMessage):
    type = "ai"


class AIMessageChunk(AIMessage):
    pass


class SystemMessage(BaseMessage):
    type = "system"


class ToolMessage(BaseMessage):
    type = "tool"


_ROLES = {
    "human": HumanMessage, "user": HumanMessage,
    "ai": AIMessage, "assistant": AIMessage,
    "system": SystemMessage, "tool": ToolMessage,
}


def to_message(m):
    if isinstance(m, BaseMessage):
        return m
    if isinstance(m, str):
        return HumanMessage(m)
    if isinstance(m, (tuple, list)) and len(m) == 2:
        role, content = m
        if role not in _ROLES:
            raise ValueError(f"Unexpected message type: '{role}'. Use one of 'human', 'user', 'ai', 'assistant', 'system', 'tool'.")
        return _ROLES[role](content)
    if isinstance(m, dict) and "role" in m:
        return _ROLES[m["role"]](m.get("content", ""))
    raise ValueError(f"Cannot convert {m!r} to a message")


def convert_to_messages(items):
    return [to_message(m) for m in items]


def get_buffer_string(messages):
    label = {"human": "Human", "ai": "AI", "system": "System", "tool": "Tool"}
    return "\n".join(f"{label.get(m.type, m.type)}: {m.content}" for m in messages)
