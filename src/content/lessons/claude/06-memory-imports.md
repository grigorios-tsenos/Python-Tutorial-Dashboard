---
id: cc-memory-imports
track: claude
order: 6
title: Assemble CLAUDE.md with Imports
tagline: Project memory can pull in other files. Follow the chain without looping forever.
kind: build
xp: 55
minutes: 8
---
@@body
# What Claude actually reads at startup

`CLAUDE.md` is Claude Code's **project memory**: build commands, conventions and gotchas, loaded into context at the start of every session. Long memory files get split up, so a memory file can **import** another with `@path`:

```markdown
# Orbit
Use pnpm, never npm.
@docs/testing.md
@docs/style.md
```

Claude Code documents the first three rules below; the fourth is this exercise's policy. Each one prevents a real problem:

- relative paths resolve from the **importing file's** directory, so `docs/testing.md` can import `@fixtures.md` (meaning `docs/fixtures.md`) or `@../STYLE.md`
- imports can nest, but only up to **5 hops** deep, which bounds the context cost
- text inside code blocks is never an import, so a Python sample with `@dataclass` stays a sample
- a file that is already in the current import chain is not expanded again, so two files that import each other don't paste each other's text repeatedly until the depth limit stops them

> **Mission:** implement `expand_memory(files, entry="CLAUDE.md", max_depth=5)`. `files` maps POSIX paths to text (a fake project). Return `(text, loaded)`:
>
> - an **import** is a line whose stripped content is a single token starting with `@` and longer than one character, outside a fenced code block (a line starting with three backticks toggles the fence)
> - replace an import line with the expanded lines of the target file, resolved with `posixpath.normpath(posixpath.join(dirname(importer), target))`
> - keep the import line **unchanged** when the target doesn't exist, is already in the current chain, or would be deeper than `max_depth` (the entry file is depth 0)
> - `text` is the resulting lines joined with `"\n"`; `loaded` lists every file that was expanded, once each, in first-expanded order
> - a missing `entry` raises `FileNotFoundError`; don't modify `files`

This exercise follows the documented import rules with a simplified line-based syntax; real memory files can also mention `@paths` inline in a sentence.
@@starter
import posixpath

def expand_memory(files, entry="CLAUDE.md", max_depth=5):
    """Expand @imports recursively; return (text, files_loaded_in_order)."""
    # TODO: walk the lines, expand imports relative to the importing file, stop cycles and deep chains
    return files[entry], [entry]

PROJECT = {
    "CLAUDE.md": "# Orbit\nUse pnpm, never npm.\n@docs/testing.md\n@docs/missing.md",
    "docs/testing.md": "Run `pnpm test` before every commit.\n@fixtures.md\n```python\n@dataclass\n```",
    "docs/fixtures.md": "Fixtures live in tests/data.\n@../CLAUDE.md",
}
text, loaded = expand_memory(PROJECT)
print(text)
print("loaded:", loaded)
@@solution
import posixpath

def expand_memory(files, entry="CLAUDE.md", max_depth=5):
    """Expand @imports recursively; return (text, files_loaded_in_order)."""
    if entry not in files:
        raise FileNotFoundError(entry)
    loaded = []

    def expand(path, depth, chain):
        if path not in loaded:
            loaded.append(path)
        lines, in_code = [], False
        for line in files[path].splitlines():
            token = line.strip()
            if token.startswith("```"):
                in_code = not in_code
            is_import = not in_code and token.startswith("@") and len(token) > 1 and len(token.split()) == 1
            if not is_import:
                lines.append(line)
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(path), token[1:]))
            if target not in files or target in chain or depth + 1 > max_depth:
                lines.append(line)
            else:
                lines.extend(expand(target, depth + 1, chain | {target}))
        return lines

    return "\n".join(expand(entry, 0, {entry})), loaded

PROJECT = {
    "CLAUDE.md": "# Orbit\nUse pnpm, never npm.\n@docs/testing.md\n@docs/missing.md",
    "docs/testing.md": "Run `pnpm test` before every commit.\n@fixtures.md\n```python\n@dataclass\n```",
    "docs/fixtures.md": "Fixtures live in tests/data.\n@../CLAUDE.md",
}
text, loaded = expand_memory(PROJECT)
print(text)
print("loaded:", loaded)
@@check
P = {
    "CLAUDE.md": "# Orbit\nUse pnpm, never npm.\n@docs/testing.md\n@docs/missing.md",
    "docs/testing.md": "Run `pnpm test` before every commit.\n@fixtures.md\n```python\n@dataclass\n```",
    "docs/fixtures.md": "Fixtures live in tests/data.\n@../CLAUDE.md",
}
snapshot = dict(P)
t, l = expand_memory(P)
lines = t.split("\n")
test("imports are replaced by the imported file's lines", lambda: lines[:4] == ["# Orbit", "Use pnpm, never npm.", "Run `pnpm test` before every commit.", "Fixtures live in tests/data."])
test("paths resolve from the importing file's directory", lambda: "docs/fixtures.md" in l)
test("a cycle back to the entry file is left as a line, not expanded again", lambda: lines[4] == "@../CLAUDE.md" and t.count("# Orbit") == 1)
test("code blocks never import", lambda: lines[5:8] == ["```python", "@dataclass", "```"])
test("a missing file stays as a visible line", lambda: lines[-1] == "@docs/missing.md")
test("loaded lists each expanded file once, in order", lambda: l == ["CLAUDE.md", "docs/testing.md", "docs/fixtures.md"])
test("the project files are unchanged", lambda: P == snapshot)
chain = {"CLAUDE.md": "root\n@a1.md"}
for i in range(1, 8):
    chain[f"a{i}.md"] = f"level {i}" + (f"\n@a{i + 1}.md" if i < 7 else "")
deep_text, deep_loaded = expand_memory(chain)
test("imports stop after max_depth hops", lambda: deep_text.split("\n") == ["root", "level 1", "level 2", "level 3", "level 4", "level 5", "@a6.md"] and len(deep_loaded) == 6)
test("max_depth is a parameter", lambda: expand_memory(chain, max_depth=1)[0].split("\n") == ["root", "level 1", "@a2.md"] and expand_memory(chain, max_depth=0)[0] == "root\n@a1.md")
shared = {
    "CLAUDE.md": "@team/a.md\n@team/b.md",
    "team/a.md": "A\n@common.md",
    "team/b.md": "B\n@common.md",
    "team/common.md": "shared rule",
}
s_text, s_loaded = expand_memory(shared)
test("a file shared by two branches is expanded in each, loaded once", lambda: s_text.split("\n") == ["A", "shared rule", "B", "shared rule"] and s_loaded == ["CLAUDE.md", "team/a.md", "team/common.md", "team/b.md"])
odd = {"CLAUDE.md": "Ask @alice about deploys\n@\n  @notes.md  \n@notes.md extra", "notes.md": "N"}
test("only whole-line single tokens are imports", lambda: expand_memory(odd)[0].split("\n") == ["Ask @alice about deploys", "@", "N", "@notes.md extra"])
test("a different entry file can be used", lambda: expand_memory(shared, entry="team/a.md")[0] == "A\nshared rule")
try:
    expand_memory({"README.md": "x"})
    missing = False
except FileNotFoundError:
    missing = True
test("a missing entry file raises FileNotFoundError", lambda: missing)
@@hint
Write a recursive helper `expand(path, depth, chain)` that returns a list of lines. Track a fenced-code flag that flips on lines starting with three backticks, and treat a line as an import only outside code when `token.startswith("@")`, `len(token) > 1` and `len(token.split()) == 1`.
@@hint
Resolve with `posixpath.normpath(posixpath.join(posixpath.dirname(path), token[1:]))`. If the target is missing, already in `chain`, or `depth + 1 > max_depth`, keep the original line; otherwise `lines.extend(expand(target, depth + 1, chain | {target}))`. Append each path to `loaded` the first time it is expanded.
@@q
Relative to what does a CLAUDE.md `@import` path resolve?
@@a
The directory of the file that contains the import.
@@q
Why do memory imports need a cycle check and a depth limit?
@@a
Files can import each other; without limits expansion would loop forever or flood the context window.
@@real
Run `/memory` in Claude Code to see which memory files were loaded and open them for editing. Claude Code also reads `~/.claude/CLAUDE.md` (your personal preferences for every project) and CLAUDE.md files in subdirectories when it works there. See [CLAUDE.md imports](https://code.claude.com/docs/en/memory#claude-md-imports).
