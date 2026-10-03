---
id: cc-permissions
track: claude
order: 2
title: Teach Claude What It May Touch
tagline: Permission rules are the seatbelt for an agent that runs shell commands.
kind: build
xp: 45
minutes: 8
---
@@body
# Permissions: allow, deny, ask

Claude Code can read files, edit code and run shell commands. You control that with rules in **`.claude/settings.json`**:

```json
{
  "permissions": {
    "allow": ["Bash(npm run test:*)", "Bash(git diff:*)"],
    "deny":  ["Read(./.env)", "Bash(rm -rf:*)"]
  }
}
```

A rule is `Tool(specifier)`. `Bash(npm run test:*)` is a **prefix** match (anything starting with `npm run test`); without `:*` the specifier must match exactly. Evaluation order:

1. any matching **deny** rule → blocked, always (deny beats allow)
2. else any matching **allow** rule → runs without asking
3. else → Claude **asks** you first

> **Mission:** (1) `build_settings(allow, deny)` returns the settings dict. (2) `decide(settings, tool, arg)` returns `"deny"`, `"allow"` or `"ask"` using the rules above.
@@starter
import json

def build_settings(allow, deny):
    """The dict you'd save as .claude/settings.json."""
    # TODO
    return {}

def decide(settings, tool, arg):
    """'deny' if a deny rule matches, else 'allow' if an allow rule matches, else 'ask'."""
    # TODO: rules look like Tool(prefix:*) or Tool(exact)
    return "ask"

settings = build_settings(
    allow=["Bash(npm run test:*)", "Bash(git:*)"],
    deny=["Bash(git push:*)", "Read(./.env)"],
)
print(json.dumps(settings, indent=2))
print(decide(settings, "Bash", "git push origin main"))
@@solution
import json

def build_settings(allow, deny):
    """The dict you'd save as .claude/settings.json."""
    return {"permissions": {"allow": list(allow), "deny": list(deny)}}

def decide(settings, tool, arg):
    """'deny' if a deny rule matches, else 'allow' if an allow rule matches, else 'ask'."""
    def matches(rule):
        name, _, rest = rule.partition("(")
        if name != tool:
            return False
        pattern = rest[:-1]
        if pattern.endswith(":*"):
            return arg.startswith(pattern[:-2])
        return arg == pattern

    perms = settings.get("permissions", {})
    if any(matches(r) for r in perms.get("deny", [])):
        return "deny"
    if any(matches(r) for r in perms.get("allow", [])):
        return "allow"
    return "ask"

settings = build_settings(
    allow=["Bash(npm run test:*)", "Bash(git:*)"],
    deny=["Bash(git push:*)", "Read(./.env)"],
)
print(json.dumps(settings, indent=2))
print(decide(settings, "Bash", "git push origin main"))
@@check
s = build_settings(allow=["Bash(git diff:*)"], deny=["Read(./.env)"])
cfg = build_settings(allow=["Bash(npm run test:*)", "Bash(git:*)"], deny=["Bash(git push:*)", "Read(./.env)"])
test("settings have the right shape", lambda: s == {"permissions": {"allow": ["Bash(git diff:*)"], "deny": ["Read(./.env)"]}})
test("empty lists are kept", lambda: build_settings([], []) == {"permissions": {"allow": [], "deny": []}})
test("prefix allow rule", lambda: decide(cfg, "Bash", "npm run test:unit") == "allow")
test("deny beats allow", lambda: decide(cfg, "Bash", "git push origin main") == "deny")
test("exact deny rule", lambda: decide(cfg, "Read", "./.env") == "deny")
test("unmatched -> ask", lambda: decide(cfg, "Bash", "curl example.com") == "ask")
test("the tool name must match too", lambda: decide(cfg, "Edit", "git status") == "ask")
@@hint
`build_settings` is just a nested dict: `{"permissions": {"allow": [...], "deny": [...]}}`. For `decide`, split a rule at the first `(` to get the tool name and the specifier (minus the trailing `)`).
@@hint
If the specifier ends with `:*`, use `arg.startswith(specifier[:-2])`; otherwise compare with `==`. Check deny rules first, then allow, else return `"ask"`.
@@q
Which wins when a command matches both an allow and a deny rule?
@@a
Deny always wins.
@@q
What does the `:*` suffix mean in `Bash(npm run test:*)`?
@@a
Prefix match: any command that starts with `npm run test`.
@@real
Settings can live in `.claude/settings.json` (shared with your team), `.claude/settings.local.json` (just you) or `~/.claude/settings.json` (all projects). Use `/permissions` inside Claude Code to review the active rules.
