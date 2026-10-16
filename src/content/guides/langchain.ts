import type { CodingGuide } from '../guided'

export const LANGCHAIN_GUIDES: Record<string, CodingGuide> = {
  "lc-model-call": {
    "steps": [
      {
        "title": "Import the practice model",
        "instruction": "Import `FakeListChatModel` from the `langchain_core.language_models` module. This practice model accepts a `responses` list of scripted reply strings, so you can learn the call without an API key.",
        "code": "from langchain_core.language_models import FakeListChatModel",
        "check": "test(\"Import the practice model\", lambda: FakeListChatModel(responses=[\"hello\"]).responses == [\"hello\"], \"The imported model accepts a list of scripted replies.\")",
        "expected": "The imported model accepts a list of scripted replies.",
        "reassurance": "The import is ready. No account or API key is needed for this chapter."
      },
      {
        "title": "Create one scripted reply",
        "instruction": "Create a practice model named `llm`. Give its `responses` setting one string. Reply data: “RAG retrieves documents, then asks the model with them as context.” Leave the model uncalled for now.",
        "code": "llm = FakeListChatModel(responses=[\"RAG retrieves documents, then asks the model with them as context.\"])",
        "check": "test(\"Create one scripted reply\", lambda: llm.responses == [\"RAG retrieves documents, then asks the model with them as context.\"], \"llm holds one scripted RAG explanation.\")",
        "expected": "llm holds one scripted RAG explanation.",
        "reassurance": "Your model is configured; we have not called it yet."
      },
      {
        "title": "Ask the model",
        "instruction": "Ask `llm` the question “What is RAG?” using its `invoke` method. Save the complete returned message in `reply`; the next step will extract its text.",
        "code": "reply = llm.invoke(\"What is RAG?\")",
        "check": "test(\"Ask the model\", lambda: reply.type == \"ai\" and reply.content.startswith(\"RAG retrieves documents\"), \"reply is an AI message containing the RAG explanation.\")",
        "expected": "reply is an AI message containing the RAG explanation.",
        "reassurance": "The call worked. A message object is the expected result."
      },
      {
        "title": "Read its text",
        "instruction": "Save the text carried by `reply` in a variable named `text`. The message exposes that text through its `content` field.",
        "code": "text = reply.content",
        "check": "test(\"Read its text\", lambda: text == \"RAG retrieves documents, then asks the model with them as context.\", \"text is the plain RAG explanation string.\")",
        "expected": "text is the plain RAG explanation string.",
        "reassurance": "You have extracted the text correctly; the original message is still available."
      },
      {
        "title": "Print the message type",
        "instruction": "Display the class name of `reply` in the output. Python objects have a type, and that type has a `__name__` attribute; use those concepts to identify this message.",
        "code": "print(type(reply).__name__)",
        "check": "test(\"Print the message type\", lambda: \"AIMessage\" in __stdout__, \"The output includes AIMessage.\")",
        "expected": "The output includes AIMessage.",
        "reassurance": "AIMessage confirms that invoke returned a message object."
      },
      {
        "title": "Print and verify the answer",
        "instruction": "Display `text`, then check your work. Compare the message class name with the plain answer text to confirm you understand the two different values.",
        "code": "print(text)",
        "check": "",
        "expected": "The output shows AIMessage and the RAG sentence; all chapter checks pass.",
        "reassurance": "Both parts are now visible, so you can compare the object and its text."
      }
    ]
  },
  "lc-lcel": {
    "steps": [
      {
        "title": "Import prompts",
        "instruction": "Import `ChatPromptTemplate` from `langchain_core.prompts`. Its `from_template` method creates a prompt whose curly-brace placeholders will be filled from an input dictionary.",
        "code": "from langchain_core.prompts import ChatPromptTemplate",
        "check": "test(\"Import prompts\", lambda: ChatPromptTemplate.from_template(\"Hi {name}\").invoke({\"name\": \"Ada\"}).to_messages()[0].content == \"Hi Ada\", \"A template can turn a name into the message Hi Ada.\")",
        "expected": "A template can turn a name into the message Hi Ada.",
        "reassurance": "The prompt component is available."
      },
      {
        "title": "Import the parser",
        "instruction": "Import `StrOutputParser` from `langchain_core.output_parsers`. A parser instance will turn the model message into plain text at the end of your chain.",
        "code": "from langchain_core.output_parsers import StrOutputParser",
        "check": "test(\"Import the parser\", lambda: callable(StrOutputParser().invoke), \"StrOutputParser exposes invoke.\")",
        "expected": "StrOutputParser exposes invoke.",
        "reassurance": "The final component is ready; composing comes later."
      },
      {
        "title": "Import the model",
        "instruction": "Import `FakeListChatModel` from `langchain_core.language_models`. Its `responses` setting accepts a list of reply strings, keeping this exercise predictable.",
        "code": "from langchain_core.language_models import FakeListChatModel",
        "check": "test(\"Import the model\", lambda: FakeListChatModel(responses=[\"ok\"]).responses == [\"ok\"], \"The fake model accepts a scripted reply.\")",
        "expected": "The fake model accepts a scripted reply.",
        "reassurance": "You have all three ingredients now."
      },
      {
        "title": "Create the prompt",
        "instruction": "Create a `ChatPromptTemplate` named `prompt`, using its `from_template` method. Template data: “Explain {topic} to a {audience} in one sentence.” Preserve both placeholder names so the chain can accept `topic` and `audience`.",
        "code": "prompt = ChatPromptTemplate.from_template(\"Explain {topic} to a {audience} in one sentence.\")",
        "check": "test(\"Create the prompt\", lambda: prompt.invoke({\"topic\":\"a vector\", \"audience\":\"child\"}).to_messages()[0].content == \"Explain a vector to a child in one sentence.\", \"Both topic and audience are filled in.\")",
        "expected": "Both topic and audience are filled in.",
        "reassurance": "The prompt is verified independently from the model."
      },
      {
        "title": "Configure the response",
        "instruction": "Create a `FakeListChatModel` named `llm` with a single string in its `responses` list. Reply data: “A vector is an arrow with a length and a direction.” You only need to configure it at this step.",
        "code": "llm = FakeListChatModel(responses=[\"A vector is an arrow with a length and a direction.\"])",
        "check": "test(\"Configure the response\", lambda: llm.responses == [\"A vector is an arrow with a length and a direction.\"], \"The scripted response describes a vector.\")",
        "expected": "The scripted response describes a vector.",
        "reassurance": "Your reply is ready to flow through the chain."
      },
      {
        "title": "Connect the pieces",
        "instruction": "Build a runnable named `chain` that sends input through `prompt`, then `llm`, then an instance of `StrOutputParser`. LCEL uses the pipe operator to connect the output of one component to the input of the next.",
        "code": "chain = prompt | llm | StrOutputParser()",
        "check": "test(\"Connect the pieces\", lambda: chain.invoke({\"topic\":\"a vector\", \"audience\":\"child\"}) == \"A vector is an arrow with a length and a direction.\", \"Invoking the chain returns the vector explanation as a string.\")",
        "expected": "Invoking the chain returns the vector explanation as a string.",
        "reassurance": "The three components work together; the parser gives you plain text."
      },
      {
        "title": "Run the complete chain",
        "instruction": "Invoke `chain` with `topic` set to “a vector” and `audience` set to “child”, and display the result. Check that the final value is ordinary text rather than a message object.",
        "code": "print(chain.invoke({\"topic\": \"a vector\", \"audience\": \"child\"}))",
        "check": "",
        "expected": "The vector sentence is printed, and the chapter checks verify its value and type.",
        "reassurance": "You have a complete prompt → model → text pipeline."
      }
    ]
  },
  "lc-history": {
    "steps": [
      {
        "title": "Start the prompt with a system message",
        "instruction": "Create `prompt` with `ChatPromptTemplate.from_messages`, holding one system message for now. System text: “You are a support assistant for {product}.” The setup provides `history` and a recording model named `llm`.",
        "code": "prompt = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a support assistant for {product}.\"),\n])",
        "check": "test(\"Start the prompt with a system message\", lambda: [m.content for m in prompt.invoke({\"product\":\"Orbit\"}).to_messages()] == [\"You are a support assistant for Orbit.\"], \"The prompt renders one system message for Orbit.\")",
        "expected": "The prompt renders one system message for Orbit.",
        "reassurance": ""
      },
      {
        "title": "Place history in the prompt",
        "instruction": "Recreate `prompt` with two more entries after the system message: a `MessagesPlaceholder` named `history`, then a human message with the template “{question}”.",
        "code": "prompt = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a support assistant for {product}.\"),\n    MessagesPlaceholder(\"history\"),\n    (\"human\", \"{question}\"),\n])",
        "check": "test(\"Place history in the prompt\", lambda: [m.type for m in prompt.invoke({\"product\":\"Orbit\", \"history\":[HumanMessage(\"earlier\")], \"question\":\"now\"}).to_messages()] == [\"system\", \"human\", \"human\"], \"The prompt contains system, earlier human, then newest human.\")",
        "expected": "The prompt contains system, earlier human, then newest human.",
        "reassurance": "The placeholder expands into however many messages you pass; trimming is the next job.",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Find where turns start",
        "instruction": "Create `starts`, the positions in `history` of every message whose `type` is `human`. Use `enumerate` to get each position next to its message.",
        "code": "starts = [i for i, m in enumerate(history) if m.type == \"human\"]",
        "check": "test(\"Find where turns start\", lambda: starts == [1, 3, 5], \"The human messages sit at positions 1, 3 and 5.\")",
        "expected": "The human messages sit at positions 1, 3 and 5.",
        "reassurance": ""
      },
      {
        "title": "Cut from a turn start",
        "instruction": "Define `trim_history(messages, max_turns)`. Keep only the last `max_turns` turn starts, and return a new list of every message from the oldest kept start to the end.",
        "code": "def trim_history(messages, max_turns):\n    starts = [i for i, m in enumerate(messages) if m.type == \"human\"][-max_turns:]\n    return list(messages[starts[0]:])",
        "check": "test(\"Cut from a turn start\", lambda: [m.content for m in trim_history(history, 1)] == [\"Also my login fails\", \"Try the reset link.\"] and len(trim_history(history, 2)) == 4, \"One turn keeps the newest question and its reply; two turns keep four messages.\")",
        "expected": "One turn keeps the newest question and its reply; two turns keep four messages.",
        "reassurance": ""
      },
      {
        "title": "Keep complete recent turns",
        "instruction": "Update `trim_history` so a window of zero or less returns `[]` straight away, and a history with no human message also gives `[]` instead of failing. Leave the original list unchanged.",
        "code": "def trim_history(messages, max_turns):\n    if max_turns <= 0:\n        return []\n    starts = [i for i, m in enumerate(messages) if m.type == \"human\"][-max_turns:]\n    return list(messages[starts[0]:]) if starts else []",
        "check": "test(\"Keep complete recent turns\", lambda: [m.content for m in trim_history(history, 1)] == [\"Also my login fails\", \"Try the reset link.\"] and trim_history(history, 0) == [] and trim_history([AIMessage(\"hi\")], 2) == [] and trim_history([], 2) == [], \"One turn keeps the newest question and reply. A zero window or no human messages gives [].\")",
        "expected": "One turn keeps the newest question and reply. A zero window or no human messages gives [].",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Connect trimming to the chain",
        "instruction": "Define `build_chain` with parameters `llm` and `max_turns`, defaulting `max_turns` to 2. Its runnable input has `product`, `history`, and `question` keys. Use `trim_history` to replace only the history before sending the input through `prompt`, the supplied model, and `StrOutputParser`. `RunnablePassthrough.assign` can compute a replacement field while preserving the other input fields. Return the runnable without invoking it.",
        "code": "def build_chain(llm, max_turns=2):\n    return RunnablePassthrough.assign(history=lambda x: trim_history(x[\"history\"], max_turns)) | prompt | llm | StrOutputParser()",
        "check": "test(\"Connect trimming to the chain\", lambda: build_chain(RunnableLambda(lambda pv: AIMessage(str(len(pv.to_messages())))), 1).invoke({\"product\":\"Orbit\", \"history\":history, \"question\":\"now\"}) == \"4\", \"A one-turn window sends 4 messages: system, human, reply, question.\")",
        "expected": "A one-turn window sends 4 messages: system, human, reply, question.",
        "reassurance": "The window size is being applied before the model sees the prompt."
      },
      {
        "title": "Choose a two-turn window",
        "instruction": "Create `chain` using `build_chain`, the setup model `llm`, and a window of 2 turns. Keep it ready to receive `product`, `history`, and `question` values.",
        "code": "chain = build_chain(llm, max_turns=2)",
        "check": "test(\"Choose a two-turn window\", lambda: callable(chain.invoke), \"chain is ready to invoke with product, history, and question.\")",
        "expected": "chain is ready to invoke with product, history, and question.",
        "reassurance": "The reusable builder is ready; the next step will show the actual message count."
      },
      {
        "title": "Inspect the conversation sent",
        "instruction": "Run `chain` with product “Orbit”, the setup `history`, and question “Still broken.” Display its result. The setup list `seen` records each model input as a message list; display the type and content of every message in its latest entry, then check the chapter.",
        "code": "print(chain.invoke({\"product\": \"Orbit\", \"history\": history, \"question\": \"Still broken.\"}))\nfor m in seen[-1]:\n    print(f\"{m.type:>6}: {m.content}\")",
        "check": "",
        "expected": "The model saw 6 messages: system, two complete turns, and the new question. The full checks also try empty histories and other window sizes.",
        "reassurance": "You can read the exact prompt instead of guessing what the model remembered."
      }
    ],
    "setup": "from langchain_core.messages import AIMessage, HumanMessage\nfrom langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langchain_core.runnables import RunnableLambda, RunnablePassthrough\n\n# a stand-in model that records exactly what it was sent\nseen = []\ndef fake_model(prompt_value):\n    messages = prompt_value.to_messages()\n    seen.append(messages)\n    return AIMessage(f\"(model saw {len(messages)} messages)\")\nllm = RunnableLambda(fake_model)\n\nhistory = [\n    AIMessage(\"Hi! How can I help?\"),\n    HumanMessage(\"My invoice is wrong\"), AIMessage(\"Which month?\"),\n    HumanMessage(\"March\"), AIMessage(\"Fixed, sorry about that.\"),\n    HumanMessage(\"Also my login fails\"), AIMessage(\"Try the reset link.\"),\n]"
  },
  "lc-tools": {
    "steps": [
      {
        "title": "Count words in text",
        "instruction": "Define a plain function `word_count` with one parameter, `text`, annotated as `str`, and an `int` return annotation. Return the number of whitespace-separated words; tabs and newlines count as whitespace, and blank text has zero words. The setup also provides a `shout` tool and a message named `msg` requesting both tools.",
        "code": "def word_count(text: str) -> int:\n    return len(text.split())",
        "check": "test(\"Count words in text\", lambda: word_count(\"  one\\ttwo\\nthree  \") == 3 and word_count(\"\") == 0, \"Three words are counted across mixed whitespace; an empty string gives 0.\")",
        "expected": "Three words are counted across mixed whitespace; an empty string gives 0.",
        "reassurance": ""
      },
      {
        "title": "Turn a counter into a tool",
        "instruction": "Redefine `word_count` as a tool: apply the imported `tool` decorator and add a docstring containing the words “Count the words”. A tool is called with `invoke` and a dictionary of arguments.",
        "code": "@tool\ndef word_count(text: str) -> int:\n    \"\"\"Count the words in a piece of text.\"\"\"\n    return len(text.split())",
        "check": "test(\"Turn a counter into a tool\", lambda: word_count.invoke({\"text\":\"  one\\ttwo\\nthree  \"}) == 3 and word_count.name == \"word_count\" and \"Count the words\" in word_count.description, \"word_count is now a tool named word_count that still counts 3 words.\")",
        "expected": "word_count is now a tool named word_count that still counts 3 words.",
        "reassurance": "The function name becomes the tool name and the docstring becomes its description.",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Look up tools by name",
        "instruction": "Define `tools_by_name(tools)` that returns a dictionary mapping each tool’s `name` to the tool itself.",
        "code": "def tools_by_name(tools):\n    return {t.name: t for t in tools}",
        "check": "test(\"Look up tools by name\", lambda: tools_by_name([shout, word_count]) == {\"shout\": shout, \"word_count\": word_count}, \"The dictionary maps shout and word_count to their tools.\")",
        "expected": "The dictionary maps shout and word_count to their tools.",
        "reassurance": ""
      },
      {
        "title": "Read one tool request",
        "instruction": "Save the first entry of `msg.tool_calls` in `first`. Each entry is a dictionary with a `name` and an `args` dictionary.",
        "code": "first = msg.tool_calls[0]",
        "check": "test(\"Read one tool request\", lambda: first[\"name\"] == \"word_count\" and first[\"args\"] == {\"text\": \"tools make agents useful\"}, \"The first request asks word_count to count “tools make agents useful”.\")",
        "expected": "The first request asks word_count to count “tools make agents useful”.",
        "reassurance": ""
      },
      {
        "title": "Invoke one tool",
        "instruction": "Create `first_result` by invoking the `word_count` tool with the `args` dictionary of `first`.",
        "code": "first_result = word_count.invoke(first[\"args\"])",
        "check": "test(\"Invoke one tool\", lambda: first_result == 4, \"first_result is 4: “tools make agents useful” has four words.\")",
        "expected": "first_result is 4: “tools make agents useful” has four words.",
        "reassurance": ""
      },
      {
        "title": "Dispatch requests by name",
        "instruction": "Define `run_tool_calls(ai_message, tools)`. For every entry in `ai_message.tool_calls`, find the tool by name with `tools_by_name`, invoke it with the entry’s arguments, and collect each result as a string, in request order. A message with no calls gives an empty list.",
        "code": "def run_tool_calls(ai_message, tools):\n    by_name = tools_by_name(tools)\n    return [str(by_name[call[\"name\"]].invoke(call[\"args\"])) for call in ai_message.tool_calls]",
        "check": "test(\"Dispatch requests by name\", lambda: run_tool_calls(msg, [shout, word_count]) == [\"4\", \"ORBIT\"] and run_tool_calls(AIMessage(\"hello\"), [word_count]) == [], \"The two calls produce [\\\"4\\\", \\\"ORBIT\\\"] even when the tools list has a different order. No calls gives [].\")",
        "expected": "The two calls produce [\"4\", \"ORBIT\"] even when the tools list has a different order. No calls gives [].",
        "reassurance": ""
      },
      {
        "title": "Print the tool results",
        "instruction": "Display the results from `run_tool_calls` for the setup `msg`, using `shout` and `word_count` as the available tools. Check that results follow the request order even though the tool list starts with `shout`.",
        "code": "print(run_tool_calls(msg, [shout, word_count]))",
        "check": "",
        "expected": "The output is ['4', 'ORBIT'], and all chapter checks pass.",
        "reassurance": "You have connected a model request to real function execution."
      }
    ],
    "setup": "from langchain_core.tools import tool\nfrom langchain_core.messages import AIMessage\n\n@tool\ndef shout(text: str) -> str:\n    \"\"\"Return the text in capitals.\"\"\"\n    return text.upper()\n\nmsg = AIMessage(\"\", tool_calls=[\n    {\"name\": \"word_count\", \"args\": {\"text\": \"tools make agents useful\"}, \"id\": \"call_1\"},\n    {\"name\": \"shout\", \"args\": {\"text\": \"orbit\"}, \"id\": \"call_2\"},\n])"
  },
  "lc-json": {
    "steps": [
      {
        "title": "Create the JSON parser",
        "instruction": "Create a `JsonOutputParser` instance named `parser`. Its `invoke` method accepts an AI message and parses its JSON, including JSON inside a Markdown fence. The setup `message` contains a padded answer and a source list.",
        "code": "parser = JsonOutputParser()",
        "check": "test(\"Create the JSON parser\", lambda: parser.invoke(AIMessage('{\"answer\":\"ok\",\"sources\":[]}')) == {\"answer\":\"ok\", \"sources\":[]}, \"The parser returns a Python dictionary for valid JSON.\")",
        "expected": "The parser returns a Python dictionary for valid JSON.",
        "reassurance": "Parsing works. We still need to validate which fields are acceptable."
      },
      {
        "title": "Reject a non-list",
        "instruction": "Define `validate_sources(sources)` that raises `ValueError` with the text “sources must be a list of strings” when `sources` is not a list.",
        "code": "def validate_sources(sources):\n    if not isinstance(sources, list):\n        raise ValueError(\"sources must be a list of strings\")",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Reject a non-list\", lambda: _rejects(lambda: validate_sources(\"guide\")) and validate_sources([\"guide\"]) is None, \"A plain string is rejected with ValueError; a list passes.\")",
        "expected": "A plain string is rejected with ValueError; a list passes.",
        "reassurance": ""
      },
      {
        "title": "Validate source citations",
        "instruction": "Update `validate_sources` so it also rejects a list containing anything other than strings, and returns the accepted list unchanged. An empty list is valid.",
        "code": "def validate_sources(sources):\n    if not isinstance(sources, list) or any(not isinstance(source, str) for source in sources):\n        raise ValueError(\"sources must be a list of strings\")\n    return sources",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Validate source citations\", lambda: validate_sources([\"guide\"]) == [\"guide\"] and validate_sources([]) == [] and _rejects(lambda: validate_sources([\"guide\", 3])), \"A list of strings and an empty list are valid; a list containing 3 is rejected.\")",
        "expected": "A list of strings and an empty list are valid; a list containing 3 is rejected.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Parse the setup message",
        "instruction": "Create `data` by passing the setup `message` to `parser`'s `invoke` method.",
        "code": "data = parser.invoke(message)",
        "check": "test(\"Parse the setup message\", lambda: data == {\"answer\": \"  Delta remembers versions.  \", \"sources\": [\"guide\"]}, \"data is a dictionary with the padded answer and sources [\\\"guide\\\"].\")",
        "expected": "data is a dictionary with the padded answer and sources [\"guide\"].",
        "reassurance": ""
      },
      {
        "title": "Parse the reply",
        "instruction": "Define `parse_answer(message)`. Parse `message` with `parser`, then return a dictionary with only the parsed `answer` and `sources` values.",
        "code": "def parse_answer(message):\n    data = parser.invoke(message)\n    return {\"answer\": data[\"answer\"], \"sources\": data[\"sources\"]}",
        "check": "test(\"Parse the reply\", lambda: parse_answer(message) == {\"answer\":\"  Delta remembers versions.  \", \"sources\":[\"guide\"]}, \"The fenced reply becomes a dictionary; the answer is still padded.\")",
        "expected": "The fenced reply becomes a dictionary; the answer is still padded.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Trim the answer and check citations",
        "instruction": "Update `parse_answer` to read both fields with the dictionary `get` method, trim surrounding whitespace from the answer, and pass the sources through `validate_sources`.",
        "code": "def parse_answer(message):\n    data = parser.invoke(message)\n    answer = data.get(\"answer\")\n    return {\"answer\": answer.strip(), \"sources\": validate_sources(data.get(\"sources\"))}",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Trim the answer and check citations\", lambda: parse_answer(message) == {\"answer\":\"Delta remembers versions.\", \"sources\":[\"guide\"]} and _rejects(lambda: parse_answer(AIMessage('{\"answer\":\"ok\"}'))), \"The answer is trimmed, and missing sources raise ValueError.\")",
        "expected": "The answer is trimmed, and missing sources raise ValueError.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Require a JSON object",
        "instruction": "Update `parse_answer` so parsed data that is not a dictionary raises `ValueError` with the text “answer must be a JSON object”, before any field is read.",
        "code": "def parse_answer(message):\n    data = parser.invoke(message)\n    if not isinstance(data, dict):\n        raise ValueError(\"answer must be a JSON object\")\n    answer = data.get(\"answer\")\n    return {\"answer\": answer.strip(), \"sources\": validate_sources(data.get(\"sources\"))}",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Require a JSON object\", lambda: parse_answer(message)[\"answer\"] == \"Delta remembers versions.\" and _rejects(lambda: parse_answer(AIMessage(\"[1, 2]\"))), \"A JSON list is rejected with ValueError; the example still parses.\")",
        "expected": "A JSON list is rejected with ValueError; the example still parses.",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Validate the answer shape",
        "instruction": "Update `parse_answer` so an answer that is missing, not a string, or blank raises `ValueError` with the text “answer must be non-empty text”. Extra fields are still ignored.",
        "code": "def parse_answer(message):\n    data = parser.invoke(message)\n    if not isinstance(data, dict):\n        raise ValueError(\"answer must be a JSON object\")\n    answer = data.get(\"answer\")\n    if not isinstance(answer, str) or not answer.strip():\n        raise ValueError(\"answer must be non-empty text\")\n    return {\"answer\": answer.strip(), \"sources\": validate_sources(data.get(\"sources\"))}",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Validate the answer shape\", lambda: parse_answer(message) == {\"answer\":\"Delta remembers versions.\", \"sources\":[\"guide\"]} and _rejects(lambda: parse_answer(AIMessage('{\"answer\":\" \",\"sources\":[]}'))) and _rejects(lambda: parse_answer(AIMessage('{\"answer\":12,\"sources\":[]}'))), \"The fenced reply becomes a trimmed answer; blank or numeric answers are rejected.\")",
        "expected": "The fenced reply becomes a trimmed answer; blank or numeric answers are rejected.",
        "reassurance": "",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Show the structured result",
        "instruction": "Display the result of `parse_answer` for the setup `message`, then check the chapter. Compare the trimmed answer and retained citation with the original data; invalid cases should be rejected rather than silently accepted.",
        "code": "print(parse_answer(message))",
        "check": "",
        "expected": "A dictionary with answer and sources is printed. Malformed JSON and invalid field shapes must be rejected.",
        "reassurance": "You now verify both successful parsing and rejection of unusable answers."
      }
    ],
    "setup": "from langchain_core.messages import AIMessage\nfrom langchain_core.output_parsers import JsonOutputParser\n\nmessage = AIMessage('```json\\n{\"answer\": \"  Delta remembers versions.  \", \"sources\": [\"guide\"]}\\n```')"
  },
  "lc-chunking": {
    "steps": [
      {
        "title": "Read words from the sample",
        "instruction": "The setup provides a `Document` named `runbook`, whose text is in `page_content` and source details are in `metadata`. Save its whitespace-separated words in `words`, without changing the document.",
        "code": "words = runbook.page_content.split()",
        "check": "test(\"Read words from the sample\", lambda: words[:5] == [\"If\", \"the\", \"nightly\", \"job\", \"fails,\"], \"The first five words are If the nightly job fails,.\")",
        "expected": "The first five words are If the nightly job fails,.",
        "reassurance": "Whitespace has been normalized without changing the source document."
      },
      {
        "title": "Take a first window",
        "instruction": "Create `first_window` as a passage containing the first 8 entries of `words`, separated by single spaces. This is one chunk’s text, without its metadata yet.",
        "code": "first_window = \" \".join(words[:8])",
        "check": "test(\"Take a first window\", lambda: first_window == \"If the nightly job fails, check the Delta\", \"The first window contains exactly eight words.\")",
        "expected": "The first window contains exactly eight words.",
        "reassurance": "This is the chunk text; the next step checks how overlap preserves context."
      },
      {
        "title": "Move forward with overlap",
        "instruction": "Calculate `next_start`, the zero-based word index for the next chunk when chunks contain 8 words and share 2 words with the previous chunk. Think about how many new words each move should advance.",
        "code": "next_start = 8 - 2",
        "check": "test(\"Move forward with overlap\", lambda: words[next_start:next_start + 2] == words[6:8] and next_start == 6, \"The next chunk starts at word 6 and repeats the previous final two words.\")",
        "expected": "The next chunk starts at word 6 and repeats the previous final two words.",
        "reassurance": "You have the stride right. Overlap is counted in words, not characters."
      },
      {
        "title": "List the window starts",
        "instruction": "Set `chunk_size` to 8 and `overlap` to 2 in one line. Then create `starts`, a list of the word indices where windows begin: from 0, below `len(words)`, stepping by the number of new words per window. Use `range`.",
        "code": "chunk_size, overlap = 8, 2\nstarts = list(range(0, len(words), chunk_size - overlap))",
        "check": "test(\"List the window starts\", lambda: starts == [0, 6, 12, 18], \"The 20 words give window starts 0, 6, 12 and 18.\")",
        "expected": "The 20 words give window starts 0, 6, 12 and 18.",
        "reassurance": ""
      },
      {
        "title": "Collect the window texts",
        "instruction": "Create an empty list `chunks`. Loop over the same starts with `enumerate`, naming the loop variables `number` and `start`, and append each window’s text (up to `chunk_size` words joined by single spaces).",
        "code": "chunks = []\nfor number, start in enumerate(range(0, len(words), chunk_size - overlap)):\n    chunks.append(\" \".join(words[start:start + chunk_size]))",
        "check": "test(\"Collect the window texts\", lambda: len(chunks) == 4 and chunks[0] == first_window and chunks[-1] == \"the pipeline.\", \"Four windows; the last one, “the pipeline.”, only repeats overlap.\")",
        "expected": "Four windows; the last one, “the pipeline.”, only repeats overlap.",
        "reassurance": ""
      },
      {
        "title": "Stop at the end",
        "instruction": "Rebuild `chunks` with the same loop, but stop before appending a window (other than the first) whose new words would start past the end, so no window is pure overlap.",
        "code": "chunks = []\nfor number, start in enumerate(range(0, len(words), chunk_size - overlap)):\n    if number and start + overlap >= len(words):\n        break\n    chunks.append(\" \".join(words[start:start + chunk_size]))",
        "check": "test(\"Stop at the end\", lambda: len(chunks) == 3 and chunks[-1] == \"the last good version before rerunning the pipeline.\", \"Three windows; the last one ends on “pipeline.”.\")",
        "expected": "Three windows; the last one ends on “pipeline.”.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Wrap windows in a function",
        "instruction": "Define `chunk_document(doc, chunk_size, overlap)` that reads the words of `doc`, runs your loop, and returns `chunks`.",
        "code": "def chunk_document(doc, chunk_size, overlap):\n    words = doc.page_content.split()\n    chunks = []\n    for number, start in enumerate(range(0, len(words), chunk_size - overlap)):\n        if number and start + overlap >= len(words):\n            break\n        chunks.append(\" \".join(words[start:start + chunk_size]))\n    return chunks",
        "check": "test(\"Wrap windows in a function\", lambda: chunk_document(Document(\"a b c d e f g\"), 4, 1) == [\"a b c d\", \"d e f g\"] and chunk_document(Document(\"  \"), 4, 1) == [], \"Seven words give two four-word windows; a blank document gives [].\")",
        "expected": "Seven words give two four-word windows; a blank document gives [].",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Build windows for one document",
        "instruction": "Change `chunk_document` so each chunk is a new `Document`: the window text as content, and as metadata a copy of the source metadata plus `chunk` (the window number) and `start_word`. Pass metadata by keyword.",
        "code": "def chunk_document(doc, chunk_size, overlap):\n    words = doc.page_content.split()\n    chunks = []\n    for number, start in enumerate(range(0, len(words), chunk_size - overlap)):\n        if number and start + overlap >= len(words):\n            break\n        chunks.append(Document(\" \".join(words[start:start + chunk_size]), metadata={**doc.metadata, \"chunk\": number, \"start_word\": start}))\n    return chunks",
        "check": "test(\"Build windows for one document\", lambda: [(c.page_content, c.metadata) for c in chunk_document(Document(\"a b c d e f g\", metadata={\"source\":\"a\"}), 4, 1)] == [(\"a b c d\", {\"source\":\"a\", \"chunk\":0, \"start_word\":0}), (\"d e f g\", {\"source\":\"a\", \"chunk\":1, \"start_word\":3})], \"Two Documents keep source a and record chunk 0 at word 0, chunk 1 at word 3.\")",
        "expected": "Two Documents keep source a and record chunk 0 at word 0, chunk 1 at word 3.",
        "reassurance": "{**doc.metadata, ...} builds a fresh dictionary, so the source metadata is never shared or changed.",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Combine documents",
        "instruction": "Define `split_documents(docs, chunk_size, overlap)` that returns the chunks of every document in `docs`, in document order, using `chunk_document`.",
        "code": "def split_documents(docs, chunk_size, overlap):\n    return [chunk for doc in docs for chunk in chunk_document(doc, chunk_size, overlap)]",
        "check": "test(\"Combine documents\", lambda: split_documents([], 4, 1) == [] and len(split_documents([Document(\"a b c d e f g\", metadata={}), Document(\"x y\")], 4, 1)) == 3, \"An empty collection gives []; two documents give three chunks.\")",
        "expected": "An empty collection gives []; two documents give three chunks.",
        "reassurance": ""
      },
      {
        "title": "Validate sizes and combine documents",
        "instruction": "Update `split_documents` to first require a size of at least 1 and an overlap that is non-negative and smaller than the size; otherwise raise `ValueError` with the text “need chunk_size >= 1 and 0 <= overlap < chunk_size”.",
        "code": "def split_documents(docs, chunk_size, overlap):\n    if chunk_size < 1 or not 0 <= overlap < chunk_size:\n        raise ValueError(\"need chunk_size >= 1 and 0 <= overlap < chunk_size\")\n    return [chunk for doc in docs for chunk in chunk_document(doc, chunk_size, overlap)]",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Validate sizes and combine documents\", lambda: _rejects(lambda: split_documents([], 0, 0)) and _rejects(lambda: split_documents([], 4, 4)) and _rejects(lambda: split_documents([], 4, -1)) and len(split_documents([Document(\"a b c d e f g\", metadata={})], 4, 1)) == 2, \"Size 0, overlap 4 of 4 and overlap -1 raise ValueError; the seven-word example still gives two chunks.\")",
        "expected": "Size 0, overlap 4 of 4 and overlap -1 raise ValueError; the seven-word example still gives two chunks.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Inspect every chunk",
        "instruction": "Split the setup `runbook` into chunks of 8 words with an overlap of 2. Display each chunk’s metadata and text, then check the chapter. Use the source and starting word indices to follow how the windows overlap.",
        "code": "for chunk in split_documents([runbook], chunk_size=8, overlap=2):\n    print(chunk.metadata, \"|\", chunk.page_content)",
        "check": "",
        "expected": "Each line shows source runbook.md, a chunk number, a start_word index, and at most eight words.",
        "reassurance": "The printed positions make it easy to trace where each passage came from."
      }
    ],
    "setup": "from langchain_core.documents import Document\n\nrunbook = Document(\n    \"If the nightly job fails, check the Delta table history first. \"\n    \"Restore the last good version before rerunning the pipeline.\",\n    metadata={\"source\": \"runbook.md\"},\n)"
  },
  "lc-context-budget": {
    "steps": [
      {
        "title": "Append one passage",
        "instruction": "Define `add_passage(context, used, document, max_chars)`. Strip `document` into `passage`, and return a pair: `context` followed by two newlines and the passage, and `used` plus the passage length plus 2 for the separator. Ignore the budget for now.",
        "code": "def add_passage(context, used, document, max_chars):\n    passage = document.strip()\n    return context + \"\\n\\n\" + passage, used + len(passage) + 2",
        "check": "test(\"Append one passage\", lambda: add_passage(\"ok\", 2, \" go \", 6) == (\"ok\\n\\ngo\", 6), \"Adding go to ok gives ok, two newlines, go, and a count of 6.\")",
        "expected": "Adding go to ok gives ok, two newlines, go, and a count of 6.",
        "reassurance": ""
      },
      {
        "title": "Separate only when needed",
        "instruction": "Update `add_passage` to compute `size`, the passage length plus 2 only when `context` is non-empty, and to add the two-newline separator only in that case too.",
        "code": "def add_passage(context, used, document, max_chars):\n    passage = document.strip()\n    size = len(passage) + (2 if context else 0)\n    return context + (\"\\n\\n\" if context else \"\") + passage, used + size",
        "check": "test(\"Separate only when needed\", lambda: add_passage(\"\", 0, \" go \", 9) == (\"go\", 2) and add_passage(\"ok\", 2, \"go\", 6) == (\"ok\\n\\ngo\", 6), \"The first passage has no separator and counts 2; the second counts its separator.\")",
        "expected": "The first passage has no separator and counts 2; the second counts its separator.",
        "reassurance": "",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Try one whole passage",
        "instruction": "Update `add_passage` so the passage is added only when it is not blank and `used + size` stays within `max_chars`. Otherwise return `context` and `used` unchanged.",
        "code": "def add_passage(context, used, document, max_chars):\n    passage = document.strip()\n    size = len(passage) + (2 if context else 0)\n    if passage and used + size <= max_chars:\n        return context + (\"\\n\\n\" if context else \"\") + passage, used + size\n    return context, used",
        "check": "test(\"Try one whole passage\", lambda: add_passage(\"ok\", 2, \"go\", 6) == (\"ok\\n\\ngo\", 6) and add_passage(\"ok\", 2, \"go\", 5) == (\"ok\", 2) and add_passage(\"ok\", 2, \"  \", 9) == (\"ok\", 2), \"Budget 6 includes go and its separator; budget 5 or a blank passage leaves only ok.\")",
        "expected": "Budget 6 includes go and its separator; budget 5 or a blank passage leaves only ok.",
        "reassurance": "The helper keeps a whole passage or skips it, never partial text.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Start an empty context",
        "instruction": "In one line, set `documents` to the list “too long to fit”, “ok”, “go” and `max_chars` to 6. Then set `context` to an empty string and `used` to 0 in one line.",
        "code": "documents, max_chars = [\"too long to fit\", \"ok\", \"go\"], 6\ncontext, used = \"\", 0",
        "check": "test(\"Start an empty context\", lambda: context == \"\" and used == 0 and len(documents) == 3 and max_chars == 6, \"An empty context with nothing used, and three sample passages.\")",
        "expected": "An empty context with nothing used, and three sample passages.",
        "reassurance": ""
      },
      {
        "title": "Add each passage in turn",
        "instruction": "Loop over `documents` and update `context` and `used` with `add_passage` for each one, using `max_chars` as the budget.",
        "code": "for document in documents:\n    context, used = add_passage(context, used, document, max_chars)",
        "check": "test(\"Add each passage in turn\", lambda: context == \"ok\\n\\ngo\" and used == 6, \"The long passage is skipped; ok and go fill exactly 6 characters.\")",
        "expected": "The long passage is skipped; ok and go fill exactly 6 characters.",
        "reassurance": ""
      },
      {
        "title": "Wrap the scan in a function",
        "instruction": "Define `pack_context(documents, max_chars)`: start empty, run your loop, and return only the final context string.",
        "code": "def pack_context(documents, max_chars):\n    context, used = \"\", 0\n    for document in documents:\n        context, used = add_passage(context, used, document, max_chars)\n    return context",
        "check": "test(\"Wrap the scan in a function\", lambda: pack_context([\"too long to fit\", \"ok\", \"go\"], 6) == \"ok\\n\\ngo\" and pack_context([\"ok\", \"go\"], 5) == \"ok\" and pack_context([], 5) == \"\", \"Budget 6 packs ok and go; budget 5 packs only ok; no documents gives \\\"\\\".\")",
        "expected": "Budget 6 packs ok and go; budget 5 packs only ok; no documents gives \"\".",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Scan every passage within the budget",
        "instruction": "Update `pack_context` so a budget of zero or less returns an empty string straight away.",
        "code": "def pack_context(documents, max_chars):\n    if max_chars <= 0:\n        return \"\"\n    context, used = \"\", 0\n    for document in documents:\n        context, used = add_passage(context, used, document, max_chars)\n    return context",
        "check": "test(\"Scan every passage within the budget\", lambda: pack_context([\"text\"], 0) == \"\" and pack_context([\"text\"], -2) == \"\" and pack_context([\"too long to fit\", \"ok\", \"go\"], 6) == \"ok\\n\\ngo\", \"Budgets of 0 and -2 give \\\"\\\"; the six-character example still packs ok and go.\")",
        "expected": "Budgets of 0 and -2 give \"\"; the six-character example still packs ok and go.",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Create the context prompt",
        "instruction": "Create a `ChatPromptTemplate` named `prompt` with distinct `context` and `question` placeholders. Its rendered text should begin with “Context:”, followed by a newline and the context; after two newlines, add “Question: ” followed by the question. Use the template constructor that accepts a text template.",
        "code": "prompt = ChatPromptTemplate.from_template(\"Context:\\n{context}\\n\\nQuestion: {question}\")",
        "check": "test(\"Create the context prompt\", lambda: \"Question: why?\" in prompt.invoke({\"context\":\"facts\", \"question\":\"why?\"}).to_string(), \"The prompt keeps the question alongside the context.\")",
        "expected": "The prompt keeps the question alongside the context.",
        "reassurance": "The question survives independently of how much context fits."
      },
      {
        "title": "Prepare the chain input",
        "instruction": "Create a runnable named `prepare_context` using `RunnableLambda`. It receives a dictionary with `docs`, `budget`, and `question`, and should produce only `context` and `question`. Obtain the context through `pack_context` using the documents and budget; preserve the question exactly.",
        "code": "prepare_context = RunnableLambda(lambda x: {\"context\": pack_context(x[\"docs\"], x[\"budget\"]), \"question\": x[\"question\"]})",
        "check": "test(\"Prepare the chain input\", lambda: prepare_context.invoke({\"docs\":[\"relevant\", \"too much context\"], \"budget\":8, \"question\":\"why?\"}) == {\"context\":\"relevant\", \"question\":\"why?\"}, \"The prepared input contains relevant context and the unchanged question.\")",
        "expected": "The prepared input contains relevant context and the unchanged question.",
        "reassurance": "The budget is applied at the right point in the pipeline."
      },
      {
        "title": "Connect prompt, echo model, and parser",
        "instruction": "Build `context_chain` so the prepared input flows through `prompt`, an echo model, and `StrOutputParser`. You can represent the echo model with `RunnableLambda`: it receives a prompt value whose `to_string` method provides the full prompt text, and should respond with an `AIMessage` containing that same text. The final chain result should be plain text.",
        "code": "context_chain = prepare_context | prompt | RunnableLambda(lambda pv: AIMessage(pv.to_string())) | StrOutputParser()",
        "check": "test(\"Connect prompt, echo model, and parser\", lambda: \"Context:\\nrelevant\\n\\nQuestion: why?\" in context_chain.invoke({\"docs\":[\"relevant\"], \"budget\":8, \"question\":\"why?\"}), \"The chain returns text containing only the packed context and question.\")",
        "expected": "The chain returns text containing only the packed context and question.",
        "reassurance": "You can see the completed model input directly."
      },
      {
        "title": "Print the budgeted prompt",
        "instruction": "Run `context_chain` with documents “Delta stores history.” and “Graphs route work.”, budget 25, and question “What is Delta?”. Display the rendered prompt, then check the chapter. Compare which complete passages fit and confirm the question remains intact.",
        "code": "print(context_chain.invoke({\"docs\": [\"Delta stores history.\", \"Graphs route work.\"], \"budget\": 25, \"question\": \"What is Delta?\"}))",
        "check": "",
        "expected": "The prompt contains Delta stores history. and the Delta question; the second passage does not fit.",
        "reassurance": "The final checks verify exact fits, blank input, and that the original documents stay unchanged."
      }
    ],
    "setup": "from langchain_core.messages import AIMessage\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langchain_core.runnables import RunnableLambda"
  },
  "lc-rag": {
    "steps": [
      {
        "title": "Embed a question",
        "instruction": "Create a vector named `q` for the question “How does MLflow track experiments and metrics?” using the setup `embed` helper. That helper accepts text and produces a 64-entry NumPy vector. The setup `DOCS` list and `DOC_VECS` matrix hold the documents and their vectors in matching order.",
        "code": "q = embed(\"How does MLflow track experiments and metrics?\")",
        "check": "test(\"Embed a question\", lambda: q.shape == (64,) and np.linalg.norm(q) > 0, \"q is a nonzero vector with 64 entries.\")",
        "expected": "q is a nonzero vector with 64 entries.",
        "reassurance": "The question and documents can now be compared using the same representation."
      },
      {
        "title": "Calculate cosine denominators",
        "instruction": "Create `norms`, one cosine-similarity denominator per document. Each denominator is the Euclidean length of that row of `DOC_VECS` multiplied by the length of `q`. NumPy’s `linalg.norm` can calculate row lengths using its `axis` setting.",
        "code": "norms = np.linalg.norm(DOC_VECS, axis=1) * np.linalg.norm(q)",
        "check": "test(\"Calculate cosine denominators\", lambda: norms.shape == (len(DOCS),) and np.all(norms > 0), \"There is one positive denominator per document.\")",
        "expected": "There is one positive denominator per document.",
        "reassurance": "The normalization prevents longer documents winning just because they contain more words."
      },
      {
        "title": "Calculate safe similarity scores",
        "instruction": "Create `sims`, one cosine-similarity score per document, by normalizing each document–question dot product with its corresponding value in `norms`. Use zero when a denominator is zero so every score stays finite. NumPy supports matrix–vector products and division with an output array and a mask.",
        "code": "sims = np.divide(DOC_VECS @ q, norms, out=np.zeros(len(DOCS)), where=norms != 0)",
        "check": "test(\"Calculate safe similarity scores\", lambda: sims.shape == (len(DOCS),) and np.all(np.isfinite(sims)) and int(np.argmax(sims)) == 0, \"The MLflow document has the highest finite cosine score.\")",
        "expected": "The MLflow document has the highest finite cosine score.",
        "reassurance": "The sample ranking is correct, with safe handling for zero vectors."
      },
      {
        "title": "Rank documents by score",
        "instruction": "Create `order`, the document indices sorted from highest to lowest score in `sims`. Use `np.argsort` with a stable sort so tied scores keep document order.",
        "code": "order = np.argsort(-sims, kind=\"stable\")",
        "check": "test(\"Rank documents by score\", lambda: list(order)[0] == 0 and sorted(order.tolist()) == [0, 1, 2, 3], \"The MLflow document (index 0) ranks first.\")",
        "expected": "The MLflow document (index 0) ranks first.",
        "reassurance": ""
      },
      {
        "title": "Wrap retrieval in a function",
        "instruction": "Define `retrieve(question, k=1)`: embed the question into `q`, compute `norms` and `sims` as before, and return the `k` best document strings from `DOCS` in ranked order.",
        "code": "def retrieve(question, k=1):\n    q = embed(question)\n    norms = np.linalg.norm(DOC_VECS, axis=1) * np.linalg.norm(q)\n    sims = np.divide(DOC_VECS @ q, norms, out=np.zeros(len(DOCS)), where=norms != 0)\n    return [DOCS[i] for i in np.argsort(-sims, kind=\"stable\")[:k]]",
        "check": "test(\"Wrap retrieval in a function\", lambda: retrieve(\"How does MLflow track experiments and metrics?\") == [DOCS[0]] and len(retrieve(\"MLflow\", 2)) == 2, \"The MLflow question retrieves its document; k=2 returns two documents.\")",
        "expected": "The MLflow question retrieves its document; k=2 returns two documents.",
        "reassurance": "",
        "startFrom": [
          1,
          2
        ]
      },
      {
        "title": "Package the reusable retriever",
        "instruction": "Update `retrieve` so a blank question, an empty `DOCS`, or a non-positive `k` returns `[]` before any work is done.",
        "code": "def retrieve(question, k=1):\n    if not question.strip() or not DOCS or k <= 0:\n        return []\n    q = embed(question)\n    norms = np.linalg.norm(DOC_VECS, axis=1) * np.linalg.norm(q)\n    sims = np.divide(DOC_VECS @ q, norms, out=np.zeros(len(DOCS)), where=norms != 0)\n    return [DOCS[i] for i in np.argsort(-sims, kind=\"stable\")[:k]]",
        "check": "test(\"Package the reusable retriever\", lambda: retrieve(\"How does MLflow track experiments and metrics?\")[0] == DOCS[0] and retrieve(\"  \") == [] and retrieve(\"MLflow\", 0) == [], \"The MLflow question retrieves its document; blank queries and zero k return [].\")",
        "expected": "The MLflow question retrieves its document; blank queries and zero k return [].",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Create the RAG prompt",
        "instruction": "Create a `ChatPromptTemplate` named `prompt` with `context` and `question` placeholders. Render “Context:”, a newline, and the context, followed by two newlines and “Question: ” plus the original question. Keep the two inputs distinct.",
        "code": "prompt = ChatPromptTemplate.from_template(\"Context:\\n{context}\\n\\nQuestion: {question}\")",
        "check": "test(\"Create the RAG prompt\", lambda: \"facts\" in prompt.invoke({\"context\":\"facts\", \"question\":\"why?\"}).to_string() and \"why?\" in prompt.invoke({\"context\":\"facts\", \"question\":\"why?\"}).to_string(), \"The rendered prompt contains both supplied context and question.\")",
        "expected": "The rendered prompt contains both supplied context and question.",
        "reassurance": "Both ingredients have a place in the final prompt."
      },
      {
        "title": "Fan out the question",
        "instruction": "Create a dictionary named `rag_inputs` with two runnable branches named `context` and `question`. The context branch should retrieve passages for its input question and join them with single newlines; use `RunnableLambda` to adapt that work. The question branch should preserve the original input through `RunnablePassthrough`. A blank question should add no invented context.",
        "code": "rag_inputs = {\"context\": RunnableLambda(lambda q: \"\\n\".join(retrieve(q))), \"question\": RunnablePassthrough()}",
        "check": "test(\"Fan out the question\", lambda: rag_inputs[\"question\"].invoke(\"MLflow\") == \"MLflow\" and DOCS[0] in rag_inputs[\"context\"].invoke(\"How does MLflow track experiments and metrics?\"), \"The branches produce the MLflow passage and the original question.\")",
        "expected": "The branches produce the MLflow passage and the original question.",
        "reassurance": "Retrieval and question preservation are each verified."
      },
      {
        "title": "Connect the RAG chain",
        "instruction": "Build a runnable named `rag_chain` by connecting `rag_inputs`, `prompt`, the setup echo model `llm`, and `StrOutputParser`, in that order. The output should be a string that includes only the retrieved context alongside the original question.",
        "code": "rag_chain = rag_inputs | prompt | llm | StrOutputParser()",
        "check": "test(\"Connect the RAG chain\", lambda: \"LangGraph models agents\" in rag_chain.invoke(\"How do agents use state machines with nodes?\"), \"The echoed answer includes the relevant LangGraph passage.\")",
        "expected": "The echoed answer includes the relevant LangGraph passage.",
        "reassurance": "Retrieved context is reaching the model; the final checks will cover other collections too."
      },
      {
        "title": "Print and check Mini RAG",
        "instruction": "Run `rag_chain` with the question “How does MLflow track experiments and metrics?” and display the answer. Check the chapter and compare the echoed context with the question to verify that retrieval chose the relevant passage.",
        "code": "print(rag_chain.invoke(\"How does MLflow track experiments and metrics?\"))",
        "check": "",
        "expected": "The output starts ANSWER USING and includes the MLflow passage plus the question.",
        "reassurance": "You can inspect retrieval and generation together, with all chapter edge cases checked."
      }
    ],
    "setup": "import zlib\nimport numpy as np\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\nfrom langchain_core.runnables import RunnableLambda, RunnablePassthrough\nfrom langchain_core.messages import AIMessage\n\nDOCS = [\n    \"MLflow tracks experiments, parameters and metrics.\",\n    \"LangGraph models agents as state machines with nodes and edges.\",\n    \"Delta Lake adds ACID transactions and time travel to data lakes.\",\n    \"Pandas groupby splits data into groups and aggregates each group.\",\n]\n\ndef embed(text, dim=64):\n    v = np.zeros(dim)\n    for word in text.lower().replace(\".\", \"\").replace(\"?\", \"\").replace(\",\", \"\").split():\n        v[zlib.crc32(word.encode()) % dim] += 1\n    return v\n\nDOC_VECS = np.array([embed(d) for d in DOCS])\n\nllm = RunnableLambda(lambda pv: AIMessage(\"ANSWER USING -> \" + pv.to_string()))"
  }
}
