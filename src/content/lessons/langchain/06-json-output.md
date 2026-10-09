---
id: lc-json
track: langchain
order: 6
title: Make Model Output Usable
tagline: Parsing JSON is only the first half of a structured answer.
kind: build
xp: 50
minutes: 6
---
@@body
# Structured output needs a contract

`JsonOutputParser` turns an `AIMessage` into Python data, even when the JSON sits inside a Markdown code fence. But valid JSON can still have the wrong shape: a list, a missing answer, a non-string source. Validate at the boundary.

> **Mission:** implement `parse_answer(message)` using the supplied parser. Return exactly `{"answer": ..., "sources": ...}`. The answer must be a non-empty string after stripping surrounding whitespace; return that stripped answer. Sources must be a list of strings (an empty list is valid). Ignore extra fields. Raise `ValueError` for invalid JSON, a non-object response, missing fields, or invalid field types.

@@step Require an object with a real answer
Parse, then check the *shape* before touching fields:

```python
data = parser.invoke(message)
if not isinstance(data, dict):
    raise ValueError("answer must be a JSON object")
answer = data.get("answer")
if not isinstance(answer, str) or not answer.strip():
    raise ValueError("answer must be non-empty text")
return {"answer": answer.strip(), "sources": data.get("sources")}
```

`isinstance` before `.strip()` is what keeps a numeric answer from crashing with `AttributeError` instead of a clear `ValueError`. (The parser itself raises on invalid JSON; let that propagate as a `ValueError` subclass or re-raise.)

**Do:** add the object and answer checks, then Run.
@@stepcheck
from langchain_core.messages import AIMessage
def rejects(text):
    try:
        parse_answer(AIMessage(text))
    except ValueError:
        return True
    return False
test("the answer is stripped", lambda: parse_answer(message)["answer"] == "Delta remembers versions.", 'return answer.strip()')
test("non-objects and bad answers are rejected", lambda: rejects("not JSON") and rejects("[]") and rejects('{"sources":[]}') and rejects('{"answer":" ","sources":[]}') and rejects('{"answer":12,"sources":[]}'), "isinstance(data, dict) and isinstance(answer, str) checks that raise ValueError")
@@step Validate the sources, return only the contract
A list is required, and every element must be a string. `any(...)` over the elements finds a single bad one:

```python
sources = data.get("sources")
if not isinstance(sources, list) or any(not isinstance(s, str) for s in sources):
    raise ValueError("sources must be a list of strings")
return {"answer": answer.strip(), "sources": sources}
```

Returning a new dict with exactly two keys drops anything extra the model added.

**Do:** add the sources check, then Run.
@@stepcheck
from langchain_core.messages import AIMessage
def rejects(text):
    try:
        parse_answer(AIMessage(text))
    except ValueError:
        return True
    return False
test("extra fields are dropped and empty source lists are valid", lambda: parse_answer(AIMessage('{"answer":"Graphs branch.","sources":["intro"],"score":9}')) == {"answer": "Graphs branch.", "sources": ["intro"]} and parse_answer(AIMessage('{"answer":"No citation.","sources":[]}')) == {"answer": "No citation.", "sources": []})
test("missing or malformed sources are rejected", lambda: rejects('{"answer":"ok"}') and rejects('{"answer":"ok","sources":"guide"}') and rejects('{"answer":"ok","sources":[3]}'), "isinstance(sources, list) and every element a str")
@@starter
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import JsonOutputParser

parser = JsonOutputParser()

def parse_answer(message):
    # TODO: parse, validate and return the two required fields
    return parser.invoke(message)

message = AIMessage('```json\n{"answer": "  Delta remembers versions.  ", "sources": ["guide"]}\n```')
print(parse_answer(message))
@@solution
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import JsonOutputParser

parser = JsonOutputParser()

def parse_answer(message):
    data = parser.invoke(message)
    if not isinstance(data, dict):
        raise ValueError("answer must be a JSON object")
    answer, sources = data.get("answer"), data.get("sources")
    if not isinstance(answer, str) or not answer.strip():
        raise ValueError("answer must be non-empty text")
    if not isinstance(sources, list) or any(not isinstance(source, str) for source in sources):
        raise ValueError("sources must be a list of strings")
    return {"answer": answer.strip(), "sources": sources}

message = AIMessage('```json\n{"answer": "  Delta remembers versions.  ", "sources": ["guide"]}\n```')
print(parse_answer(message))
@@check
test("fenced JSON is parsed and answer whitespace is removed", lambda: parse_answer(message) == {"answer": "Delta remembers versions.", "sources": ["guide"]})
test("new answers retain sources and drop extra fields", lambda: parse_answer(AIMessage('{"answer":"Graphs branch.","sources":["intro","routing"],"score":9}')) == {"answer": "Graphs branch.", "sources": ["intro", "routing"]})
test("an empty source list is valid", lambda: parse_answer(AIMessage('{"answer":"No citation.","sources":[]}')) == {"answer": "No citation.", "sources": []})
def rejects_invalid_answers():
    for text in ['not JSON', '[]', '{"sources":[]}', '{"answer":" ","sources":[]}', '{"answer":12,"sources":[]}', '{"answer":"ok"}', '{"answer":"ok","sources":"guide"}', '{"answer":"ok","sources":[3]}']:
        try:
            parse_answer(AIMessage(text))
        except ValueError:
            continue
        return False
    return True
test("malformed JSON and invalid answer shapes are rejected", rejects_invalid_answers)
@@hint
Parse with `parser.invoke(message)`, then check that the result is a dict before reading fields. Use `isinstance` to validate text and source-list types.
@@hint
Reject a blank `answer.strip()` and any non-string source. Return a new dict with only `answer` and `sources`; use `raise ValueError(...)` when validation fails.
@@q
Why validate after JSON parsing?
@@a
JSON syntax can be valid while the result has missing fields or the wrong types.
@@real
With a real model, use a typed schema or structured-output support when available. Still validate the returned data at the boundary before using it.
