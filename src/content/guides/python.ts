import type { CodingGuide } from '../guided'

export const PYTHON_GUIDES: Record<string, CodingGuide> = {
  "py-prompt-strings": {
    "setup": "role, question = \"  data engineer \", \"What is a partition?  \"",
    "steps": [
      {
        "title": "Clean the role",
        "instruction": "Create `clean_role` from `role` by removing surrounding whitespace. Preserve whitespace inside the text and leave `role` unchanged.",
        "code": "clean_role = role.strip()",
        "check": "test('Clean the role', lambda: clean_role == \"data engineer\" and role.startswith(\"  \"), 'clean_role is \"data engineer\"; role still has its original surrounding spaces.')",
        "expected": "clean_role is \"data engineer\"; role still has its original surrounding spaces.",
        "reassurance": "The role is cleaned without overwriting the input."
      },
      {
        "title": "Clean the question",
        "instruction": "Create `clean_question` by removing surrounding whitespace from `question`, leaving the original input unchanged.",
        "code": "clean_question = question.strip()",
        "check": "test('Clean the question', lambda: clean_question == \"What is a partition?\", 'clean_question is \"What is a partition?\".')",
        "expected": "clean_question is \"What is a partition?\".",
        "reassurance": "Both inputs are ready for the template."
      },
      {
        "title": "Build the two-line string",
        "instruction": "Create a string named `prompt` with exactly two lines using the cleaned values. The first begins `You are a helpful `, followed by `clean_role` and a period. The second begins `Question: `, followed by `clean_question`.",
        "code": "prompt = f\"You are a helpful {clean_role}.\\nQuestion: {clean_question}\"",
        "check": "test('Build the two-line string', lambda: prompt == \"You are a helpful data engineer.\\nQuestion: What is a partition?\" and len(prompt.splitlines()) == 2, 'The string has exactly two lines, with the role and question filled in.')",
        "expected": "The string has exactly two lines, with the role and question filled in.",
        "reassurance": "The template is right; the next short function will reuse it with any inputs."
      },
      {
        "title": "Make the template reusable",
        "instruction": "Implement `build_prompt(role, question)`, with parameters in that order. Return the same two-line prompt format for any inputs, removing surrounding whitespace from each input while preserving its internal text.",
        "code": "def build_prompt(role, question):\n    return f\"You are a helpful {role.strip()}.\\nQuestion: {question.strip()}\"",
        "check": "test('Make the template reusable', lambda: build_prompt(\" poet \", \" Why? \") == \"You are a helpful poet.\\nQuestion: Why?\", 'New inputs \" poet \" and \" Why? \" produce clean poet and Why? text.')",
        "expected": "New inputs \" poet \" and \" Why? \" produce clean poet and Why? text.",
        "reassurance": "The function works for different inputs, rather than depending on the example variables."
      },
      {
        "title": "Print a real call",
        "instruction": "Use `build_prompt` with the role `data engineer` and question `What is a partition?`, then print the resulting prompt.",
        "code": "print(build_prompt(\"data engineer\", \"What is a partition?\"))",
        "check": "",
        "expected": "The output is the two-line prompt starting You are a helpful data engineer.",
        "reassurance": "The full check confirms exact wording, line count, new inputs and whitespace cleanup."
      }
    ]
  },
  "py-dataclass": {
    "setup": "",
    "steps": [
      {
        "title": "Import dataclass tools",
        "instruction": "Import `dataclass` and `field` from Python’s `dataclasses` module. They will provide generated object methods and independent default values.",
        "code": "from dataclasses import dataclass, field",
        "check": "test('Import dataclass tools', lambda: callable(dataclass) and callable(field), 'Both dataclass and field are available.')",
        "expected": "Both dataclass and field are available.",
        "reassurance": "The building blocks for independent conversation objects are ready."
      },
      {
        "title": "Define one message",
        "instruction": "Define a dataclass named `Message` with string fields `role` and `content`, in that order. Instances should accept positional or named fields and compare equal when both field values match.",
        "code": "@dataclass\nclass Message:\n    role: str\n    content: str",
        "check": "test('Define one message', lambda: Message(\"user\", \"hello\") == Message(role=\"user\", content=\"hello\"), 'A Message stores its role and content and compares by those values.')",
        "expected": "A Message stores its role and content and compares by those values.",
        "reassurance": "You have the individual message object before building the collection."
      },
      {
        "title": "Give each conversation a fresh list",
        "instruction": "Define a dataclass named `Conversation` with a `messages` list field. Each new conversation must begin with its own empty list; conversations must never share the same default list.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)",
        "check": "test('Give each conversation a fresh list', lambda: Conversation().messages == [] and Conversation().messages is not Conversation().messages, 'Two new conversations have separate empty lists.')",
        "expected": "Two new conversations have separate empty lists.",
        "reassurance": "The mutable-default trap is covered. Next add a message-storing method."
      },
      {
        "title": "Add the add method",
        "instruction": "Redefine `Conversation` in this step with its independent `messages` list field and an `add` method taking `self`, `role` and `content` in that order. The method should append a new `Message` to that conversation’s list and return no value. Include the existing field in the updated class definition so it remains available.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)\n    def add(self, role: str, content: str) -> None:\n        self.messages.append(Message(role, content))",
        "check": "probe = Conversation()\nprobe.add(\"user\", \"hello\")\ntest(\"add stores a Message\", lambda: probe.messages == [Message(\"user\", \"hello\")], \"append Message(role, content) to self.messages\")",
        "expected": "Conversation now exposes add(role, content). The check below also stores a sample message.",
        "reassurance": "The list remains independent in each instance; add now has a place to store typed messages."
      },
      {
        "title": "Count words with a property",
        "instruction": "Redefine `Conversation` in this step, retaining its independent `messages` list field and `add` method, and adding a read-only `word_count` property. It should total the whitespace-separated words in every message’s `content`, returning zero for an empty conversation. Include all existing fields and methods in this updated class definition.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)\n    def add(self, role: str, content: str) -> None:\n        self.messages.append(Message(role, content))\n    @property\n    def word_count(self) -> int:\n        return sum(len(m.content.split()) for m in self.messages)",
        "check": "test('Count words with a property', lambda: Conversation([Message(\"user\", \"hello big world\"), Message(\"assistant\", \"hi\")]).word_count == 4 and Conversation().word_count == 0, 'The two example messages total 4 words; an empty conversation has 0.')",
        "expected": "The two example messages total 4 words; an empty conversation has 0.",
        "reassurance": "Word counts work across messages and for an empty chat. The final demo will exercise add too."
      },
      {
        "title": "Try the conversation",
        "instruction": "Create a `Conversation` named `chat`. Add a user message with content `hello big world` and an assistant message with content `hi`, in that order. Print its `word_count`.",
        "code": "chat = Conversation()\nchat.add(\"user\", \"hello big world\")\nchat.add(\"assistant\", \"hi\")\nprint(chat.word_count)",
        "check": "",
        "expected": "The printed word count is 4.",
        "reassurance": "The full check confirms Message storage, total word count and independent message lists."
      }
    ]
  },
  "py-pydantic": {
    "setup": "raw = {\"sentiment\": \"meh\", \"score\": \"9\"}",
    "steps": [
      {
        "title": "Import the schema tools",
        "instruction": "Import `Literal` from `typing` and `BaseModel`, `Field`, `ValidationError` from `pydantic`. These names will define the schema and identify validation failures.",
        "code": "from typing import Literal\nfrom pydantic import BaseModel, Field, ValidationError",
        "check": "test('Import the schema tools', lambda: issubclass(ValidationError, Exception) and callable(Field), 'The validator and its rejection exception are available.')",
        "expected": "The validator and its rejection exception are available.",
        "reassurance": "You can now describe valid review data at the input boundary."
      },
      {
        "title": "Restrict the sentiment",
        "instruction": "Define `Review` as a Pydantic model with `sentiment` and `score` fields. Permit only `positive`, `neutral` or `negative` for sentiment; require an integer score while allowing numeric strings to be converted.",
        "code": "class Review(BaseModel):\n    sentiment: Literal[\"positive\", \"neutral\", \"negative\"]\n    score: int",
        "check": "try:\n    Review(sentiment=\"meh\", score=3)\n    bad_sentiment_rejected = False\nexcept ValidationError:\n    bad_sentiment_rejected = True\ntest(\"sentiment vocabulary is enforced\", lambda: bad_sentiment_rejected and Review(sentiment=\"neutral\", score=\"4\").score == 4, \"Literal must permit only positive, neutral and negative\")",
        "expected": "A neutral review with score \"4\" becomes an integer score of 4.",
        "reassurance": "Safe numeric coercion is preserved. The next class definition adds the missing score range."
      },
      {
        "title": "Bound the score",
        "instruction": "Update `Review` so its integer `score` must be between 1 and 5, inclusive. Retain the three permitted sentiments and numeric-string conversion.",
        "code": "class Review(BaseModel):\n    sentiment: Literal[\"positive\", \"neutral\", \"negative\"]\n    score: int = Field(ge=1, le=5)",
        "check": "test('Bound the score', lambda: Review(sentiment=\"positive\", score=5).score == 5 and Review(sentiment=\"negative\", score=1).score == 1, 'Both valid boundary scores, 1 and 5, are accepted.')",
        "expected": "Both valid boundary scores, 1 and 5, are accepted.",
        "reassurance": "The valid boundaries work. The complete check will also confirm that invalid values are rejected."
      },
      {
        "title": "Handle the malformed reply",
        "instruction": "Validate the supplied `raw` reply as a `Review`. Catch `ValidationError` and print `rejected` for invalid input; otherwise print `accepted` with the validated object.",
        "code": "try:\n    review = Review(**raw)\n    print(\"accepted\", review)\nexcept ValidationError:\n    print(\"rejected\")",
        "check": "",
        "expected": "The demo prints rejected for sentiment meh and score 9.",
        "reassurance": "The full check confirms both score bounds, the sentiment vocabulary and safe numeric-string coercion."
      }
    ]
  },
  "py-batches": {
    "setup": "",
    "steps": [
      {
        "title": "Import the lazy batching tool",
        "instruction": "Import `batched` from Python’s `itertools` module for lazy grouping.",
        "code": "from itertools import batched",
        "check": "test('Import the lazy batching tool', lambda: list(batched(range(4), 3)) == [(0, 1, 2), (3,)], 'batched keeps a full tuple and the shorter final tuple.')",
        "expected": "batched keeps a full tuple and the shorter final tuple.",
        "reassurance": "The standard tool already provides ordering and partial-batch behavior."
      },
      {
        "title": "Define the tiny adapter",
        "instruction": "Implement `batches(items, size=3)`, with parameters in that order and a default batch size of three. Return a lazy iterator of ordered tuples, using the standard batching tool. Keep a shorter final batch, handle empty input and reject non-positive sizes. Do not consume the source eagerly.",
        "code": "def batches(items, size=3):\n    return batched(items, size)",
        "check": "test('Define the tiny adapter', lambda: list(batches(range(8), 3)) == [(0, 1, 2), (3, 4, 5), (6, 7)] and list(batches([], 2)) == [], 'Eight items form three ordered tuples; an empty source yields none.')",
        "expected": "Eight items form three ordered tuples; an empty source yields none.",
        "reassurance": "The adapter preserves the standard iterator behavior. Next watch when it reads a source."
      },
      {
        "title": "Create a source that records reads",
        "instruction": "Create an empty list named `seen` and a lazy generator named `texts` yielding integers 0 through 7 in order. Each time a value is requested, record that value in `seen`; creating the generator alone must record nothing.",
        "code": "seen = []\ntexts = (seen.append(i) or i for i in range(8))",
        "check": "test('Create a source that records reads', lambda: seen == [], 'seen is still empty after creating texts.')",
        "expected": "seen is still empty after creating texts.",
        "reassurance": "Creating this source has not read any items."
      },
      {
        "title": "Create a batch iterator",
        "instruction": "Create a batch iterator named `groups` from `texts`, using your `batches` function with size three. Do not request any items yet.",
        "code": "groups = batches(texts, 3)",
        "check": "test('Create a batch iterator', lambda: seen == [] and iter(groups) is groups, 'groups is an iterator and seen remains empty.')",
        "expected": "groups is an iterator and seen remains empty.",
        "reassurance": "Creating batches also leaves the source unread, as streaming requires."
      },
      {
        "title": "Ask for just one batch",
        "instruction": "Request just the first batch from `groups` and store it as `first`. Leave later batches unread.",
        "code": "first = next(groups)",
        "check": "test('Ask for just one batch', lambda: first == (0, 1, 2) and seen == [0, 1, 2], 'first is (0, 1, 2), and exactly those three items were read.')",
        "expected": "first is (0, 1, 2), and exactly those three items were read.",
        "reassurance": "The first request reads one batch instead of consuming the whole dataset."
      },
      {
        "title": "Keep the remaining items",
        "instruction": "Print `first` and the remaining batches from `groups`. You may fully consume this finite demo now to inspect the shorter final batch.",
        "code": "print(first, list(groups))",
        "check": "",
        "expected": "The remaining tuples are (3, 4, 5) and (6, 7).",
        "reassurance": "The complete check also verifies one-shot and infinite sources, empty input and rejected invalid sizes."
      }
    ]
  },
  "py-embed-cache": {
    "setup": "calls = []\ndef fake_embed_batch(texts):\n    calls.append(list(texts))\n    return [[float(len(t)), float(t.count(\" \"))] for t in texts]",
    "steps": [
      {
        "title": "Create independent cache state",
        "instruction": "Define `EmbeddingCache` with an initializer taking `self` and `embed_batch`. Store the supplied callable as `embed_batch`, create a fresh dictionary named `store` for each instance and start the `hits` and `misses` counters at zero.",
        "code": "class EmbeddingCache:\n    def __init__(self, embed_batch):\n        self.embed_batch = embed_batch\n        self.store = {}\n        self.hits = 0\n        self.misses = 0",
        "check": "test('Create independent cache state', lambda: EmbeddingCache(fake_embed_batch).store == {} and EmbeddingCache(fake_embed_batch).store is not EmbeddingCache(fake_embed_batch).store, 'Every cache starts with its own empty dictionary and zero counters.')",
        "expected": "Every cache starts with its own empty dictionary and zero counters.",
        "reassurance": "The state is independent before any API work begins."
      },
      {
        "title": "Find first-seen misses",
        "instruction": "Implement `unseen_texts(texts, store)`, with parameters in that order. Return each uncached text once, in order of first appearance. Exclude keys already in `store` and do not mutate either input.",
        "code": "def unseen_texts(texts, store):\n    return [text for text in dict.fromkeys(texts) if text not in store]",
        "check": "test('Find first-seen misses', lambda: unseen_texts([\"alpha\", \"beta\", \"alpha\", \"gamma\"], {\"beta\": [4]}) == [\"alpha\", \"gamma\"], 'The misses are [\"alpha\", \"gamma\"], with the repeat and cached beta excluded.')",
        "expected": "The misses are [\"alpha\", \"gamma\"], with the repeat and cached beta excluded.",
        "reassurance": "The API will receive each new text once and in first-seen order."
      },
      {
        "title": "Fill misses only after validating the reply",
        "instruction": "Implement `fill_misses(cache, unseen)`, with parameters in that order. For a nonempty miss list, request vectors through `cache.embed_batch` and require exactly one vector per text before changing `cache.store`. Store the matching vectors only after validation; raise `ValueError` for the wrong count. Empty misses make no API call, and API errors must propagate without partial updates.",
        "code": "def fill_misses(cache, unseen):\n    if unseen:\n        vectors = cache.embed_batch(unseen)\n        if len(vectors) != len(unseen):\n            raise ValueError(f\"expected {len(unseen)} vectors, got {len(vectors)}\")\n        cache.store.update(zip(unseen, vectors))",
        "check": "probe = EmbeddingCache(lambda texts: [[len(text)] for text in texts])\nfill_misses(probe, [\"a\", \"bb\"])\nbroken = EmbeddingCache(lambda texts: [[0]])\ntry:\n    fill_misses(broken, [\"a\", \"b\"])\n    rejected = False\nexcept ValueError:\n    rejected = True\ntest(\"cache updates only after a complete reply\", lambda: probe.store == {\"a\": [1], \"bb\": [2]} and rejected and broken.store == {}, \"validate the returned vector count before updating the dictionary\")",
        "expected": "A good batch fills the requested keys; a short reply raises ValueError and leaves the dictionary empty.",
        "reassurance": "The helper protects the cache from partial writes. Its check tries both a valid and a short reply."
      },
      {
        "title": "Assemble one embed request",
        "instruction": "Implement `embed(self, texts)` as a standalone function for now. Accept a one-shot iterable, identify first-seen misses with `unseen_texts` and fill them using `fill_misses`. After successful filling, increase `misses` by unique new texts and `hits` by all other requested occurrences. Return vectors in original request order, including repeats. Failed requests must leave cache state and counters unchanged.",
        "code": "def embed(self, texts):\n    texts = list(texts)\n    unseen = unseen_texts(texts, self.store)\n    fill_misses(self, unseen)\n    self.misses += len(unseen)\n    self.hits += len(texts) - len(unseen)\n    return [self.store[text] for text in texts]",
        "check": "probe_calls = []\ndef probe_api(texts):\n    probe_calls.append(list(texts))\n    return [[len(text)] for text in texts]\nprobe = EmbeddingCache(probe_api)\nresult = embed(probe, (text for text in [\"a\", \"bb\", \"a\"]))\ntest(\"request order and counters agree\", lambda: result == [[1], [2], [1]] and probe_calls == [[\"a\", \"bb\"]] and (probe.hits, probe.misses) == (1, 2), \"materialize once, fetch each unique miss, then return vectors in original order\")",
        "expected": "The request [\"a\", \"bb\", \"a\"] returns three vectors, with one API call for a and bb, 2 misses and 1 hit.",
        "reassurance": "The method body now combines the checked parts. Next attach it to the class for the full contract check."
      },
      {
        "title": "Attach the checked method",
        "instruction": "Attach your `embed` function as the `embed` method of `EmbeddingCache`, so each instance supplies its own state when called. Then run the complete checks.",
        "code": "EmbeddingCache.embed = embed",
        "check": "",
        "expected": "The full check includes cached repeats, one-shot inputs, empty requests, bad-length replies, API errors and independent caches.",
        "reassurance": "The complete check verifies ordering, counters, call batching and the required failure behavior."
      }
    ]
  },
  "py-prediction-batches": {
    "setup": "replies = ['{\"label\": \"ham\", \"confidence\": 0.9}', 'not json', '{\"label\": \"spam\", \"confidence\": 0.7}']",
    "steps": [
      {
        "title": "Import validation tools",
        "instruction": "Import `Literal` from `typing` and `BaseModel`, `Field`, `ValidationError` from `pydantic`.",
        "code": "from typing import Literal\nfrom pydantic import BaseModel, Field, ValidationError",
        "check": "test('Import validation tools', lambda: issubclass(ValidationError, Exception) and callable(Field), 'The schema tools and rejection exception are available.')",
        "expected": "The schema tools and rejection exception are available.",
        "reassurance": "The validation boundary can now be defined before processing a batch."
      },
      {
        "title": "Define the accepted reply shape",
        "instruction": "Define a Pydantic model named `Prediction` with `label` and `confidence`. Labels may be only `spam` or `ham`; confidence must be a strict numeric value between 0 and 1 inclusive, rejecting numeric strings and booleans. Forbid extra fields.",
        "code": "class Prediction(BaseModel):\n    model_config = {\"extra\": \"forbid\"}\n    label: Literal[\"spam\", \"ham\"]\n    confidence: float = Field(ge=0, le=1, strict=True)",
        "check": "test('Define the accepted reply shape', lambda: Prediction.model_validate_json(replies[0]).label == \"ham\" and Prediction.model_validate_json(replies[0]).confidence == 0.9, 'The first reply becomes a Prediction(label=\"ham\", confidence=0.9).')",
        "expected": "The first reply becomes a validated Prediction with label ham and confidence 0.9.",
        "reassurance": "A valid reply passes the schema. The batch loop will handle failures without losing successes."
      },
      {
        "title": "Keep each reply’s original position",
        "instruction": "Create `indexed` as a list pairing each entry in `replies` with its original zero-based index. Preserve the payloads and their order.",
        "code": "indexed = list(enumerate(replies))",
        "check": "test('Keep each reply’s original position', lambda: indexed[1] == (1, \"not json\") and len(indexed) == 3, 'The malformed payload retains index 1.')",
        "expected": "The malformed payload retains index 1.",
        "reassurance": "You have the original positions; they must survive even when accepted results form a shorter list."
      },
      {
        "title": "Validate independently inside the loop",
        "instruction": "Implement `validate_predictions(payloads)`, accepting an iterable of JSON strings. Validate each independently as a `Prediction`. Return two lists in order: accepted objects in input order and original zero-based indices of rejected payloads. Catch only `ValidationError` per payload, continue after rejected entries and handle empty or one-shot inputs.",
        "code": "def validate_predictions(payloads):\n    accepted, rejected = [], []\n    for index, text in enumerate(payloads):\n        try:\n            accepted.append(Prediction.model_validate_json(text))\n        except ValidationError:\n            rejected.append(index)\n    return accepted, rejected",
        "check": "test('Validate independently inside the loop', lambda: len(validate_predictions(iter(replies))[0]) == 2 and validate_predictions(iter(replies))[1] == [1], 'Two Prediction objects are accepted and the rejected indices are [1].')",
        "expected": "Two Prediction objects are accepted and the rejected indices are [1].",
        "reassurance": "The malformed middle reply does not erase either valid neighbor."
      },
      {
        "title": "Inspect accepted and rejected results",
        "instruction": "Use `validate_predictions` on `replies` and print both the accepted predictions and rejected indices.",
        "code": "print(validate_predictions(replies))",
        "check": "",
        "expected": "Two typed predictions are shown alongside rejected index [1].",
        "reassurance": "The full check verifies strict types, confidence boundaries, extra-field rejection, generators and independent calls."
      }
    ]
  },
  "py-retry": {
    "setup": "import functools\nimport time\nclass RateLimitError(Exception):\n    def __init__(self, message=\"rate limited\", retry_after=None):\n        super().__init__(message)\n        self.retry_after = retry_after\n\ndef scripted(*outcomes):\n    queue = list(outcomes)\n    def call(*args, **kwargs):\n        outcome = queue.pop(0)\n        if isinstance(outcome, BaseException):\n            raise outcome\n        return outcome\n    return call\n\nwaits = []\nreplies = iter([RateLimitError(), TimeoutError(\"slow\"), \"Paris\"])\ndef ask(question):\n    \"\"\"Ask the model a question.\"\"\"\n    reply = next(replies)\n    if isinstance(reply, Exception):\n        raise reply\n    return reply",
    "steps": [
      {
        "title": "Calculate a capped backoff",
        "instruction": "Create a list named `delays` for five consecutive failure indices starting at zero. Start with a one-second wait, double after each failure and cap every wait at five seconds.",
        "code": "delays = [min(5, 1 * 2 ** attempt) for attempt in range(5)]",
        "check": "test('Calculate a capped backoff', lambda: delays == [1, 2, 4, 5, 5], 'The wait sequence is [1, 2, 4, 5, 5].')",
        "expected": "The wait sequence is [1, 2, 4, 5, 5].",
        "reassurance": "The exponential schedule and cap are checked before they are used by a retry loop."
      },
      {
        "title": "Respect the server’s suggested wait",
        "instruction": "Implement `retry_delay(error, attempt, base_delay, max_delay)`, with parameters in that order. If `error` has a non-None `retry_after` attribute, return it exactly, including zero. Otherwise compute exponential backoff from the zero-based attempt, starting at `base_delay` and capped by `max_delay`.",
        "code": "def retry_delay(error, attempt, base_delay, max_delay):\n    suggested = getattr(error, \"retry_after\", None)\n    return suggested if suggested is not None else min(max_delay, base_delay * 2 ** attempt)",
        "check": "test('Respect the server’s suggested wait', lambda: retry_delay(RateLimitError(retry_after=3), 0, 0.5, 8) == 3 and retry_delay(RateLimitError(retry_after=0), 2, 0.5, 8) == 0 and retry_delay(TimeoutError(), 1, 0.5, 8) == 1, 'Suggested waits 3 and 0 are honored exactly; a second unsuggested failure waits 1 second.')",
        "expected": "Suggested waits 3 and 0 are honored exactly; a second unsuggested failure waits 1 second.",
        "reassurance": "The wait calculation covers both server guidance and local backoff."
      },
      {
        "title": "Retry only transient errors",
        "instruction": "Implement `retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay)`, with parameters in that order. Invoke `fn` with the supplied arguments and return immediately on success. Retry only exceptions identified by `retry_on`, for at most `attempts` total calls. Between failures, obtain a wait from `delay` using the error and zero-based attempt, then use `sleep`. Re-raise the original final error without another wait; unrelated errors propagate immediately.",
        "code": "def retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay):\n    for attempt in range(attempts):\n        try:\n            return fn(*args, **kwargs)\n        except retry_on as error:\n            if attempt == attempts - 1: raise\n            sleep(delay(error, attempt))",
        "check": "probe_waits = []\nresult = retry_call(scripted(RateLimitError(), TimeoutError(), \"ok\"), (), {}, 3, (RateLimitError, TimeoutError), probe_waits.append, lambda error, attempt: 0.5 * 2 ** attempt)\nlast = TimeoutError(\"last\")\nfinal_waits = []\ntry:\n    retry_call(scripted(last), (), {}, 1, (TimeoutError,), final_waits.append, lambda error, attempt: 1)\n    caught = None\nexcept TimeoutError as error:\n    caught = error\ntest(\"retry stops at success or the final failure\", lambda: result == \"ok\" and probe_waits == [0.5, 1.0] and caught is last and final_waits == [], \"return on success and raise before sleeping on the last allowed failure\")",
        "expected": "Two transient failures followed by success cause two waits; the last allowed failure causes no extra wait.",
        "reassurance": "The loop checks the retry boundary before sleeping, so it cannot wait after giving up."
      },
      {
        "title": "Build the decorator around the loop",
        "instruction": "Implement the decorator factory `retry` with parameters in this order: `attempts`, `base_delay`, `max_delay`, `retry_on`, `sleep`. Defaults are 4 attempts, 0.5 seconds, 8.0 seconds, the exception pair `RateLimitError` and `TimeoutError`, and `time.sleep`. Reject attempts below one or negative base delays with `ValueError` when configured. Preserve wrapped metadata and arguments, and use `retry_call` with `retry_delay` so each invocation begins fresh backoff.",
        "code": "def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):\n    if attempts < 1 or base_delay < 0: raise ValueError(\"attempts must be >= 1 and base_delay >= 0\")\n    def decorate(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))\n        return wrapper\n    return decorate",
        "check": "test('Build the decorator around the loop', lambda: retry(sleep=lambda delay: None)(scripted(TimeoutError(), \"ok\"))() == \"ok\", 'A wrapped function retries a timeout and returns ok.')",
        "expected": "A wrapped function retries a timeout and returns ok.",
        "reassurance": "The decorator uses your retry helper. The final step preserves the demo function metadata and runs all requirements."
      },
      {
        "title": "Wrap the demo call",
        "instruction": "Replace the demo `ask` with its decorated version using `retry` and the wait recorder `waits.append` for sleeping. Ask `Capital of France?` and print its result alongside `waits`.",
        "code": "ask = retry(sleep=waits.append)(ask)\nprint(ask(\"Capital of France?\"), waits)",
        "check": "",
        "expected": "The output is Paris [0.5, 1.0].",
        "reassurance": "The full check covers capped waits, Retry-After, final-error identity, permanent errors, arguments, metadata and fresh backoff for each call."
      }
    ]
  },
  "py-async": {
    "setup": "import asyncio\nasync def fake_llm(prompt):\n    await asyncio.sleep(0.01)\n    return prompt.upper()",
    "steps": [
      {
        "title": "Create the concurrency limiter",
        "instruction": "Create an asyncio semaphore named `sem` with two available slots. It will be shared by per-prompt tasks.",
        "code": "sem = asyncio.Semaphore(2)",
        "check": "test('Create the concurrency limiter', lambda: isinstance(sem, asyncio.Semaphore) and not sem.locked(), 'A limiter with two available slots is ready.')",
        "expected": "A limiter with two available slots is ready.",
        "reassurance": "The shared limiter will be passed to every per-prompt task."
      },
      {
        "title": "Run one prompt with bounded retries",
        "instruction": "Implement async `fetch_one(prompt, call_llm, sem, retries)`, with parameters in that order. Hold a semaphore slot while awaiting the supplied model call and any retries. Retry only `TimeoutError`, using `retries` as the maximum total number of calls. Return immediately on success and propagate the last timeout or any unrelated error.",
        "code": "async def fetch_one(prompt, call_llm, sem, retries):\n    async with sem:\n        for attempt in range(retries):\n            try:\n                return await call_llm(prompt)\n            except TimeoutError:\n                if attempt == retries - 1: raise",
        "check": "result = await fetch_one(\"a\", fake_llm, sem, 1)\ntries = []\nasync def flaky(prompt):\n    tries.append(prompt)\n    if len(tries) < 3:\n        raise TimeoutError(\"slow\")\n    return prompt + \"!\"\nretried = await fetch_one(\"x\", flaky, sem, 3)\ntest(\"one prompt has bounded retries\", lambda: result == \"A\" and retried == \"x!\" and tries == [\"x\", \"x\", \"x\"], \"await the call inside the semaphore and retry at most the requested number of attempts\")",
        "expected": "A prompt a produces A; a source that times out twice succeeds on its third attempt.",
        "reassurance": "The per-prompt task handles a success and the exact retry count before you add fan-out."
      },
      {
        "title": "Fan out while preserving order",
        "instruction": "Implement async `fetch_all(prompts, call_llm, limit=3, retries=3)`, with parameters in that order and defaults of three for both settings. Reject non-positive settings with `ValueError`. Run per-prompt tasks concurrently through `fetch_one`, sharing a semaphore that limits active calls to `limit`. Return results in input order, handle an empty input and preserve the bounded retry behavior.",
        "code": "async def fetch_all(prompts, call_llm, limit=3, retries=3):\n    if limit < 1 or retries < 1: raise ValueError(\"limit and retries must be positive\")\n    sem = asyncio.Semaphore(limit)\n    return await asyncio.gather(*(fetch_one(p, call_llm, sem, retries) for p in prompts))",
        "check": "",
        "expected": "The complete check verifies input order, concurrent execution at the limit, exact retry counts, empty input and rejected invalid settings.",
        "reassurance": "The full check exercises concurrency and failures with controlled calls, so it verifies more than a single fast demo."
      }
    ]
  }
}
