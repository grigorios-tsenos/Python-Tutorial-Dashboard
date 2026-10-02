import string

from .messages import AIMessage, HumanMessage, SystemMessage, convert_to_messages, get_buffer_string
from .runnables import Runnable


def _fields(template):
    return [f for _, f, _, _ in string.Formatter().parse(template) if f]


def _check(name, needed, values):
    missing = sorted(set(needed) - set(values))
    if missing:
        raise KeyError(f"Input to {name} is missing variables {set(missing)}.  Expected: {sorted(set(needed))} Received: {sorted(values)}")


class ChatPromptValue:
    def __init__(self, messages):
        self.messages = messages

    def to_messages(self):
        return self.messages

    def to_string(self):
        return get_buffer_string(self.messages)

    def __repr__(self):
        return f"ChatPromptValue(messages={self.messages!r})"


class StringPromptValue:
    def __init__(self, text):
        self.text = text

    def to_string(self):
        return self.text

    def to_messages(self):
        return [HumanMessage(self.text)]

    def __repr__(self):
        return f"StringPromptValue(text={self.text!r})"


class PromptTemplate(Runnable):
    def __init__(self, template):
        self.template = template
        self.input_variables = list(dict.fromkeys(_fields(template)))

    @classmethod
    def from_template(cls, template):
        return cls(template)

    def format(self, **kwargs):
        _check("PromptTemplate", self.input_variables, kwargs)
        return self.template.format(**kwargs)

    def invoke(self, input, config=None, **kwargs):
        return StringPromptValue(self.format(**input))


class MessagesPlaceholder:
    def __init__(self, variable_name, optional=False):
        self.variable_name = variable_name
        self.optional = optional


class ChatPromptTemplate(Runnable):
    def __init__(self, parts):
        self.parts = parts
        needed = []
        for p in parts:
            if isinstance(p, MessagesPlaceholder):
                if not p.optional:
                    needed.append(p.variable_name)
            else:
                needed.extend(_fields(p[1]))
        self.input_variables = list(dict.fromkeys(needed))

    @classmethod
    def from_template(cls, template):
        return cls([("human", template)])

    @classmethod
    def from_messages(cls, items):
        parts = []
        for it in items:
            if isinstance(it, MessagesPlaceholder):
                parts.append(it)
            elif isinstance(it, str) and it.startswith("{") and it.endswith("}"):
                parts.append(MessagesPlaceholder(it[1:-1]))
            elif isinstance(it, (tuple, list)) and len(it) == 2:
                parts.append((it[0], it[1]))
            else:
                raise ValueError(f"Unsupported message spec: {it!r}")
        return cls(parts)

    def format_messages(self, **kwargs):
        _check("ChatPromptTemplate", self.input_variables, kwargs)
        out = []
        for p in self.parts:
            if isinstance(p, MessagesPlaceholder):
                out.extend(convert_to_messages(kwargs.get(p.variable_name, [])))
            else:
                role, tmpl = p
                out.extend(convert_to_messages([(role, tmpl.format(**kwargs))]))
        return out

    def invoke(self, input, config=None, **kwargs):
        return ChatPromptValue(self.format_messages(**input))

    def format(self, **kwargs):
        return get_buffer_string(self.format_messages(**kwargs))

    def __repr__(self):
        return f"ChatPromptTemplate(input_variables={self.input_variables})"


__all__ = ["ChatPromptTemplate", "PromptTemplate", "MessagesPlaceholder", "AIMessage", "SystemMessage"]
