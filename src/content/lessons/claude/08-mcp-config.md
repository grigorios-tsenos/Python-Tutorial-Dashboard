---
id: cc-mcp-config
track: claude
order: 8
title: Share an MCP Config without Sharing Secrets
tagline: Commit .mcp.json for the team; keep the tokens in each person's environment.
kind: build
xp: 60
minutes: 8
---
@@body
# Environment variables in .mcp.json

A project-scoped **`.mcp.json`** is committed so the whole team gets the same MCP servers. Tokens and machine paths must not be committed, so Claude Code expands environment variables when it reads the file:

```json
{ "mcpServers": { "tracker": {
    "type": "http",
    "url": "${TRACKER_URL:-https://tracker.example.com}/mcp",
    "headers": {"Authorization": "Bearer ${TRACKER_TOKEN}"} } } }
```

| syntax | meaning |
|---|---|
| `${VAR}` | the value of `VAR`; unset means the config is invalid |
| `${VAR:-default}` | `VAR` if set, otherwise `default` |

As in the shell, an **empty** value also falls back to the default.

> **Mission:** implement `resolve_mcp_config(config, env)` → a **new** config with placeholders expanded:
>
> - expand only `command`, each item of `args`, each value of `env` and `headers`, and `url`; other fields stay as written
> - a placeholder is `${NAME}` or `${NAME:-default}`, `NAME` matching `[A-Za-z_][A-Za-z0-9_]*`, the default containing no `}`. Anything else (`$HOME`, `${}`, `${1X}`) stays literal
> - expanded values are **not** expanded again
> - when any `${VAR}` without a default is unset, raise `ValueError` whose message lists **every** missing name, sorted, without duplicates
> - don't modify `config` or `env`; a config without `mcpServers` is returned as a copy
@@starter
import copy
import re

def resolve_mcp_config(config, env):
    """Expand ${VAR} and ${VAR:-default} in command, args, env, url and headers."""
    # TODO: deep-copy, expand the allowed fields, collect missing variables
    return config

CONFIG = {
    "mcpServers": {
        "tracker": {
            "type": "http",
            "url": "${TRACKER_URL:-https://tracker.example.com}/mcp",
            "headers": {"Authorization": "Bearer ${TRACKER_TOKEN}"},
        },
        "docs": {"command": "npx", "args": ["-y", "docs-mcp", "--root", "${DOCS_ROOT:-./docs}"], "env": {"LOG_LEVEL": "warn"}},
    }
}
print(resolve_mcp_config(CONFIG, {"TRACKER_TOKEN": "tok-123"}))
@@solution
import copy
import re

PLACEHOLDER = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}")

def resolve_mcp_config(config, env):
    """Expand ${VAR} and ${VAR:-default} in command, args, env, url and headers."""
    missing = set()

    def expand(value):
        if not isinstance(value, str):
            return value

        def replace(match):
            name, default = match.group(1), match.group(2)
            current = env.get(name)
            if default is not None and not current:
                return default
            if current is None:
                missing.add(name)
                return match.group(0)
            return current

        return PLACEHOLDER.sub(replace, value)

    resolved = copy.deepcopy(config)
    for server in resolved.get("mcpServers", {}).values():
        for field in ("command", "url"):
            if field in server:
                server[field] = expand(server[field])
        if isinstance(server.get("args"), list):
            server["args"] = [expand(arg) for arg in server["args"]]
        for field in ("env", "headers"):
            if isinstance(server.get(field), dict):
                server[field] = {key: expand(value) for key, value in server[field].items()}
    if missing:
        raise ValueError("missing environment variables: " + ", ".join(sorted(missing)))
    return resolved

CONFIG = {
    "mcpServers": {
        "tracker": {
            "type": "http",
            "url": "${TRACKER_URL:-https://tracker.example.com}/mcp",
            "headers": {"Authorization": "Bearer ${TRACKER_TOKEN}"},
        },
        "docs": {"command": "npx", "args": ["-y", "docs-mcp", "--root", "${DOCS_ROOT:-./docs}"], "env": {"LOG_LEVEL": "warn"}},
    }
}
print(resolve_mcp_config(CONFIG, {"TRACKER_TOKEN": "tok-123"}))
@@check
import copy
C = {
    "mcpServers": {
        "tracker": {
            "type": "http",
            "url": "${TRACKER_URL:-https://tracker.example.com}/mcp",
            "headers": {"Authorization": "Bearer ${TRACKER_TOKEN}", "X-Team": "${TEAM:-data}"},
            "description": "Uses ${TRACKER_TOKEN} for auth",
        },
        "docs": {"command": "${NODE:-npx}", "args": ["-y", "docs-mcp", "--root", "${DOCS_ROOT:-./docs}"], "env": {"LOG_LEVEL": "warn", "HOME_DIR": "$HOME"}},
    }
}
E = {"TRACKER_TOKEN": "tok-123", "DOCS_ROOT": ""}
c_before, e_before = copy.deepcopy(C), dict(E)
out = resolve_mcp_config(C, E)
tracker, docs = out["mcpServers"]["tracker"], out["mcpServers"]["docs"]
test("defaults fill unset variables and set ones are used", lambda: tracker["url"] == "https://tracker.example.com/mcp" and tracker["headers"] == {"Authorization": "Bearer tok-123", "X-Team": "data"})
test("command, args and env values are expanded", lambda: docs["command"] == "npx" and docs["args"] == ["-y", "docs-mcp", "--root", "./docs"] and docs["env"] == {"LOG_LEVEL": "warn", "HOME_DIR": "$HOME"})
test("an empty variable falls back to its default, like the shell", lambda: docs["args"][-1] == "./docs")
test("fields outside the list stay exactly as written", lambda: tracker["description"] == "Uses ${TRACKER_TOKEN} for auth" and tracker["type"] == "http")
test("the input config and env are unchanged", lambda: C == c_before and E == e_before and out is not C)
test("a set variable overrides the default", lambda: resolve_mcp_config(C, {"TRACKER_TOKEN": "t", "TRACKER_URL": "https://mcp.internal"})["mcpServers"]["tracker"]["url"] == "https://mcp.internal/mcp")
test("a variable set to empty without a default expands to empty", lambda: resolve_mcp_config({"mcpServers": {"s": {"url": "a${X}b"}}}, {"X": ""})["mcpServers"]["s"]["url"] == "ab")
test("several placeholders in one value all expand", lambda: resolve_mcp_config({"mcpServers": {"s": {"url": "https://${HOST}:${PORT:-443}/${PATH_:-mcp}"}}}, {"HOST": "h", "PATH_": "v2"})["mcpServers"]["s"]["url"] == "https://h:443/v2")
test("values are not expanded twice", lambda: resolve_mcp_config({"mcpServers": {"s": {"headers": {"A": "${TOKEN}"}}}}, {"TOKEN": "${SECRET}", "SECRET": "leak"})["mcpServers"]["s"]["headers"]["A"] == "${SECRET}")
test("text that is not a placeholder stays literal", lambda: resolve_mcp_config({"mcpServers": {"s": {"args": ["$HOME", "${}", "${1X}", "${A-b}"]}}}, {"HOME": "/root"})["mcpServers"]["s"]["args"] == ["$HOME", "${}", "${1X}", "${A-b}"])
broken = {"mcpServers": {
    "a": {"url": "${API_URL}", "headers": {"Authorization": "${API_KEY}"}},
    "b": {"command": "run", "args": ["--key", "${API_KEY}"], "env": {"REGION": "${REGION}"}},
}}
def missing_message():
    try:
        resolve_mcp_config(broken, {"REGION": "eu"})
    except ValueError as error:
        return str(error)
    return ""
test("every missing variable is reported once, sorted", lambda: "API_KEY, API_URL" in missing_message() and missing_message().count("API_KEY") == 1 and "REGION" not in missing_message())
test("a config without servers is copied", lambda: resolve_mcp_config({}, {}) == {} and resolve_mcp_config({"mcpServers": {}}, {}) == {"mcpServers": {}})
@@hint
Use one regex, `r"\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}"`, with `re.sub` and a replacement function. Group 2 is `None` when there's no `:-default`. `re.sub` never rescans text it has inserted, which is exactly the no-double-expansion rule.
@@hint
In the replacement function: if there is a default and `env.get(name)` is unset or empty, return the default; if the variable is unset, add it to a `missing` set and return the original text; otherwise return its value. `copy.deepcopy(config)` first, expand only the listed fields, then raise `ValueError` if `missing` is non-empty.
@@q
How do you keep secrets out of a committed .mcp.json?
@@a
Reference environment variables like `${API_KEY}`; each developer sets them locally, and Claude Code expands them when it loads the config.
@@q
What does `${VAR:-default}` do?
@@a
Uses VAR's value if it is set and non-empty, otherwise the default.
@@real
`claude mcp add --scope project ...` writes `.mcp.json` for you, each person approves project-scoped servers before first use, and `/mcp` shows connection status. See [environment variable expansion in .mcp.json](https://code.claude.com/docs/en/mcp#environment-variable-expansion-in-mcp-json).
