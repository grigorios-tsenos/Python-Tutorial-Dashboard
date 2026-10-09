---
id: py-pydantic
track: python
order: 4
title: "Bug Hunt: The Gullible Schema"
tagline: LLMs return garbage sometimes. Pydantic catches it at the door.
kind: bug
xp: 40
minutes: 7
packages: pydantic
---
@@body
# Validate what the model hands you

Ask an LLM for JSON and eventually you get `"score": 9` on a 1-to-5 scale, or `"sentiment": "meh"`. **Pydantic** turns a class into a validator: bad output fails loudly at the boundary instead of corrupting data downstream.

```python
class Ticket(BaseModel):
    priority: Literal["low", "high"]        # only these two strings
    hours: int = Field(ge=1, le=40)         # 1 <= hours <= 40
```

Pydantic coerces where safe: `"4"` becomes `4`.

`Review` below accepts anything. That's the bug.

> **Mission:** make `Review` reject a `score` outside **1 to 5** and any `sentiment` other than `positive`, `neutral` or `negative`.

@@step Restrict sentiment to three words
Run the starter: it prints `accepted` for `"meh"`. A `str` field takes any string. `Literal` (from `typing`) lists the only values allowed:

```python
from typing import Literal

sentiment: Literal["positive", "neutral", "negative"]
```

**Do:** add the import and change the field type, then Run.
@@stepcheck
from pydantic import ValidationError
def rejects(**kw):
    try:
        Review(**kw)
    except ValidationError:
        return True
    return False
test("unknown sentiment rejected", lambda: rejects(sentiment="meh", score=3), 'sentiment: Literal["positive", "neutral", "negative"]')
test("valid review accepted", lambda: Review(sentiment="positive", score=5).score == 5)
@@step Bound the score with Field
`int` accepts 9 and -3. `Field` attaches constraints: `ge` means greater-or-equal, `le` less-or-equal:

```python
score: int = Field(ge=1, le=5)
```

Coercion still works: the string `"4"` becomes `4` before the bounds are checked.

**Do:** constrain the score, then Run. The cell should now print `rejected`.
@@stepcheck
from pydantic import ValidationError
def rejects(**kw):
    try:
        Review(**kw)
    except ValidationError:
        return True
    return False
test("scores outside 1..5 are rejected", lambda: rejects(sentiment="positive", score=6) and rejects(sentiment="positive", score=0), "score: int = Field(ge=1, le=5)")
test("numeric strings still coerced", lambda: Review(sentiment="neutral", score="4").score == 4)
@@starter
from pydantic import BaseModel, Field, ValidationError

class Review(BaseModel):
    sentiment: str
    score: int

raw = {"sentiment": "meh", "score": "9"}
try:
    review = Review(**raw)
    print("accepted", review)
except ValidationError:
    print("rejected")
@@solution
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Review(BaseModel):
    sentiment: Literal["positive", "neutral", "negative"]
    score: int = Field(ge=1, le=5)

raw = {"sentiment": "meh", "score": "9"}
try:
    review = Review(**raw)
    print("accepted", review)
except ValidationError:
    print("rejected")
@@check
from pydantic import ValidationError
def rejects(**kw):
    try:
        Review(**kw)
    except ValidationError:
        return True
    return False
test("valid review accepted", lambda: Review(sentiment="positive", score=5).score == 5)
test("score above 5 rejected", lambda: rejects(sentiment="positive", score=6))
test("score below 1 rejected", lambda: rejects(sentiment="positive", score=0))
test("unknown sentiment rejected", lambda: rejects(sentiment="meh", score=3))
test("numeric strings still coerced", lambda: Review(sentiment="neutral", score="4").score == 4)
@@hint
`Literal["positive", "neutral", "negative"]` (from `typing`) restricts a string to a fixed set.
@@hint
`score: int = Field(ge=1, le=5)`: `ge` is "greater or equal", `le` is "less or equal".
@@q
What does pydantic do with `score="4"` for a field typed `int`?
@@a
Coerces it to the integer 4 (lax mode). Invalid values like "abc" raise ValidationError.
@@q
Why validate LLM output with a schema?
@@a
Models can return wrong types or out-of-range values; a schema fails loudly at the boundary instead of poisoning downstream code.
@@real
LangChain's `llm.with_structured_output(Review)` returns a validated `Review` instance — the same pydantic you wrote here.
