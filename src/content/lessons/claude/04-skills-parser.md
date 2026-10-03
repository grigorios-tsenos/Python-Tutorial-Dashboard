---
id: cc-frontmatter
track: claude
order: 4
title: "Puzzle: Read a Skill File"
tagline: Skills and subagents are Markdown files with a tiny YAML header.
kind: parsons
xp: 40
minutes: 6
---
@@body
# Skills and subagents are just files

Two Claude Code extension points are Markdown with **frontmatter**, a `key: value` header between `---` lines:

```markdown
---
name: code-reviewer
description: Reviews diffs for bugs. Use after any code change.
tools: Read, Grep
---
You are a careful reviewer...
```

| file | what it is |
|---|---|
| `.claude/skills/<name>/SKILL.md` | a **skill**: loaded when its `description` matches the task |
| `.claude/agents/<name>.md` | a **subagent**: its own prompt (the body) and tool access |

Arrange `parse_frontmatter(text)`, which returns `(meta_dict, body)`. Values can contain colons (`description: Use when: reviewing`), so split at the **first** one only.
@@lines
def parse_frontmatter(text):
    head, _, body = text.removeprefix("---\n").partition("\n---\n")
    meta = {}
    for line in head.splitlines():
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta, body.strip()
@@check
doc = "---\nname: code-reviewer\ndescription: Use when: reviewing diffs\ntools: Read, Grep\n---\nYou are a careful reviewer.\n"
meta, body = parse_frontmatter(doc)
test("keys and values parsed", lambda: meta["name"] == "code-reviewer" and meta["tools"] == "Read, Grep")
test("values may contain colons", lambda: meta["description"] == "Use when: reviewing diffs")
test("body is returned without the header", lambda: body == "You are a careful reviewer.")
test("exactly three keys", lambda: len(meta) == 3)
@@hint
A `def` line must come first, and every indented line belongs under it. The `meta = {}` has to exist before the loop fills it.
@@hint
Split the header from the body (`head, _, body = ...`), create `meta`, loop over `head.splitlines()`, fill `meta`, then `return`. The loop body is indented one level deeper than the loop.
@@q
Where does a Claude Code subagent definition live?
@@a
`.claude/agents/<name>.md`: frontmatter for name/description/tools, body as its system prompt.
@@q
Why is a skill's `description` so important?
@@a
Claude reads it to decide when the skill is relevant to the current task.
