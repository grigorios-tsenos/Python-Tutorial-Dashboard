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
        "title": "Place history in the prompt",
        "instruction": "Create `prompt` with `ChatPromptTemplate.from_messages`. It needs a system message, a `MessagesPlaceholder` named `history`, and a human message for the new question, in that order. System text: “You are a support assistant for {product}.” Human template: “{question}”. The setup provides `history` and a recording model named `llm`.",
        "code": "prompt = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a support assistant for {product}.\"),\n    MessagesPlaceholder(\"history\"),\n    (\"human\", \"{question}\"),\n])",
        "check": "test(\"Place history in the prompt\", lambda: [m.type for m in prompt.invoke({\"product\":\"Orbit\", \"history\":[HumanMessage(\"earlier\")], \"question\":\"now\"}).to_messages()] == [\"system\", \"human\", \"human\"], \"The prompt contains system, earlier human, then newest human.\")",
        "expected": "The prompt contains system, earlier human, then newest human.",
        "reassurance": "The history is in the right position; trimming is the next separate job."
      },
      {
        "title": "Keep complete recent turns",
        "instruction": "Define `trim_history` with parameters `messages` and `max_turns`, in that order. Return a new list containing the most recent human-started turns and every following reply, including consecutive AI replies. A turn starts at a message whose `type` is `human`. Ignore messages before the oldest retained human message. Non-positive windows, empty histories, and histories without human messages should give an empty list; leave the original list unchanged.",
        "code": "def trim_history(messages, max_turns):\n    \"\"\"The last max_turns turns, starting on a human message.\"\"\"\n    if max_turns <= 0:\n        return []\n    starts = [i for i, m in enumerate(messages) if m.type == \"human\"][-max_turns:]\n    return list(messages[starts[0]:]) if starts else []",
        "check": "test(\"Keep complete recent turns\", lambda: [m.content for m in trim_history(history, 1)] == [\"Also my login fails\", \"Try the reset link.\"] and trim_history(history, 0) == [] and trim_history([AIMessage(\"hi\")], 2) == [], \"One turn keeps the newest question and reply. A zero window or no human messages gives [].\")",
        "expected": "One turn keeps the newest question and reply. A zero window or no human messages gives [].",
        "reassurance": "Your window starts on a human message and keeps its reply together."
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
        "title": "Turn a counter into a tool",
        "instruction": "Define a tool named `word_count` with one parameter, `text`, annotated as `str`, and an `int` return annotation. Apply the imported `tool` decorator and give it a descriptive docstring containing the words “Count the words”. It should count whitespace-separated words, including tabs and newlines, and give zero for empty or whitespace-only text. The setup also provides a `shout` tool and a message named `msg` requesting both tools.",
        "code": "@tool\ndef word_count(text: str) -> int:\n    \"\"\"Count the words in a piece of text.\"\"\"\n    return len(text.split())",
        "check": "test(\"Turn a counter into a tool\", lambda: word_count.invoke({\"text\":\"  one\\ttwo\\nthree  \"}) == 3 and word_count.invoke({\"text\":\"\"}) == 0 and word_count.name == \"word_count\", \"Three words are counted across mixed whitespace; an empty string gives 0.\")",
        "expected": "Three words are counted across mixed whitespace; an empty string gives 0.",
        "reassurance": "split handles repeated spaces for you, and the docstring supplies the tool description."
      },
      {
        "title": "Dispatch requests by name",
        "instruction": "Define `run_tool_calls` with parameters `ai_message` and `tools`, in that order. Each entry in `ai_message.tool_calls` has a `name` and an `args` dictionary. Match the name to the corresponding tool’s `name` field, invoke that tool with the arguments, and collect the results as strings in request order. Repeated requests must all run, regardless of tool-list order; a message with no calls should give an empty list.",
        "code": "def run_tool_calls(ai_message, tools):\n    by_name = {t.name: t for t in tools}\n    return [str(by_name[call[\"name\"]].invoke(call[\"args\"])) for call in ai_message.tool_calls]",
        "check": "test(\"Dispatch requests by name\", lambda: run_tool_calls(msg, [shout, word_count]) == [\"4\", \"ORBIT\"] and run_tool_calls(AIMessage(\"hello\"), [word_count]) == [], \"The two calls produce [\\\"4\\\", \\\"ORBIT\\\"] even when the tools list has a different order. No calls gives [].\")",
        "expected": "The two calls produce [\"4\", \"ORBIT\"] even when the tools list has a different order. No calls gives [].",
        "reassurance": "Your dispatcher uses names correctly and handles an empty batch."
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
        "title": "Validate source citations",
        "instruction": "Define `validate_sources` with one parameter, `sources`. Accept a list containing only strings, including an empty list, and return the accepted list unchanged. Reject any other shape with `ValueError`. Error text: “sources must be a list of strings”.",
        "code": "def validate_sources(sources):\n    if not isinstance(sources, list) or any(not isinstance(source, str) for source in sources):\n        raise ValueError(\"sources must be a list of strings\")\n    return sources",
        "check": "test(\"Validate source citations\", lambda: validate_sources([\"guide\"]) == [\"guide\"] and validate_sources([]) == [], \"A list of strings and an empty list are valid sources.\")",
        "expected": "A list of strings and an empty list are valid sources.",
        "reassurance": "The citation check is ready to use in the answer parser."
      },
      {
        "title": "Validate the answer shape",
        "instruction": "Define `parse_answer` with one parameter, `message`. Use `parser` to parse it, then require a dictionary with a non-blank string `answer` and a valid `sources` field. Trim surrounding whitespace from the answer, use `validate_sources` for citations, and return only those two fields. Invalid JSON and missing or invalid fields must raise `ValueError`; extra fields should be ignored. Error texts for a non-object and invalid answer are “answer must be a JSON object” and “answer must be non-empty text”.",
        "code": "def parse_answer(message):\n    data = parser.invoke(message)\n    if not isinstance(data, dict):\n        raise ValueError(\"answer must be a JSON object\")\n    answer = data.get(\"answer\")\n    if not isinstance(answer, str) or not answer.strip():\n        raise ValueError(\"answer must be non-empty text\")\n    return {\"answer\": answer.strip(), \"sources\": validate_sources(data.get(\"sources\"))}",
        "check": "test(\"Validate the answer shape\", lambda: parse_answer(message) == {\"answer\":\"Delta remembers versions.\", \"sources\":[\"guide\"]}, \"The fenced reply becomes a trimmed answer with the guide source.\")",
        "expected": "The fenced reply becomes a trimmed answer with the guide source.",
        "reassurance": "The valid example works; the final checks will also try malformed JSON and invalid fields."
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
        "title": "Build windows for one document",
        "instruction": "Define `chunk_document` with parameters `doc`, `chunk_size`, and `overlap`, in that order. Return a list of new `Document` objects containing word windows, normalized to single spaces. Advance by the number of new words per window and omit a final window that would contain only repeated overlap. Copy each chunk’s source metadata and add zero-based `chunk` and `start_word` fields; numbering restarts for each document. Include all source words, skip blank documents, and leave source text and metadata unchanged.",
        "code": "def chunk_document(doc, chunk_size, overlap):\n    words = doc.page_content.split()\n    chunks = []\n    for number, start in enumerate(range(0, len(words), chunk_size - overlap)):\n        if number and start + overlap >= len(words):\n            break\n        chunks.append(Document(\" \".join(words[start:start + chunk_size]), {**doc.metadata, \"chunk\": number, \"start_word\": start}))\n    return chunks",
        "check": "test(\"Build windows for one document\", lambda: [c.page_content for c in chunk_document(Document(\"a b c d e f g\", {\"source\":\"a\"}), 4, 1)] == [\"a b c d\", \"d e f g\"], \"Seven words produce two four-word windows with one overlapping word.\")",
        "expected": "Seven words produce two four-word windows with one overlapping word.",
        "reassurance": "The per-document loop avoids an extra chunk containing only overlap."
      },
      {
        "title": "Validate sizes and combine documents",
        "instruction": "Define `split_documents` with parameters `docs`, `chunk_size`, and `overlap`, in that order. Require a size of at least 1 and a non-negative overlap smaller than that size; reject invalid values with `ValueError`. Use `chunk_document` for each document and combine its results in document order. An empty collection should give an empty list. Error text: “need chunk_size >= 1 and 0 <= overlap < chunk_size”.",
        "code": "def split_documents(docs, chunk_size, overlap):\n    if chunk_size < 1 or not 0 <= overlap < chunk_size:\n        raise ValueError(\"need chunk_size >= 1 and 0 <= overlap < chunk_size\")\n    return [chunk for doc in docs for chunk in chunk_document(doc, chunk_size, overlap)]",
        "check": "test(\"Validate sizes and combine documents\", lambda: split_documents([], 4, 1) == [] and len(split_documents([Document(\"a b c d e f g\", {})], 4, 1)) == 2, \"An empty collection gives []; the seven-word example still gives two chunks.\")",
        "expected": "An empty collection gives []; the seven-word example still gives two chunks.",
        "reassurance": "The public splitter now validates its inputs before doing any work."
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
    "setup": "from langchain_core.documents import Document\n\nrunbook = Document(\n    \"If the nightly job fails, check the Delta table history first. \"\n    \"Restore the last good version before rerunning the pipeline.\",\n    {\"source\": \"runbook.md\"},\n)"
  },
  "lc-context-budget": {
    "steps": [
      {
        "title": "Try one whole passage",
        "instruction": "Define `add_passage` with parameters `context`, `used`, `document`, and `max_chars`, in that order. Return a pair containing the resulting context string and character count. Strip the candidate passage, skip it if blank or too large, and include it whole only when it fits. Separate it from any existing context with exactly two newlines and count those characters too. A skipped passage must leave both values unchanged.",
        "code": "def add_passage(context, used, document, max_chars):\n    passage = document.strip()\n    size = len(passage) + (2 if context else 0)\n    if passage and used + size <= max_chars:\n        return context + (\"\\n\\n\" if context else \"\") + passage, used + size\n    return context, used",
        "check": "test(\"Try one whole passage\", lambda: add_passage(\"ok\", 2, \"go\", 6) == (\"ok\\n\\ngo\", 6) and add_passage(\"ok\", 2, \"go\", 5) == (\"ok\", 2), \"Budget 6 includes go and its separator; budget 5 preserves only ok.\")",
        "expected": "Budget 6 includes go and its separator; budget 5 preserves only ok.",
        "reassurance": "The helper keeps a whole passage or skips it, with no partial text."
      },
      {
        "title": "Scan every passage within the budget",
        "instruction": "Define `pack_context` with parameters `documents` and `max_chars`, in that order. Start with an empty context and use `add_passage` to consider every passage in input order. Skip oversized or blank passages while continuing to later ones, keep included passages whole, and return only the final context string. Empty input or a non-positive budget should give an empty string; do not modify the input collection.",
        "code": "def pack_context(documents, max_chars):\n    if max_chars <= 0:\n        return \"\"\n    context, used = \"\", 0\n    for document in documents:\n        context, used = add_passage(context, used, document, max_chars)\n    return context",
        "check": "test(\"Scan every passage within the budget\", lambda: pack_context([\"too long to fit\", \"ok\", \"go\"], 6) == \"ok\\n\\ngo\" and pack_context([\"ok\",\"go\"], 5) == \"ok\", \"The oversized first passage is skipped; ok and go fit in a six-character context.\")",
        "expected": "The oversized first passage is skipped; ok and go fit in a six-character context.",
        "reassurance": "Your packing function includes separators and keeps looking for useful later text."
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
        "title": "Package the reusable retriever",
        "instruction": "Define `retrieve` with parameters `question` and `k`, defaulting `k` to 1. Use `embed`, the current `DOCS`, and the current `DOC_VECS` to rank documents by decreasing cosine similarity, then return at most `k` document strings. Tied scores must keep document order and zero vectors must not create invalid scores. Blank questions, empty collections, and non-positive `k` should give an empty list; an oversized `k` should return the whole collection in ranked order.",
        "code": "def retrieve(question, k=1):\n    \"\"\"Return the k documents most cosine-similar to the question.\"\"\"\n    if not question.strip() or not DOCS or k <= 0:\n        return []\n    q = embed(question)\n    norms = np.linalg.norm(DOC_VECS, axis=1) * np.linalg.norm(q)\n    sims = np.divide(DOC_VECS @ q, norms, out=np.zeros(len(DOCS)), where=norms != 0)\n    return [DOCS[i] for i in np.argsort(-sims, kind=\"stable\")[:k]]",
        "check": "test(\"Package the reusable retriever\", lambda: retrieve(\"How does MLflow track experiments and metrics?\")[0] == DOCS[0] and retrieve(\"  \") == [] and retrieve(\"MLflow\", 0) == [], \"The MLflow question retrieves its document; blank queries and zero k return [].\")",
        "expected": "The MLflow question retrieves its document; blank queries and zero k return [].",
        "reassurance": "The reusable retriever handles the main result and its empty-input guards."
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
