import json
import re

from .messages import AIMessage, AIMessageChunk, convert_to_messages
from .runnables import Runnable


def _to_messages(input):
    if hasattr(input, "to_messages"):
        return input.to_messages()
    if isinstance(input, str):
        return convert_to_messages([input])
    return convert_to_messages(input)


class BaseChatModel(Runnable):
    def _next(self, messages):
        raise NotImplementedError

    def invoke(self, input, config=None, **kwargs):
        return self._next(_to_messages(input))

    def _stream(self, input, config=None):
        full = self.invoke(input, config)
        pieces = re.split(r"(\s)", full.content) if full.content else [""]
        for p in pieces:
            if p != "":
                yield AIMessageChunk(p)

    def _transform(self, chunks, config=None):
        items = list(chunks)
        yield from self._stream(items[0] if len(items) == 1 else items, config)

    def bind_tools(self, tools, **kwargs):
        self.bound_tools = list(tools)
        return self

    def with_structured_output(self, schema, **kwargs):
        model = self

        class _Structured(Runnable):
            def invoke(self, input, config=None, **kw):
                text = model.invoke(input, config).content.strip()
                text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
                data = json.loads(text)
                if hasattr(schema, "model_validate"):
                    return schema.model_validate(data)
                return data

        return _Structured()


class FakeListChatModel(BaseChatModel):
    """Returns the given responses in order, cycling forever."""

    def __init__(self, responses, **kwargs):
        self.responses = list(responses)
        self.i = 0

    def _next(self, messages):
        r = self.responses[self.i % len(self.responses)]
        self.i += 1
        return AIMessage(r)

    def _stream(self, input, config=None):
        for ch in self.invoke(input, config).content:
            yield AIMessageChunk(ch)

    def __repr__(self):
        return f"FakeListChatModel(responses={self.responses!r})"


class GenericFakeChatModel(BaseChatModel):
    """Returns messages (or strings) from an iterator, one per call. Great for scripting tool calls."""

    def __init__(self, messages, **kwargs):
        self.messages = iter(messages)
        self.calls = []

    def _next(self, messages):
        self.calls.append(messages)
        try:
            m = next(self.messages)
        except StopIteration:
            raise StopIteration("GenericFakeChatModel has no more scripted messages") from None
        return AIMessage(m) if isinstance(m, str) else m

    def __repr__(self):
        return "GenericFakeChatModel()"


__all__ = ["BaseChatModel", "FakeListChatModel", "GenericFakeChatModel"]
