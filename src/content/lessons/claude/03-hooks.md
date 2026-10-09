---
id: cc-hooks
track: claude
order: 3
title: Hooks: Guardrails That Always Run
tagline: Prompts are suggestions. Hooks are laws.
kind: build
xp: 50
minutes: 9
---
@@body
# Hooks: deterministic control over an agent

Telling Claude "never run `rm -rf`" *usually* works. A **hook** makes it **always** work: your own script, run by Claude Code before a tool runs (`PreToolUse`). Register it in `.claude/settings.json`:

```json
{ "hooks": { "PreToolUse": [
  { "matcher": "Bash|Edit|Write",
    "hooks": [{ "type": "command", "command": "python3 .claude/hooks/guard.py" }] } ] } }
```

Claude Code pipes the JSON event to stdin; your script answers with its **exit code**: `0` carries on, `2` **blocks** the call and shows stderr to Claude. The script is three lines of glue; the logic is a pure function you can test.

> **Mission:** write `pre_tool_use(event)` → `(exit_code, message)`:
> - `Bash` command containing `rm -rf` → `(2, message mentioning "rm -rf")`
> - `Bash` `git push` with `--force` (or `-f`) → `(2, message mentioning "force")`
> - `Write`/`Edit`/`MultiEdit` to a path ending in `.env` → `(2, message mentioning ".env")`
> - anything else → `(0, "")`

@@step Block rm -rf
Read the fields safely, then write the first rule. Blocking means returning exit code 2 and a message that tells Claude what to do instead:

```python
tool = event.get("tool_name")
args = event.get("tool_input", {})
if tool == "Bash":
    cmd = args.get("command", "")
    if "rm -rf" in cmd:
        return 2, "Blocked: rm -rf is not allowed. Delete specific files instead."
return 0, ""
```

**Do:** add the first rule, then Run.
@@stepcheck
def ev(tool, **inp):
    return {"tool_name": tool, "tool_input": inp}
test("rm -rf is blocked with exit code 2 and a message naming it", lambda: pre_tool_use(ev("Bash", command="rm -rf /tmp/x"))[0] == 2 and "rm -rf" in pre_tool_use(ev("Bash", command="rm -rf /tmp/x"))[1], 'if "rm -rf" in cmd: return 2, "Blocked: rm -rf ..."')
test("a normal command is allowed", lambda: pre_tool_use(ev("Bash", command="ls -la")) == (0, ""))
@@step Block force pushes
`--force` and the short `-f` both count, but `-f` must be a whole flag, not part of a path. A regular expression handles both:

```python
if re.search(r"git push\b.*(--force|\s-f\b)", cmd):
    return 2, "Blocked: force pushes are not allowed. Use a normal push."
```

Add `import re` at the top.

**Do:** add the rule inside the Bash branch, then Run.
@@stepcheck
def ev(tool, **inp):
    return {"tool_name": tool, "tool_input": inp}
test("force push is blocked, long and short form", lambda: pre_tool_use(ev("Bash", command="git push --force origin main"))[0] == 2 and "force" in pre_tool_use(ev("Bash", command="git push --force origin main"))[1].lower() and pre_tool_use(ev("Bash", command="git push -f origin main"))[0] == 2, r're.search(r"git push\b.*(--force|\s-f\b)", cmd)')
test("a normal push is allowed", lambda: pre_tool_use(ev("Bash", command="git push origin main")) == (0, ""))
@@step Protect .env files
File tools carry a `file_path`. Catch `.env` at the end of the path and `.env` directories in the middle:

```python
if tool in ("Write", "Edit", "MultiEdit"):
    path = args.get("file_path", "")
    if path.endswith(".env") or "/.env" in path:
        return 2, "Blocked: .env files hold secrets. Edit .env.example instead."
```

**Do:** add the file rule before the final `return 0, ""`, then Run.
@@stepcheck
def ev(tool, **inp):
    return {"tool_name": tool, "tool_input": inp}
test("editing .env is blocked", lambda: pre_tool_use(ev("Edit", file_path="/repo/.env"))[0] == 2 and ".env" in pre_tool_use(ev("Edit", file_path="/repo/.env"))[1], 'path.endswith(".env") or "/.env" in path')
test("editing other files is allowed", lambda: pre_tool_use(ev("Edit", file_path="/repo/app.py")) == (0, ""))
@@starter
def pre_tool_use(event):
    """Return (exit_code, message). 2 = block (message goes back to Claude), 0 = allow."""
    # TODO
    return 0, ""

# the glue a real hook script would run:
#   event = json.load(sys.stdin); code, msg = pre_tool_use(event)
#   if msg: print(msg, file=sys.stderr)
#   sys.exit(code)

print(pre_tool_use({"tool_name": "Bash", "tool_input": {"command": "rm -rf /tmp/build"}}))
@@solution
import re

def pre_tool_use(event):
    """Return (exit_code, message). 2 = block (message goes back to Claude), 0 = allow."""
    tool = event.get("tool_name")
    args = event.get("tool_input", {})
    if tool == "Bash":
        cmd = args.get("command", "")
        if "rm -rf" in cmd:
            return 2, "Blocked: rm -rf is not allowed. Delete specific files instead."
        if re.search(r"git push\b.*(--force|\s-f\b)", cmd):
            return 2, "Blocked: force pushes are not allowed. Use a normal push."
    if tool in ("Write", "Edit", "MultiEdit"):
        path = args.get("file_path", "")
        if path.endswith(".env") or "/.env" in path:
            return 2, "Blocked: .env files hold secrets. Edit .env.example instead."
    return 0, ""

print(pre_tool_use({"tool_name": "Bash", "tool_input": {"command": "rm -rf /tmp/build"}}))
@@check
def ev(tool, **inp):
    return {"tool_name": tool, "tool_input": inp}
test("a normal command is allowed", lambda: pre_tool_use(ev("Bash", command="ls -la")) == (0, ""))
test("rm -rf is blocked with exit code 2", lambda: pre_tool_use(ev("Bash", command="rm -rf /tmp/x"))[0] == 2)
test("the message names what was blocked", lambda: "rm -rf" in pre_tool_use(ev("Bash", command="rm -rf /tmp/x"))[1])
test("force push is blocked", lambda: pre_tool_use(ev("Bash", command="git push --force origin main"))[0] == 2 and "force" in pre_tool_use(ev("Bash", command="git push --force origin main"))[1].lower())
test("short -f force push is blocked", lambda: pre_tool_use(ev("Bash", command="git push -f origin main"))[0] == 2)
test("a normal push is allowed", lambda: pre_tool_use(ev("Bash", command="git push origin main")) == (0, ""))
test("editing .env is blocked", lambda: pre_tool_use(ev("Edit", file_path="/repo/.env"))[0] == 2 and ".env" in pre_tool_use(ev("Edit", file_path="/repo/.env"))[1])
test("editing other files is allowed", lambda: pre_tool_use(ev("Edit", file_path="/repo/app.py")) == (0, ""))
@@hint
Pull `tool_name` and `tool_input` out of the event with `.get(...)`. For Bash, look at `tool_input["command"]`; for file tools, at `tool_input["file_path"]`.
@@hint
Use `"rm -rf" in cmd` for the first rule, `re.search(r"git push\b.*(--force|\s-f\b)", cmd)` for force pushes, and `path.endswith(".env") or "/.env" in path` for secrets. Return `(2, "Blocked: ...")` early; `(0, "")` at the end.
@@q
What does a PreToolUse hook's exit code 2 do?
@@a
Blocks the tool call and sends the hook's stderr message back to Claude.
@@q
Why use a hook instead of a prompt instruction?
@@a
Hooks run deterministically every time; prompt instructions are followed only most of the time.
@@real
Other hook events exist too: `PostToolUse` (auto-formatting after edits), `UserPromptSubmit`, `Stop`, and more. Configure them in `.claude/settings.json` or with `/hooks`.
