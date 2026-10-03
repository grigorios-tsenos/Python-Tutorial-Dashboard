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

A prompt saying "never run `rm -rf`" *usually* works. A **hook** always works: your own script, run by Claude Code at fixed points such as `PreToolUse` (before a tool runs).

Register one in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write",
        "hooks": [{ "type": "command", "command": "python3 .claude/hooks/guard.py" }] }
    ]
  }
}
```

Claude Code pipes a JSON **event** to your script's stdin, e.g. `{"tool_name": "Bash", "tool_input": {"command": "ls"}}`. Your script answers with its **exit code**:

- **`0`**: carry on
- **`2`**: **block** the tool call; stderr is shown to Claude so it can correct course

The script is three lines of glue; the real logic is a pure, testable function.

> **Mission:** write `pre_tool_use(event)` → `(exit_code, message)`:
> - `Bash` command containing `rm -rf` → `(2, message mentioning "rm -rf")`
> - `Bash` `git push` with `--force` (or `-f`) → `(2, message mentioning "force")`
> - `Write`/`Edit`/`MultiEdit` to a path ending in `.env` → `(2, message mentioning ".env")`
> - anything else → `(0, "")`
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
