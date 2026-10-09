---
id: py-dataclass
track: python
order: 2
title: Messages Are Just Dataclasses
tagline: The tiny pattern behind every chat API.
kind: build
xp: 40
minutes: 6
---
@@body
# Model your data first

Every LLM SDK uses the same shape: a **message** has a *role* and *content*; a **conversation** is a list of messages. `@dataclass` writes `__init__`, `__repr__` and `__eq__` for you from the field list.

```python
@dataclass
class Point:
    x: int
    y: int = 0                                   # a default
    tags: list = field(default_factory=list)     # mutable defaults need a factory
```

The last line is the trap: `tags: list = []` is rejected, because every instance would share *one* list.

> **Mission:** finish `Conversation`. It needs a list of `Message`s (a fresh list per instance), an `add(role, content)` method, and a `word_count` property: the total number of words across all messages.

@@step A fresh list for every conversation
`messages: list = None` means every conversation starts with nothing to append to. A `default_factory` is a function called **per instance**, so each one gets its own empty list:

```python
messages: list = field(default_factory=list)
```

**Do:** replace the default, then Run.
@@stepcheck
test("each Conversation gets its own list", lambda: Conversation().messages == [] and Conversation().messages is not Conversation().messages, "messages: list = field(default_factory=list)")
@@step add() builds a Message and appends it
`Message(role, content)` is the generated constructor: positional, in field order. Append the object, not a tuple or a string:

```python
self.messages.append(Message(role, content))
```

**Do:** implement `add`, then Run.
@@stepcheck
c = Conversation()
c.add("user", "hello big world")
c.add("assistant", "hi")
test("add() stores Message objects", lambda: len(c.messages) == 2 and c.messages[0] == Message("user", "hello big world"), "self.messages.append(Message(role, content))")
@@step word_count sums the words of every message
`text.split()` breaks a string on whitespace into a list of words. Count each message's words and add them up with a generator expression inside `sum`:

```python
return sum(len(m.content.split()) for m in self.messages)
```

`@property` makes it read like an attribute: `chat.word_count`, no parentheses.

**Do:** implement `word_count`, then Run. The cell should print `4`.
@@stepcheck
c = Conversation()
c.add("user", "hello big world")
c.add("assistant", "hi")
test("word_count adds up all messages", lambda: c.word_count == 4, "sum(len(m.content.split()) for m in self.messages)")
@@starter
from dataclasses import dataclass, field

@dataclass
class Message:
    role: str
    content: str

@dataclass
class Conversation:
    # TODO: a list of Message objects (fresh list for each Conversation!)
    messages: list = None

    def add(self, role: str, content: str) -> None:
        # TODO: append a Message
        pass

    @property
    def word_count(self) -> int:
        # TODO: total words across all messages
        return 0

chat = Conversation()
chat.add("user", "hello big world")
chat.add("assistant", "hi")
print(chat.word_count)
@@solution
from dataclasses import dataclass, field

@dataclass
class Message:
    role: str
    content: str

@dataclass
class Conversation:
    messages: list = field(default_factory=list)

    def add(self, role: str, content: str) -> None:
        self.messages.append(Message(role, content))

    @property
    def word_count(self) -> int:
        return sum(len(m.content.split()) for m in self.messages)

chat = Conversation()
chat.add("user", "hello big world")
chat.add("assistant", "hi")
print(chat.word_count)
@@check
c = Conversation()
c.add("user", "hello big world")
c.add("assistant", "hi")
test("add() stores Message objects", lambda: len(c.messages) == 2 and c.messages[0] == Message("user", "hello big world"))
test("word_count adds up all messages", lambda: c.word_count == 4)
test("each Conversation gets its own list", lambda: Conversation().messages == [] and Conversation().messages is not Conversation().messages)
@@hint
Use `field(default_factory=list)` for the `messages` default, and `self.messages.append(Message(role, content))` in `add`.
@@hint
`word_count`: `sum(len(m.content.split()) for m in self.messages)`.
@@q
Why does `items: list = []` fail in a dataclass?
@@a
Mutable defaults would be shared across all instances; use `field(default_factory=list)`.
@@q
Which methods does `@dataclass` generate for free?
@@a
`__init__`, `__repr__` and `__eq__` (plus ordering/hash if you ask).
