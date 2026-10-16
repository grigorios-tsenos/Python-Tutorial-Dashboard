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
        "reassurance": ""
      },
      {
        "title": "Clean the question",
        "instruction": "Create `clean_question` by removing surrounding whitespace from `question`, leaving the original input unchanged.",
        "code": "clean_question = question.strip()",
        "check": "test('Clean the question', lambda: clean_question == \"What is a partition?\", 'clean_question is \"What is a partition?\".')",
        "expected": "clean_question is \"What is a partition?\".",
        "reassurance": ""
      },
      {
        "title": "Build the two-line string",
        "instruction": "Create a string named `prompt` with exactly two lines using the cleaned values. The first begins `You are a helpful `, followed by `clean_role` and a period. The second begins `Question: `, followed by `clean_question`.",
        "code": "prompt = f\"You are a helpful {clean_role}.\\nQuestion: {clean_question}\"",
        "check": "test('Build the two-line string', lambda: prompt == \"You are a helpful data engineer.\\nQuestion: What is a partition?\" and len(prompt.splitlines()) == 2, 'The string has exactly two lines, with the role and question filled in.')",
        "expected": "The string has exactly two lines, with the role and question filled in.",
        "reassurance": ""
      },
      {
        "title": "Make the template reusable",
        "instruction": "Implement `build_prompt(role, question)`, with parameters in that order. Return the same two-line prompt format for any inputs, removing surrounding whitespace from each input while preserving its internal text.",
        "code": "def build_prompt(role, question):\n    return f\"You are a helpful {role.strip()}.\\nQuestion: {question.strip()}\"",
        "check": "test('Make the template reusable', lambda: build_prompt(\" poet \", \" Why? \") == \"You are a helpful poet.\\nQuestion: Why?\", 'New inputs \" poet \" and \" Why? \" produce clean poet and Why? text.')",
        "expected": "New inputs \" poet \" and \" Why? \" produce clean poet and Why? text.",
        "reassurance": ""
      },
      {
        "title": "Print a real call",
        "instruction": "Use `build_prompt` with the role `data engineer` and question `What is a partition?`, then print the resulting prompt.",
        "code": "print(build_prompt(\"data engineer\", \"What is a partition?\"))",
        "check": "",
        "expected": "The output is the two-line prompt starting You are a helpful data engineer.",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Define a message with a role",
        "instruction": "Define a dataclass named `Message` with a single string field `role`. The decorator writes the initializer for you.",
        "code": "@dataclass\nclass Message:\n    role: str",
        "check": "test(\"Define a message with a role\", lambda: Message(\"user\").role == \"user\", \"Message(\\\"user\\\") stores \\\"user\\\" as its role.\")",
        "expected": "Message(\"user\") stores \"user\" as its role.",
        "reassurance": ""
      },
      {
        "title": "Add the content field",
        "instruction": "Redefine `Message` with a second string field `content` after `role`. Instances should accept positional or named fields and compare equal when both values match.",
        "code": "@dataclass\nclass Message:\n    role: str\n    content: str",
        "check": "test(\"Add the content field\", lambda: Message(\"user\", \"hello\") == Message(role=\"user\", content=\"hello\"), \"A Message stores its role and content and compares by those values.\")",
        "expected": "A Message stores its role and content and compares by those values.",
        "reassurance": "The generated __eq__ compares field values, so two separate objects with the same data are equal.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Give each conversation a fresh list",
        "instruction": "Define a dataclass named `Conversation` with a `messages` list field. Each new conversation must begin with its own empty list; conversations must never share the same default list.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)",
        "check": "test(\"Give each conversation a fresh list\", lambda: Conversation().messages == [] and Conversation().messages is not Conversation().messages, \"Two new conversations have separate empty lists.\")",
        "expected": "Two new conversations have separate empty lists.",
        "reassurance": "A plain [] default would be created once and shared by every instance; default_factory builds a new list per object."
      },
      {
        "title": "Add the add method",
        "instruction": "Redefine `Conversation`, keeping its `messages` field, and add a method `add(self, role, content)` that appends a new `Message` to that conversation’s list and returns nothing.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)\n    def add(self, role: str, content: str) -> None:\n        self.messages.append(Message(role, content))",
        "check": "_probe = Conversation()\n_probe.add(\"user\", \"hello\")\ntest(\"Add the add method\", lambda: Conversation().add(\"user\", \"hello\") is None and _probe.messages == [Message(\"user\", \"hello\")], \"add(\\\"user\\\", \\\"hello\\\") stores Message(\\\"user\\\", \\\"hello\\\") and returns None.\")",
        "expected": "add(\"user\", \"hello\") stores Message(\"user\", \"hello\") and returns None.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Count one message’s words",
        "instruction": "Create `sample`, a list holding `Message(\"user\", \"hello big world\")` and `Message(\"assistant\", \"hi\")`. Then create `first_words`, the number of whitespace-separated words in the first message’s content. Splitting a string with no argument breaks it on any run of whitespace.",
        "code": "sample = [Message(\"user\", \"hello big world\"), Message(\"assistant\", \"hi\")]\nfirst_words = len(sample[0].content.split())",
        "check": "test(\"Count one message’s words\", lambda: first_words == 3 and len(sample) == 2, \"first_words is 3.\")",
        "expected": "first_words is 3.",
        "reassurance": ""
      },
      {
        "title": "Total the words",
        "instruction": "Create `total_words`, the word count of every message in `sample` added together. Add up one word count per message in a single expression.",
        "code": "total_words = sum(len(m.content.split()) for m in sample)",
        "check": "test(\"Total the words\", lambda: total_words == 4, \"total_words is 4.\")",
        "expected": "total_words is 4.",
        "reassurance": ""
      },
      {
        "title": "Count words with a property",
        "instruction": "Redefine `Conversation` with its field and `add` method, plus a read-only `word_count` property that totals the words across `self.messages` the same way. An empty conversation has 0 words.",
        "code": "@dataclass\nclass Conversation:\n    messages: list = field(default_factory=list)\n    def add(self, role: str, content: str) -> None:\n        self.messages.append(Message(role, content))\n    @property\n    def word_count(self) -> int:\n        return sum(len(m.content.split()) for m in self.messages)",
        "check": "test(\"Count words with a property\", lambda: Conversation(sample).word_count == 4 and Conversation().word_count == 0, \"Conversation(sample).word_count is 4; an empty conversation has 0.\")",
        "expected": "Conversation(sample).word_count is 4; an empty conversation has 0.",
        "reassurance": "A property is read like an attribute (no parentheses) but is recomputed on every access, so it never goes stale.",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Start a chat",
        "instruction": "Create a `Conversation` named `chat` and add a user message with content `hello big world`.",
        "code": "chat = Conversation()\nchat.add(\"user\", \"hello big world\")",
        "check": "test(\"Start a chat\", lambda: chat.messages == [Message(\"user\", \"hello big world\")], \"chat holds one user message.\")",
        "expected": "chat holds one user message.",
        "reassurance": ""
      },
      {
        "title": "Reply and count",
        "instruction": "Add an assistant message with content `hi` to `chat`, then print its `word_count`. Then run Check.",
        "code": "chat.add(\"assistant\", \"hi\")\nprint(chat.word_count)",
        "check": "",
        "expected": "The printed word count is 4.",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Restrict the sentiment",
        "instruction": "Define `Review` as a Pydantic model with `sentiment` and `score` fields. Permit only `positive`, `neutral` or `negative` for sentiment; require an integer score while allowing numeric strings to be converted.",
        "code": "class Review(BaseModel):\n    sentiment: Literal[\"positive\", \"neutral\", \"negative\"]\n    score: int",
        "check": "try:\n    Review(sentiment=\"meh\", score=3)\n    bad_sentiment_rejected = False\nexcept ValidationError:\n    bad_sentiment_rejected = True\ntest(\"sentiment vocabulary is enforced\", lambda: bad_sentiment_rejected and Review(sentiment=\"neutral\", score=\"4\").score == 4, \"Literal must permit only positive, neutral and negative\")",
        "expected": "A neutral review with score \"4\" becomes an integer score of 4.",
        "reassurance": "Pydantic coerces safe conversions such as \"4\" to 4 but still rejects values outside a Literal."
      },
      {
        "title": "Bound the score",
        "instruction": "Update `Review` so its integer `score` must be between 1 and 5, inclusive. Retain the three permitted sentiments and numeric-string conversion.",
        "code": "class Review(BaseModel):\n    sentiment: Literal[\"positive\", \"neutral\", \"negative\"]\n    score: int = Field(ge=1, le=5)",
        "check": "test('Bound the score', lambda: Review(sentiment=\"positive\", score=5).score == 5 and Review(sentiment=\"negative\", score=1).score == 1, 'Both valid boundary scores, 1 and 5, are accepted.')",
        "expected": "Both valid boundary scores, 1 and 5, are accepted.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Unpack a well-formed reply",
        "instruction": "Create a dictionary `data` with sentiment `neutral` and score `\"4\"`. Build `review` by unpacking `data` into `Review` as keyword arguments, then print `accepted` followed by `review`.",
        "code": "data = {\"sentiment\": \"neutral\", \"score\": \"4\"}\nreview = Review(**data)\nprint(\"accepted\", review)",
        "check": "test(\"Unpack a well-formed reply\", lambda: review.score == 4 and \"accepted\" in __stdout__, \"The output shows accepted with score=4.\")",
        "expected": "The output shows accepted with score=4.",
        "reassurance": "Two stars unpack a dictionary into keyword arguments, so each key becomes a field name."
      },
      {
        "title": "Switch to the model’s reply",
        "instruction": "Point `data` at the supplied `raw` reply so the same validation line can run on it.",
        "code": "data = raw",
        "check": "test(\"Switch to the model’s reply\", lambda: data[\"sentiment\"] == \"meh\", \"data is now the raw reply with sentiment meh.\")",
        "expected": "data is now the raw reply with sentiment meh.",
        "reassurance": ""
      },
      {
        "title": "Handle the malformed reply",
        "instruction": "Wrap your two validation lines in a try block. If `Review` raises `ValidationError`, print `rejected` instead. Then run Check.",
        "code": "try:\n    review = Review(**data)\n    print(\"accepted\", review)\nexcept ValidationError:\n    print(\"rejected\")",
        "check": "",
        "expected": "The demo prints rejected for sentiment meh and score 9.",
        "reassurance": "",
        "startFrom": [
          3
        ]
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
        "reassurance": ""
      },
      {
        "title": "Define the tiny adapter",
        "instruction": "Implement `batches(items, size=3)`, with parameters in that order and a default batch size of three. Return a lazy iterator of ordered tuples, using the standard batching tool. Keep a shorter final batch, handle empty input and reject non-positive sizes. Do not consume the source eagerly.",
        "code": "def batches(items, size=3):\n    return batched(items, size)",
        "check": "test('Define the tiny adapter', lambda: list(batches(range(8), 3)) == [(0, 1, 2), (3, 4, 5), (6, 7)] and list(batches([], 2)) == [], 'Eight items form three ordered tuples; an empty source yields none.')",
        "expected": "Eight items form three ordered tuples; an empty source yields none.",
        "reassurance": ""
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
        "reassurance": ""
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
        "reassurance": ""
      }
    ]
  },
  "py-embed-cache": {
    "setup": "calls = []\ndef fake_embed_batch(texts):\n    calls.append(list(texts))\n    return [[float(len(t)), float(t.count(\" \"))] for t in texts]",
    "steps": [
      {
        "title": "Store the embedding function",
        "instruction": "Define a class `EmbeddingCache` whose initializer takes `self` and `embed_batch` and stores the callable on the instance as `embed_batch`.",
        "code": "class EmbeddingCache:\n    def __init__(self, embed_batch):\n        self.embed_batch = embed_batch",
        "check": "test(\"Store the embedding function\", lambda: EmbeddingCache(fake_embed_batch).embed_batch is fake_embed_batch, \"A new cache keeps the function it was given.\")",
        "expected": "A new cache keeps the function it was given.",
        "reassurance": ""
      },
      {
        "title": "Give each cache its own state",
        "instruction": "Redefine `EmbeddingCache` so the initializer also creates a fresh empty dictionary `store` and sets `hits` and `misses` to zero.",
        "code": "class EmbeddingCache:\n    def __init__(self, embed_batch):\n        self.embed_batch = embed_batch\n        self.store = {}\n        self.hits = 0\n        self.misses = 0",
        "check": "test(\"Give each cache its own state\", lambda: EmbeddingCache(fake_embed_batch).store == {} and EmbeddingCache(fake_embed_batch).store is not EmbeddingCache(fake_embed_batch).store and (EmbeddingCache(fake_embed_batch).hits, EmbeddingCache(fake_embed_batch).misses) == (0, 0), \"Every cache starts with its own empty dictionary and zero counters.\")",
        "expected": "Every cache starts with its own empty dictionary and zero counters.",
        "reassurance": "Creating the dictionary inside __init__ gives every instance its own; a class-level {} would be shared.",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Find first-seen misses",
        "instruction": "Implement `unseen_texts(texts, store)`, with parameters in that order. Return each uncached text once, in order of first appearance. Exclude keys already in `store` and do not mutate either input.",
        "code": "def unseen_texts(texts, store):\n    return [text for text in dict.fromkeys(texts) if text not in store]",
        "check": "test('Find first-seen misses', lambda: unseen_texts([\"alpha\", \"beta\", \"alpha\", \"gamma\"], {\"beta\": [4]}) == [\"alpha\", \"gamma\"], 'The misses are [\"alpha\", \"gamma\"], with the repeat and cached beta excluded.')",
        "expected": "The misses are [\"alpha\", \"gamma\"], with the repeat and cached beta excluded.",
        "reassurance": "dict.fromkeys keeps the first occurrence of each key in order, so it deduplicates without reordering."
      },
      {
        "title": "Materialize a one-shot request",
        "instruction": "Create `texts` as a generator over `\"red fox\"`, `\"owl\"`, `\"red fox\"`, then replace it with a list of its items so it can be read more than once.",
        "code": "texts = (text for text in [\"red fox\", \"owl\", \"red fox\"])\ntexts = list(texts)",
        "check": "test(\"Materialize a one-shot request\", lambda: texts == [\"red fox\", \"owl\", \"red fox\"], \"texts is the list [\\\"red fox\\\", \\\"owl\\\", \\\"red fox\\\"].\")",
        "expected": "texts is the list [\"red fox\", \"owl\", \"red fox\"].",
        "reassurance": "A generator can be iterated only once; materializing it first lets you scan it for misses and again for the result."
      },
      {
        "title": "Find this request’s misses",
        "instruction": "Create `cache`, an `EmbeddingCache` using `fake_embed_batch`, and `unseen`, the misses of `texts` against its store found with `unseen_texts`.",
        "code": "cache = EmbeddingCache(fake_embed_batch)\nunseen = unseen_texts(texts, cache.store)",
        "check": "test(\"Find this request’s misses\", lambda: unseen == [\"red fox\", \"owl\"], \"unseen is [\\\"red fox\\\", \\\"owl\\\"].\")",
        "expected": "unseen is [\"red fox\", \"owl\"].",
        "reassurance": ""
      },
      {
        "title": "Fetch and store the misses",
        "instruction": "Create `vectors` by passing `unseen` to the cache’s `embed_batch` in one call. Then add each text with its vector to `cache.store`: pair the two lists element by element and update the dictionary with the pairs.",
        "code": "vectors = cache.embed_batch(unseen)\ncache.store.update(zip(unseen, vectors))",
        "check": "test(\"Fetch and store the misses\", lambda: cache.store == {\"red fox\": [7.0, 1.0], \"owl\": [3.0, 0.0]}, \"cache.store maps \\\"red fox\\\" to [7.0, 1.0] and \\\"owl\\\" to [3.0, 0.0].\")",
        "expected": "cache.store maps \"red fox\" to [7.0, 1.0] and \"owl\" to [3.0, 0.0].",
        "reassurance": ""
      },
      {
        "title": "Wrap the fill in a function",
        "instruction": "Define `fill_misses(cache, unseen)` that runs those two lines for the cache and miss list it receives.",
        "code": "def fill_misses(cache, unseen):\n    vectors = cache.embed_batch(unseen)\n    cache.store.update(zip(unseen, vectors))",
        "check": "_probe = EmbeddingCache(lambda texts: [[len(text)] for text in texts])\nfill_misses(_probe, [\"a\", \"bb\"])\ntest(\"Wrap the fill in a function\", lambda: _probe.store == {\"a\": [1], \"bb\": [2]}, \"fill_misses fills a new cache with {\\\"a\\\": [1], \\\"bb\\\": [2]}.\")",
        "expected": "fill_misses fills a new cache with {\"a\": [1], \"bb\": [2]}.",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Skip empty requests",
        "instruction": "Update `fill_misses` so it calls the API only when `unseen` is nonempty.",
        "code": "def fill_misses(cache, unseen):\n    if unseen:\n        vectors = cache.embed_batch(unseen)\n        cache.store.update(zip(unseen, vectors))",
        "check": "def _boom(texts):\n    raise AssertionError(\"the API was called\")\n_probe = EmbeddingCache(lambda texts: [[len(text)] for text in texts])\nfill_misses(_probe, [\"abc\"])\ntest(\"Skip empty requests\", lambda: fill_misses(EmbeddingCache(_boom), []) is None and _probe.store == {\"abc\": [3]}, \"An empty miss list makes no API call; a nonempty one still fills the store.\")",
        "expected": "An empty miss list makes no API call; a nonempty one still fills the store.",
        "reassurance": "",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Reject a short reply",
        "instruction": "Update `fill_misses` once more: after fetching, if the number of vectors differs from the number of texts, raise `ValueError` before touching `cache.store`.",
        "code": "def fill_misses(cache, unseen):\n    if unseen:\n        vectors = cache.embed_batch(unseen)\n        if len(vectors) != len(unseen):\n            raise ValueError(f\"expected {len(unseen)} vectors, got {len(vectors)}\")\n        cache.store.update(zip(unseen, vectors))",
        "check": "_broken = EmbeddingCache(lambda texts: [[0]])\ntry:\n    fill_misses(_broken, [\"a\", \"b\"])\n    _rejected = False\nexcept ValueError:\n    _rejected = True\ntest(\"Reject a short reply\", lambda: _rejected and _broken.store == {}, \"A short reply raises ValueError and leaves the store empty.\")",
        "expected": "A short reply raises ValueError and leaves the store empty.",
        "reassurance": "Validating before writing means a bad reply can never leave the cache half updated.",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Fill and count on a fresh cache",
        "instruction": "Recreate `cache` with `fake_embed_batch` and fill it with `fill_misses` for `unseen`. Then increase `cache.misses` by the number of unique new texts and `cache.hits` by every other text in `texts`.",
        "code": "cache = EmbeddingCache(fake_embed_batch)\nfill_misses(cache, unseen)\ncache.misses += len(unseen)\ncache.hits += len(texts) - len(unseen)",
        "check": "test(\"Fill and count on a fresh cache\", lambda: len(cache.store) == 2 and (cache.hits, cache.misses) == (1, 2), \"The fresh cache holds 2 vectors, with 1 hit and 2 misses.\")",
        "expected": "The fresh cache holds 2 vectors, with 1 hit and 2 misses.",
        "reassurance": ""
      },
      {
        "title": "Wrap the request in a function",
        "instruction": "Define `embed(cache, texts)` that repeats your steps on its inputs: materialize `texts`, find the misses, fill them, update both counters, and return the stored vector for every text in the original order, repeats included.",
        "code": "def embed(cache, texts):\n    texts = list(texts)\n    unseen = unseen_texts(texts, cache.store)\n    fill_misses(cache, unseen)\n    cache.misses += len(unseen)\n    cache.hits += len(texts) - len(unseen)\n    return [cache.store[text] for text in texts]",
        "check": "_calls = []\ndef _api(texts):\n    _calls.append(list(texts))\n    return [[len(text)] for text in texts]\n_probe = EmbeddingCache(_api)\n_result = embed(_probe, (text for text in [\"a\", \"bb\", \"a\"]))\ntest(\"Wrap the request in a function\", lambda: _result == [[1], [2], [1]] and _calls == [[\"a\", \"bb\"]] and (_probe.hits, _probe.misses) == (1, 2), \"embed returns [[1], [2], [1]] with one API call for a and bb, 1 hit and 2 misses.\")",
        "expected": "embed returns [[1], [2], [1]] with one API call for a and bb, 1 hit and 2 misses.",
        "reassurance": "",
        "startFrom": [
          9
        ]
      },
      {
        "title": "Attach the checked method",
        "instruction": "Attach `embed` to `EmbeddingCache` as its `embed` method; the instance is then passed in as the first argument, `cache`. Then run Check.",
        "code": "EmbeddingCache.embed = embed",
        "check": "",
        "expected": "The full check includes cached repeats, one-shot inputs, empty requests, bad-length replies, API errors and independent caches.",
        "reassurance": "Any function stored on a class becomes a method; the first parameter is conventionally named self, but cache works the same."
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
        "reassurance": ""
      },
      {
        "title": "Restrict the label",
        "instruction": "Define a Pydantic model `Prediction` with a `label` field that accepts only `spam` or `ham`.",
        "code": "class Prediction(BaseModel):\n    label: Literal[\"spam\", \"ham\"]",
        "check": "def _rejects(**fields):\n    try:\n        Prediction(**fields)\n    except ValidationError:\n        return True\n    return False\ntest(\"Restrict the label\", lambda: Prediction(label=\"ham\").label == \"ham\" and _rejects(label=\"eggs\"), \"label ham is accepted and eggs is rejected.\")",
        "expected": "label ham is accepted and eggs is rejected.",
        "reassurance": ""
      },
      {
        "title": "Bound the confidence strictly",
        "instruction": "Redefine `Prediction` with a `confidence` float between 0 and 1 inclusive. Make the field strict, so numeric strings and booleans are rejected instead of converted.",
        "code": "class Prediction(BaseModel):\n    label: Literal[\"spam\", \"ham\"]\n    confidence: float = Field(ge=0, le=1, strict=True)",
        "check": "def _rejects(**fields):\n    try:\n        Prediction(**fields)\n    except ValidationError:\n        return True\n    return False\ntest(\"Bound the confidence strictly\", lambda: Prediction.model_validate_json(replies[0]).confidence == 0.9 and _rejects(label=\"ham\", confidence=\"0.8\") and _rejects(label=\"ham\", confidence=1.2), \"The first reply gives confidence 0.9; \\\"0.8\\\" and 1.2 are rejected.\")",
        "expected": "The first reply gives confidence 0.9; \"0.8\" and 1.2 are rejected.",
        "reassurance": "strict=True turns off Pydantic’s usual coercion for this field, which matters when a model might return \"0.8\" or true.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Forbid extra fields",
        "instruction": "Redefine `Prediction` so any field other than `label` and `confidence` is rejected, using the model’s configuration.",
        "code": "class Prediction(BaseModel):\n    model_config = {\"extra\": \"forbid\"}\n    label: Literal[\"spam\", \"ham\"]\n    confidence: float = Field(ge=0, le=1, strict=True)",
        "check": "def _rejects(**fields):\n    try:\n        Prediction(**fields)\n    except ValidationError:\n        return True\n    return False\ntest(\"Forbid extra fields\", lambda: _rejects(label=\"ham\", confidence=0.5, secret=\"x\") and Prediction.model_validate_json(replies[0]).label == \"ham\", \"An extra field is rejected; the first reply still validates.\")",
        "expected": "An extra field is rejected; the first reply still validates.",
        "reassurance": "",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Keep each reply’s original position",
        "instruction": "Create `indexed` as a list pairing each entry in `replies` with its original zero-based index. Preserve the payloads and their order.",
        "code": "indexed = list(enumerate(replies))",
        "check": "test('Keep each reply’s original position', lambda: indexed[1] == (1, \"not json\") and len(indexed) == 3, 'The malformed payload retains index 1.')",
        "expected": "The malformed payload retains index 1.",
        "reassurance": ""
      },
      {
        "title": "Accept the first reply",
        "instruction": "Create two empty lists, `accepted` and `rejected`. Unpack `indexed[0]` into `index` and `text`, validate `text` as JSON with `Prediction`, and append the result to `accepted`.",
        "code": "accepted, rejected = [], []\nindex, text = indexed[0]\naccepted.append(Prediction.model_validate_json(text))",
        "check": "test(\"Accept the first reply\", lambda: len(accepted) == 1 and accepted[0].label == \"ham\" and rejected == [], \"accepted holds one ham Prediction; rejected is empty.\")",
        "expected": "accepted holds one ham Prediction; rejected is empty.",
        "reassurance": ""
      },
      {
        "title": "Record a rejection",
        "instruction": "Unpack `indexed[1]`, the malformed reply, into `index` and `text`, and append its `index` to `rejected`.",
        "code": "index, text = indexed[1]\nrejected.append(index)",
        "check": "test(\"Record a rejection\", lambda: rejected == [1], \"rejected is [1].\")",
        "expected": "rejected is [1].",
        "reassurance": ""
      },
      {
        "title": "Validate every reply in a loop",
        "instruction": "Reset both lists, then loop over `indexed` with `index` and `text`. Try your accepting line for each; when it raises `ValidationError`, run your rejecting line instead and continue.",
        "code": "accepted, rejected = [], []\nfor index, text in indexed:\n    try:\n        accepted.append(Prediction.model_validate_json(text))\n    except ValidationError:\n        rejected.append(index)",
        "check": "test(\"Validate every reply in a loop\", lambda: len(accepted) == 2 and rejected == [1], \"Two Prediction objects are accepted and rejected is [1].\")",
        "expected": "Two Prediction objects are accepted and rejected is [1].",
        "reassurance": "Catching inside the loop keeps one bad reply from discarding its valid neighbours.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Wrap the loop in a function",
        "instruction": "Define `validate_predictions(payloads)` that runs the same loop over any iterable of JSON strings, numbering them as it goes, and returns `accepted` and `rejected` in that order.",
        "code": "def validate_predictions(payloads):\n    accepted, rejected = [], []\n    for index, text in enumerate(payloads):\n        try:\n            accepted.append(Prediction.model_validate_json(text))\n        except ValidationError:\n            rejected.append(index)\n    return accepted, rejected",
        "check": "test(\"Wrap the loop in a function\", lambda: len(validate_predictions(iter(replies))[0]) == 2 and validate_predictions(iter(replies))[1] == [1], \"Two Prediction objects are accepted and the rejected indices are [1].\")",
        "expected": "Two Prediction objects are accepted and the rejected indices are [1].",
        "reassurance": "",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Inspect accepted and rejected results",
        "instruction": "Use `validate_predictions` on `replies` and print both the accepted predictions and rejected indices. Then run Check.",
        "code": "print(validate_predictions(replies))",
        "check": "",
        "expected": "Two typed predictions are shown alongside rejected index [1].",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Respect the server’s suggested wait",
        "instruction": "Implement `retry_delay(error, attempt, base_delay, max_delay)`, with parameters in that order. If `error` has a non-None `retry_after` attribute, return it exactly, including zero. Otherwise compute exponential backoff from the zero-based attempt, starting at `base_delay` and capped by `max_delay`.",
        "code": "def retry_delay(error, attempt, base_delay, max_delay):\n    suggested = getattr(error, \"retry_after\", None)\n    return suggested if suggested is not None else min(max_delay, base_delay * 2 ** attempt)",
        "check": "test('Respect the server’s suggested wait', lambda: retry_delay(RateLimitError(retry_after=3), 0, 0.5, 8) == 3 and retry_delay(RateLimitError(retry_after=0), 2, 0.5, 8) == 0 and retry_delay(TimeoutError(), 1, 0.5, 8) == 1, 'Suggested waits 3 and 0 are honored exactly; a second unsuggested failure waits 1 second.')",
        "expected": "Suggested waits 3 and 0 are honored exactly; a second unsuggested failure waits 1 second.",
        "reassurance": "Honouring a server’s Retry-After, even 0, is politer and usually faster than guessing."
      },
      {
        "title": "Pass the arguments through",
        "instruction": "Define `retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay)`, with parameters in that order. For now it just calls `fn`, unpacking the tuple `args` and the dictionary `kwargs`, and returns the result.",
        "code": "def retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay):\n    return fn(*args, **kwargs)",
        "check": "test(\"Pass the arguments through\", lambda: retry_call(lambda *a, **k: (a, k), (1,), {\"x\": 2}, 1, (), None, None) == ((1,), {\"x\": 2}), \"Positional and keyword arguments reach fn unchanged.\")",
        "expected": "Positional and keyword arguments reach fn unchanged.",
        "reassurance": ""
      },
      {
        "title": "Catch only retryable errors",
        "instruction": "Wrap the call in a try block that catches only the exception types in `retry_on` and, for now, re-raises them unchanged.",
        "code": "def retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay):\n    try:\n        return fn(*args, **kwargs)\n    except retry_on:\n        raise",
        "check": "_err = TimeoutError(\"slow\")\ntry:\n    retry_call(scripted(_err), (), {}, 1, (TimeoutError,), None, None)\n    _caught = None\nexcept TimeoutError as e:\n    _caught = e\ntest(\"Catch only retryable errors\", lambda: _caught is _err and retry_call(scripted(\"ok\"), (), {}, 1, (TimeoutError,), None, None) == \"ok\", \"A success is returned; a caught timeout is re-raised as the same object.\")",
        "expected": "A success is returned; a caught timeout is re-raised as the same object.",
        "reassurance": "An except clause accepts a tuple of exception classes, so retry_on can name several transient errors.",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Retry up to the limit",
        "instruction": "Put the try block in a loop over zero-based attempt numbers, at most `attempts` times. Re-raise only on the last attempt; on earlier failures, let the loop try again.",
        "code": "def retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay):\n    for attempt in range(attempts):\n        try:\n            return fn(*args, **kwargs)\n        except retry_on:\n            if attempt == attempts - 1: raise",
        "check": "try:\n    retry_call(scripted(TimeoutError(), TimeoutError(), \"ok\"), (), {}, 2, (TimeoutError,), None, None)\n    _gave_up = False\nexcept TimeoutError:\n    _gave_up = True\ntest(\"Retry up to the limit\", lambda: retry_call(scripted(TimeoutError(), TimeoutError(), \"ok\"), (), {}, 3, (TimeoutError,), None, None) == \"ok\" and _gave_up, \"Two timeouts then ok returns ok; two timeouts with attempts=2 re-raise.\")",
        "expected": "Two timeouts then ok returns ok; two timeouts with attempts=2 re-raise.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Wait between attempts",
        "instruction": "Name the caught error `error`. After a non-final failure, get the wait from `delay(error, attempt)` and pass it to `sleep`.",
        "code": "def retry_call(fn, args, kwargs, attempts, retry_on, sleep, delay):\n    for attempt in range(attempts):\n        try:\n            return fn(*args, **kwargs)\n        except retry_on as error:\n            if attempt == attempts - 1: raise\n            sleep(delay(error, attempt))",
        "check": "_waits = []\n_result = retry_call(scripted(RateLimitError(), TimeoutError(), \"ok\"), (), {}, 3, (RateLimitError, TimeoutError), _waits.append, lambda error, attempt: 0.5 * 2 ** attempt)\n_last = TimeoutError(\"last\")\n_final_waits = []\ntry:\n    retry_call(scripted(_last), (), {}, 1, (TimeoutError,), _final_waits.append, lambda error, attempt: 1)\n    _caught = None\nexcept TimeoutError as error:\n    _caught = error\ntest(\"Wait between attempts\", lambda: _result == \"ok\" and _waits == [0.5, 1.0] and _caught is _last and _final_waits == [], \"Two transient failures then success cause two waits; the last allowed failure causes no extra wait.\")",
        "expected": "Two transient failures then success cause two waits; the last allowed failure causes no extra wait.",
        "reassurance": "The boundary check comes before the sleep, so the loop never waits after giving up.",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Choose the settings",
        "instruction": "Create the default settings as variables: `attempts` 4, `base_delay` 0.5, `max_delay` 8.0, `retry_on` the pair `RateLimitError` and `TimeoutError`, and `sleep` the standard library’s `time.sleep`.",
        "code": "attempts, base_delay, max_delay = 4, 0.5, 8.0\nretry_on, sleep = (RateLimitError, TimeoutError), time.sleep",
        "check": "test(\"Choose the settings\", lambda: (attempts, base_delay, max_delay) == (4, 0.5, 8.0) and retry_on == (RateLimitError, TimeoutError) and sleep is time.sleep, \"The five settings hold their default values.\")",
        "expected": "The five settings hold their default values.",
        "reassurance": ""
      },
      {
        "title": "Wrap one function by hand",
        "instruction": "Create `fn` with `scripted(RateLimitError(retry_after=0), \"ok\")`. Define `wrapper(*args, **kwargs)` that returns `retry_call` on `fn` with those arguments and settings, using a small lambda of `error` and `attempt` that calls `retry_delay` with `base_delay` and `max_delay` as the delay.",
        "code": "fn = scripted(RateLimitError(retry_after=0), \"ok\")\ndef wrapper(*args, **kwargs):\n    return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))",
        "check": "test(\"Wrap one function by hand\", lambda: wrapper() == \"ok\", \"wrapper() retries the rate limit and returns ok.\")",
        "expected": "wrapper() retries the rate limit and returns ok.",
        "reassurance": ""
      },
      {
        "title": "Make it a decorator",
        "instruction": "Move `wrapper` inside `decorate(fn)`, which returns the wrapper it builds for the `fn` it receives.",
        "code": "def decorate(fn):\n    def wrapper(*args, **kwargs):\n        return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))\n    return wrapper",
        "check": "test(\"Make it a decorator\", lambda: decorate(scripted(RateLimitError(retry_after=0), \"ok\"))() == \"ok\", \"decorate(fn)() retries and returns ok.\")",
        "expected": "decorate(fn)() retries and returns ok.",
        "reassurance": "The wrapper closes over fn, so each decorated function gets its own wrapper.",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Turn the settings into parameters",
        "instruction": "Define the factory `retry` with parameters `attempts`, `base_delay`, `max_delay`, `retry_on`, `sleep` and the same defaults as your variables. It contains `decorate` and returns it.",
        "code": "def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):\n    def decorate(fn):\n        def wrapper(*args, **kwargs):\n            return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))\n        return wrapper\n    return decorate",
        "check": "test(\"Turn the settings into parameters\", lambda: retry(sleep=lambda delay: None)(scripted(TimeoutError(), \"ok\"))() == \"ok\", \"A wrapped function retries a timeout and returns ok.\")",
        "expected": "A wrapped function retries a timeout and returns ok.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Keep the function’s name",
        "instruction": "Update `retry` so the wrapper copies the wrapped function’s name and docstring, using the `functools` decorator for that.",
        "code": "def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):\n    def decorate(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))\n        return wrapper\n    return decorate",
        "check": "def _named():\n    \"\"\"Doc.\"\"\"\ntest(\"Keep the function’s name\", lambda: retry()(_named).__name__ == \"_named\" and retry()(_named).__doc__ == \"Doc.\", \"A decorated function keeps its __name__ and __doc__.\")",
        "expected": "A decorated function keeps its __name__ and __doc__.",
        "reassurance": "",
        "startFrom": [
          9
        ]
      },
      {
        "title": "Reject bad settings",
        "instruction": "Update `retry` so it raises `ValueError` as soon as it is called with `attempts` below 1 or a negative `base_delay`.",
        "code": "def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):\n    if attempts < 1 or base_delay < 0: raise ValueError(\"attempts must be >= 1 and base_delay >= 0\")\n    def decorate(fn):\n        @functools.wraps(fn)\n        def wrapper(*args, **kwargs):\n            return retry_call(fn, args, kwargs, attempts, retry_on, sleep, lambda error, attempt: retry_delay(error, attempt, base_delay, max_delay))\n        return wrapper\n    return decorate",
        "check": "def _rejects(**kwargs):\n    try:\n        retry(**kwargs)\n    except ValueError:\n        return True\n    return False\ntest(\"Reject bad settings\", lambda: _rejects(attempts=0) and _rejects(base_delay=-1), \"attempts=0 and base_delay=-1 both raise ValueError.\")",
        "expected": "attempts=0 and base_delay=-1 both raise ValueError.",
        "reassurance": "",
        "startFrom": [
          10
        ]
      },
      {
        "title": "Wrap the demo call",
        "instruction": "Replace the demo `ask` with its decorated version using `retry` and the wait recorder `waits.append` for sleeping. Ask `Capital of France?` and print its result alongside `waits`. Then run Check.",
        "code": "ask = retry(sleep=waits.append)(ask)\nprint(ask(\"Capital of France?\"), waits)",
        "check": "",
        "expected": "The output is Paris [0.5, 1.0].",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Await one call inside the limiter",
        "instruction": "Define async `fetch_one(prompt, call_llm, sem, retries)`, with parameters in that order. Hold a slot of `sem` while awaiting `call_llm(prompt)` and return its result. `retries` is unused for now.",
        "code": "async def fetch_one(prompt, call_llm, sem, retries):\n    async with sem:\n        return await call_llm(prompt)",
        "check": "_result = await fetch_one(\"a\", fake_llm, sem, 1)\ntest(\"Await one call inside the limiter\", lambda: _result == \"A\", \"fetch_one(\\\"a\\\", fake_llm, sem, 1) returns A.\")",
        "expected": "fetch_one(\"a\", fake_llm, sem, 1) returns A.",
        "reassurance": "async with acquires the semaphore and releases it even if the call raises."
      },
      {
        "title": "Catch timeouts",
        "instruction": "Wrap the awaited call in a try block that catches only `TimeoutError` and, for now, re-raises it.",
        "code": "async def fetch_one(prompt, call_llm, sem, retries):\n    async with sem:\n        try:\n            return await call_llm(prompt)\n        except TimeoutError:\n            raise",
        "check": "async def _slow(prompt):\n    raise TimeoutError(\"slow\")\ntry:\n    await fetch_one(\"x\", _slow, sem, 3)\n    _timed_out = False\nexcept TimeoutError:\n    _timed_out = True\n_ok = await fetch_one(\"a\", fake_llm, sem, 1)\ntest(\"Catch timeouts\", lambda: _timed_out and _ok == \"A\", \"A success returns A; a timeout propagates.\")",
        "expected": "A success returns A; a timeout propagates.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Retry up to the limit",
        "instruction": "Put the try block in a loop over zero-based attempt numbers, at most `retries` times, all inside the semaphore. Re-raise only on the last attempt.",
        "code": "async def fetch_one(prompt, call_llm, sem, retries):\n    async with sem:\n        for attempt in range(retries):\n            try:\n                return await call_llm(prompt)\n            except TimeoutError:\n                if attempt == retries - 1: raise",
        "check": "_tries = []\nasync def _flaky(prompt):\n    _tries.append(prompt)\n    if len(_tries) < 3:\n        raise TimeoutError(\"slow\")\n    return prompt + \"!\"\n_retried = await fetch_one(\"x\", _flaky, sem, 3)\ntest(\"Retry up to the limit\", lambda: _retried == \"x!\" and _tries == [\"x\", \"x\", \"x\"], \"A source that times out twice succeeds on its third attempt.\")",
        "expected": "A source that times out twice succeeds on its third attempt.",
        "reassurance": "",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Fan out with gather",
        "instruction": "Define async `fetch_all(prompts, call_llm, limit=3, retries=3)`. Create a semaphore with `limit` slots, then run `fetch_one` for every prompt concurrently and return the results in input order. Gathering awaitables does both.",
        "code": "async def fetch_all(prompts, call_llm, limit=3, retries=3):\n    sem = asyncio.Semaphore(limit)\n    return await asyncio.gather(*(fetch_one(p, call_llm, sem, retries) for p in prompts))",
        "check": "_out = await fetch_all([\"a\", \"b\", \"c\"], fake_llm)\ntest(\"Fan out with gather\", lambda: list(_out) == [\"A\", \"B\", \"C\"], \"fetch_all([\\\"a\\\", \\\"b\\\", \\\"c\\\"], fake_llm) returns [\\\"A\\\", \\\"B\\\", \\\"C\\\"].\")",
        "expected": "fetch_all([\"a\", \"b\", \"c\"], fake_llm) returns [\"A\", \"B\", \"C\"].",
        "reassurance": "gather returns results in the order the awaitables were passed, not the order they finish."
      },
      {
        "title": "Reject bad settings",
        "instruction": "Update `fetch_all` so a `limit` or `retries` below 1 raises `ValueError` before any work starts. Then run Check.",
        "code": "async def fetch_all(prompts, call_llm, limit=3, retries=3):\n    if limit < 1 or retries < 1: raise ValueError(\"limit and retries must be positive\")\n    sem = asyncio.Semaphore(limit)\n    return await asyncio.gather(*(fetch_one(p, call_llm, sem, retries) for p in prompts))",
        "check": "",
        "expected": "The complete check verifies input order, concurrent execution at the limit, exact retry counts, empty input and rejected invalid settings.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      }
    ]
  }
}
