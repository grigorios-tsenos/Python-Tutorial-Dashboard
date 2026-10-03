---
id: cc-skill-lint
track: claude
order: 5
title: Lint a Skill Before You Share It
tagline: Parsing a header is only the start: validate the metadata your team relies on.
kind: build
xp: 50
minutes: 6
---
@@body
# Turn project conventions into useful errors

The previous puzzle parsed a skill's frontmatter. Now validate the resulting metadata **without executing the skill**. Your team's review skills follow a deliberately small project policy; it is stricter than Claude Code's full frontmatter format.

> **Mission:** write `validate_skill(meta, body)` returning a list of invalid field names in this fixed order: `name`, `description`, `allowed-tools`, `body`.

- `name`: a string of 1–64 characters, starting with a lowercase letter, followed by lowercase letters/digits and optional single hyphens between non-empty segments. Examples: `review-code`, `lint2`; reject `Review`, `-lint`, `lint--code` and `lint-`.
- `description`: a string whose stripped length is 1–1024.
- `allowed-tools`: optional; when present, a comma-separated string of one or more tool names from `Read`, `Grep`, `Glob`. Spaces around each name are fine; empty or unknown names are invalid.
- `body`: a non-empty string after stripping whitespace.

If `meta` is not a dict, return only `["metadata"]`. A valid skill returns `[]`. Ignore extra metadata keys and leave the input untouched. This is the team's lint policy, not a complete YAML parser or a proof that a skill is safe.
@@starter
import re

def validate_skill(meta, body):
    # TODO: collect field names in the documented order
    return []

meta = {"name": "Review-Code", "description": "Use when reviewing a diff.", "allowed-tools": "Read, Bash"}
print(validate_skill(meta, "Inspect the changed code and report specific bugs."))
@@solution
import re

def validate_skill(meta, body):
    if not isinstance(meta, dict):
        return ["metadata"]
    errors = []
    name = meta.get("name")
    if not isinstance(name, str) or not 1 <= len(name) <= 64 or not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", name):
        errors.append("name")
    description = meta.get("description")
    if not isinstance(description, str) or not 1 <= len(description.strip()) <= 1024:
        errors.append("description")
    if "allowed-tools" in meta:
        tools = meta["allowed-tools"]
        if not isinstance(tools, str) or any(t.strip() not in {"Read", "Grep", "Glob"} for t in tools.split(",")):
            errors.append("allowed-tools")
    if not isinstance(body, str) or not body.strip():
        errors.append("body")
    return errors

meta = {"name": "Review-Code", "description": "Use when reviewing a diff.", "allowed-tools": "Read, Bash"}
print(validate_skill(meta, "Inspect the changed code and report specific bugs."))
@@check
valid = {"name": "review-code", "description": "Use when: reviewing diffs", "allowed-tools": "Read, Grep, Glob", "version": "1"}
before = dict(valid)
test("a complete project skill passes", lambda: validate_skill(valid, "Inspect changed files.") == [])
test("allowed-tools can be omitted", lambda: validate_skill({"name": "lint2", "description": "Read the code."}, "Report bugs.") == [])
test("all problems are reported in a stable order", lambda: validate_skill({"name": "BAD", "description": "  ", "allowed-tools": "Bash"}, " ") == ["name", "description", "allowed-tools", "body"])
test("names must use valid segments", lambda: all(validate_skill(dict(valid, name=n), "body") == ["name"] for n in ["Review", "-lint", "lint-", "lint--code", "lint_code", 7, None]))
test("name length has an inclusive maximum", lambda: validate_skill(dict(valid, name="a" * 64), "body") == [] and validate_skill(dict(valid, name="a" * 65), "body") == ["name"])
test("description types and length are checked", lambda: all(validate_skill(dict(valid, description=d), "body") == ["description"] for d in [None, [], "", "x" * 1025]))
test("description limits apply after trimming", lambda: validate_skill(dict(valid, description=" " + "x" * 1024 + " "), "body") == [])
test("missing required fields are reported", lambda: validate_skill({}, "body") == ["name", "description"])
test("tool names can be spaced but cannot be empty or unknown", lambda: validate_skill(dict(valid, **{"allowed-tools": " Read , Grep "}), "body") == [] and all(validate_skill(dict(valid, **{"allowed-tools": t}), "body") == ["allowed-tools"] for t in ["", "Read,", "Read,,Glob", "read", "Write", ["Read"]]))
test("non-dict metadata is handled without crashing", lambda: all(validate_skill(m, "body") == ["metadata"] for m in [None, [], "name: lint"]))
test("body must contain text", lambda: all(validate_skill(valid, b) == ["body"] for b in [None, [], "", "\n \t"]))
test("validation leaves metadata unchanged", lambda: valid == before and validate_skill(valid, "body") == [])
@@hint
Use `.get(...)` for required fields, and test `isinstance(value, str)` before applying string operations. Append errors in the mission's order instead of returning after the first bad field.
@@hint
`re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", name)` checks the name's segments. Split the tool string on commas and check every stripped item against `{"Read", "Grep", "Glob"}`; a trailing comma creates an invalid empty item.
@@q
Why collect every lint error in a fixed order?
@@a
The author can fix all problems in one pass, and consistent output makes CI results and tests easier to read.
@@q
Does validating allowed-tools prove a skill is safe?
@@a
No. Structural checks validate the team's metadata conventions; the instructions and supporting code still need review.
@@real
Claude Code supports more frontmatter fields and tool formats than this project linter. Its `allowed-tools` field pre-approves listed tools during invocation; other tools still follow the normal permission settings. See the [official skills reference](https://code.claude.com/docs/en/skills#frontmatter-reference).
