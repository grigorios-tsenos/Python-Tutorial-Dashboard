---
id: cc-report
track: claude
order: 9
title: "Boss: The Agent Run Report"
tagline: Automate Claude in CI? Then you need to know what it actually did.
kind: boss
xp: 120
minutes: 12
---
@@body
# Boss: turn an agent's event log into a PR comment

When Claude Code runs unattended, each run writes a **JSONL** log, one JSON object per line:

```
{"type": "tool_use", "tool": "Bash"}
{"type": "tool_result", "is_error": true}
{"type": "hook_block", "tool": "Bash", "reason": "rm -rf"}
{"type": "usage", "input_tokens": 1200, "output_tokens": 300}
```

Real logs contain blank lines, truncated writes and junk. A good parser **skips what it can't read and counts it**.

> **Mission:** write `summarize(log_text)` returning a dict:
>
> | key | value |
> |---|---|
> | `tools` | `{tool_name: count}` of `tool_use` events |
> | `errors` | `tool_result` events with `is_error` true |
> | `blocked` | `hook_block` events |
> | `tokens` | sum of `input_tokens + output_tokens` over `usage` events |
> | `skipped` | lines that aren't valid JSON objects, or known events with invalid fields (blank lines don't count) |

Valid means: a non-empty string tool name; a boolean `is_error` when present (missing means `false`); non-negative integer token counts (booleans don't count; missing means `0`). Count an invalid event once as skipped and keep reading. Ignore unknown event types; each call is independent.
@@starter
import json

def summarize(log_text):
    """Summarise a JSONL agent log."""
    # TODO
    return {}

LOG = """
{"type": "tool_use", "tool": "Bash"}
{"type": "tool_result", "is_error": false}
{"type": "tool_use", "tool": "Edit"}
{"type": "tool_result", "is_error": true}
{"type": "hook_block", "tool": "Bash", "reason": "rm -rf"}
{"type": "usage", "input_tokens": 1200, "output_tokens": 300}
not json at all

{"type": "usage", "input_tokens": 800, "output_tokens": 150}
"""
print(summarize(LOG))
@@solution
import json

def summarize(log_text):
    """Summarise a JSONL agent log."""
    tools, errors, blocked, tokens, skipped = {}, 0, 0, 0, 0
    for line in log_text.splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            skipped += 1
            continue
        if not isinstance(event, dict):
            skipped += 1
            continue
        kind = event.get("type")
        if kind == "tool_use":
            name = event.get("tool")
            if not isinstance(name, str) or not name.strip():
                skipped += 1
                continue
            tools[name] = tools.get(name, 0) + 1
        elif kind == "tool_result":
            is_error = event.get("is_error", False)
            if not isinstance(is_error, bool):
                skipped += 1
                continue
            errors += int(is_error)
        elif kind == "hook_block":
            name = event.get("tool")
            if not isinstance(name, str) or not name.strip():
                skipped += 1
                continue
            blocked += 1
        elif kind == "usage":
            counts = [event.get("input_tokens", 0), event.get("output_tokens", 0)]
            if any(type(n) is not int or n < 0 for n in counts):
                skipped += 1
                continue
            tokens += sum(counts)
    return {"tools": tools, "errors": errors, "blocked": blocked, "tokens": tokens, "skipped": skipped}

LOG = """
{"type": "tool_use", "tool": "Bash"}
{"type": "tool_result", "is_error": false}
{"type": "tool_use", "tool": "Edit"}
{"type": "tool_result", "is_error": true}
{"type": "hook_block", "tool": "Bash", "reason": "rm -rf"}
{"type": "usage", "input_tokens": 1200, "output_tokens": 300}
not json at all

{"type": "usage", "input_tokens": 800, "output_tokens": 150}
"""
print(summarize(LOG))
@@check
LOG2 = "\n".join([
    '{"type": "tool_use", "tool": "Bash"}',
    '{"type": "tool_use", "tool": "Bash"}',
    '{"type": "tool_use", "tool": "Edit"}',
    '{"type": "tool_result", "is_error": true}',
    '{"type": "tool_result", "is_error": false}',
    '{"type": "hook_block", "tool": "Bash", "reason": "rm -rf"}',
    '{"type": "usage", "input_tokens": 1200, "output_tokens": 300}',
    'not json',
    '',
    '[1, 2]',
    '{"type": "usage", "input_tokens": 800, "output_tokens": 150}',
])
r = summarize(LOG2)
test("tool counts", lambda: r.get("tools") == {"Bash": 2, "Edit": 1}, "got " + str(r.get("tools")))
test("errors counted from tool_result only", lambda: r.get("errors") == 1)
test("blocked hook events counted", lambda: r.get("blocked") == 1)
test("hook events need a valid tool name", lambda: summarize('{"type":"hook_block","tool":" "}\n{"type":"hook_block"}') == {"tools": {}, "errors": 0, "blocked": 0, "tokens": 0, "skipped": 2})
test("tokens = input + output over all usage events", lambda: r.get("tokens") == 2450)
test("junk lines skipped and counted (blank lines ignored)", lambda: r.get("skipped") == 2, "got " + str(r.get("skipped")))
test("empty log gives zeros", lambda: summarize("") == {"tools": {}, "errors": 0, "blocked": 0, "tokens": 0, "skipped": 0})
messy = "\n".join([
    '{"type": "tool_use"}',
    '{"type": "tool_use", "tool": []}',
    '{"type": "tool_use", "tool": "  "}',
    '{"type": "tool_result", "is_error": "true"}',
    '{"type": "usage", "input_tokens": "8"}',
    '{"type": "usage", "input_tokens": -1}',
    '{"type": "usage", "output_tokens": true}',
    '{"type": "usage", "input_tokens": 1.5}',
    '{"type": "future_event", "data": [1, 2]}',
    '{"type": "tool_result"}',
    '{"type": "usage", "output_tokens": 3}',
    '{"type": "tool_use", "tool": "Read"}',
])
robust = summarize(messy)
test("invalid known events are skipped once and later events survive", lambda: robust == {"tools": {"Read": 1}, "errors": 0, "blocked": 0, "tokens": 3, "skipped": 8})
test("reports do not accumulate state between calls", lambda: summarize(LOG2) == r and summarize("\n \n") == {"tools": {}, "errors": 0, "blocked": 0, "tokens": 0, "skipped": 0})
@@hint
Loop over `log_text.splitlines()`. Skip blank lines, then `json.loads` inside a try/except `json.JSONDecodeError`: count a failure as `skipped`. Remember that valid JSON like `[1, 2]` isn't an object.
@@hint
Validate fields inside each known event branch before counting. Use `type(n) is int and n >= 0` for token counts: Python treats `bool` as a subclass of `int`. Invalid fields add one to `skipped`; missing token fields default to `0`.
@@q
Why skip-and-count bad log lines instead of raising?
@@a
One corrupted line shouldn't destroy the whole report, and the count tells you how much data was lost.
@@q
What is JSONL?
@@a
JSON Lines: one complete JSON object per line, ideal for append-only logs.
@@real
Claude Code runs non-interactively (`claude -p "..."`) for CI and scripts, and hooks can write exactly this kind of audit log. This tolerant, counting, pure-function parser is what you'd wire into a GitHub Action.
