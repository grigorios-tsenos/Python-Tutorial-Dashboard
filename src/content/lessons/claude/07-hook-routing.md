---
id: cc-hook-routing
track: claude
order: 7
title: Route Hook Decisions with JSON
tagline: Block forbidden writes, ask about dependency changes and preserve normal permissions elsewhere.
kind: build
xp: 60
minutes: 8
---
@@body
# A hook can make a precise decision

A `PreToolUse` hook can print structured JSON with a `deny` or `ask` decision and a reason:

```json
{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "ask", "permissionDecisionReason": "Review dependency changes."}}
```

> **Mission:** write `route_hook(event, project_dir)` → a JSON-serializable dict for this policy. `project_dir` is a trusted absolute POSIX path; inputs contain no symlinks. Rules run in this order:

1. `event` not a dict, or `tool_name` not a non-empty string → deny, reason containing `malformed`
2. tools other than `Write`, `Edit`, `MultiEdit` → `{}` (no decision)
3. `tool_input` must be a dict and `file_path` a non-blank string without NUL characters, else deny with `malformed`
4. resolve a relative path against `project_dir` and normalize `.`/`..`; paths outside the project → deny with `outside`
5. any component equal to `.git`, `.env`, or starting with `.env.` (except `.env.example`) → deny with `protected`
6. filename `package.json`, `pyproject.toml` or `requirements.txt` → ask with `dependencies`; otherwise `{}`

Every deny/ask result uses exactly the wrapper above with a non-empty reason. Don't modify the event. `posixpath.normpath`, `join` and `commonpath` need no filesystem; a plain prefix test would treat `/repo-old` as inside `/repo`.

@@step Validate the event, ignore unmanaged tools
A small helper builds the wrapper once, so every decision has the same shape. Then rules 1 to 3:

```python
def reply(decision, reason):
    return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": decision, "permissionDecisionReason": reason}}

if not isinstance(event, dict) or not isinstance(event.get("tool_name"), str) or not event["tool_name"].strip():
    return reply("deny", "malformed tool event")
if event["tool_name"] not in {"Write", "Edit", "MultiEdit"}:
    return {}
inputs = event.get("tool_input")
path = inputs.get("file_path") if isinstance(inputs, dict) else None
if not isinstance(path, str) or not path.strip() or "\0" in path:
    return reply("deny", "malformed file path")
return {}
```

**Do:** write the validation, then Run.
@@stepcheck
ROOT = "/workspace/repo"
def ev(path, tool="Write"):
    return {"tool_name": tool, "tool_input": {"file_path": path}}
def decision(event, expected, word, root=ROOT):
    result = route_hook(event, root)
    output = result.get("hookSpecificOutput", {})
    return set(result) == {"hookSpecificOutput"} and output.get("hookEventName") == "PreToolUse" and output.get("permissionDecision") == expected and word in str(output.get("permissionDecisionReason", "")).lower()
test("malformed events are denied without crashing", lambda: all(decision(e, "deny", "malformed") for e in [None, [], {}, {"tool_name": 3}, {"tool_name": " "}, {"tool_name": "Write", "tool_input": None}, ev(None), ev(""), ev(" \t"), ev("bad\0path")]), 'reply("deny", "malformed ...") with the hookSpecificOutput wrapper')
test("unmanaged tools get no decision", lambda: route_hook(ev(".env", "Read"), ROOT) == {} and route_hook({"tool_name": "Bash"}, ROOT) == {})
@@step Normalize the path and fence the project
Join relative paths onto the root, normalize away `.` and `..`, then ask whether the project root is the common prefix **by path components**:

```python
root = posixpath.normpath(project_dir)
path = posixpath.normpath(posixpath.join(root, path))
if posixpath.commonpath([root, path]) != root:
    return reply("deny", "write is outside the project")
```

`join` ignores the root when the path is already absolute, and `commonpath` compares components, so `/workspace/repo-old` is correctly outside `/workspace/repo`.

**Do:** add the path rules, then Run.
@@stepcheck
ROOT = "/workspace/repo"
def ev(path, tool="Write"):
    return {"tool_name": tool, "tool_input": {"file_path": path}}
def decision(event, expected, word, root=ROOT):
    output = route_hook(event, root).get("hookSpecificOutput", {})
    return output.get("permissionDecision") == expected and word in str(output.get("permissionDecisionReason", "")).lower()
test("absolute sibling paths are outside, not project prefixes", lambda: decision(ev("/workspace/repo-old/app.py"), "deny", "outside"), "posixpath.commonpath([root, path]) != root")
test("traversal is normalized before checking scope", lambda: decision(ev("src/../../secrets.txt"), "deny", "outside") and route_hook(ev("src/../docs/readme.md"), ROOT) == {})
@@step Protected paths, then dependency files
Split the path relative to the root into components. Any `.git` or `.env`-style component (except `.env.example`) is denied; a dependency manifest as the final component asks for review:

```python
parts = posixpath.relpath(path, root).split("/")
if any(p == ".git" or (p != ".env.example" and (p == ".env" or p.startswith(".env."))) for p in parts):
    return reply("deny", "protected project path")
if parts[-1] in {"package.json", "pyproject.toml", "requirements.txt"}:
    return reply("ask", "review dependencies before writing")
return {}
```

**Do:** add the last two rules, then Run.
@@stepcheck
ROOT = "/workspace/repo"
def ev(path, tool="Write"):
    return {"tool_name": tool, "tool_input": {"file_path": path}}
def decision(event, expected, word, root=ROOT):
    output = route_hook(event, root).get("hookSpecificOutput", {})
    return output.get("permissionDecision") == expected and word in str(output.get("permissionDecisionReason", "")).lower()
test("protected files and directories are denied, examples allowed", lambda: all(decision(ev(p, "MultiEdit"), "deny", "protected") for p in [".git/config", ".env", "config/.env.production", "keys/.env/secret.txt"]) and route_hook(ev("docs/.env.example"), ROOT) == {}, "check every component of relpath(path, root)")
test("dependency files produce an ask decision", lambda: all(decision(ev(p), "ask", "dependencies") for p in ["package.json", "config/../pyproject.toml", "services/api/requirements.txt"]))
@@starter
import json
import posixpath

def route_hook(event, project_dir):
    # TODO: validate, normalize the path, then return a decision or {}
    return {}

event = {"tool_name": "Write", "tool_input": {"file_path": "config/../package.json"}}
print(json.dumps(route_hook(event, "/workspace/repo"), indent=2))
@@solution
import json
import posixpath

def route_hook(event, project_dir):
    def reply(decision, reason):
        return {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": decision, "permissionDecisionReason": reason}}

    if not isinstance(event, dict) or not isinstance(event.get("tool_name"), str) or not event["tool_name"].strip():
        return reply("deny", "malformed tool event")
    if event["tool_name"] not in {"Write", "Edit", "MultiEdit"}:
        return {}
    inputs = event.get("tool_input")
    path = inputs.get("file_path") if isinstance(inputs, dict) else None
    if not isinstance(path, str) or not path.strip() or "\0" in path:
        return reply("deny", "malformed file path")
    root = posixpath.normpath(project_dir)
    # ponytail: lexical paths only; resolve symlinks before filesystem enforcement.
    path = posixpath.normpath(posixpath.join(root, path))
    if posixpath.commonpath([root, path]) != root:
        return reply("deny", "write is outside the project")
    parts = posixpath.relpath(path, root).split("/")
    if any(p == ".git" or (p != ".env.example" and (p == ".env" or p.startswith(".env."))) for p in parts):
        return reply("deny", "protected project path")
    if parts[-1] in {"package.json", "pyproject.toml", "requirements.txt"}:
        return reply("ask", "review dependencies before writing")
    return {}

event = {"tool_name": "Write", "tool_input": {"file_path": "config/../package.json"}}
print(json.dumps(route_hook(event, "/workspace/repo"), indent=2))
@@check
ROOT = "/workspace/repo"
def ev(path, tool="Write"):
    return {"tool_name": tool, "tool_input": {"file_path": path}}

def decision(event, expected, word, root=ROOT):
    result = route_hook(event, root)
    output = result.get("hookSpecificOutput", {})
    return set(result) == {"hookSpecificOutput"} and set(output) == {"hookEventName", "permissionDecision", "permissionDecisionReason"} and output.get("hookEventName") == "PreToolUse" and output.get("permissionDecision") == expected and isinstance(output.get("permissionDecisionReason"), str) and word in output["permissionDecisionReason"].lower()

test("normal project writes preserve default permissions", lambda: route_hook(ev("src/app.py"), ROOT) == {} and route_hook(ev("/workspace/repo/docs/readme.md", "Edit"), ROOT) == {})
test("dependency files produce an ask decision", lambda: all(decision(ev(p), "ask", "dependencies") for p in ["package.json", "config/../pyproject.toml", "services/api/requirements.txt"]))
test("absolute sibling paths are outside, not project prefixes", lambda: decision(ev("/workspace/repo-old/app.py"), "deny", "outside"))
test("traversal is normalized before checking scope", lambda: decision(ev("src/../../secrets.txt"), "deny", "outside") and route_hook(ev("src/../docs/readme.md"), ROOT) == {})
test("protected files and directories are denied", lambda: all(decision(ev(p, "MultiEdit"), "deny", "protected") for p in [".git/config", ".env", "config/.env.production", "keys/.env/secret.txt"]))
test("example environment files are allowed through", lambda: route_hook(ev(".env.example"), ROOT) == {} and route_hook(ev("docs/.env.example"), ROOT) == {})
test("deny takes precedence over dependency review", lambda: decision(ev(".git/package.json"), "deny", "protected") and decision(ev("../package.json"), "deny", "outside"))
test("unmanaged tools get no decision", lambda: route_hook(ev(".env", "Read"), ROOT) == {} and route_hook({"tool_name": "Bash"}, ROOT) == {})
test("malformed events are denied without crashing", lambda: all(decision(e, "deny", "malformed") for e in [None, [], {}, {"tool_name": 3}, {"tool_name": " "}, {"tool_name": "Write", "tool_input": None}, ev(None), ev(""), ev(" \t"), ev("bad\0path")]))
test("a different project root is used rather than hardcoded", lambda: decision(ev("../repo/file.py"), "deny", "outside", "/other/project") and route_hook(ev("./src/main.py"), "/other/project") == {})
before = json.loads(json.dumps(event))
route_hook(event, ROOT)
test("output is JSON-serializable and the input is unchanged", lambda: json.loads(json.dumps(route_hook(event, ROOT))) == route_hook(event, ROOT) and event == before)
@@hint
Build a helper that wraps a decision and reason in `hookSpecificOutput`. Validate input types before calling string or path methods. Return `{}` for tools this policy does not manage.
@@hint
Use `posixpath.normpath(posixpath.join(project_dir, path))`, then compare `posixpath.commonpath([project_dir, path])` to the normalized root. Check components from `posixpath.relpath(path, root).split("/")` before checking the final filename for dependency files.
@@q
Why should an unmanaged tool return an empty object instead of allow?
@@a
An empty object means the hook has no decision, so normal permissions still apply. An allow decision can pre-approve a call.
@@q
Why is startswith(project_dir) insufficient for a path boundary?
@@a
An unrelated sibling such as /repo-old starts with /repo too. Normalize the path and compare complete path components.
@@real
Print the dict with `json.dumps(...)` on stdout and exit 0 so Claude Code reads the structured decision; symlink resolution and real enforcement need the filesystem or a sandbox. See [PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control).
