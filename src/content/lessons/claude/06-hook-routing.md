---
id: cc-hook-routing
track: claude
order: 6
title: Route Hook Decisions with JSON
tagline: Block forbidden writes, ask about dependency changes and preserve normal permissions elsewhere.
kind: build
xp: 60
minutes: 8
---
@@body
# A hook can make a precise decision

An exit-code hook can block a call. A `PreToolUse` hook can also print structured JSON with a `deny` or `ask` decision and a reason:

```json
{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "ask", "permissionDecisionReason": "Review dependency changes."}}
```

> **Mission:** write `route_hook(event, project_dir)`, which returns a JSON-serializable dict for this project's policy. The trusted `project_dir` is an absolute POSIX path; inputs contain no symlinks.

1. If `event` is not a dict or its `tool_name` is not a non-empty string, deny with a reason containing `malformed`.
2. Tools other than `Write`, `Edit`, `MultiEdit` return `{}`: the hook has no decision.
3. For those write tools, `tool_input` must be a dict and `file_path` must be a non-blank string without NUL characters. Invalid input is denied with a reason containing `malformed`.
4. Resolve a relative path against `project_dir` and normalize `.` / `..`. Deny paths outside the project, with a reason containing `outside`.
5. Deny any path component equal to `.git`, `.env`, or starting with `.env.`, except `.env.example`. Include `protected` in the reason.
6. Ask for confirmation when the filename is `package.json`, `pyproject.toml` or `requirements.txt`, with `dependencies` in the reason. Otherwise return `{}`.

Rules run in this order. Every deny/ask result has exactly the wrapper shown above, the chosen decision, and a non-empty reason. Do not modify the event. `posixpath.normpath`, `join` and `commonpath` handle paths without requiring filesystem access. A string-prefix test alone would incorrectly treat `/repo-old` as inside `/repo`.
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
Print the returned dict with `json.dumps(...)` on stdout and exit with code 0 so Claude Code can read the structured decision. This exercise's POSIX path policy is an application rule; symlink resolution and filesystem enforcement need the actual filesystem or a sandbox. See [PreToolUse decision control](https://code.claude.com/docs/en/hooks#pretooluse-decision-control).
