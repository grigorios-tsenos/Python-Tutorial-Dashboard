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

Rules in **`.claude/settings.json`** control what Claude Code may do:

```json
{
  "permissions": {
    "allow": ["Bash(npm run test:*)", "Bash(git diff:*)"],
    "deny":  ["Read(./.env)", "Bash(rm -rf:*)"]
  }
}
```

A rule is `Tool(specifier)`. `Bash(npm run test:*)` is a **prefix** match; without `:*` the specifier must match exactly. Evaluation order:

1. any matching **deny** rule → blocked, always (deny beats allow)
2. else any matching **allow** rule → runs without asking
3. else → Claude **asks** you first

> **Mission:** (1) `build_settings(allow, deny)` returns the settings dict. (2) `matches(rule, tool, arg)` says whether one rule applies to one call. (3) `decide(settings, tool, arg)` returns `"deny"`, `"allow"` or `"ask"` using the rules above.

@@step build_settings is a nested dict
The JSON above is just a dict with a dict inside. Copy the lists so callers can't mutate your settings later:

```python
return {"permissions": {"allow": list(allow), "deny": list(deny)}}
```

**Do:** implement `build_settings`, then Run. The printed JSON should match the shape above.
@@stepcheck
test("settings have the right shape", lambda: build_settings(allow=["Bash(git diff:*)"], deny=["Read(./.env)"]) == {"permissions": {"allow": ["Bash(git diff:*)"], "deny": ["Read(./.env)"]}}, '{"permissions": {"allow": [...], "deny": [...]}}')
test("empty lists are kept", lambda: build_settings([], []) == {"permissions": {"allow": [], "deny": []}})
@@step matches: one rule against one call
Split the rule at the first `(`: the part before is the tool name, the part inside the parentheses is the specifier. A specifier ending in `:*` is a prefix; anything else must match exactly:

```python
def matches(rule, tool, arg):
    name, _, rest = rule.partition("(")
    if name != tool:
        return False
    pattern = rest[:-1]                      # drop the closing ')'
    if pattern.endswith(":*"):
        return arg.startswith(pattern[:-2])
    return arg == pattern
```

**Do:** add `matches` as a module-level function, then Run.
@@stepcheck
test("prefix rules match by startswith", lambda: matches("Bash(npm run test:*)", "Bash", "npm run test:unit") is True and matches("Bash(npm run test:*)", "Bash", "npm install") is False, 'pattern.endswith(":*") -> arg.startswith(pattern[:-2])')
test("exact rules and tool names must match", lambda: matches("Read(./.env)", "Read", "./.env") is True and matches("Read(./.env)", "Read", "./.env.local") is False and matches("Bash(git:*)", "Edit", "git status") is False)
@@step decide: deny, then allow, then ask
Order is the policy. Check every deny rule first, then every allow rule, and fall back to asking:

```python
perms = settings.get("permissions", {})
if any(matches(r, tool, arg) for r in perms.get("deny", [])):
    return "deny"
if any(matches(r, tool, arg) for r in perms.get("allow", [])):
    return "allow"
return "ask"
```

**Do:** implement `decide`, then Run. The cell should print `deny` for the force push.
@@stepcheck
cfg = build_settings(allow=["Bash(npm run test:*)", "Bash(git:*)"], deny=["Bash(git push:*)", "Read(./.env)"])
test("prefix allow rule", lambda: decide(cfg, "Bash", "npm run test:unit") == "allow")
test("deny beats allow", lambda: decide(cfg, "Bash", "git push origin main") == "deny", "check deny rules before allow rules")
test("unmatched -> ask", lambda: decide(cfg, "Bash", "curl example.com") == "ask")
@@starter
import json

def build_settings(allow, deny):
    """The dict you'd save as .claude/settings.json."""
    # TODO 1
    return {}

# TODO 2: matches(rule, tool, arg) -> does one rule like Tool(prefix:*) or Tool(exact) apply to this call?

def decide(settings, tool, arg):
    """'deny' if a deny rule matches, else 'allow' if an allow rule matches, else 'ask'."""
    # TODO 3: deny first, then allow, else ask
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

def matches(rule, tool, arg):
    """Does one rule like Tool(prefix:*) or Tool(exact) apply to this call?"""
    name, _, rest = rule.partition("(")
    if name != tool:
        return False
    pattern = rest[:-1]
    if pattern.endswith(":*"):
        return arg.startswith(pattern[:-2])
    return arg == pattern

def decide(settings, tool, arg):
    """'deny' if a deny rule matches, else 'allow' if an allow rule matches, else 'ask'."""
    perms = settings.get("permissions", {})
    if any(matches(r, tool, arg) for r in perms.get("deny", [])):
        return "deny"
    if any(matches(r, tool, arg) for r in perms.get("allow", [])):
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
test("matches handles prefix and exact rules", lambda: matches("Bash(npm run test:*)", "Bash", "npm run test:unit") and not matches("Read(./.env)", "Read", "./.env.local"))
test("prefix allow rule", lambda: decide(cfg, "Bash", "npm run test:unit") == "allow")
test("deny beats allow", lambda: decide(cfg, "Bash", "git push origin main") == "deny")
test("exact deny rule", lambda: decide(cfg, "Read", "./.env") == "deny")
test("unmatched -> ask", lambda: decide(cfg, "Bash", "curl example.com") == "ask")
test("the tool name must match too", lambda: decide(cfg, "Edit", "git status") == "ask")
@@hint
`build_settings` is just a nested dict: `{"permissions": {"allow": [...], "deny": [...]}}`. For `matches`, split a rule at the first `(` to get the tool name and the specifier (minus the trailing `)`).
@@hint
If the specifier ends with `:*`, use `arg.startswith(specifier[:-2])`; otherwise compare with `==`. In `decide`, check deny rules first, then allow, else return `"ask"`.
@@q
Which wins when a command matches both an allow and a deny rule?
@@a
Deny always wins.
@@q
What does the `:*` suffix mean in `Bash(npm run test:*)`?
@@a
Prefix match: any command that starts with `npm run test`.
@@real
Settings live in `.claude/settings.json` (team), `.claude/settings.local.json` (just you) or `~/.claude/settings.json` (all projects). `/permissions` shows the active rules.
