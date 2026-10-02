import json
import re

from .runnables import Runnable


def _text(x):
    return x if isinstance(x, str) else getattr(x, "content", str(x))


class StrOutputParser(Runnable):
    def invoke(self, input, config=None, **kwargs):
        return _text(input)

    def _transform(self, chunks, config=None):
        for c in chunks:
            yield _text(c)

    def __repr__(self):
        return "StrOutputParser()"


class JsonOutputParser(Runnable):
    def invoke(self, input, config=None, **kwargs):
        t = _text(input).strip()
        m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", t, re.S)
        if m:
            t = m.group(1)
        try:
            return json.loads(t)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid json output: {t}") from e


class CommaSeparatedListOutputParser(Runnable):
    def invoke(self, input, config=None, **kwargs):
        return [s.strip() for s in _text(input).split(",") if s.strip()]
