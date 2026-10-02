import inspect
import typing

from .messages import ToolMessage
from .runnables import Runnable

_JSON = {int: "integer", float: "number", str: "string", bool: "boolean", list: "array", dict: "object"}


class StructuredTool(Runnable):
    def __init__(self, func, name=None, description=None):
        self.func = func
        self.name = name or func.__name__
        self.description = inspect.cleandoc(description or func.__doc__ or "")
        sig = inspect.signature(func)
        hints = typing.get_type_hints(func)
        self.args = {
            p: {"title": p.replace("_", " ").title(), "type": _JSON.get(hints.get(p), "string")}
            for p in sig.parameters
        }

    def invoke(self, input, config=None, **kwargs):
        if isinstance(input, dict) and input.get("type") == "tool_call":
            result = self.func(**input["args"])
            return ToolMessage(content=str(result), tool_call_id=input.get("id"), name=self.name)
        if isinstance(input, dict):
            return self.func(**input)
        return self.func(input)

    def __repr__(self):
        return f"StructuredTool(name={self.name!r}, args={self.args})"


def tool(name_or_func=None, *, description=None):
    """@tool or @tool("name") — turn a typed, documented function into a tool an LLM can call."""
    if callable(name_or_func):
        return StructuredTool(name_or_func)

    def wrap(fn):
        return StructuredTool(fn, name=name_or_func, description=description)

    return wrap
