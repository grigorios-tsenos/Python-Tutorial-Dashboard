---
id: py-prediction-batches
track: python
order: 7
title: Validate a Batch without Losing Good Results
tagline: One malformed model reply should not erase every valid prediction beside it.
kind: build
xp: 60
minutes: 8
packages: pydantic
---
@@body
# Put a schema at the batch boundary

A model can return valid JSON with invalid values, or text that is not JSON at all. `Prediction.model_validate_json(text)` handles both parsing and schema validation; failures raise `ValidationError`.

The provided schema accepts labels `"spam"` and `"ham"`, a numeric confidence from `0` to `1`, and no extra fields. Confidence uses strict validation: strings and booleans do not count as numbers.

> **Mission:** implement `validate_predictions(payloads)` for an iterable of JSON strings. Return `(accepted, rejected)`: `accepted` contains validated `Prediction` objects in input order; `rejected` contains the zero-based indices of bad replies in input order. Keep processing after a validation error. Support a one-shot generator and empty input, and keep each call independent.

Do not replace bad replies with invented predictions. Reporting their original indices lets the caller retry only those requests.
@@starter
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Prediction(BaseModel):
    model_config = {"extra": "forbid"}
    label: Literal["spam", "ham"]
    confidence: float = Field(ge=0, le=1, strict=True)

def validate_predictions(payloads):
    """Return validated predictions and the input indices of rejected replies."""
    # TODO
    return [], []

replies = ['{"label": "ham", "confidence": 0.9}', 'not json', '{"label": "spam", "confidence": 0.7}']
print(validate_predictions(replies))
@@solution
from typing import Literal
from pydantic import BaseModel, Field, ValidationError

class Prediction(BaseModel):
    model_config = {"extra": "forbid"}
    label: Literal["spam", "ham"]
    confidence: float = Field(ge=0, le=1, strict=True)

def validate_predictions(payloads):
    """Return validated predictions and the input indices of rejected replies."""
    accepted, rejected = [], []
    for index, text in enumerate(payloads):
        try:
            accepted.append(Prediction.model_validate_json(text))
        except ValidationError:
            rejected.append(index)
    return accepted, rejected

replies = ['{"label": "ham", "confidence": 0.9}', 'not json', '{"label": "spam", "confidence": 0.7}']
print(validate_predictions(replies))
@@check
payloads = [
    '{"label": "ham", "confidence": 0.9}',
    'not json',
    '{"label": "other", "confidence": 0.5}',
    '{"label": "spam", "confidence": 1.2}',
    '{"label": "ham"}',
    '{"label": "spam", "confidence": 0.7}',
]
accepted, rejected = validate_predictions(iter(payloads))
test("valid replies survive later failures in original order", lambda: [p.label for p in accepted] == ["ham", "spam"] and [p.confidence for p in accepted] == [0.9, 0.7])
test("accepted results are typed Prediction objects", lambda: all(isinstance(p, Prediction) for p in accepted))
test("bad JSON and invalid fields retain their original indices", lambda: rejected == [1, 2, 3, 4])
edge = [
    '{"label": "ham", "confidence": 0}',
    '{"label": "spam", "confidence": 1}',
    '{"label": "ham", "confidence": "0.8"}',
    '{"label": "ham", "confidence": true}',
    '{"label": "ham", "confidence": 0.8, "secret": "extra"}',
    '[]',
    'null',
]
valid_edge, bad_edge = validate_predictions(text for text in edge)
test("confidence boundaries are accepted without unsafe coercion", lambda: [p.confidence for p in valid_edge] == [0.0, 1.0] and bad_edge == [2, 3, 4, 5, 6])
test("empty batches return fresh empty results", lambda: validate_predictions([]) == ([], []) and validate_predictions([])[0] is not validate_predictions([])[0])
test("one rejected batch does not affect a later valid batch", lambda: validate_predictions(['bad'])[1] == [0] and len(validate_predictions([payloads[0]])[0]) == 1)
@@hint
Use `enumerate(payloads)` so a rejected reply keeps its position in the original batch. Call `Prediction.model_validate_json(text)` inside a `try` block for each record.
@@hint
Append the validated object on success; catch `ValidationError` and append only the index on failure. Create both result lists inside the function, then return them after the loop.
@@q
Why keep the original index of a rejected model reply?
@@a
It lets the caller identify and retry the corresponding request without repeating the successful work.
@@q
What does model_validate_json validate beyond JSON syntax?
@@a
The parsed object's fields, types, allowed labels, numeric bounds and extra-field policy.
@@real
Structured model output still needs validation at the application boundary. Separating accepted results from rejected indices also makes partial retries and batch quality metrics straightforward.
