import type { CodingGuide } from '../guided';

export const CLAUDE_GUIDES: Record<string, CodingGuide> = {
  "cc-events": {
    "setup": "LOG = [\n    {\"tool_name\": \"Bash\", \"tool_input\": {\"command\": \"npm test\"}},\n    {\"tool_name\": \"Edit\", \"tool_input\": {\"file_path\": \"src/app.py\"}},\n    {\"tool_name\": \"WebSearch\", \"tool_input\": {\"query\": \"pandas pivot\"}},\n]",
    "steps": [
      {
        "title": "Read the tool name",
        "instruction": "Read the first event in `LOG` and store its tool name in `tool`. Use `?` as the fallback when `tool_name` is absent.",
        "code": "tool = LOG[0].get(\"tool_name\", \"?\")",
        "check": "test(\"Read the tool name\", lambda: tool == \"Bash\", \"The first tool is Bash.\")",
        "expected": "The first tool is Bash.",
        "reassurance": "You have identified the action. Its detail lives in tool_input."
      },
      {
        "title": "Read the command",
        "instruction": "For the first event, store the nested `tool_input` mapping in `details` and its command in `command`. A missing details mapping should behave like an empty one, and a missing command should produce `?`.",
        "code": "details = LOG[0].get(\"tool_input\", {})\ncommand = details.get(\"command\", \"?\")",
        "check": "test(\"Read the command\", lambda: command == \"npm test\", \"The command is npm test.\")",
        "expected": "The command is npm test.",
        "reassurance": "The nested lookup is correct. Next combine the name and detail."
      },
      {
        "title": "Format a readable event",
        "instruction": "Create readable text in `line` using the stored tool name and command, separated by a colon and one space. The expected text lets you check the formatting before handling other tool types.",
        "code": "line = f\"{tool}: {command}\"",
        "check": "test(\"Format a readable event\", lambda: line == \"Bash: npm test\", \"Bash: npm test\")",
        "expected": "Bash: npm test",
        "reassurance": "The first event is readable. The function will also handle file tools and unknown tools."
      },
      {
        "title": "Describe any supported event",
        "instruction": "Define `describe(event)` returning readable text. Bash events use their command; Edit and Write events use their file path; other events return just the tool name. Use a colon and one space before a detail, `?` for a missing name or supported detail, and an empty mapping for missing `tool_input`.",
        "code": "def describe(event):\n    tool = event.get(\"tool_name\", \"?\")\n    details = event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        return f\"Bash: {details.get('command', '?')}\"\n    if tool in (\"Edit\", \"Write\"):\n        return f\"{tool}: {details.get('file_path', '?')}\"\n    return tool",
        "check": "test(\"Describe any supported event\", lambda: describe({\"tool_name\": \"Bash\"}) == \"Bash: ?\" and describe({\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"a.py\"}}) == \"Write: a.py\", \"Missing Bash details give Bash: ?; Write displays its file.\")",
        "expected": "Missing Bash details give Bash: ?; Write displays its file.",
        "reassurance": "The fallback and file branch are checked. The final loop prints the actual audit trail."
      },
      {
        "title": "Print the audit trail",
        "instruction": "Display one description for each event in `LOG`, in its original order, using your `describe` function. The full verification checks both formatting and missing-detail behavior.",
        "code": "for event in LOG:\n    print(describe(event))",
        "check": "",
        "expected": "Bash: npm test, Edit: src/app.py, then WebSearch.",
        "reassurance": "The full check verifies all event types, missing details and printed output."
      }
    ]
  },
  "cc-permissions": {
    "setup": "import json",
    "steps": [
      {
        "title": "Build the settings shape",
        "instruction": "Define `build_settings(allow, deny)` to return a permissions object with independent `allow` and `deny` lists under the `permissions` key. Preserve rule order and empty lists; changing a result list must not change the caller's list.",
        "code": "def build_settings(allow, deny):\n    return {\"permissions\": {\"allow\": list(allow), \"deny\": list(deny)}}",
        "check": "test(\"Build the settings shape\", lambda: build_settings([\"Bash(git:*)\"], []) == {\"permissions\": {\"allow\": [\"Bash(git:*)\"], \"deny\": []}}, \"permissions contains allow and deny lists, including an empty deny list.\")",
        "expected": "permissions contains allow and deny lists, including an empty deny list.",
        "reassurance": "The settings shape is verified. Now interpret one rule at a time."
      },
      {
        "title": "Match a tool and argument",
        "instruction": "Define `matches(rule, tool, arg)` returning whether the tool and argument match a rule shaped like `Tool(pattern)`. Tool names must match exactly. A pattern ending in `:*` matches an argument prefix before that suffix; other patterns require an exact argument match. Preserve colons inside the pattern.",
        "code": "def matches(rule, tool, arg):\n    name, _, rest = rule.partition(\"(\")\n    if name != tool:\n        return False\n    pattern = rest[:-1]\n    return arg.startswith(pattern[:-2]) if pattern.endswith(\":*\") else arg == pattern",
        "check": "test(\"Match a tool and argument\", lambda: matches(\"Bash(git:*)\", \"Bash\", \"git status\") and not matches(\"Bash(git:*)\", \"Edit\", \"git status\") and matches(\"Read(./.env)\", \"Read\", \"./.env\"), \"Prefix and exact rules match only the named tool.\")",
        "expected": "Prefix and exact rules match only the named tool.",
        "reassurance": "Rule matching works. Deny must be checked before allow."
      },
      {
        "title": "Apply deny before allow",
        "instruction": "Define `decide(settings, tool, arg)` returning `deny`, `allow` or `ask`. A matching deny rule wins over every allow rule; otherwise use a matching allow rule or ask when neither matches. Missing permissions or rule lists should behave like empty lists.",
        "code": "def decide(settings, tool, arg):\n    perms = settings.get(\"permissions\", {})\n    if any(matches(rule, tool, arg) for rule in perms.get(\"deny\", [])):\n        return \"deny\"\n    if any(matches(rule, tool, arg) for rule in perms.get(\"allow\", [])):\n        return \"allow\"\n    return \"ask\"",
        "check": "test(\"Apply deny before allow\", lambda: decide(build_settings([\"Bash(git:*)\"], [\"Bash(git push:*)\"]), \"Bash\", \"git push origin main\") == \"deny\", \"git push is denied even though git commands are allowed.\")",
        "expected": "git push is denied even though git commands are allowed.",
        "reassurance": "The precedence rule is checked. The full tests also cover exact rules and unmatched actions."
      },
      {
        "title": "Inspect a settings example",
        "instruction": "Create `settings` allowing `Bash(npm run test:*)` and `Bash(git:*)`, and denying `Bash(git push:*)` and `Read(./.env)`. Display the settings as readable JSON, then display the decision for Bash command `git push origin main`.",
        "code": "settings = build_settings([\"Bash(npm run test:*)\", \"Bash(git:*)\"], [\"Bash(git push:*)\", \"Read(./.env)\"])\nprint(json.dumps(settings, indent=2))\nprint(decide(settings, \"Bash\", \"git push origin main\"))",
        "check": "",
        "expected": "The JSON contains both rule lists; the final decision is deny.",
        "reassurance": "The complete check verifies the settings format and each decision path."
      }
    ]
  },
  "cc-hooks": {
    "setup": "import re",
    "steps": [
      {
        "title": "Block destructive shell commands",
        "instruction": "Define `command_block_reason(command)` returning a reason for forbidden Bash commands or an empty string for allowed ones. Block commands containing `rm -rf`, and `git push` commands with `--force` or the separate `-f` flag. The reasons must name `rm -rf` or `force` respectively; a normal push remains allowed.",
        "code": "def command_block_reason(command):\n    if \"rm -rf\" in command:\n        return \"Blocked: rm -rf is not allowed. Delete specific files instead.\"\n    if re.search(r\"git push\\b.*(--force|\\s-f\\b)\", command):\n        return \"Blocked: force pushes are not allowed. Use a normal push.\"\n    return \"\"",
        "check": "test(\"Block destructive shell commands\", lambda: \"rm -rf\" in command_block_reason(\"rm -rf /tmp/x\") and \"force\" in command_block_reason(\"git push -f origin main\") and command_block_reason(\"git push origin main\") == \"\", \"rm -rf and force pushes have reasons; a normal push has none.\")",
        "expected": "rm -rf and force pushes have reasons; a normal push has none.",
        "reassurance": "The command policy is checked. The next rule covers file edits."
      },
      {
        "title": "Identify protected environment paths",
        "instruction": "Define `protected_env_path(path)` for this chapter's environment-file rule. A path is protected if it ends in `.env` or contains `/.env`; ordinary paths such as `/repo/app.py` should pass.",
        "code": "def protected_env_path(path):\n    return path.endswith(\".env\") or \"/.env\" in path",
        "check": "test(\"Identify protected environment paths\", lambda: protected_env_path(\"/repo/.env\") and not protected_env_path(\"/repo/app.py\"), \"/repo/.env is protected; /repo/app.py is not.\")",
        "expected": "/repo/.env is protected; /repo/app.py is not.",
        "reassurance": "The file rule is ready. The hook now needs to route tools to the correct rule."
      },
      {
        "title": "Return the hook decision",
        "instruction": "Define `pre_tool_use(event)` returning an exit-code/message pair. For Bash, apply your command rule to `tool_input` command text. For Write, Edit and MultiEdit, block protected file paths with a message naming `.env`. Blocks use exit code `2` and a helpful reason; all other actions use `0` and an empty message. Missing details should default safely.",
        "code": "def pre_tool_use(event):\n    tool, args = event.get(\"tool_name\"), event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        reason = command_block_reason(args.get(\"command\", \"\"))\n        return (2, reason) if reason else (0, \"\")\n    if tool in (\"Write\", \"Edit\", \"MultiEdit\") and protected_env_path(args.get(\"file_path\", \"\")):\n        return 2, \"Blocked: .env files hold secrets. Edit .env.example instead.\"\n    return 0, \"\"",
        "check": "test(\"Return the hook decision\", lambda: pre_tool_use({\"tool_name\": \"Bash\", \"tool_input\": {\"command\": \"ls -la\"}}) == (0, \"\") and pre_tool_use({\"tool_name\": \"Edit\", \"tool_input\": {\"file_path\": \"/repo/.env\"}})[0] == 2, \"Normal ls is allowed; editing .env returns exit code 2.\")",
        "expected": "Normal ls is allowed; editing .env returns exit code 2.",
        "reassurance": "Both routing branches are checked. The final checks exercise the other prohibited commands."
      },
      {
        "title": "Inspect a blocked result",
        "instruction": "Inspect your hook's response for a Bash event whose command is `rm -rf /tmp/build`. Display the returned decision without executing the command, then run the complete verification.",
        "code": "print(pre_tool_use({\"tool_name\": \"Bash\", \"tool_input\": {\"command\": \"rm -rf /tmp/build\"}}))",
        "check": "",
        "expected": "A tuple beginning with 2 and a reason naming rm -rf.",
        "reassurance": "The full check confirms blocking messages and allowed alternatives."
      }
    ]
  },
  "cc-frontmatter": {
    "setup": "doc = \"---\\nname: code-reviewer\\ndescription: Use when: reviewing diffs\\ntools: Read, Grep\\n---\\nYou are a careful reviewer.\\n\"",
    "steps": [
      {
        "title": "Separate header and body",
        "instruction": "Separate `doc` into `head` for the metadata between its opening and closing `---` delimiter lines, and `body` for the text after the closing delimiter. Keep the header out of the body.",
        "code": "head, _, body = doc.removeprefix(\"---\\n\").partition(\"\\n---\\n\")",
        "check": "test(\"Separate header and body\", lambda: head.startswith(\"name: code-reviewer\") and body.strip() == \"You are a careful reviewer.\", \"Header starts with name; body contains only the reviewer instruction.\")",
        "expected": "Header starts with name; body contains only the reviewer instruction.",
        "reassurance": "The two sections are separated. Next parse one colon per header line."
      },
      {
        "title": "Keep colons inside values",
        "instruction": "Inspect the second header line and store its field name in `key` and remaining text in `value`. Split at the first colon only so the description's internal colon remains part of the value.",
        "code": "key, _, value = head.splitlines()[1].partition(\":\")",
        "check": "test(\"Keep colons inside values\", lambda: key == \"description\" and value.strip() == \"Use when: reviewing diffs\", \"The description value still includes its internal colon.\")",
        "expected": "The description value still includes its internal colon.",
        "reassurance": "The split preserves the full description. Use that operation for each header line."
      },
      {
        "title": "Build the metadata mapping",
        "instruction": "Build a dictionary named `meta` from all header lines, trimming whitespace around each key and value. Preserve the complete value after the first colon, including any later colons.",
        "code": "meta = {}\nfor line in head.splitlines():\n    key, _, value = line.partition(\":\")\n    meta[key.strip()] = value.strip()",
        "check": "test(\"Build the metadata mapping\", lambda: meta == {\"name\": \"code-reviewer\", \"description\": \"Use when: reviewing diffs\", \"tools\": \"Read, Grep\"}, \"Exactly three metadata fields with their original values.\")",
        "expected": "Exactly three metadata fields with their original values.",
        "reassurance": "The metadata is correct. Package the verified operations as the requested parser."
      },
      {
        "title": "Return metadata and body",
        "instruction": "Define `parse_frontmatter(text)` to return the metadata dictionary and trimmed body, in that order. Apply your parsing behavior to the text argument, using the delimiter lines and preserving internal colons in field values.",
        "code": "def parse_frontmatter(text):\n    head, _, body = text.removeprefix(\"---\\n\").partition(\"\\n---\\n\")\n    meta = {}\n    for line in head.splitlines():\n        key, _, value = line.partition(\":\")\n        meta[key.strip()] = value.strip()\n    return meta, body.strip()",
        "check": "",
        "expected": "parse_frontmatter returns the three metadata fields and the body text.",
        "reassurance": "The complete check verifies key count, internal colons and removal of the header."
      }
    ]
  },
  "cc-skill-lint": {
    "setup": "import re",
    "steps": [
      {
        "title": "Validate a skill name",
        "instruction": "Define `valid_skill_name(name)` returning a boolean. Accept only strings of 1 to 64 characters that begin with a lowercase letter and contain lowercase letters, digits and single separating hyphens. No leading, trailing or repeated hyphens are allowed; nonstrings must fail without raising.",
        "code": "def valid_skill_name(name):\n    return isinstance(name, str) and 1 <= len(name) <= 64 and re.fullmatch(r\"[a-z][a-z0-9]*(?:-[a-z0-9]+)*\", name) is not None",
        "check": "test(\"Validate a skill name\", lambda: valid_skill_name(\"review-code\") and not valid_skill_name(\"Review-Code\") and not valid_skill_name(None) and valid_skill_name(\"a\" * 64), \"review-code and a 64-character lowercase name pass; uppercase and None fail.\")",
        "expected": "review-code and a 64-character lowercase name pass; uppercase and None fail.",
        "reassurance": "Name validation handles both format and type. Next validate trimmed descriptions."
      },
      {
        "title": "Validate the description",
        "instruction": "Define `valid_skill_description(description)` returning a boolean. Accept only strings with 1 to 1024 characters after trimming whitespace; reject blank text, overlong text and nonstrings without raising.",
        "code": "def valid_skill_description(description):\n    return isinstance(description, str) and 1 <= len(description.strip()) <= 1024",
        "check": "test(\"Validate the description\", lambda: valid_skill_description(\" x \") and not valid_skill_description(\"  \") and not valid_skill_description(\"x\" * 1025), \"A nonblank trimmed description of at most 1024 characters passes.\")",
        "expected": "A nonblank trimmed description of at most 1024 characters passes.",
        "reassurance": "Description boundaries are checked. The optional tool list has its own allowlist."
      },
      {
        "title": "Validate the tool list",
        "instruction": "Define `valid_skill_tools(tools)` returning a boolean for comma-separated text. Each trimmed entry must be `Read`, `Grep` or `Glob`. Reject unknown names, empty entries including a trailing comma, and nonstring inputs.",
        "code": "def valid_skill_tools(tools):\n    return isinstance(tools, str) and all(tool.strip() in {\"Read\", \"Grep\", \"Glob\"} for tool in tools.split(\",\"))",
        "check": "test(\"Validate the tool list\", lambda: valid_skill_tools(\" Read , Grep \") and not valid_skill_tools(\"Read,\") and not valid_skill_tools([\"Read\"]), \"Spaced allowed names pass; trailing empty names and nonstrings fail.\")",
        "expected": "Spaced allowed names pass; trailing empty names and nonstrings fail.",
        "reassurance": "The allowlist rejects unknown and empty names. Next collect errors in the documented order."
      },
      {
        "title": "Collect every field error",
        "instruction": "Define `validate_skill(meta, body)` returning a list of invalid field names. Nondictionary metadata should produce only `metadata`. Otherwise check `name`, `description`, optional `allowed-tools` and nonblank string `body`, reporting every failure in that order. Missing required fields fail; absent allowed-tools is acceptable. Preserve the inputs.",
        "code": "def validate_skill(meta, body):\n    if not isinstance(meta, dict):\n        return [\"metadata\"]\n    checks = [(\"name\", valid_skill_name(meta.get(\"name\"))),\n        (\"description\", valid_skill_description(meta.get(\"description\"))),\n        (\"allowed-tools\", \"allowed-tools\" not in meta or valid_skill_tools(meta[\"allowed-tools\"])),\n        (\"body\", isinstance(body, str) and bool(body.strip()))]\n    return [field for field, passed in checks if not passed]",
        "check": "",
        "expected": "Invalid fields are reported as name, description, allowed-tools, body, in that order.",
        "reassurance": "The full checks cover missing fields, limits, tool names, body types and unchanged metadata."
      }
    ]
  },
  "cc-memory-imports": {
    "setup": "import posixpath\nPROJECT = {\n    \"CLAUDE.md\": \"# Orbit\\nUse pnpm, never npm.\\n@docs/testing.md\\n@docs/missing.md\",\n    \"docs/testing.md\": \"Run `pnpm test` before every commit.\\n@fixtures.md\\n```python\\n@dataclass\\n```\",\n    \"docs/fixtures.md\": \"Fixtures live in tests/data.\\n@../CLAUDE.md\",\n}",
    "steps": [
      {
        "title": "Recognize whole-line imports",
        "instruction": "Define `is_memory_import(token, in_code)` returning a boolean. Recognize a whole-line token beginning with `@` followed by a nonempty path and no whitespace inside the token. Its caller will remove surrounding whitespace before recognition. Tokens inside fenced code and tokens with extra text are ordinary text.",
        "code": "def is_memory_import(token, in_code):\n    return not in_code and token.startswith(\"@\") and len(token) > 1 and len(token.split()) == 1",
        "check": "test(\"Recognize whole-line imports\", lambda: is_memory_import(\"@docs/testing.md\", False) and not is_memory_import(\"@dataclass\", True) and not is_memory_import(\"@notes.md extra\", False), \"@docs/testing.md is an import; a code decorator and a token with extra text are not.\")",
        "expected": "@docs/testing.md is an import; a code decorator and a token with extra text are not.",
        "reassurance": "The import boundary is checked. Relative paths need the importing file\u2019s directory."
      },
      {
        "title": "Resolve an import path",
        "instruction": "Define `memory_target(path, token)` to resolve an import token against the directory of the importing file, using normalized POSIX paths. Remove only the import marker; sibling and parent-directory references must resolve correctly.",
        "code": "def memory_target(path, token):\n    return posixpath.normpath(posixpath.join(posixpath.dirname(path), token[1:]))",
        "check": "test(\"Resolve an import path\", lambda: memory_target(\"docs/testing.md\", \"@fixtures.md\") == \"docs/fixtures.md\" and memory_target(\"docs/fixtures.md\", \"@../CLAUDE.md\") == \"CLAUDE.md\", \"Sibling fixtures resolve under docs; ../CLAUDE.md resolves to the root file.\")",
        "expected": "Sibling fixtures resolve under docs; ../CLAUDE.md resolves to the root file.",
        "reassurance": "Path resolution matches the sample. Missing, cyclic or too-deep imports must remain visible."
      },
      {
        "title": "Expand one safe import",
        "instruction": "Define `expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code)` returning a list of output lines. Ignore surrounding whitespace when recognizing an import, so an indented whole-line import can expand. Preserve ordinary lines and imports that are missing, already in the current recursion chain, or beyond the maximum depth. For a safe import, delegate to `expand_memory_lines` at the next depth with the target added to that branch's chain. Preserve the entire original line, including whitespace, when expansion stops.",
        "code": "def expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code):\n    token = line.strip()\n    if not is_memory_import(token, in_code):\n        return [line]\n    target = memory_target(path, token)\n    if target not in files or target in chain or depth + 1 > max_depth:\n        return [line]\n    return expand_memory_lines(files, target, depth + 1, chain | {target}, max_depth, loaded)",
        "check": "test(\"Expand one safe import\", lambda: expand_memory_line(PROJECT, \"CLAUDE.md\", \"@docs/missing.md\", 0, {\"CLAUDE.md\"}, 5, [], False) == [\"@docs/missing.md\"] and expand_memory_line(PROJECT, \"docs/fixtures.md\", \"@../CLAUDE.md\", 2, {\"CLAUDE.md\"}, 5, [], False) == [\"@../CLAUDE.md\"], \"Missing and cyclic imports stay as their original lines.\")",
        "expected": "Missing and cyclic imports stay as their original lines.",
        "reassurance": "The stopping cases are verified without recursing. Next walk a file\u2019s lines and track code fences."
      },
      {
        "title": "Walk one file\u2019s lines",
        "instruction": "Define `expand_memory_lines(files, path, depth, chain, max_depth, loaded)` returning the expanded lines of one file. Record each loaded path only once in discovery order. Treat lines whose trimmed text starts with three backticks as code-fence boundaries, preserving fenced text without imports. Delegate each line to `expand_memory_line`, and allow a shared file to expand again in separate branches. Keep cycle detection local to the current chain.",
        "code": "def expand_memory_lines(files, path, depth, chain, max_depth, loaded):\n    if path not in loaded: loaded.append(path)\n    lines, in_code = [], False\n    for line in files[path].splitlines():\n        if line.strip().startswith(\"```\"):\n            in_code = not in_code\n        lines.extend(expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code))\n    return lines",
        "check": "test(\"Walk one file\\u2019s lines\", lambda: expand_memory_lines({\"CLAUDE.md\": \"root\\n@a.md\", \"a.md\": \"A\"}, \"CLAUDE.md\", 0, {\"CLAUDE.md\"}, 5, []) == [\"root\", \"A\"], \"A simple import expands to root, then A.\")",
        "expected": "A simple import expands to root, then A.",
        "reassurance": "Recursive expansion works on a small example. The wrapper will validate the entry and return loaded order."
      },
      {
        "title": "Expose the memory assembler",
        "instruction": "Define `expand_memory(files, entry=\"CLAUDE.md\", max_depth=5)` returning expanded text and the loaded-path list, in that order. Start at depth zero with fresh state per call, join output lines with newlines, and raise `FileNotFoundError` if the entry is absent. Preserve `files`, stop imports beyond the depth limit and leave blocked imports visible.",
        "code": "def expand_memory(files, entry=\"CLAUDE.md\", max_depth=5):\n    if entry not in files:\n        raise FileNotFoundError(entry)\n    loaded = []\n    text = \"\\n\".join(expand_memory_lines(files, entry, 0, {entry}, max_depth, loaded))\n    return text, loaded",
        "check": "test(\"Expose the memory assembler\", lambda: expand_memory(PROJECT)[1] == [\"CLAUDE.md\", \"docs/testing.md\", \"docs/fixtures.md\"], \"Loaded order is CLAUDE.md, docs/testing.md, docs/fixtures.md.\")",
        "expected": "Loaded order is CLAUDE.md, docs/testing.md, docs/fixtures.md.",
        "reassurance": "The sample traversal order is correct. The last check also tests depth, sharing and fenced code."
      },
      {
        "title": "Inspect assembled memory",
        "instruction": "Assemble the available `PROJECT` with your function, storing the returned text and file list in `text` and `loaded`. Display both, labeling the file list `loaded:`. Inspect where missing imports and the cycle remain visible.",
        "code": "text, loaded = expand_memory(PROJECT)\nprint(text)\nprint(\"loaded:\", loaded)",
        "check": "",
        "expected": "Expanded instructions print, while missing imports and the cycle remain visible.",
        "reassurance": "The complete checks verify recursion limits, code fences, shared imports and unchanged project files."
      }
    ]
  },
  "cc-hook-routing": {
    "setup": "import json\nimport posixpath\nevent = {\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"config/../package.json\"}}",
    "steps": [
      {
        "title": "Build the JSON decision shape",
        "instruction": "Define `hook_reply(decision, reason)` returning a JSON-serializable dictionary. Its `hookSpecificOutput` object must contain `hookEventName` with value `PreToolUse`, `permissionDecision` with the given decision, and `permissionDecisionReason` with the given explanation.",
        "code": "def hook_reply(decision, reason):\n    return {\"hookSpecificOutput\": {\"hookEventName\": \"PreToolUse\", \"permissionDecision\": decision, \"permissionDecisionReason\": reason}}",
        "check": "test(\"Build the JSON decision shape\", lambda: json.loads(json.dumps(hook_reply(\"deny\", \"malformed tool event\")))[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\", \"A JSON-serializable deny decision with the PreToolUse event name.\")",
        "expected": "A JSON-serializable deny decision with the PreToolUse event name.",
        "reassurance": "The response shape is correct. Validate events before touching nested values."
      },
      {
        "title": "Validate the outer event",
        "instruction": "Define `valid_tool_event(event)` returning a boolean. Only dictionaries with a nonblank string `tool_name` are valid. Reject malformed outer events without raising or modifying them.",
        "code": "def valid_tool_event(event):\n    return isinstance(event, dict) and isinstance(event.get(\"tool_name\"), str) and bool(event[\"tool_name\"].strip())",
        "check": "test(\"Validate the outer event\", lambda: valid_tool_event({\"tool_name\": \"Write\"}) and not valid_tool_event(None) and not valid_tool_event({\"tool_name\": \" \"}), \"Write is valid; None and a blank tool name are invalid.\")",
        "expected": "Write is valid; None and a blank tool name are invalid.",
        "reassurance": "Malformed outer events are identified without crashing. File paths have a separate trust boundary."
      },
      {
        "title": "Read and validate a path",
        "instruction": "Define `event_path(event)` to read `file_path` only when `tool_input` is a dictionary, returning `None` otherwise. Also define `valid_hook_path(path)` to accept only nonblank strings with no NUL character. These helpers must reject malformed path data without crashing.",
        "code": "def event_path(event):\n    inputs = event.get(\"tool_input\")\n    return inputs.get(\"file_path\") if isinstance(inputs, dict) else None\n\ndef valid_hook_path(path):\n    return isinstance(path, str) and bool(path.strip()) and \"\\0\" not in path",
        "check": "test(\"Read and validate a path\", lambda: event_path({\"tool_input\": None}) is None and valid_hook_path(\"src/app.py\") and not valid_hook_path(\"bad\\0path\"), \"Normal file text passes; malformed input and NUL paths fail.\")",
        "expected": "Normal file text passes; malformed input and NUL paths fail.",
        "reassurance": "The path boundary is checked. Normalize before deciding whether a write stays in scope."
      },
      {
        "title": "Identify protected path components",
        "instruction": "Define `protected_hook_parts(parts)` returning whether any whole path component is `.git`, `.env` or begins with `.env.`. Protect these at every depth, while allowing the exact component `.env.example`.",
        "code": "def protected_hook_parts(parts):\n    return any(part == \".git\" or (part != \".env.example\" and (part == \".env\" or part.startswith(\".env.\"))) for part in parts)",
        "check": "test(\"Identify protected path components\", lambda: protected_hook_parts([\"config\", \".env.production\"]) and protected_hook_parts([\".git\", \"config\"]) and not protected_hook_parts([\"docs\", \".env.example\"]), \"Nested environment files and .git are protected; .env.example passes.\")",
        "expected": "Nested environment files and .git are protected; .env.example passes.",
        "reassurance": "Protection is checked by whole path components. Scope and dependency review come next."
      },
      {
        "title": "Choose the project-path policy",
        "instruction": "Define `classify_hook_parts(parts)` using `hook_reply`. Protected components take priority and produce `deny` with reason `protected project path`. Otherwise a final filename of `package.json`, `pyproject.toml` or `requirements.txt` produces `ask` with reason `review dependencies before writing`. Ordinary paths return an empty dictionary.",
        "code": "def classify_hook_parts(parts):\n    if protected_hook_parts(parts):\n        return hook_reply(\"deny\", \"protected project path\")\n    if parts[-1] in {\"package.json\", \"pyproject.toml\", \"requirements.txt\"}:\n        return hook_reply(\"ask\", \"review dependencies before writing\")\n    return {}",
        "check": "test(\"protection precedes dependency review\", lambda: classify_hook_parts([\".git\", \"package.json\"])[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\" and classify_hook_parts([\"package.json\"])[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and classify_hook_parts([\"src\", \"app.py\"]) == {}, \"Protected files deny, dependency files ask, and ordinary files return {}.\")",
        "expected": "Protected files deny; dependency files ask; normal project paths return {}.",
        "reassurance": "The path policy is checked independently. First the next helper will make sure a normalized path stays inside the project."
      },
      {
        "title": "Normalize and check project scope",
        "instruction": "Define `classify_hook_path(path, project_dir)` to normalize POSIX paths relative to the project root. Deny normalized paths outside that root with reason `write is outside the project`; compare whole components so sibling roots do not count as inside. For paths within the root, classify their relative components. This exercise uses lexical paths, without resolving filesystem symlinks.",
        "code": "def classify_hook_path(path, project_dir):\n    root = posixpath.normpath(project_dir)\n    # ponytail: lexical paths only; resolve symlinks before filesystem enforcement.\n    path = posixpath.normpath(posixpath.join(root, path))\n    if posixpath.commonpath([root, path]) != root:\n        return hook_reply(\"deny\", \"write is outside the project\")\n    return classify_hook_parts(posixpath.relpath(path, root).split(\"/\"))",
        "check": "test(\"normalized paths respect project scope\", lambda: classify_hook_path(\"../package.json\", \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\" and classify_hook_path(\"config/../package.json\", \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\", \"Outside writes deny; normalized project dependency files ask.\")",
        "expected": "Outside writes are denied; normalized project dependency files ask for review.",
        "reassurance": "Scope takes precedence over dependency review. Next route validated write tools into this classifier."
      },
      {
        "title": "Route the complete event",
        "instruction": "Define `route_hook(event, project_dir)`. Deny invalid outer events with reason `malformed tool event`. Tools other than Write, Edit and MultiEdit return an empty dictionary. For managed writes, deny invalid paths with reason `malformed file path`; otherwise apply your normalized path classifier. Preserve the event and project input.",
        "code": "def route_hook(event, project_dir):\n    if not valid_tool_event(event):\n        return hook_reply(\"deny\", \"malformed tool event\")\n    if event[\"tool_name\"] not in {\"Write\", \"Edit\", \"MultiEdit\"}: return {}\n    path = event_path(event)\n    if not valid_hook_path(path):\n        return hook_reply(\"deny\", \"malformed file path\")\n    return classify_hook_path(path, project_dir)",
        "check": "test(\"the complete hook routes valid and malformed events\", lambda: route_hook(event, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and route_hook({\"tool_name\": \"Read\"}, \"/workspace/repo\") == {} and route_hook({\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"src/app.py\"}}, \"/workspace/repo\") == {} and route_hook(None, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\", \"Dependencies ask, normal writes and unmanaged tools return {}, and malformed events deny.\")",
        "expected": "Normal writes return {}; dependency writes ask; malformed and protected writes deny.",
        "reassurance": "The router correctly handles the sample dependency, an ordinary write, an unmanaged tool and malformed input. The final check adds the remaining path cases."
      },
      {
        "title": "Inspect the dependency decision",
        "instruction": "Display the JSON response from your router for the available `event` and project directory `/workspace/repo`. Inspect how its `config/../package.json` path affects the decision, then run the chapter verification.",
        "code": "print(json.dumps(route_hook(event, \"/workspace/repo\"), indent=2))",
        "check": "",
        "expected": "The PreToolUse response asks for review because config/../package.json normalizes to package.json.",
        "reassurance": "The complete checks cover traversal, sibling roots, protected paths, precedence, malformed events and unchanged inputs."
      }
    ]
  },
  "cc-mcp-config": {
    "setup": "import copy\nimport re\nCONFIG = {\n    \"mcpServers\": {\n        \"tracker\": {\n            \"type\": \"http\",\n            \"url\": \"${TRACKER_URL:-https://tracker.example.com}/mcp\",\n            \"headers\": {\"Authorization\": \"Bearer ${TRACKER_TOKEN}\"},\n        },\n        \"docs\": {\"command\": \"npx\", \"args\": [\"-y\", \"docs-mcp\", \"--root\", \"${DOCS_ROOT:-./docs}\"], \"env\": {\"LOG_LEVEL\": \"warn\"}},\n    }\n}",
    "steps": [
      {
        "title": "Recognize supported placeholders",
        "instruction": "Create a compiled regular expression named `PLACEHOLDER` for `${NAME}` and `${NAME:-default}`. Names begin with a letter or underscore, followed by letters, digits or underscores; defaults contain no closing brace. Capture the name as group 1 and optional default as group 2. Unsupported syntax must remain literal.",
        "code": "PLACEHOLDER = re.compile(r\"\\$\\{([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\\}\")",
        "check": "test(\"Recognize supported placeholders\", lambda: PLACEHOLDER.fullmatch(\"${PORT:-443}\").groups() == (\"PORT\", \"443\") and PLACEHOLDER.fullmatch(\"${1X}\") is None, \"${PORT:-443} captures PORT and 443; ${1X} stays literal.\")",
        "expected": "${PORT:-443} captures PORT and 443; ${1X} stays literal.",
        "reassurance": "The parser recognizes only the promised syntax. Next decide one placeholder\u2019s value."
      },
      {
        "title": "Resolve one placeholder",
        "instruction": "Define `placeholder_value(match, env, missing)` for one regex match. Use the environment value when present, or the default when the value is unset or empty. An empty value without a default stays empty. For an unset name without a default, add the name to `missing` and preserve the original placeholder text.",
        "code": "def placeholder_value(match, env, missing):\n    name, default = match.group(1), match.group(2)\n    current = env.get(name)\n    if default is not None and not current: return default\n    if current is None:\n        missing.add(name)\n        return match.group(0)\n    return current",
        "check": "test(\"Resolve one placeholder\", lambda: placeholder_value(PLACEHOLDER.fullmatch(\"${PORT:-443}\"), {\"PORT\": \"\"}, set()) == \"443\" and placeholder_value(PLACEHOLDER.fullmatch(\"${X}\"), {\"X\": \"\"}, set()) == \"\", \"An empty PORT uses 443; an empty X without a default stays empty.\")",
        "expected": "An empty PORT uses 443; an empty X without a default stays empty.",
        "reassurance": "Default and empty-value behavior match the contract. Expand each string only once."
      },
      {
        "title": "Expand one string once",
        "instruction": "Define `expand_mcp_text(value, env, missing)` to expand all supported placeholders in a string exactly once using your match helper. Leave nonstrings and unsupported syntax unchanged, and do not re-expand placeholder text introduced by an environment value or default.",
        "code": "def expand_mcp_text(value, env, missing):\n    if not isinstance(value, str):\n        return value\n    return PLACEHOLDER.sub(lambda match: placeholder_value(match, env, missing), value)",
        "check": "test(\"Expand one string once\", lambda: expand_mcp_text(\"Bearer ${TOKEN}\", {\"TOKEN\": \"${SECRET}\", \"SECRET\": \"leak\"}, set()) == \"Bearer ${SECRET}\" and expand_mcp_text(\"$HOME\", {}, set()) == \"$HOME\", \"Inserted ${SECRET} stays literal; $HOME stays literal too.\")",
        "expected": "Inserted ${SECRET} stays literal; $HOME stays literal too.",
        "reassurance": "Expansion happens once, which prevents accidental secret chaining. Next apply it only to allowed server fields."
      },
      {
        "title": "Expand a server\u2019s allowed fields",
        "instruction": "Define `resolve_mcp_server(server, env, missing)` to update one server dictionary in place, with no return value. Expand `command`, `url`, each item of a list-valued `args`, and each value of dictionary-valued `env` and `headers`. Preserve keys, other fields and unsupported container forms.",
        "code": "def resolve_mcp_server(server, env, missing):\n    for field in (\"command\", \"url\"):\n        if field in server: server[field] = expand_mcp_text(server[field], env, missing)\n    if isinstance(server.get(\"args\"), list):\n        server[\"args\"] = [expand_mcp_text(arg, env, missing) for arg in server[\"args\"]]\n    for field in (\"env\", \"headers\"):\n        if isinstance(server.get(field), dict):\n            server[field] = {key: expand_mcp_text(value, env, missing) for key, value in server[field].items()}",
        "check": "test(\"Expand a server\\u2019s allowed fields\", lambda: resolve_mcp_server(server := {\"url\": \"${HOST}\", \"description\": \"${HOST}\"}, {\"HOST\": \"example\"}, set()) is None and server == {\"url\": \"example\", \"description\": \"${HOST}\"}, \"url expands to example while description remains ${HOST}.\")",
        "expected": "url expands to example while description remains ${HOST}.",
        "reassurance": "The field boundary is verified. The public function must copy before calling this mutating helper."
      },
      {
        "title": "Resolve a copied configuration",
        "instruction": "Define `resolve_mcp_config(config, env)` returning an independent deep copy with every server's allowed fields resolved. Collect all missing required variables across servers, and raise one `ValueError` listing their names once each in sorted order. Copy configurations without servers too, and preserve both input objects even when resolution fails.",
        "code": "def resolve_mcp_config(config, env):\n    resolved, missing = copy.deepcopy(config), set()\n    for server in resolved.get(\"mcpServers\", {}).values():\n        resolve_mcp_server(server, env, missing)\n    if missing:\n        raise ValueError(\"missing environment variables: \" + \", \".join(sorted(missing)))\n    return resolved",
        "check": "test(\"Resolve a copied configuration\", lambda: resolve_mcp_config(CONFIG, {\"TRACKER_TOKEN\": \"tok-123\"})[\"mcpServers\"][\"tracker\"][\"headers\"][\"Authorization\"] == \"Bearer tok-123\" and CONFIG[\"mcpServers\"][\"tracker\"][\"headers\"][\"Authorization\"] == \"Bearer ${TRACKER_TOKEN}\", \"The result uses Bearer tok-123; CONFIG still holds its placeholder.\")",
        "expected": "The result uses Bearer tok-123; CONFIG still holds its placeholder.",
        "reassurance": "Copying preserves the input. The last check adds missing variables, defaults and multiple placeholders."
      },
      {
        "title": "Inspect the resolved configuration",
        "instruction": "Resolve the available `CONFIG` using environment token `TRACKER_TOKEN` with value `tok-123` and display the result. Inspect the token and fallback URL/root values before running the complete verification.",
        "code": "print(resolve_mcp_config(CONFIG, {\"TRACKER_TOKEN\": \"tok-123\"}))",
        "check": "",
        "expected": "The tracker uses its default URL and supplied token; docs uses ./docs.",
        "reassurance": "The full checks verify all supported fields, literal text, single expansion and missing-variable reporting."
      }
    ]
  },
  "cc-report": {
    "setup": "import json\nLOG = \"\"\"\n{\"type\": \"tool_use\", \"tool\": \"Bash\"}\n{\"type\": \"tool_result\", \"is_error\": false}\n{\"type\": \"tool_use\", \"tool\": \"Edit\"}\n{\"type\": \"tool_result\", \"is_error\": true}\n{\"type\": \"hook_block\", \"tool\": \"Bash\", \"reason\": \"rm -rf\"}\n{\"type\": \"usage\", \"input_tokens\": 1200, \"output_tokens\": 300}\nnot json at all\n\n{\"type\": \"usage\", \"input_tokens\": 800, \"output_tokens\": 150}\n\"\"\"",
    "steps": [
      {
        "title": "Start a fresh report",
        "instruction": "Define `empty_report()` returning a new report dictionary. It needs an empty `tools` dictionary and zero counts for `errors`, `blocked`, `tokens` and `skipped`. Every call must produce independent mutable state.",
        "code": "def empty_report():\n    return {\"tools\": {}, \"errors\": 0, \"blocked\": 0, \"tokens\": 0, \"skipped\": 0}",
        "check": "test(\"Start a fresh report\", lambda: empty_report() == {\"tools\": {}, \"errors\": 0, \"blocked\": 0, \"tokens\": 0, \"skipped\": 0} and empty_report()[\"tools\"] is not empty_report()[\"tools\"], \"All counters start at zero with a fresh tools dictionary.\")",
        "expected": "All counters start at zero with a fresh tools dictionary.",
        "reassurance": "The report starts clean. Next parse lines without allowing malformed JSON to stop later events."
      },
      {
        "title": "Parse one JSON object",
        "instruction": "Define `parse_log_event(line)` to parse one JSON line. Return a dictionary for a JSON object, or `None` for malformed JSON and nonobject values such as arrays. Bad text must not stop processing later events.",
        "code": "def parse_log_event(line):\n    try:\n        event = json.loads(line)\n    except json.JSONDecodeError:\n        return None\n    return event if isinstance(event, dict) else None",
        "check": "test(\"Parse one JSON object\", lambda: parse_log_event(\"not json\") is None and parse_log_event(\"[1, 2]\") is None and parse_log_event('{\"type\":\"tool_use\"}') == {\"type\": \"tool_use\"}, \"Junk and arrays are rejected; a JSON object is retained.\")",
        "expected": "Junk and arrays are rejected; a JSON object is retained.",
        "reassurance": "Bad lines cannot crash the parser. Known event fields still need validation."
      },
      {
        "title": "Validate names and token counts",
        "instruction": "Define `valid_report_tool(event)` to accept only nonblank string `tool` names. Also define `report_token_count(event)` to total `input_tokens` and `output_tokens`, treating omitted counts as zero. Return `None` if either count is negative or not an integer; booleans are invalid counts.",
        "code": "def valid_report_tool(event):\n    name = event.get(\"tool\")\n    return isinstance(name, str) and bool(name.strip())\n\ndef report_token_count(event):\n    counts = [event.get(\"input_tokens\", 0), event.get(\"output_tokens\", 0)]\n    return sum(counts) if all(type(count) is int and count >= 0 for count in counts) else None",
        "check": "test(\"Validate names and token counts\", lambda: valid_report_tool({\"tool\": \"Read\"}) and not valid_report_tool({\"tool\": []}) and report_token_count({\"input_tokens\": 8, \"output_tokens\": 3}) == 11 and report_token_count({\"output_tokens\": True}) is None, \"Read is valid; token counts 8 + 3 give 11; boolean tokens are invalid.\")",
        "expected": "Read is valid; token counts 8 + 3 give 11; boolean tokens are invalid.",
        "reassurance": "The trust-boundary checks match the contract. Next count named tool and hook events."
      },
      {
        "title": "Count named actions",
        "instruction": "Define `count_named_event(report, event)` to update the report in place with no return value. An invalid tool name increases `skipped` once. A valid `hook_block` increases `blocked`; a valid `tool_use` increases only that tool's count in `tools`.",
        "code": "def count_named_event(report, event):\n    if not valid_report_tool(event):\n        report[\"skipped\"] += 1\n    elif event[\"type\"] == \"hook_block\":\n        report[\"blocked\"] += 1\n    else:\n        name = event[\"tool\"]\n        report[\"tools\"][name] = report[\"tools\"].get(name, 0) + 1",
        "check": "test(\"Count named actions\", lambda: count_named_event(report := empty_report(), {\"type\": \"tool_use\", \"tool\": \"Bash\"}) is None and report[\"tools\"] == {\"Bash\": 1}, \"One Bash tool_use creates a Bash count of 1.\")",
        "expected": "One Bash tool_use creates a Bash count of 1.",
        "reassurance": "Named actions count correctly. Error flags and usage events have different validation."
      },
      {
        "title": "Count error flags",
        "instruction": "Define `count_result_event(report, event)` to update the report in place with no return value. A boolean `is_error` increases `errors` only when true; an omitted flag means false. Nonboolean flags increase `skipped` once and do not count as errors.",
        "code": "def count_result_event(report, event):\n    is_error = event.get(\"is_error\", False)\n    if not isinstance(is_error, bool):\n        report[\"skipped\"] += 1\n    else:\n        report[\"errors\"] += int(is_error)",
        "check": "test(\"Count error flags\", lambda: count_result_event(report := empty_report(), {\"is_error\": \"true\"}) is None and report[\"skipped\"] == 1 and report[\"errors\"] == 0, \"The string \\\"true\\\" is skipped rather than counted as an error.\")",
        "expected": "The string \"true\" is skipped rather than counted as an error.",
        "reassurance": "Malformed error flags are contained. Next total valid usage records."
      },
      {
        "title": "Count usage records",
        "instruction": "Define `count_usage_event(report, event)` to update the report in place with no return value. Add a valid total from your token helper to `tokens`, or increase `skipped` once for an invalid usage record.",
        "code": "def count_usage_event(report, event):\n    count = report_token_count(event)\n    if count is None:\n        report[\"skipped\"] += 1\n    else:\n        report[\"tokens\"] += count",
        "check": "test(\"Count usage records\", lambda: count_usage_event(report := empty_report(), {\"input_tokens\": 1200, \"output_tokens\": 300}) is None and report[\"tokens\"] == 1500, \"The usage event contributes 1500 tokens.\")",
        "expected": "The usage event contributes 1500 tokens.",
        "reassurance": "Usage totals are verified. Now route the event types to their checked handlers."
      },
      {
        "title": "Route known event types",
        "instruction": "Define `count_log_event(report, event)` to route `tool_use` and `hook_block` to your named-action handler, `tool_result` to the result handler, and `usage` to the token handler. Ignore unknown event types without increasing `skipped`; no return value is needed.",
        "code": "def count_log_event(report, event):\n    kind = event.get(\"type\")\n    if kind in (\"tool_use\", \"hook_block\"):\n        count_named_event(report, event)\n    elif kind == \"tool_result\":\n        count_result_event(report, event)\n    elif kind == \"usage\":\n        count_usage_event(report, event)",
        "check": "test(\"Route known event types\", lambda: count_log_event(report := empty_report(), {\"type\": \"future_event\"}) is None and report == empty_report(), \"An unknown future event leaves the report unchanged.\")",
        "expected": "An unknown future event leaves the report unchanged.",
        "reassurance": "Routing preserves forward compatibility. The line loop will now combine parsing and counting."
      },
      {
        "title": "Summarize the log",
        "instruction": "Define `summarize(log_text)` returning a fresh report for its JSON-lines text argument. Ignore blank lines, increase `skipped` once per malformed nonblank line or nonobject JSON value, and route parsed objects to your event counter. Continue after bad records and keep repeated calls independent.",
        "code": "def summarize(log_text):\n    report = empty_report()\n    for line in log_text.splitlines():\n        if not line.strip(): continue\n        event = parse_log_event(line)\n        if event is None: report[\"skipped\"] += 1\n        else: count_log_event(report, event)\n    return report",
        "check": "test(\"Summarize the log\", lambda: summarize(LOG) == {\"tools\": {\"Bash\": 1, \"Edit\": 1}, \"errors\": 1, \"blocked\": 1, \"tokens\": 2450, \"skipped\": 1}, \"Sample: Bash 1, Edit 1, errors 1, blocked 1, tokens 2450, skipped 1.\")",
        "expected": "Sample: Bash 1, Edit 1, errors 1, blocked 1, tokens 2450, skipped 1.",
        "reassurance": "The sample report is correct. The final check adds malformed fields, arrays and independent repeated calls."
      },
      {
        "title": "Print the run report",
        "instruction": "Display the report from your `summarize` function for `LOG`. Compare the tool counts, error count, blocked count, token total and skipped count before running the full verification.",
        "code": "print(summarize(LOG))",
        "check": "",
        "expected": "The report dictionary shows all five counters and per-tool counts.",
        "reassurance": "The complete checks confirm malformed events do not hide later valid events."
      }
    ]
  }
};
