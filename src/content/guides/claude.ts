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
        "title": "Start a describe function",
        "instruction": "Define `describe(event)` that reads the event's tool name into `tool`, with `?` as the fallback, and returns it. Details come next.",
        "code": "def describe(event):\n    tool = event.get(\"tool_name\", \"?\")\n    return tool",
        "check": "test(\"Start a describe function\", lambda: describe(LOG[2]) == \"WebSearch\" and describe({}) == \"?\", \"describe returns WebSearch for the third event and ? for an empty one.\")",
        "expected": "describe returns WebSearch for the third event and ? for an empty one.",
        "reassurance": "The function reads any event, not just LOG[0]."
      },
      {
        "title": "Describe Bash events",
        "instruction": "Extend `describe`: read `tool_input` into `details` (an empty mapping when absent). For Bash, return the name, a colon and one space, then the command, or `?` when the command is missing. Other tools still return just their name.",
        "code": "def describe(event):\n    tool = event.get(\"tool_name\", \"?\")\n    details = event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        return f\"Bash: {details.get('command', '?')}\"\n    return tool",
        "check": "test(\"Describe Bash events\", lambda: describe(LOG[0]) == \"Bash: npm test\" and describe({\"tool_name\": \"Bash\"}) == \"Bash: ?\" and describe(LOG[2]) == \"WebSearch\", \"Bash: npm test, Bash: ? without details, and WebSearch unchanged.\")",
        "expected": "Bash: npm test, Bash: ? without details, and WebSearch unchanged.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Describe file edits",
        "instruction": "Add one more branch to `describe`: Edit and Write events show their tool name and `file_path` the same way, with `?` when the path is missing.",
        "code": "def describe(event):\n    tool = event.get(\"tool_name\", \"?\")\n    details = event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        return f\"Bash: {details.get('command', '?')}\"\n    if tool in (\"Edit\", \"Write\"):\n        return f\"{tool}: {details.get('file_path', '?')}\"\n    return tool",
        "check": "test(\"Describe file edits\", lambda: describe({\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"a.py\"}}) == \"Write: a.py\" and describe({\"tool_name\": \"Edit\"}) == \"Edit: ?\" and describe({\"tool_name\": \"Bash\"}) == \"Bash: ?\", \"Write: a.py, Edit: ? without details, Bash: ? still works.\")",
        "expected": "Write: a.py, Edit: ? without details, Bash: ? still works.",
        "reassurance": "All three cases are covered. The final loop prints the actual audit trail.",
        "startFrom": [
          4
        ]
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
        "title": "Split one rule",
        "instruction": "Store `Bash(git:*)` in `rule`. Split it at the first `(` with `str.partition` into `name` and `rest`, then store the text inside the parentheses, without the closing one, in `pattern`.",
        "code": "rule = \"Bash(git:*)\"\nname, _, rest = rule.partition(\"(\")\npattern = rest[:-1]",
        "check": "test(\"Split one rule\", lambda: name == \"Bash\" and pattern == \"git:*\", \"name is Bash and pattern is git:*.\")",
        "expected": "name is Bash and pattern is git:*.",
        "reassurance": "Colons inside the pattern survive because only the first ( splits."
      },
      {
        "title": "Match exact rules",
        "instruction": "Define `matches(rule, tool, arg)` with the same two splitting lines, returning whether `name` equals `tool` and `arg` equals `pattern` exactly.",
        "code": "def matches(rule, tool, arg):\n    name, _, rest = rule.partition(\"(\")\n    pattern = rest[:-1]\n    return name == tool and arg == pattern",
        "check": "test(\"Match exact rules\", lambda: matches(\"Read(./.env)\", \"Read\", \"./.env\") and not matches(\"Read(./.env)\", \"Edit\", \"./.env\") and not matches(\"Read(./.env)\", \"Read\", \"./.env.local\"), \"Read(./.env) matches only Read with ./.env exactly.\")",
        "expected": "Read(./.env) matches only Read with ./.env exactly.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Match a tool and argument",
        "instruction": "Before the exact comparison, handle patterns ending in `:*`: the name must still equal `tool`, and `arg` must start with the pattern minus those two characters. Use `str.endswith` and `str.startswith`.",
        "code": "def matches(rule, tool, arg):\n    name, _, rest = rule.partition(\"(\")\n    pattern = rest[:-1]\n    if pattern.endswith(\":*\"):\n        return name == tool and arg.startswith(pattern[:-2])\n    return name == tool and arg == pattern",
        "check": "test(\"Match a tool and argument\", lambda: matches(\"Bash(git:*)\", \"Bash\", \"git status\") and not matches(\"Bash(git:*)\", \"Edit\", \"git status\") and matches(\"Read(./.env)\", \"Read\", \"./.env\"), \"Prefix and exact rules match only the named tool.\")",
        "expected": "Prefix and exact rules match only the named tool.",
        "reassurance": "Rule matching works. Deny must be checked before allow.",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Ask by default",
        "instruction": "Define `decide(settings, tool, arg)`. Read the `permissions` mapping into `perms`, using an empty mapping when it is missing, and return `ask` for now.",
        "code": "def decide(settings, tool, arg):\n    perms = settings.get(\"permissions\", {})\n    return \"ask\"",
        "check": "test(\"Ask by default\", lambda: decide({}, \"Bash\", \"ls\") == \"ask\" and decide(build_settings([], []), \"Bash\", \"ls\") == \"ask\", \"decide returns ask, even for settings without permissions.\")",
        "expected": "decide returns ask, even for settings without permissions.",
        "reassurance": ""
      },
      {
        "title": "Check the deny rules",
        "instruction": "Before returning `ask`, return `deny` when any rule in the `deny` list matches the tool and argument. A missing list behaves like an empty one. Use `any` with your `matches` function.",
        "code": "def decide(settings, tool, arg):\n    perms = settings.get(\"permissions\", {})\n    if any(matches(rule, tool, arg) for rule in perms.get(\"deny\", [])):\n        return \"deny\"\n    return \"ask\"",
        "check": "test(\"Check the deny rules\", lambda: decide(build_settings([], [\"Read(./.env)\"]), \"Read\", \"./.env\") == \"deny\" and decide({\"permissions\": {}}, \"Read\", \"./.env\") == \"ask\", \"Reading ./.env is denied; settings without lists still ask.\")",
        "expected": "Reading ./.env is denied; settings without lists still ask.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Apply deny before allow",
        "instruction": "After the deny check, return `allow` when any rule in the `allow` list matches. Deny must still win when both match.",
        "code": "def decide(settings, tool, arg):\n    perms = settings.get(\"permissions\", {})\n    if any(matches(rule, tool, arg) for rule in perms.get(\"deny\", [])):\n        return \"deny\"\n    if any(matches(rule, tool, arg) for rule in perms.get(\"allow\", [])):\n        return \"allow\"\n    return \"ask\"",
        "check": "test(\"Apply deny before allow\", lambda: decide(build_settings([\"Bash(git:*)\"], [\"Bash(git push:*)\"]), \"Bash\", \"git push origin main\") == \"deny\" and decide(build_settings([\"Bash(git:*)\"], []), \"Bash\", \"git status\") == \"allow\", \"git push is denied even though git commands are allowed; git status is allowed.\")",
        "expected": "git push is denied even though git commands are allowed; git status is allowed.",
        "reassurance": "The order of the checks is the precedence rule.",
        "startFrom": [
          5
        ]
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
        "title": "Block rm -rf",
        "instruction": "Define `command_block_reason(command)`. Return a reason naming `rm -rf` when the command contains it, written as a one-line `if`; otherwise return an empty string.",
        "code": "def command_block_reason(command):\n    if \"rm -rf\" in command: return \"Blocked: rm -rf is not allowed. Delete specific files instead.\"\n    return \"\"",
        "check": "test(\"Block rm -rf\", lambda: \"rm -rf\" in command_block_reason(\"rm -rf /tmp/x\") and command_block_reason(\"ls -la\") == \"\", \"rm -rf has a reason; ls -la has none.\")",
        "expected": "rm -rf has a reason; ls -la has none.",
        "reassurance": ""
      },
      {
        "title": "Block destructive shell commands",
        "instruction": "Before the final return, also block `git push` commands carrying `--force` or a separate `-f` flag, with a reason naming `force`. Use `re.search` so `-f` only counts as its own word after `git push`.",
        "code": "def command_block_reason(command):\n    if \"rm -rf\" in command: return \"Blocked: rm -rf is not allowed. Delete specific files instead.\"\n    if re.search(r\"git push\\b.*(--force|\\s-f\\b)\", command):\n        return \"Blocked: force pushes are not allowed. Use a normal push.\"\n    return \"\"",
        "check": "test(\"Block destructive shell commands\", lambda: \"rm -rf\" in command_block_reason(\"rm -rf /tmp/x\") and \"force\" in command_block_reason(\"git push -f origin main\") and command_block_reason(\"git push origin main\") == \"\", \"rm -rf and force pushes have reasons; a normal push has none.\")",
        "expected": "rm -rf and force pushes have reasons; a normal push has none.",
        "reassurance": "The command policy is checked. The next rule covers file edits.",
        "startFrom": [
          0
        ]
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
        "title": "Allow by default",
        "instruction": "Define `pre_tool_use(event)`. Unpack the tool name into `tool` and the `tool_input` mapping into `args` (an empty mapping when absent), and return the pair `0, \"\"` for now.",
        "code": "def pre_tool_use(event):\n    tool, args = event.get(\"tool_name\"), event.get(\"tool_input\", {})\n    return 0, \"\"",
        "check": "test(\"Allow by default\", lambda: pre_tool_use({\"tool_name\": \"Read\"}) == (0, \"\") and pre_tool_use({}) == (0, \"\"), \"Every event is allowed with (0, \\\"\\\") for now.\")",
        "expected": "Every event is allowed with (0, \"\") for now.",
        "reassurance": ""
      },
      {
        "title": "Route Bash commands",
        "instruction": "For Bash events, store the result of `command_block_reason` for the `command` in `args` (empty text when missing) in `reason`. Return `(2, reason)` when there is a reason, otherwise `(0, \"\")`.",
        "code": "def pre_tool_use(event):\n    tool, args = event.get(\"tool_name\"), event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        reason = command_block_reason(args.get(\"command\", \"\"))\n        return (2, reason) if reason else (0, \"\")\n    return 0, \"\"",
        "check": "test(\"Route Bash commands\", lambda: pre_tool_use({\"tool_name\": \"Bash\", \"tool_input\": {\"command\": \"ls -la\"}}) == (0, \"\") and pre_tool_use({\"tool_name\": \"Bash\", \"tool_input\": {\"command\": \"rm -rf /\"}})[0] == 2 and pre_tool_use({\"tool_name\": \"Bash\"}) == (0, \"\"), \"ls -la is allowed, rm -rf returns exit code 2, a Bash event without input is allowed.\")",
        "expected": "ls -la is allowed, rm -rf returns exit code 2, a Bash event without input is allowed.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Return the hook decision",
        "instruction": "Add the file rule: for Write, Edit and MultiEdit, block a protected `file_path` (empty text when missing) with exit code `2` and a message naming `.env`.",
        "code": "def pre_tool_use(event):\n    tool, args = event.get(\"tool_name\"), event.get(\"tool_input\", {})\n    if tool == \"Bash\":\n        reason = command_block_reason(args.get(\"command\", \"\"))\n        return (2, reason) if reason else (0, \"\")\n    if tool in (\"Write\", \"Edit\", \"MultiEdit\") and protected_env_path(args.get(\"file_path\", \"\")):\n        return 2, \"Blocked: .env files hold secrets. Edit .env.example instead.\"\n    return 0, \"\"",
        "check": "test(\"Return the hook decision\", lambda: pre_tool_use({\"tool_name\": \"Edit\", \"tool_input\": {\"file_path\": \"/repo/.env\"}})[0] == 2 and \".env\" in pre_tool_use({\"tool_name\": \"Edit\", \"tool_input\": {\"file_path\": \"/repo/.env\"}})[1] and pre_tool_use({\"tool_name\": \"Edit\", \"tool_input\": {\"file_path\": \"/repo/app.py\"}}) == (0, \"\"), \"Editing .env returns exit code 2 with a reason naming .env; app.py is allowed.\")",
        "expected": "Editing .env returns exit code 2 with a reason naming .env; app.py is allowed.",
        "reassurance": "Both routing branches are checked. The final checks exercise the other prohibited commands.",
        "startFrom": [
          4
        ]
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
        "title": "Split every header line",
        "instruction": "Loop over the lines of `head`. Split each one at its first colon into `key` and `value`, and display the trimmed key, an equals sign and the trimmed value.",
        "code": "for line in head.splitlines():\n    key, _, value = line.partition(\":\")\n    print(key.strip(), \"=\", value.strip())",
        "check": "test(\"Split every header line\", lambda: \"description = Use when: reviewing diffs\" in __stdout__ and \"tools = Read, Grep\" in __stdout__, \"Three lines print, including description = Use when: reviewing diffs.\")",
        "expected": "Three lines print, including description = Use when: reviewing diffs.",
        "reassurance": ""
      },
      {
        "title": "Build the metadata mapping",
        "instruction": "Start an empty dictionary `meta` and run the same loop, storing each trimmed value under its trimmed key instead of printing it.",
        "code": "meta = {}\nfor line in head.splitlines():\n    key, _, value = line.partition(\":\")\n    meta[key.strip()] = value.strip()",
        "check": "test(\"Build the metadata mapping\", lambda: meta == {\"name\": \"code-reviewer\", \"description\": \"Use when: reviewing diffs\", \"tools\": \"Read, Grep\"}, \"Exactly three metadata fields with their original values.\")",
        "expected": "Exactly three metadata fields with their original values.",
        "reassurance": "The metadata is correct. Package the verified operations as the requested parser.",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Return metadata and body",
        "instruction": "Define `parse_frontmatter(text)` to return the metadata dictionary and trimmed body, in that order. Apply your parsing behavior to the text argument, using the delimiter lines and preserving internal colons in field values.",
        "code": "def parse_frontmatter(text):\n    head, _, body = text.removeprefix(\"---\\n\").partition(\"\\n---\\n\")\n    meta = {}\n    for line in head.splitlines():\n        key, _, value = line.partition(\":\")\n        meta[key.strip()] = value.strip()\n    return meta, body.strip()",
        "check": "",
        "expected": "parse_frontmatter returns the three metadata fields and the body text.",
        "reassurance": "The complete check verifies key count, internal colons and removal of the header.",
        "startFrom": [
          3
        ]
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
        "title": "Report an invalid name",
        "instruction": "Store a sample in `meta` (name `Bad Name`, description `ok`, allowed-tools `Read,`) and `body` (empty text). Start an empty list `errors`, then, with a one-line `if`, append `name` when `valid_skill_name` rejects the name; use `get` so a missing name fails too.",
        "code": "meta, body = {\"name\": \"Bad Name\", \"description\": \"ok\", \"allowed-tools\": \"Read,\"}, \"\"\nerrors = []\nif not valid_skill_name(meta.get(\"name\")): errors.append(\"name\")",
        "check": "test(\"Report an invalid name\", lambda: errors == [\"name\"], \"errors is [\\\"name\\\"].\")",
        "expected": "errors is [\"name\"].",
        "reassurance": ""
      },
      {
        "title": "Report the other fields",
        "instruction": "Add three one-line checks in this order: append `description` for an invalid description, `allowed-tools` only when that key is present and invalid, and `body` when the body is not a string or is blank.",
        "code": "if not valid_skill_description(meta.get(\"description\")): errors.append(\"description\")\nif \"allowed-tools\" in meta and not valid_skill_tools(meta[\"allowed-tools\"]): errors.append(\"allowed-tools\")\nif not isinstance(body, str) or not body.strip(): errors.append(\"body\")",
        "check": "test(\"Report the other fields\", lambda: errors == [\"name\", \"allowed-tools\", \"body\"], \"errors is [\\\"name\\\", \\\"allowed-tools\\\", \\\"body\\\"].\")",
        "expected": "errors is [\"name\", \"allowed-tools\", \"body\"].",
        "reassurance": "The description passed, so it is not reported. Next wrap these lines in a function."
      },
      {
        "title": "Collect every field error",
        "instruction": "Define `validate_skill(meta, body)` returning the error list. Start with a one-line guard that returns `[\"metadata\"]` when `meta` is not a dictionary, then repeat your error-collecting lines on the arguments and return `errors`.",
        "code": "def validate_skill(meta, body):\n    if not isinstance(meta, dict): return [\"metadata\"]\n    errors = []\n    if not valid_skill_name(meta.get(\"name\")): errors.append(\"name\")\n    if not valid_skill_description(meta.get(\"description\")): errors.append(\"description\")\n    if \"allowed-tools\" in meta and not valid_skill_tools(meta[\"allowed-tools\"]): errors.append(\"allowed-tools\")\n    if not isinstance(body, str) or not body.strip(): errors.append(\"body\")\n    return errors",
        "check": "",
        "expected": "Invalid fields are reported as name, description, allowed-tools, body, in that order.",
        "reassurance": "The full checks cover missing fields, limits, tool names, body types and unchanged metadata.",
        "startFrom": [
          3,
          4
        ]
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
        "reassurance": "The import boundary is checked. Relative paths need the importing file’s directory."
      },
      {
        "title": "Join an import path",
        "instruction": "Define `memory_target(path, token)` returning the token without its `@`, joined onto the directory of the importing `path`. Use `posixpath.dirname` and `posixpath.join`.",
        "code": "def memory_target(path, token):\n    return posixpath.join(posixpath.dirname(path), token[1:])",
        "check": "test(\"Join an import path\", lambda: memory_target(\"docs/testing.md\", \"@fixtures.md\") == \"docs/fixtures.md\" and memory_target(\"docs/fixtures.md\", \"@../CLAUDE.md\") == \"docs/../CLAUDE.md\", \"Sibling fixtures resolve to docs/fixtures.md; ../CLAUDE.md gives docs/../CLAUDE.md.\")",
        "expected": "Sibling fixtures resolve to docs/fixtures.md; ../CLAUDE.md gives docs/../CLAUDE.md.",
        "reassurance": "The second path still contains a parent step. Next normalize it."
      },
      {
        "title": "Resolve an import path",
        "instruction": "Wrap the joined path in `posixpath.normpath` so parent-directory steps collapse.",
        "code": "def memory_target(path, token):\n    return posixpath.normpath(posixpath.join(posixpath.dirname(path), token[1:]))",
        "check": "test(\"Resolve an import path\", lambda: memory_target(\"docs/testing.md\", \"@fixtures.md\") == \"docs/fixtures.md\" and memory_target(\"docs/fixtures.md\", \"@../CLAUDE.md\") == \"CLAUDE.md\", \"Sibling fixtures resolve under docs; ../CLAUDE.md resolves to the root file.\")",
        "expected": "Sibling fixtures resolve under docs; ../CLAUDE.md resolves to the root file.",
        "reassurance": "Path resolution matches the sample. Missing, cyclic or too-deep imports must remain visible.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Keep ordinary lines",
        "instruction": "Define `expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code)`. Return `[line]` unchanged when the trimmed line is not an import according to `is_memory_import`. Imports are handled in the next step.",
        "code": "def expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code):\n    if not is_memory_import(line.strip(), in_code):\n        return [line]",
        "check": "test(\"Keep ordinary lines\", lambda: expand_memory_line(PROJECT, \"CLAUDE.md\", \"Use pnpm\", 0, {\"CLAUDE.md\"}, 5, [], False) == [\"Use pnpm\"] and expand_memory_line(PROJECT, \"docs/testing.md\", \"@dataclass\", 1, {\"CLAUDE.md\"}, 5, [], True) == [\"@dataclass\"], \"Plain text and a fenced @dataclass come back unchanged.\")",
        "expected": "Plain text and a fenced @dataclass come back unchanged.",
        "reassurance": ""
      },
      {
        "title": "Expand one safe import",
        "instruction": "Resolve the trimmed line into `target` with `memory_target`. Return `[line]` when the target is missing from `files`, already in `chain`, or one more level would exceed `max_depth`. Otherwise return what `expand_memory_lines` gives for the target at `depth + 1`, with the target added to the chain.",
        "code": "def expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code):\n    if not is_memory_import(line.strip(), in_code):\n        return [line]\n    target = memory_target(path, line.strip())\n    if target not in files or target in chain or depth + 1 > max_depth:\n        return [line]\n    return expand_memory_lines(files, target, depth + 1, chain | {target}, max_depth, loaded)",
        "check": "test(\"Expand one safe import\", lambda: expand_memory_line(PROJECT, \"CLAUDE.md\", \"@docs/missing.md\", 0, {\"CLAUDE.md\"}, 5, [], False) == [\"@docs/missing.md\"] and expand_memory_line(PROJECT, \"docs/fixtures.md\", \"@../CLAUDE.md\", 2, {\"CLAUDE.md\"}, 5, [], False) == [\"@../CLAUDE.md\"], \"Missing and cyclic imports stay as their original lines.\")",
        "expected": "Missing and cyclic imports stay as their original lines.",
        "reassurance": "The stopping cases are verified without recursing. Next walk a file’s lines and track code fences.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Record the loaded file",
        "instruction": "Define `expand_memory_lines(files, path, depth, chain, max_depth, loaded)`. With a one-line `if`, append `path` to `loaded` unless it is already there. Then set up `lines` as an empty list and `in_code` as False; there is nothing to return yet.",
        "code": "def expand_memory_lines(files, path, depth, chain, max_depth, loaded):\n    if path not in loaded: loaded.append(path)\n    lines, in_code = [], False",
        "check": "test(\"Record the loaded file\", lambda: (expand_memory_lines(PROJECT, \"CLAUDE.md\", 0, set(), 5, seen := []), expand_memory_lines(PROJECT, \"CLAUDE.md\", 0, set(), 5, seen)) and seen == [\"CLAUDE.md\"], \"Two calls for CLAUDE.md record it once.\")",
        "expected": "Two calls for CLAUDE.md record it once.",
        "reassurance": ""
      },
      {
        "title": "Expand every line",
        "instruction": "Loop over the lines of `files[path]`, extending `lines` with what `expand_memory_line` returns for each one (pass `in_code` along), and return `lines`. Use `list.extend`.",
        "code": "def expand_memory_lines(files, path, depth, chain, max_depth, loaded):\n    if path not in loaded: loaded.append(path)\n    lines, in_code = [], False\n    for line in files[path].splitlines():\n        lines.extend(expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code))\n    return lines",
        "check": "test(\"Expand every line\", lambda: expand_memory_lines({\"CLAUDE.md\": \"root\\n@a.md\", \"a.md\": \"A\"}, \"CLAUDE.md\", 0, {\"CLAUDE.md\"}, 5, []) == [\"root\", \"A\"], \"A simple import expands to root, then A.\")",
        "expected": "A simple import expands to root, then A.",
        "reassurance": "Code fences are not tracked yet, so an @ line inside one would still import.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Walk one file’s lines",
        "instruction": "Inside the loop, before expanding, flip `in_code` whenever a line's trimmed text starts with three backticks.",
        "code": "def expand_memory_lines(files, path, depth, chain, max_depth, loaded):\n    if path not in loaded: loaded.append(path)\n    lines, in_code = [], False\n    for line in files[path].splitlines():\n        if line.strip().startswith(\"```\"):\n            in_code = not in_code\n        lines.extend(expand_memory_line(files, path, line, depth, chain, max_depth, loaded, in_code))\n    return lines",
        "check": "test(\"Walk one file’s lines\", lambda: expand_memory_lines({\"CLAUDE.md\": \"```\\n@a.md\\n```\\n@a.md\", \"a.md\": \"A\"}, \"CLAUDE.md\", 0, {\"CLAUDE.md\"}, 5, []) == [\"```\", \"@a.md\", \"```\", \"A\"], \"The fenced @a.md stays as text; the one after the fence expands to A.\")",
        "expected": "The fenced @a.md stays as text; the one after the fence expands to A.",
        "reassurance": "The wrapper will validate the entry and return loaded order.",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Assemble from the entry file",
        "instruction": "Store `PROJECT`, `CLAUDE.md` and `5` in `files`, `entry` and `max_depth`. Start an empty list `loaded`, then join the lines from `expand_memory_lines` (depth zero, a chain holding only `entry`) with newlines into `text`.",
        "code": "files, entry, max_depth = PROJECT, \"CLAUDE.md\", 5\nloaded = []\ntext = \"\\n\".join(expand_memory_lines(files, entry, 0, {entry}, max_depth, loaded))",
        "check": "test(\"Assemble from the entry file\", lambda: text.startswith(\"# Orbit\\nUse pnpm\") and loaded == [\"CLAUDE.md\", \"docs/testing.md\", \"docs/fixtures.md\"], \"text starts with the CLAUDE.md lines; loaded lists the three files in order.\")",
        "expected": "text starts with the CLAUDE.md lines; loaded lists the three files in order.",
        "reassurance": ""
      },
      {
        "title": "Wrap the assembler",
        "instruction": "Define `expand_memory(files, entry=\"CLAUDE.md\", max_depth=5)` that repeats those two lines on its arguments and returns `text` and `loaded`, in that order. A fresh `loaded` list per call keeps calls independent.",
        "code": "def expand_memory(files, entry=\"CLAUDE.md\", max_depth=5):\n    loaded = []\n    text = \"\\n\".join(expand_memory_lines(files, entry, 0, {entry}, max_depth, loaded))\n    return text, loaded",
        "check": "test(\"Wrap the assembler\", lambda: expand_memory(PROJECT)[1] == [\"CLAUDE.md\", \"docs/testing.md\", \"docs/fixtures.md\"] and expand_memory(PROJECT) == expand_memory(PROJECT), \"Loaded order is CLAUDE.md, docs/testing.md, docs/fixtures.md, on every call.\")",
        "expected": "Loaded order is CLAUDE.md, docs/testing.md, docs/fixtures.md, on every call.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Expose the memory assembler",
        "instruction": "Guard the start of `expand_memory`: raise `FileNotFoundError` naming the entry when it is not in `files`.",
        "code": "def expand_memory(files, entry=\"CLAUDE.md\", max_depth=5):\n    if entry not in files:\n        raise FileNotFoundError(entry)\n    loaded = []\n    text = \"\\n\".join(expand_memory_lines(files, entry, 0, {entry}, max_depth, loaded))\n    return text, loaded",
        "check": "def _rejects(fn, error):\n    try:\n        fn()\n    except error:\n        return True\n    return False\ntest(\"Expose the memory assembler\", lambda: expand_memory(PROJECT)[1] == [\"CLAUDE.md\", \"docs/testing.md\", \"docs/fixtures.md\"] and _rejects(lambda: expand_memory({}), FileNotFoundError), \"Loaded order is unchanged, and a missing entry raises FileNotFoundError.\")",
        "expected": "Loaded order is unchanged, and a missing entry raises FileNotFoundError.",
        "reassurance": "The last check also tests depth, sharing and fenced code.",
        "startFrom": [
          9
        ]
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
        "title": "Read the file path",
        "instruction": "Define `event_path(event)`: read `tool_input` into `inputs` and return its `file_path` only when `inputs` is a dictionary; return `None` otherwise.",
        "code": "def event_path(event):\n    inputs = event.get(\"tool_input\")\n    return inputs.get(\"file_path\") if isinstance(inputs, dict) else None",
        "check": "test(\"Read the file path\", lambda: event_path({\"tool_input\": None}) is None and event_path(event) == \"config/../package.json\", \"A missing input gives None; the sample event gives config/../package.json.\")",
        "expected": "A missing input gives None; the sample event gives config/../package.json.",
        "reassurance": ""
      },
      {
        "title": "Read and validate a path",
        "instruction": "Define `valid_hook_path(path)` accepting only nonblank strings with no NUL character.",
        "code": "def valid_hook_path(path):\n    return isinstance(path, str) and bool(path.strip()) and \"\\0\" not in path",
        "check": "test(\"Read and validate a path\", lambda: valid_hook_path(\"src/app.py\") and not valid_hook_path(\"bad\\0path\") and not valid_hook_path(None) and not valid_hook_path(\"  \"), \"Normal file text passes; NUL paths, None and blank text fail.\")",
        "expected": "Normal file text passes; NUL paths, None and blank text fail.",
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
        "title": "Deny protected parts",
        "instruction": "Define `classify_hook_parts(parts)`. With a one-line `if`, return a `deny` reply with reason `protected project path` when `protected_hook_parts` flags the parts; otherwise return an empty dictionary.",
        "code": "def classify_hook_parts(parts):\n    if protected_hook_parts(parts): return hook_reply(\"deny\", \"protected project path\")\n    return {}",
        "check": "test(\"Deny protected parts\", lambda: classify_hook_parts([\".git\", \"config\"])[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\" and classify_hook_parts([\"src\", \"app.py\"]) == {}, \"Protected parts deny; src/app.py returns {}.\")",
        "expected": "Protected parts deny; src/app.py returns {}.",
        "reassurance": ""
      },
      {
        "title": "Choose the project-path policy",
        "instruction": "Before the empty result, return an `ask` reply with reason `review dependencies before writing` when the final part is `package.json`, `pyproject.toml` or `requirements.txt`. Protection must keep priority.",
        "code": "def classify_hook_parts(parts):\n    if protected_hook_parts(parts): return hook_reply(\"deny\", \"protected project path\")\n    if parts[-1] in {\"package.json\", \"pyproject.toml\", \"requirements.txt\"}:\n        return hook_reply(\"ask\", \"review dependencies before writing\")\n    return {}",
        "check": "test(\"Choose the project-path policy\", lambda: classify_hook_parts([\".git\", \"package.json\"])[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\" and classify_hook_parts([\"package.json\"])[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and classify_hook_parts([\"src\", \"app.py\"]) == {}, \"Protected files deny, dependency files ask, and ordinary files return {}.\")",
        "expected": "Protected files deny, dependency files ask, and ordinary files return {}.",
        "reassurance": "The path policy is checked independently. First the next helper will make sure a normalized path stays inside the project.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Normalize a sample path",
        "instruction": "Store `config/../package.json` in `path` and `/workspace/repo` in `project_dir`. Normalize `project_dir` into `root`, then replace `path` with the normalized join of `root` and `path`.",
        "code": "path, project_dir = \"config/../package.json\", \"/workspace/repo\"\nroot = posixpath.normpath(project_dir)\npath = posixpath.normpath(posixpath.join(root, path))",
        "check": "test(\"Normalize a sample path\", lambda: root == \"/workspace/repo\" and path == \"/workspace/repo/package.json\", \"path becomes /workspace/repo/package.json.\")",
        "expected": "path becomes /workspace/repo/package.json.",
        "reassurance": ""
      },
      {
        "title": "Classify relative components",
        "instruction": "Define `classify_hook_path(path, project_dir)` that repeats those two normalizing lines on its arguments, then makes the path relative to `root` with `posixpath.relpath`, splits it on `/`, and returns what `classify_hook_parts` decides.",
        "code": "def classify_hook_path(path, project_dir):\n    root = posixpath.normpath(project_dir)\n    path = posixpath.normpath(posixpath.join(root, path))\n    return classify_hook_parts(posixpath.relpath(path, root).split(\"/\"))",
        "check": "test(\"Classify relative components\", lambda: classify_hook_path(\"config/../package.json\", \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and classify_hook_path(\"src/app.py\", \"/workspace/repo\") == {}, \"config/../package.json asks; src/app.py returns {}.\")",
        "expected": "config/../package.json asks; src/app.py returns {}.",
        "reassurance": "A path like ../package.json still slips through as a dependency file. Scope comes next.",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Normalize and check project scope",
        "instruction": "Before classifying, deny with reason `write is outside the project` when the common path of `root` and `path` is not `root`. Use `posixpath.commonpath`, which compares whole components, so a sibling root does not count as inside.",
        "code": "def classify_hook_path(path, project_dir):\n    root = posixpath.normpath(project_dir)\n    # ponytail: lexical paths only; resolve symlinks before filesystem enforcement.\n    path = posixpath.normpath(posixpath.join(root, path))\n    if posixpath.commonpath([root, path]) != root:\n        return hook_reply(\"deny\", \"write is outside the project\")\n    return classify_hook_parts(posixpath.relpath(path, root).split(\"/\"))",
        "check": "test(\"Normalize and check project scope\", lambda: classify_hook_path(\"../package.json\", \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\" and classify_hook_path(\"config/../package.json\", \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\", \"Outside writes deny; normalized project dependency files ask.\")",
        "expected": "Outside writes deny; normalized project dependency files ask.",
        "reassurance": "Scope takes precedence over dependency review. Next route validated write tools into this classifier.",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Route a write event",
        "instruction": "Define `route_hook(event, project_dir)`: read the path with `event_path` into `path` and return what `classify_hook_path` decides for it. Validation comes next.",
        "code": "def route_hook(event, project_dir):\n    path = event_path(event)\n    return classify_hook_path(path, project_dir)",
        "check": "test(\"Route a write event\", lambda: route_hook(event, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and route_hook({\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"src/app.py\"}}, \"/workspace/repo\") == {}, \"The sample dependency write asks; src/app.py returns {}.\")",
        "expected": "The sample dependency write asks; src/app.py returns {}.",
        "reassurance": ""
      },
      {
        "title": "Check the tool and path",
        "instruction": "Before reading the path, return `{}` for tools other than Write, Edit and MultiEdit (a one-line `if`). After reading it, deny an invalid path with reason `malformed file path`.",
        "code": "def route_hook(event, project_dir):\n    if event[\"tool_name\"] not in {\"Write\", \"Edit\", \"MultiEdit\"}: return {}\n    path = event_path(event)\n    if not valid_hook_path(path):\n        return hook_reply(\"deny\", \"malformed file path\")\n    return classify_hook_path(path, project_dir)",
        "check": "test(\"Check the tool and path\", lambda: route_hook({\"tool_name\": \"Read\"}, \"/workspace/repo\") == {} and route_hook({\"tool_name\": \"Write\", \"tool_input\": None}, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\", \"Read returns {}; a Write without a usable path is denied.\")",
        "expected": "Read returns {}; a Write without a usable path is denied.",
        "reassurance": "",
        "startFrom": [
          10
        ]
      },
      {
        "title": "Route the complete event",
        "instruction": "First of all, deny invalid outer events with reason `malformed tool event`.",
        "code": "def route_hook(event, project_dir):\n    if not valid_tool_event(event):\n        return hook_reply(\"deny\", \"malformed tool event\")\n    if event[\"tool_name\"] not in {\"Write\", \"Edit\", \"MultiEdit\"}: return {}\n    path = event_path(event)\n    if not valid_hook_path(path):\n        return hook_reply(\"deny\", \"malformed file path\")\n    return classify_hook_path(path, project_dir)",
        "check": "test(\"Route the complete event\", lambda: route_hook(event, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"ask\" and route_hook({\"tool_name\": \"Read\"}, \"/workspace/repo\") == {} and route_hook({\"tool_name\": \"Write\", \"tool_input\": {\"file_path\": \"src/app.py\"}}, \"/workspace/repo\") == {} and route_hook(None, \"/workspace/repo\")[\"hookSpecificOutput\"][\"permissionDecision\"] == \"deny\", \"Dependencies ask, normal writes and unmanaged tools return {}, and malformed events deny.\")",
        "expected": "Dependencies ask, normal writes and unmanaged tools return {}, and malformed events deny.",
        "reassurance": "The router correctly handles the sample dependency, an ordinary write, an unmanaged tool and malformed input. The final check adds the remaining path cases.",
        "startFrom": [
          11
        ]
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
        "reassurance": "The parser recognizes only the promised syntax. Next decide one placeholder’s value."
      },
      {
        "title": "Read a match's groups",
        "instruction": "Store the full match of `PLACEHOLDER` against `${PORT:-443}` in `match`, then read its name and default into `name` and `default` with the match's `group` method.",
        "code": "match = PLACEHOLDER.fullmatch(\"${PORT:-443}\")\nname, default = match.group(1), match.group(2)",
        "check": "test(\"Read a match's groups\", lambda: name == \"PORT\" and default == \"443\" and PLACEHOLDER.fullmatch(\"${X}\").group(2) is None, \"name is PORT and default is 443; without a default, group 2 is None.\")",
        "expected": "name is PORT and default is 443; without a default, group 2 is None.",
        "reassurance": ""
      },
      {
        "title": "Use the environment value",
        "instruction": "Define `placeholder_value(match, env, missing)` that reads `name` and `default` the same way, looks the name up in `env` into `current`, and returns `current`.",
        "code": "def placeholder_value(match, env, missing):\n    name, default = match.group(1), match.group(2)\n    current = env.get(name)\n    return current",
        "check": "test(\"Use the environment value\", lambda: placeholder_value(PLACEHOLDER.fullmatch(\"${PORT:-443}\"), {\"PORT\": \"8080\"}, set()) == \"8080\", \"With PORT set to 8080, the value is 8080.\")",
        "expected": "With PORT set to 8080, the value is 8080.",
        "reassurance": ""
      },
      {
        "title": "Fall back to the default",
        "instruction": "Before returning, return `default` (one-line `if`) when there is a default and `current` is unset or empty.",
        "code": "def placeholder_value(match, env, missing):\n    name, default = match.group(1), match.group(2)\n    current = env.get(name)\n    if default is not None and not current: return default\n    return current",
        "check": "test(\"Fall back to the default\", lambda: placeholder_value(PLACEHOLDER.fullmatch(\"${PORT:-443}\"), {\"PORT\": \"\"}, set()) == \"443\" and placeholder_value(PLACEHOLDER.fullmatch(\"${X}\"), {\"X\": \"\"}, set()) == \"\", \"An empty PORT uses 443; an empty X without a default stays empty.\")",
        "expected": "An empty PORT uses 443; an empty X without a default stays empty.",
        "reassurance": "",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Resolve one placeholder",
        "instruction": "Finally handle an unset name without a default: add the name to `missing` and return the original placeholder text, which is group 0 of the match.",
        "code": "def placeholder_value(match, env, missing):\n    name, default = match.group(1), match.group(2)\n    current = env.get(name)\n    if default is not None and not current: return default\n    if current is None:\n        missing.add(name)\n        return match.group(0)\n    return current",
        "check": "test(\"Resolve one placeholder\", lambda: placeholder_value(PLACEHOLDER.fullmatch(\"${X}\"), {}, seen := set()) == \"${X}\" and seen == {\"X\"}, \"An unset X stays ${X} and is recorded in missing.\")",
        "expected": "An unset X stays ${X} and is recorded in missing.",
        "reassurance": "Default and empty-value behavior match the contract. Expand each string only once.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Expand every placeholder",
        "instruction": "Define `expand_mcp_text(value, env, missing)` returning `value` with each placeholder replaced by your match helper's result. Use the `sub` method of `PLACEHOLDER` with a lambda.",
        "code": "def expand_mcp_text(value, env, missing):\n    return PLACEHOLDER.sub(lambda match: placeholder_value(match, env, missing), value)",
        "check": "test(\"Expand every placeholder\", lambda: expand_mcp_text(\"Bearer ${TOKEN}\", {\"TOKEN\": \"${SECRET}\", \"SECRET\": \"leak\"}, set()) == \"Bearer ${SECRET}\" and expand_mcp_text(\"$HOME\", {}, set()) == \"$HOME\", \"Inserted ${SECRET} stays literal; $HOME stays literal too.\")",
        "expected": "Inserted ${SECRET} stays literal; $HOME stays literal too.",
        "reassurance": "sub scans the original text once, so inserted values are never expanded again."
      },
      {
        "title": "Expand one string once",
        "instruction": "Return nonstrings unchanged before attempting any substitution.",
        "code": "def expand_mcp_text(value, env, missing):\n    if not isinstance(value, str):\n        return value\n    return PLACEHOLDER.sub(lambda match: placeholder_value(match, env, missing), value)",
        "check": "test(\"Expand one string once\", lambda: expand_mcp_text(7, {}, set()) == 7 and expand_mcp_text([\"${X}\"], {\"X\": \"y\"}, set()) == [\"${X}\"] and expand_mcp_text(\"${X}\", {\"X\": \"y\"}, set()) == \"y\", \"7 and a list come back unchanged; ${X} still expands.\")",
        "expected": "7 and a list come back unchanged; ${X} still expands.",
        "reassurance": "Expansion happens once, which prevents accidental secret chaining. Next apply it only to allowed server fields.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Expand command and url",
        "instruction": "Define `resolve_mcp_server(server, env, missing)` that updates the server in place and returns nothing. Loop over the fields `command` and `url`; with a one-line `if`, replace each field that is present with its expanded text.",
        "code": "def resolve_mcp_server(server, env, missing):\n    for field in (\"command\", \"url\"):\n        if field in server: server[field] = expand_mcp_text(server[field], env, missing)",
        "check": "test(\"Expand command and url\", lambda: resolve_mcp_server(server := {\"url\": \"${HOST}\", \"description\": \"${HOST}\"}, {\"HOST\": \"example\"}, set()) is None and server == {\"url\": \"example\", \"description\": \"${HOST}\"}, \"url expands to example while description remains ${HOST}.\")",
        "expected": "url expands to example while description remains ${HOST}.",
        "reassurance": ""
      },
      {
        "title": "Expand the args list",
        "instruction": "Also expand each item of `args`, but only when `args` is a list. Build the new list with a comprehension.",
        "code": "def resolve_mcp_server(server, env, missing):\n    for field in (\"command\", \"url\"):\n        if field in server: server[field] = expand_mcp_text(server[field], env, missing)\n    if isinstance(server.get(\"args\"), list):\n        server[\"args\"] = [expand_mcp_text(arg, env, missing) for arg in server[\"args\"]]",
        "check": "test(\"Expand the args list\", lambda: resolve_mcp_server(server := {\"args\": [\"--root\", \"${R:-./docs}\"]}, {}, set()) is None and server[\"args\"] == [\"--root\", \"./docs\"], \"args becomes [\\\"--root\\\", \\\"./docs\\\"].\")",
        "expected": "args becomes [\"--root\", \"./docs\"].",
        "reassurance": "",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Expand a server’s allowed fields",
        "instruction": "Finally loop over `env` and `headers`, and when the field holds a dictionary, rebuild it with every value expanded and the keys kept.",
        "code": "def resolve_mcp_server(server, env, missing):\n    for field in (\"command\", \"url\"):\n        if field in server: server[field] = expand_mcp_text(server[field], env, missing)\n    if isinstance(server.get(\"args\"), list):\n        server[\"args\"] = [expand_mcp_text(arg, env, missing) for arg in server[\"args\"]]\n    for field in (\"env\", \"headers\"):\n        if isinstance(server.get(field), dict):\n            server[field] = {key: expand_mcp_text(value, env, missing) for key, value in server[field].items()}",
        "check": "test(\"Expand a server’s allowed fields\", lambda: resolve_mcp_server(server := {\"headers\": {\"A\": \"Bearer ${T}\"}, \"env\": \"${T}\"}, {\"T\": \"x\"}, set()) is None and server == {\"headers\": {\"A\": \"Bearer x\"}, \"env\": \"${T}\"}, \"Header values expand; an env that is not a dictionary stays as written.\")",
        "expected": "Header values expand; an env that is not a dictionary stays as written.",
        "reassurance": "The field boundary is verified. The public function must copy before calling this mutating helper.",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Copy the configuration",
        "instruction": "Define `resolve_mcp_config(config, env)`. In one line, store an independent deep copy of `config` in `resolved` (use `copy.deepcopy`) and an empty set in `missing`, then return `resolved`.",
        "code": "def resolve_mcp_config(config, env):\n    resolved, missing = copy.deepcopy(config), set()\n    return resolved",
        "check": "test(\"Copy the configuration\", lambda: resolve_mcp_config(CONFIG, {}) == CONFIG and resolve_mcp_config(CONFIG, {})[\"mcpServers\"] is not CONFIG[\"mcpServers\"], \"The result equals CONFIG but shares none of its dictionaries.\")",
        "expected": "The result equals CONFIG but shares none of its dictionaries.",
        "reassurance": ""
      },
      {
        "title": "Resolve every server",
        "instruction": "Before returning, loop over the server dictionaries under `mcpServers` in the copy (an empty mapping when absent) and resolve each one in place with `resolve_mcp_server`. Use `dict.values`.",
        "code": "def resolve_mcp_config(config, env):\n    resolved, missing = copy.deepcopy(config), set()\n    for server in resolved.get(\"mcpServers\", {}).values():\n        resolve_mcp_server(server, env, missing)\n    return resolved",
        "check": "test(\"Resolve every server\", lambda: resolve_mcp_config(CONFIG, {\"TRACKER_TOKEN\": \"tok-123\"})[\"mcpServers\"][\"tracker\"][\"headers\"][\"Authorization\"] == \"Bearer tok-123\" and CONFIG[\"mcpServers\"][\"tracker\"][\"headers\"][\"Authorization\"] == \"Bearer ${TRACKER_TOKEN}\" and resolve_mcp_config({}, {}) == {}, \"The result uses Bearer tok-123; CONFIG still holds its placeholder; {} copies to {}.\")",
        "expected": "The result uses Bearer tok-123; CONFIG still holds its placeholder; {} copies to {}.",
        "reassurance": "",
        "startFrom": [
          10
        ]
      },
      {
        "title": "Report missing variables",
        "instruction": "Before returning, raise one `ValueError` when `missing` is not empty, listing the names once each in sorted order, separated by commas.",
        "code": "def resolve_mcp_config(config, env):\n    resolved, missing = copy.deepcopy(config), set()\n    for server in resolved.get(\"mcpServers\", {}).values():\n        resolve_mcp_server(server, env, missing)\n    if missing:\n        raise ValueError(\"missing environment variables: \" + \", \".join(sorted(missing)))\n    return resolved",
        "check": "def _rejects(fn, error):\n    try:\n        fn()\n    except error:\n        return True\n    return False\ntest(\"Report missing variables\", lambda: _rejects(lambda: resolve_mcp_config(CONFIG, {}), ValueError) and resolve_mcp_config(CONFIG, {\"TRACKER_TOKEN\": \"t\"})[\"mcpServers\"][\"docs\"][\"args\"][-1] == \"./docs\", \"A complete environment still resolves; an incomplete one now raises ValueError.\")",
        "expected": "A complete environment still resolves; an incomplete one now raises ValueError.",
        "reassurance": "Copying preserves the input. The last check adds missing variables, defaults and multiple placeholders.",
        "startFrom": [
          11
        ]
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
        "title": "Parse a JSON line",
        "instruction": "Define `parse_log_event(line)` that turns the line into a Python value with `json.loads`, stores it in `event`, and returns it only when it is a dictionary, otherwise `None`.",
        "code": "def parse_log_event(line):\n    event = json.loads(line)\n    return event if isinstance(event, dict) else None",
        "check": "test(\"Parse a JSON line\", lambda: parse_log_event(\"[1, 2]\") is None and parse_log_event('{\"type\":\"tool_use\"}') == {\"type\": \"tool_use\"}, \"An array is rejected; a JSON object is retained.\")",
        "expected": "An array is rejected; a JSON object is retained.",
        "reassurance": "Malformed text still raises an error. Catch it next."
      },
      {
        "title": "Parse one JSON object",
        "instruction": "Put the parsing line inside `try`, and return `None` when it raises `json.JSONDecodeError`.",
        "code": "def parse_log_event(line):\n    try:\n        event = json.loads(line)\n    except json.JSONDecodeError:\n        return None\n    return event if isinstance(event, dict) else None",
        "check": "test(\"Parse one JSON object\", lambda: parse_log_event(\"not json\") is None and parse_log_event(\"[1, 2]\") is None and parse_log_event('{\"type\":\"tool_use\"}') == {\"type\": \"tool_use\"}, \"Junk and arrays are rejected; a JSON object is retained.\")",
        "expected": "Junk and arrays are rejected; a JSON object is retained.",
        "reassurance": "Bad lines cannot crash the parser. Known event fields still need validation.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Validate the tool name",
        "instruction": "Define `valid_report_tool(event)` that reads `tool` into `name` and accepts only nonblank strings.",
        "code": "def valid_report_tool(event):\n    name = event.get(\"tool\")\n    return isinstance(name, str) and bool(name.strip())",
        "check": "test(\"Validate the tool name\", lambda: valid_report_tool({\"tool\": \"Read\"}) and not valid_report_tool({\"tool\": []}) and not valid_report_tool({\"tool\": \"  \"}) and not valid_report_tool({}), \"Read is valid; a list, blank text and a missing tool are not.\")",
        "expected": "Read is valid; a list, blank text and a missing tool are not.",
        "reassurance": ""
      },
      {
        "title": "Validate names and token counts",
        "instruction": "Define `report_token_count(event)`: collect `input_tokens` and `output_tokens` (0 when omitted) in `counts`, and return their sum only if every count is a non-negative int (booleans excluded); otherwise return `None`.",
        "code": "def report_token_count(event):\n    counts = [event.get(\"input_tokens\", 0), event.get(\"output_tokens\", 0)]\n    return sum(counts) if all(type(count) is int and count >= 0 for count in counts) else None",
        "check": "test(\"Validate names and token counts\", lambda: report_token_count({\"input_tokens\": 8, \"output_tokens\": 3}) == 11 and report_token_count({\"output_tokens\": True}) is None and report_token_count({}) == 0, \"8 + 3 gives 11; boolean tokens are invalid; no counts give 0.\")",
        "expected": "8 + 3 gives 11; boolean tokens are invalid; no counts give 0.",
        "reassurance": "The trust-boundary checks match the contract. Next count named tool and hook events."
      },
      {
        "title": "Count one tool use",
        "instruction": "Define `count_named_event(report, event)` that reads the tool into `name` and increases that tool's count in the report's `tools` dictionary, starting from 0. Return nothing.",
        "code": "def count_named_event(report, event):\n    name = event[\"tool\"]\n    report[\"tools\"][name] = report[\"tools\"].get(name, 0) + 1",
        "check": "test(\"Count one tool use\", lambda: count_named_event(report := empty_report(), {\"type\": \"tool_use\", \"tool\": \"Bash\"}) is None and report[\"tools\"] == {\"Bash\": 1}, \"One Bash tool_use creates a Bash count of 1.\")",
        "expected": "One Bash tool_use creates a Bash count of 1.",
        "reassurance": ""
      },
      {
        "title": "Skip invalid tool names",
        "instruction": "Wrap those two lines in an `else:` branch. Before it, when `valid_report_tool` rejects the event, increase `skipped` by one.",
        "code": "def count_named_event(report, event):\n    if not valid_report_tool(event):\n        report[\"skipped\"] += 1\n    else:\n        name = event[\"tool\"]\n        report[\"tools\"][name] = report[\"tools\"].get(name, 0) + 1",
        "check": "test(\"Skip invalid tool names\", lambda: count_named_event(report := empty_report(), {\"type\": \"tool_use\", \"tool\": \" \"}) is None and report[\"skipped\"] == 1 and report[\"tools\"] == {} and count_named_event(report, {\"type\": \"tool_use\", \"tool\": \"Read\"}) is None and report[\"tools\"] == {\"Read\": 1}, \"A blank tool name is skipped and counts no tool; a named one still counts.\")",
        "expected": "A blank tool name is skipped and counts no tool; a named one still counts.",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Count named actions",
        "instruction": "Between the two branches, add an `elif` for valid `hook_block` events that increases `blocked` instead of a tool count.",
        "code": "def count_named_event(report, event):\n    if not valid_report_tool(event):\n        report[\"skipped\"] += 1\n    elif event[\"type\"] == \"hook_block\":\n        report[\"blocked\"] += 1\n    else:\n        name = event[\"tool\"]\n        report[\"tools\"][name] = report[\"tools\"].get(name, 0) + 1",
        "check": "test(\"Count named actions\", lambda: count_named_event(report := empty_report(), {\"type\": \"hook_block\", \"tool\": \"Bash\"}) is None and report[\"blocked\"] == 1 and report[\"tools\"] == {}, \"A hook_block increases blocked and adds no tool count.\")",
        "expected": "A hook_block increases blocked and adds no tool count.",
        "reassurance": "Named actions count correctly. Error flags and usage events have different validation.",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Count true error flags",
        "instruction": "Define `count_result_event(report, event)` that reads `is_error` into `is_error` (False when omitted) and adds it to `errors` as an integer, returning nothing.",
        "code": "def count_result_event(report, event):\n    is_error = event.get(\"is_error\", False)\n    report[\"errors\"] += int(is_error)",
        "check": "test(\"Count true error flags\", lambda: count_result_event(report := empty_report(), {\"is_error\": True}) is None and count_result_event(report, {}) is None and report[\"errors\"] == 1, \"One true flag and one omitted flag give 1 error.\")",
        "expected": "One true flag and one omitted flag give 1 error.",
        "reassurance": ""
      },
      {
        "title": "Count error flags",
        "instruction": "Only count booleans: when `is_error` is not a bool, increase `skipped` instead.",
        "code": "def count_result_event(report, event):\n    is_error = event.get(\"is_error\", False)\n    if not isinstance(is_error, bool):\n        report[\"skipped\"] += 1\n    else:\n        report[\"errors\"] += int(is_error)",
        "check": "test(\"Count error flags\", lambda: count_result_event(report := empty_report(), {\"is_error\": \"true\"}) is None and report[\"skipped\"] == 1 and report[\"errors\"] == 0, \"The string \\\"true\\\" is skipped rather than counted as an error.\")",
        "expected": "The string \"true\" is skipped rather than counted as an error.",
        "reassurance": "Malformed error flags are contained. Next total valid usage records.",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Add usage tokens",
        "instruction": "Define `count_usage_event(report, event)` that stores your token helper's result in `count` and adds it to `tokens`, returning nothing.",
        "code": "def count_usage_event(report, event):\n    count = report_token_count(event)\n    report[\"tokens\"] += count",
        "check": "test(\"Add usage tokens\", lambda: count_usage_event(report := empty_report(), {\"input_tokens\": 1200, \"output_tokens\": 300}) is None and report[\"tokens\"] == 1500, \"The usage event contributes 1500 tokens.\")",
        "expected": "The usage event contributes 1500 tokens.",
        "reassurance": ""
      },
      {
        "title": "Count usage records",
        "instruction": "Guard the addition: when `count` is `None`, increase `skipped` instead, using the same if/else shape as your other handlers.",
        "code": "def count_usage_event(report, event):\n    count = report_token_count(event)\n    if count is None:\n        report[\"skipped\"] += 1\n    else:\n        report[\"tokens\"] += count",
        "check": "test(\"Count usage records\", lambda: count_usage_event(report := empty_report(), {\"input_tokens\": -1}) is None and report[\"skipped\"] == 1 and report[\"tokens\"] == 0, \"A negative count is skipped and adds no tokens.\")",
        "expected": "A negative count is skipped and adds no tokens.",
        "reassurance": "Usage totals are verified. Now route the event types to their checked handlers.",
        "startFrom": [
          10
        ]
      },
      {
        "title": "Route named actions",
        "instruction": "Define `count_log_event(report, event)`. Read the event `type` into `kind`, and with a one-line `if`, send `tool_use` and `hook_block` events to your named-action handler.",
        "code": "def count_log_event(report, event):\n    kind = event.get(\"type\")\n    if kind in (\"tool_use\", \"hook_block\"): count_named_event(report, event)",
        "check": "test(\"Route named actions\", lambda: count_log_event(report := empty_report(), {\"type\": \"hook_block\", \"tool\": \"Bash\"}) is None and report[\"blocked\"] == 1, \"A hook_block event increases blocked to 1.\")",
        "expected": "A hook_block event increases blocked to 1.",
        "reassurance": ""
      },
      {
        "title": "Route known event types",
        "instruction": "Add two one-line `elif` branches: `tool_result` goes to the result handler and `usage` to the token handler. Unknown types fall through untouched.",
        "code": "def count_log_event(report, event):\n    kind = event.get(\"type\")\n    if kind in (\"tool_use\", \"hook_block\"): count_named_event(report, event)\n    elif kind == \"tool_result\": count_result_event(report, event)\n    elif kind == \"usage\": count_usage_event(report, event)",
        "check": "test(\"Route known event types\", lambda: count_log_event(report := empty_report(), {\"type\": \"future_event\"}) is None and report == empty_report() and count_log_event(report, {\"type\": \"usage\", \"output_tokens\": 5}) is None and report[\"tokens\"] == 5, \"An unknown future event leaves the report unchanged; a usage event adds its tokens.\")",
        "expected": "An unknown future event leaves the report unchanged; a usage event adds its tokens.",
        "reassurance": "Routing preserves forward compatibility. The line loop will now combine parsing and counting.",
        "startFrom": [
          12
        ]
      },
      {
        "title": "Start the summary",
        "instruction": "Define `summarize(log_text)` that creates a fresh report with `empty_report()` in `report` and returns it.",
        "code": "def summarize(log_text):\n    report = empty_report()\n    return report",
        "check": "test(\"Start the summary\", lambda: summarize(\"\") == empty_report() and summarize(\"\") is not summarize(\"\"), \"An empty log gives a new zeroed report on every call.\")",
        "expected": "An empty log gives a new zeroed report on every call.",
        "reassurance": ""
      },
      {
        "title": "Count malformed lines",
        "instruction": "Before returning, loop over the lines of `log_text`: parse each into `event` with your parser, and with a one-line `if`, increase `skipped` when the result is `None`.",
        "code": "def summarize(log_text):\n    report = empty_report()\n    for line in log_text.splitlines():\n        event = parse_log_event(line)\n        if event is None: report[\"skipped\"] += 1\n    return report",
        "check": "test(\"Count malformed lines\", lambda: summarize(\"not json\\n[1, 2]\\n{}\")[\"skipped\"] == 2, \"Junk and an array count as 2 skipped; the object is not skipped.\")",
        "expected": "Junk and an array count as 2 skipped; the object is not skipped.",
        "reassurance": "",
        "startFrom": [
          14
        ]
      },
      {
        "title": "Summarize the log",
        "instruction": "Skip blank lines first with a one-line `if` and `continue`. Then add a one-line `else` that routes parsed objects to your event counter.",
        "code": "def summarize(log_text):\n    report = empty_report()\n    for line in log_text.splitlines():\n        if not line.strip(): continue\n        event = parse_log_event(line)\n        if event is None: report[\"skipped\"] += 1\n        else: count_log_event(report, event)\n    return report",
        "check": "test(\"Summarize the log\", lambda: summarize(LOG) == {\"tools\": {\"Bash\": 1, \"Edit\": 1}, \"errors\": 1, \"blocked\": 1, \"tokens\": 2450, \"skipped\": 1}, \"Sample: Bash 1, Edit 1, errors 1, blocked 1, tokens 2450, skipped 1.\")",
        "expected": "Sample: Bash 1, Edit 1, errors 1, blocked 1, tokens 2450, skipped 1.",
        "reassurance": "The sample report is correct. The final check adds malformed fields, arrays and independent repeated calls.",
        "startFrom": [
          15
        ]
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
}
