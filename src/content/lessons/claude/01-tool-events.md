---
id: cc-events
track: claude
order: 1
title: Watch What an Agent Does
tagline: An agent's actions are just small JSON events. Learn to read them first.
kind: run
xp: 25
minutes: 4
---
@@body
# The big picture: an agent you can see is an agent you can govern

Claude Code is an AI agent: it reads files, edits code and runs shell commands on a real machine. This whole chapter is about **staying in control** of that, with permission rules, hooks and audit logs. All of those work on the same tiny thing: a **tool event**, a small dict describing one action the agent wants to take:

```python
{"tool_name": "Bash",  "tool_input": {"command": "ls -la"}}
{"tool_name": "Edit",  "tool_input": {"file_path": "src/app.py"}}
```

`tool_name` says *which capability* (run a command, edit a file); `tool_input` carries the details. Read these fluently and the rest of the chapter clicks: permissions decide on events (next lesson), hooks inspect them, and the boss summarizes a whole log of them.

One habit: use **`.get(key, default)`** instead of `event["key"]`. Real event streams contain surprises, and `.get` gives you a default instead of a crash.

> **Mission:** implement `describe(event)` → a one-line human summary:
>
> - a `Bash` event → `"Bash: <command>"`
> - an `Edit` or `Write` event → `"<tool_name>: <file_path>"`
> - any other tool → `"<tool_name>"`
> - missing `command`/`file_path` details → `"?"` in their place (don't crash)
>
> Then print one line per event in `LOG`, your first agent audit trail.
@@starter
def describe(event):
    """One readable line per tool event."""
    # TODO: tool_name plus the interesting detail
    return "something happened"

LOG = [
    {"tool_name": "Bash", "tool_input": {"command": "npm test"}},
    {"tool_name": "Edit", "tool_input": {"file_path": "src/app.py"}},
    {"tool_name": "WebSearch", "tool_input": {"query": "pandas pivot"}},
]
for event in LOG:
    print(describe(event))
@@solution
def describe(event):
    """One readable line per tool event."""
    tool = event.get("tool_name", "?")
    details = event.get("tool_input", {})
    if tool == "Bash":
        return f"Bash: {details.get('command', '?')}"
    if tool in ("Edit", "Write"):
        return f"{tool}: {details.get('file_path', '?')}"
    return tool

LOG = [
    {"tool_name": "Bash", "tool_input": {"command": "npm test"}},
    {"tool_name": "Edit", "tool_input": {"file_path": "src/app.py"}},
    {"tool_name": "WebSearch", "tool_input": {"query": "pandas pivot"}},
]
for event in LOG:
    print(describe(event))
@@check
test("a Bash event shows its command", lambda: describe({"tool_name": "Bash", "tool_input": {"command": "npm test"}}) == "Bash: npm test")
test("Edit and Write events show their file", lambda: describe({"tool_name": "Edit", "tool_input": {"file_path": "a.py"}}) == "Edit: a.py" and describe({"tool_name": "Write", "tool_input": {"file_path": "b.md"}}) == "Write: b.md")
test("other tools show just their name", lambda: describe({"tool_name": "WebSearch", "tool_input": {"query": "x"}}) == "WebSearch")
test("missing details become ? instead of a crash", lambda: describe({"tool_name": "Bash"}) == "Bash: ?" and describe({"tool_name": "Edit", "tool_input": {}}) == "Edit: ?")
test("the audit trail was printed", lambda: "Bash: npm test" in __stdout__ and "Edit: src/app.py" in __stdout__ and "WebSearch" in __stdout__)
@@hint
Pull the pieces out safely: `tool = event.get("tool_name", "?")` and `details = event.get("tool_input", {})`. Then branch on `tool`.
@@hint
For Bash return `f"Bash: {details.get('command', '?')}"`; for Edit/Write use the same pattern with `file_path`; otherwise return the tool name alone.
@@q
What two fields does every tool event carry?
@@a
tool_name (which capability: Bash, Edit, ...) and tool_input (the details, like the command or file path).
@@q
Why read event fields with .get(key, default) instead of event[key]?
@@a
Real event streams have missing or unexpected fields; .get returns a default instead of crashing your guardrail.
@@real
These are the real shapes: Claude Code pipes exactly this JSON to permission checks and PreToolUse hooks, and `claude -p` can emit a JSON log of every event. Two lessons from now you'll write the rules that decide which of these events are allowed to run.
