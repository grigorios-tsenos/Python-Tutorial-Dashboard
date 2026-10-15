import type { CodingGuide } from '../guided'

export const RAG_GUIDES: Record<string, CodingGuide> = {
  "rag-chunking": {
    "setup": "import re\n\nHANDBOOK = (\n    \"Refunds are issued to the original payment method within 14 days. \"\n    \"Returned items must be unused and in their original packaging. \"\n    \"Sale items cannot be returned! Shipping costs are not refunded. \"\n    \"Need help? Contact support from your account page.\"\n)",
    "steps": [
      {
        "title": "Split into sentences",
        "instruction": "Define `split_sentences(text)`: split the text on the whitespace that follows `.`, `!` or `?` (the lookbehind pattern `(?<=[.!?])\\s+` matches exactly that whitespace), strip each piece, and drop empty pieces.",
        "code": "def split_sentences(text):\n    return [s.strip() for s in re.split(r\"(?<=[.!?])\\s+\", text) if s.strip()]",
        "check": "test(\"Split into sentences\", lambda: len(split_sentences(HANDBOOK)) == 6 and split_sentences(HANDBOOK)[2] == \"Sale items cannot be returned!\" and split_sentences(\"   \") == [], \"Six sentences, each keeping its final punctuation; blank text gives an empty list.\")",
        "expected": "Six sentences, each keeping its final punctuation; blank text gives an empty list.",
        "reassurance": "Sentences are the units every chunk is built from."
      },
      {
        "title": "Fill one chunk",
        "instruction": "Define `pack(sentences, start, max_words)`: walk forward from `start`, adding each sentence's word count, and return the index just past the last sentence that fits in `max_words`. The first sentence is always taken, even when it alone is too long.",
        "code": "def pack(sentences, start, max_words):\n    end, words = start, 0\n    while end < len(sentences):\n        n = len(sentences[end].split())\n        if end > start and words + n > max_words:\n            break\n        words, end = words + n, end + 1\n    return end",
        "check": "_S = split_sentences(HANDBOOK)\ntest(\"Fill one chunk\", lambda: pack(_S, 0, 20) == 1 and pack(_S, 1, 20) == 4 and pack(_S, 3, 20) == 6 and pack(_S, 0, 3) == 1, \"From sentence 0 only one fits in 20 words; from 1, three fit exactly; an over-long sentence is still taken alone.\")",
        "expected": "From sentence 0 only one fits in 20 words; from 1, three fit exactly; an over-long sentence is still taken alone.",
        "reassurance": ""
      },
      {
        "title": "Slide with overlap",
        "instruction": "Define `chunk_sentences(sentences, max_words, overlap=1)`: repeatedly `pack` from `start`, join that run of sentences with single spaces, and begin the next chunk `overlap` sentences before the end, but always at least one sentence later than the current start. Stop once a chunk reaches the last sentence.",
        "code": "def chunk_sentences(sentences, max_words, overlap=1):\n    chunks, start, end = [], 0, 0\n    while end < len(sentences):\n        end = pack(sentences, start, max_words)\n        chunks.append(\" \".join(sentences[start:end]))\n        start = max(end - overlap, start + 1)\n    return chunks",
        "check": "_S = split_sentences(HANDBOOK)\ntest(\"Slide with overlap\", lambda: chunk_sentences(_S, 20) == [_S[0], \" \".join(_S[1:4]), \" \".join(_S[3:6])] and chunk_sentences(_S, 20, overlap=0) == [_S[0], \" \".join(_S[1:4]), \" \".join(_S[4:6])] and chunk_sentences([], 20) == [], \"Three chunks sharing one boundary sentence; overlap=0 shares none; no sentences give no chunks.\")",
        "expected": "Three chunks sharing one boundary sentence; overlap=0 shares none; no sentences give no chunks.",
        "reassurance": "The overlap is the safety margin for facts that straddle a boundary."
      },
      {
        "title": "Keep the source",
        "instruction": "Define `make_chunks(source, text, max_words=20)`: chunk the text's sentences and return one dict per chunk with the keys `source`, `chunk` (its 0-based position) and `text`.",
        "code": "def make_chunks(source, text, max_words=20):\n    pieces = chunk_sentences(split_sentences(text), max_words)\n    return [{\"source\": source, \"chunk\": i, \"text\": t} for i, t in enumerate(pieces)]",
        "check": "_M = make_chunks(\"returns.md\", HANDBOOK)\ntest(\"Keep the source\", lambda: [m[\"chunk\"] for m in _M] == [0, 1, 2] and all(m[\"source\"] == \"returns.md\" for m in _M) and _M[2][\"text\"].startswith(\"Shipping costs\"), \"Three dicts numbered 0 to 2, all from returns.md, the last starting with the shared sentence.\")",
        "expected": "Three dicts numbered 0 to 2, all from returns.md, the last starting with the shared sentence.",
        "reassurance": "Source and position are what a generated answer will cite later in the chapter."
      },
      {
        "title": "Print the chunks",
        "instruction": "Print each chunk of the handbook as its number, a `|`, and its text. Then run the check.",
        "code": "for c in make_chunks(\"returns.md\", HANDBOOK):\n    print(c[\"chunk\"], \"|\", c[\"text\"])",
        "check": "",
        "expected": "Three lines numbered 0, 1 and 2; the shipping sentence appears in both chunk 1 and chunk 2.",
        "reassurance": "The complete check verifies splitting, packing, overlap, edge cases, metadata and the printout."
      }
    ]
  },
  "rag-embed": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]",
    "steps": [
      {
        "title": "Tokenise",
        "instruction": "Define `tokens(text)` returning the runs of lowercase letters and digits in the text, after lowercasing it.",
        "code": "def tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())",
        "check": "test(\"Tokenise\", lambda: tokens(\"Error E42: Reset NOW!\") == [\"error\", \"e42\", \"reset\", \"now\"], \"Punctuation disappears, case is folded, and E42 stays one token.\")",
        "expected": "Punctuation disappears, case is folded, and E42 stays one token.",
        "reassurance": "Every later stage reads text through this function."
      },
      {
        "title": "Count concepts",
        "instruction": "Define `count_vector(text)`: a zero vector of length `DIM`, plus one at the concept index of every token found in `CONCEPTS`. Unknown words are skipped.",
        "code": "def count_vector(text):\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    return v",
        "check": "test(\"Count concepts\", lambda: count_vector(\"Refund refunded to my card\")[0] == 2 and count_vector(\"Refund refunded to my card\")[1] == 1 and count_vector(\"Refund refunded to my card\").sum() == 3 and count_vector(\"hello\").sum() == 0, \"Two refund words land on dimension 0, card on dimension 1, and the rest is ignored.\")",
        "expected": "Two refund words land on dimension 0, card on dimension 1, and the rest is ignored.",
        "reassurance": "Synonyms already share a dimension; next, remove the effect of length."
      },
      {
        "title": "Unit length",
        "instruction": "Define `embed(text)`: the count vector divided by its L2 norm, or the zero vector unchanged when the norm is 0.",
        "code": "def embed(text):\n    v = count_vector(text)\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v",
        "check": "test(\"Unit length\", lambda: np.isclose(np.linalg.norm(embed(\"refund to my card\")), 1.0) and np.array_equal(embed(\"hello\"), np.zeros(DIM)) and np.allclose(embed(\"refund\"), embed(\"refund refund\")), \"Known text has length 1, unknown text stays all zeros, and repeating a word changes nothing.\")",
        "expected": "Known text has length 1, unknown text stays all zeros, and repeating a word changes nothing.",
        "reassurance": "Unit vectors make a dot product a cosine similarity."
      },
      {
        "title": "Embed the collection",
        "instruction": "Create `CHUNK_VECS`: an array with one embedded row per chunk text, in the order of `CHUNKS`.",
        "code": "CHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk",
        "check": "test(\"Embed the collection\", lambda: CHUNK_VECS.shape == (len(CHUNKS), DIM) and np.allclose(np.linalg.norm(CHUNK_VECS, axis=1), 1.0) and np.allclose(CHUNK_VECS[4], embed(CHUNKS[4][\"text\"])), \"A (9, 13) matrix of unit rows, row i being chunk i.\")",
        "expected": "A (9, 13) matrix of unit rows, row i being chunk i.",
        "reassurance": "This matrix is the vector index the next lessons search."
      },
      {
        "title": "Compare meanings",
        "instruction": "Print the matrix shape after `matrix:`, then the dot product of the embeddings of `refund` and `reimbursed`, and of `refund` and `password`, each rounded to 2 decimals with the labels shown in the lesson. Then run the check.",
        "code": "print(\"matrix:\", CHUNK_VECS.shape)\nprint(\"refund vs reimbursed:\", round(embed(\"refund\") @ embed(\"reimbursed\"), 2))\nprint(\"refund vs password:\", round(embed(\"refund\") @ embed(\"password\"), 2))",
        "check": "",
        "expected": "matrix: (9, 13), then 1.0 for the synonyms and 0.0 for the unrelated pair.",
        "reassurance": "The complete check verifies tokens, counts, unit length, the zero case, synonyms and the index."
      }
    ]
  },
  "rag-search": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef embed(text):\n    \"\"\"Unit-length concept counts: a readable stand-in for an embedding model.\"\"\"\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v\n\nCHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk",
    "steps": [
      {
        "title": "Score every chunk at once",
        "instruction": "Define `cosine_scores(query)` returning one similarity per chunk: the matrix product of `CHUNK_VECS` with the query's embedding. Both have unit length, so this is the cosine.",
        "code": "def cosine_scores(query):\n    return CHUNK_VECS @ embed(query)",
        "check": "test(\"Score every chunk at once\", lambda: cosine_scores(\"reset my password\").shape == (len(CHUNKS),) and np.isclose(cosine_scores(\"reset my password\")[6], CHUNK_VECS[6] @ embed(\"reset my password\")), \"Nine scores, one per chunk, equal to each row's dot product with the query.\")",
        "expected": "Nine scores, one per chunk, equal to each row's dot product with the query.",
        "reassurance": "No loop: one matrix product scores the whole collection."
      },
      {
        "title": "Best first",
        "instruction": "Define `top_k(scores, k)`: the indices of the `k` highest scores, best first, with ties kept in their original order, as plain Python ints. A `k` of 0 or less gives an empty list.",
        "code": "def top_k(scores, k):\n    order = np.argsort(-scores, kind=\"stable\")\n    return [int(i) for i in order[:max(k, 0)]]",
        "check": "test(\"Best first\", lambda: top_k(np.array([0.2, 0.9, 0.9, 0.1]), 2) == [1, 2] and top_k(np.array([0.2, 0.9]), 10) == [1, 0] and top_k(np.array([0.2, 0.9]), 0) == [] and top_k(np.array([0.2, 0.9]), -1) == [], \"Ties keep their order, oversized k returns everything, and k \\u2264 0 returns nothing.\")",
        "expected": "Ties keep their order, oversized k returns everything, and k ≤ 0 returns nothing.",
        "reassurance": ""
      },
      {
        "title": "Search with a floor",
        "instruction": "Define `search(query, k=3, min_score=0.0)` returning `(index, score)` pairs for the top `k` chunks, keeping only scores strictly above `min_score`, with each score as a float.",
        "code": "def search(query, k=3, min_score=0.0):\n    scores = cosine_scores(query)\n    return [(i, float(scores[i])) for i in top_k(scores, k) if scores[i] > min_score]",
        "check": "test(\"Search with a floor\", lambda: [i for i, _ in search(\"How do I reset my password?\")] == [6, 7] and search(\"What is the capital of France?\") == [] and [i for i, _ in search(\"How do I reset my password?\", min_score=0.8)] == [6], \"The two account chunks for a password question, nothing for an unrelated one, and only the best when the floor is 0.8.\")",
        "expected": "The two account chunks for a password question, nothing for an unrelated one, and only the best when the floor is 0.8.",
        "reassurance": "A retriever that can say \"nothing relevant\" is safer than one that always returns k chunks."
      },
      {
        "title": "Print the results",
        "instruction": "Search for `How do I reset my password?` and print each hit as its score rounded to 2 decimals, its source, a `|` and its text. Then run the check.",
        "code": "for i, score in search(\"How do I reset my password?\"):\n    print(round(score, 2), CHUNKS[i][\"source\"], \"|\", CHUNKS[i][\"text\"])",
        "check": "",
        "expected": "Two lines: 0.94 for the reset-password chunk, then 0.71 for the E42 chunk.",
        "reassurance": "The complete check verifies scoring, ranking, edge cases, the floor and the printout."
      }
    ]
  },
  "rag-hybrid": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef embed(text):\n    \"\"\"Unit-length concept counts: a readable stand-in for an embedding model.\"\"\"\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v\n\nCHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk\n\nSTOPWORDS = {\"a\", \"an\", \"the\", \"is\", \"are\", \"my\", \"i\", \"do\", \"does\", \"what\", \"how\", \"to\", \"of\", \"for\", \"on\", \"in\", \"it\"}\n\ndef cosine_scores(query):\n    return CHUNK_VECS @ embed(query)",
    "steps": [
      {
        "title": "Score keywords",
        "instruction": "Define `keyword_scores(query)`: take the set of the query's tokens minus `STOPWORDS`, and return an array with, for each chunk, how many of those words appear among the chunk's tokens.",
        "code": "def keyword_scores(query):\n    words = set(tokens(query)) - STOPWORDS\n    return np.array([len(words & set(tokens(c[\"text\"]))) for c in CHUNKS])",
        "check": "test(\"Score keywords\", lambda: keyword_scores(\"what does error E42 mean\").tolist() == [0, 0, 0, 0, 0, 0, 0, 2, 0] and keyword_scores(\"the the the\").sum() == 0, \"Only the E42 chunk shares words (error and e42) with the question; stopwords alone match nothing.\")",
        "expected": "Only the E42 chunk shares words (error and e42) with the question; stopwords alone match nothing.",
        "reassurance": "An exact match on E42 needs no understanding at all."
      },
      {
        "title": "Rank, dropping misses",
        "instruction": "Define `ranking(scores)`: chunk indices sorted best first with ties in original order, as ints, keeping only those with a score above 0.",
        "code": "def ranking(scores):\n    order = np.argsort(-scores, kind=\"stable\")\n    return [int(i) for i in order if scores[i] > 0]",
        "check": "test(\"Rank, dropping misses\", lambda: ranking(np.array([0.0, 0.5, 0.9, 0.5])) == [2, 1, 3] and ranking(np.zeros(3)) == [], \"Best first, ties in order, and a chunk with score 0 is not in the ranking at all.\")",
        "expected": "Best first, ties in order, and a chunk with score 0 is not in the ranking at all.",
        "reassurance": ""
      },
      {
        "title": "Fuse the rankings",
        "instruction": "Define `rrf(rankings, k=60)`: for every ranking, give each chunk 1 / (k + rank) with ranks starting at 1, sum per chunk across rankings, and return the chunk indices sorted by that sum, highest first, ties by lower index.",
        "code": "def rrf(rankings, k=60):\n    fused = {}\n    for ranked in rankings:\n        for rank, i in enumerate(ranked, start=1):\n            fused[i] = fused.get(i, 0.0) + 1 / (k + rank)\n    return sorted(fused, key=lambda i: (-fused[i], i))",
        "check": "test(\"Fuse the rankings\", lambda: rrf([[2, 0], [0, 1]]) == [0, 2, 1] and rrf([[5]], k=0) == [5] and rrf([]) == [] and rrf([[3], [1]]) == [1, 3], \"A chunk in both lists beats one that tops a single list; ties go to the lower index; no rankings give no results.\")",
        "expected": "A chunk in both lists beats one that tops a single list; ties go to the lower index; no rankings give no results.",
        "reassurance": "RRF never looks at a raw score, only at positions."
      },
      {
        "title": "Search both ways",
        "instruction": "Define `hybrid_search(query, top=3)`: fuse the ranking of the cosine scores and the ranking of the keyword scores, and return the first `top` chunk indices.",
        "code": "def hybrid_search(query, top=3):\n    fused = rrf([ranking(cosine_scores(query)), ranking(keyword_scores(query))])\n    return fused[:top]",
        "check": "test(\"Search both ways\", lambda: hybrid_search(\"What does error E42 mean?\")[0] == 7 and hybrid_search(\"My parcel is lost\")[0] == 4 and hybrid_search(\"reset link E42\", top=2) == [7, 6], \"The error code is found by keywords, the paraphrase by vectors, and agreement wins.\")",
        "expected": "The error code is found by keywords, the paraphrase by vectors, and agreement wins.",
        "reassurance": "Each retriever covers the other's blind spot."
      },
      {
        "title": "Print both cases",
        "instruction": "For the two questions `What does error E42 mean?` and `My parcel is lost`, print the question, `->`, and the list of sources of its hybrid results. Then run the check.",
        "code": "for q in [\"What does error E42 mean?\", \"My parcel is lost\"]:\n    print(q, \"->\", [CHUNKS[i][\"source\"] for i in hybrid_search(q)])",
        "check": "",
        "expected": "The E42 question returns only account.md; the parcel question starts with lost.md.",
        "reassurance": "The complete check verifies keyword scores, rankings, fusion, ties and both retrieval cases."
      }
    ]
  },
  "rag-rerank": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef embed(text):\n    \"\"\"Unit-length concept counts: a readable stand-in for an embedding model.\"\"\"\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v\n\nCHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk\n\ndef search(query, k=4):\n    \"\"\"First stage: the k best chunk indices by cosine similarity.\"\"\"\n    scores = CHUNK_VECS @ embed(query)\n    return [int(i) for i in np.argsort(-scores, kind=\"stable\")[:k] if scores[i] > 0]",
    "steps": [
      {
        "title": "Concept sets",
        "instruction": "Define `concepts(text)` returning the set of concept ids of the text's tokens that appear in `CONCEPTS`.",
        "code": "def concepts(text):\n    return {CONCEPTS[t] for t in tokens(text) if t in CONCEPTS}",
        "check": "test(\"Concept sets\", lambda: concepts(\"Refunded to my card, refund!\") == {0, 1} and concepts(\"hello\") == set(), \"Repeats collapse: two refund words give one concept.\")",
        "expected": "Repeats collapse: two refund words give one concept.",
        "reassurance": "Sets ignore how often a concept appears, which is exactly what the shipping chunk exploited."
      },
      {
        "title": "Score a pair",
        "instruction": "Define `pair_score(query, text)`: the number of the query's concepts also found in the text, divided by the number of query concepts; 0.0 when the query has no concepts.",
        "code": "def pair_score(query, text):\n    wanted = concepts(query)\n    if not wanted:\n        return 0.0\n    return len(wanted & concepts(text)) / len(wanted)",
        "check": "_q = \"My delivery is lost, how many days do I have?\"\ntest(\"Score a pair\", lambda: pair_score(_q, CHUNKS[4][\"text\"]) == 1.0 and abs(pair_score(_q, CHUNKS[2][\"text\"]) - 2 / 3) < 1e-9 and pair_score(\"hello\", CHUNKS[0][\"text\"]) == 0.0, \"The lost-package chunk covers all three concepts of the question; the shipping chunk only two.\")",
        "expected": "The lost-package chunk covers all three concepts of the question; the shipping chunk only two.",
        "reassurance": ""
      },
      {
        "title": "Reorder the shortlist",
        "instruction": "Define `rerank(query, candidates, top=2)`: the candidate indices sorted by pair score, highest first, ties kept in their retrieval order, cut to `top`. Do not modify `candidates`.",
        "code": "def rerank(query, candidates, top=2):\n    ranked = sorted(candidates, key=lambda i: -pair_score(query, CHUNKS[i][\"text\"]))\n    return ranked[:top]",
        "check": "_q = \"My delivery is lost, how many days do I have?\"\ntest(\"Reorder the shortlist\", lambda: rerank(_q, [2, 4, 3, 5], top=4) == [4, 2, 3, 5] and rerank(_q, [5, 3], top=2) == [5, 3] and (lambda c: (rerank(_q, c), c)[1] == [2, 4, 3, 5])([2, 4, 3, 5]), \"Full coverage moves chunk 4 to the front; equal scores keep their order; the input list is untouched.\")",
        "expected": "Full coverage moves chunk 4 to the front; equal scores keep their order; the input list is untouched.",
        "reassurance": ""
      },
      {
        "title": "Two stages",
        "instruction": "Define `retrieve_then_rerank(query, n=4, top=2)`: shortlist `n` chunks with `search`, then rerank them and keep `top`.",
        "code": "def retrieve_then_rerank(query, n=4, top=2):\n    return rerank(query, search(query, k=n), top)",
        "check": "test(\"Two stages\", lambda: retrieve_then_rerank(\"My delivery is lost, how many days do I have?\") == [4, 2] and retrieve_then_rerank(\"What is the capital of France?\") == [], \"The lost-package chunk now ranks first; an unanswerable question still returns nothing.\")",
        "expected": "The lost-package chunk now ranks first; an unanswerable question still returns nothing.",
        "reassurance": "Wide and cheap, then narrow and sharp: that is the whole pattern."
      },
      {
        "title": "Print before and after",
        "instruction": "For the question `My delivery is lost, how many days do I have?`, print `retrieved:` followed by the search result, and `reranked: ` (with a trailing space) followed by the reranked result. Then run the check.",
        "code": "question = \"My delivery is lost, how many days do I have?\"\nprint(\"retrieved:\", search(question))\nprint(\"reranked: \", retrieve_then_rerank(question))",
        "check": "",
        "expected": "retrieved: [2, 4, 3, 5] and reranked:  [4, 2].",
        "reassurance": "The complete check verifies concepts, pair scores, stable reranking, both stages and the printout."
      }
    ]
  },
  "rag-generate": {
    "setup": "import re\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\nINSTRUCTIONS = \"Answer using only the numbered context. Cite sources like [1]. If the context does not contain the answer, say I don't know.\"\n\ndef fake_llm(prompt):\n    \"\"\"A stand-in model: it answers from the first context block, or admits it doesn't know.\"\"\"\n    blocks = re.findall(r\"^\\[(\\d+)\\] \\(.+?\\) (.+)$\", prompt, flags=re.M)\n    if not blocks:\n        return \"I don't know.\"\n    number, text = blocks[0]\n    return f\"{text} [{number}]\"",
    "steps": [
      {
        "title": "Number the context",
        "instruction": "Define `format_context(ids)`: one line per chunk id in the given order, written as `[n] (source) text` with n counting from 1, joined by newlines.",
        "code": "def format_context(ids):\n    lines = [f\"[{n}] ({CHUNKS[i]['source']}) {CHUNKS[i]['text']}\" for n, i in enumerate(ids, start=1)]\n    return \"\\n\".join(lines)",
        "check": "test(\"Number the context\", lambda: format_context([3, 0]) == \"[1] (shipping.md) \" + CHUNKS[3][\"text\"] + \"\\n[2] (returns.md) \" + CHUNKS[0][\"text\"] and format_context([]) == \"\", \"Numbers follow the given order, not the chunk ids; no ids give an empty string.\")",
        "expected": "Numbers follow the given order, not the chunk ids; no ids give an empty string.",
        "reassurance": ""
      },
      {
        "title": "Respect the budget",
        "instruction": "Define `fit_budget(ids, max_words)`: keep chunk ids in order while their total word count stays within `max_words`, and stop at the first chunk that would overflow.",
        "code": "def fit_budget(ids, max_words):\n    kept, used = [], 0\n    for i in ids:\n        n = len(CHUNKS[i][\"text\"].split())\n        if used + n > max_words:\n            break\n        kept, used = kept + [i], used + n\n    return kept",
        "check": "test(\"Respect the budget\", lambda: fit_budget([0, 3, 1], 30) == [0, 3] and fit_budget([0, 3, 1], 40) == [0, 3, 1] and fit_budget([0, 2], 5) == [] and fit_budget([0, 6, 1], 25) == [0], \"14 + 11 words fit in 30, the next 10 do not; a short later chunk never jumps ahead.\")",
        "expected": "14 + 11 words fit in 30, the next 10 do not; a short later chunk never jumps ahead.",
        "reassurance": "Rank order is a promise: the best evidence goes in first."
      },
      {
        "title": "Assemble the prompt",
        "instruction": "Define `build_prompt(question, ids, max_words=30)`: the `INSTRUCTIONS`, a blank line, `Context:` and the numbered context of the chunks that fit, a blank line, then `Question: ` and the question.",
        "code": "def build_prompt(question, ids, max_words=30):\n    context = format_context(fit_budget(ids, max_words))\n    return f\"{INSTRUCTIONS}\\n\\nContext:\\n{context}\\n\\nQuestion: {question}\"",
        "check": "_p = build_prompt(\"How fast are refunds?\", [0, 3, 1])\ntest(\"Assemble the prompt\", lambda: _p.startswith(INSTRUCTIONS) and _p.index(\"Context:\\n[1] (returns.md)\") < _p.index(\"Question: How fast are refunds?\") and \"[3]\" not in _p, \"Instructions, then two numbered blocks, then the question; the third chunk did not fit.\")",
        "expected": "Instructions, then two numbered blocks, then the question; the third chunk did not fit.",
        "reassurance": ""
      },
      {
        "title": "Read the citations",
        "instruction": "Define `citations(answer)`: the distinct numbers written in square brackets in the answer, as ints, sorted.",
        "code": "def citations(answer):\n    return sorted({int(n) for n in re.findall(r\"\\[(\\d+)\\]\", answer)})",
        "check": "test(\"Read the citations\", lambda: citations(\"See [2] and [1], also [2].\") == [1, 2] and citations(\"no sources\") == [], \"Duplicates collapse and the order is numeric.\")",
        "expected": "Duplicates collapse and the order is numeric.",
        "reassurance": ""
      },
      {
        "title": "Check grounding",
        "instruction": "Define `grounded(answer, n_blocks)`: True when the answer contains `I don't know`; otherwise True only if it cites at least one block and every citation is between 1 and `n_blocks`.",
        "code": "def grounded(answer, n_blocks):\n    cited = citations(answer)\n    if \"I don't know\" in answer:\n        return True\n    return len(cited) > 0 and all(1 <= n <= n_blocks for n in cited)",
        "check": "test(\"Check grounding\", lambda: grounded(\"Yes [1].\", 2) and not grounded(\"Yes [3].\", 2) and not grounded(\"Yes.\", 2) and not grounded(\"Yes [0].\", 2) and grounded(\"I don't know.\", 0), \"A valid citation passes; a missing, invented or zero citation fails; an honest refusal passes.\")",
        "expected": "A valid citation passes; a missing, invented or zero citation fails; an honest refusal passes.",
        "reassurance": "A refusal beats a confident answer with no evidence."
      },
      {
        "title": "Generate and verify",
        "instruction": "Fit chunks `[0, 3, 1]` into 30 words as `ids`, build the prompt for `How fast are refunds?`, pass it to `fake_llm`, and print the answer after `answer:` and its grounding after `grounded:`. Then run the check.",
        "code": "ids = fit_budget([0, 3, 1], 30)\nanswer = fake_llm(build_prompt(\"How fast are refunds?\", ids))\nprint(\"answer:\", answer)\nprint(\"grounded:\", grounded(answer, len(ids)))",
        "check": "",
        "expected": "The refund chunk comes back with [1] at the end, and grounded: True.",
        "reassurance": "The complete check verifies numbering, the budget, the prompt, citations, grounding and the printout."
      }
    ]
  },
  "rag-retriever-bug": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef embed(text):\n    \"\"\"Unit-length concept counts: a readable stand-in for an embedding model.\"\"\"\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v\n\nCHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk",
    "steps": [
      {
        "title": "Rank best first",
        "instruction": "Define `ranked(scores, k)`: the indices of the full scores array sorted from highest to lowest score, ties in original order, cut to the first `k`.",
        "code": "def ranked(scores, k):\n    return np.argsort(-scores, kind=\"stable\")[:k]",
        "check": "test(\"Rank best first\", lambda: list(ranked(np.array([0.1, 0.7, 0.4, 0.7]), 3)) == [1, 3, 2], \"Positions in the full array are chunk indices, and the best comes first.\")",
        "expected": "Positions in the full array are chunk indices, and the best comes first.",
        "reassurance": "Sorting the whole array keeps every position meaningful."
      },
      {
        "title": "Filter without losing positions",
        "instruction": "Define `search(query, k=3, min_score=0.1)`: score every chunk with a dot product against the query embedding, take the `k` best indices with `ranked`, and return `(int index, float score)` pairs only for scores above `min_score`.",
        "code": "def search(query, k=3, min_score=0.1):\n    scores = CHUNK_VECS @ embed(query)\n    return [(int(i), float(scores[i])) for i in ranked(scores, k) if scores[i] > min_score]",
        "check": "test(\"Filter without losing positions\", lambda: search(\"refund to my card\")[0][0] == 0 and all(np.isclose(sc, CHUNK_VECS[i] @ embed(\"lost package claim\")) for i, sc in search(\"lost package claim\", k=9, min_score=0.0)) and search(\"What is the capital of France?\") == [], \"The refund chunk comes first, every score matches its chunk, and an unrelated question returns nothing.\")",
        "expected": "The refund chunk comes first, every score matches its chunk, and an unrelated question returns nothing.",
        "reassurance": "Filtering last means the indices still point at the right chunks."
      },
      {
        "title": "Print the hits",
        "instruction": "Search for `refund to my card` and print each hit's index, its score rounded to 2 decimals, and its chunk text. Then run the check.",
        "code": "for i, score in search(\"refund to my card\"):\n    print(i, round(score, 2), CHUNKS[i][\"text\"])",
        "check": "",
        "expected": "The refund chunk (index 0, score 0.71) comes first.",
        "reassurance": "The complete check verifies order, index alignment, the floor, k and the printout."
      }
    ]
  },
  "rag-hyde": {
    "setup": "import re\nimport numpy as np\n\nCONCEPTS = {   # word -> concept dimension; synonyms share one\n    \"refund\": 0, \"refunds\": 0, \"refunded\": 0, \"reimbursed\": 0,\n    \"payment\": 1, \"card\": 1, \"charged\": 1,\n    \"days\": 2, \"day\": 2, \"hours\": 2, \"minutes\": 2, \"long\": 2, \"week\": 2,\n    \"shipping\": 3, \"ship\": 3, \"shipped\": 3, \"delivery\": 3, \"delivered\": 3, \"arrives\": 3,\n    \"package\": 4, \"parcel\": 4, \"order\": 4, \"orders\": 4, \"item\": 4, \"items\": 4,\n    \"missing\": 5, \"lost\": 5, \"stolen\": 5,\n    \"claim\": 6, \"report\": 6,\n    \"replacement\": 7, \"replace\": 7, \"resend\": 7,\n    \"password\": 8, \"login\": 8, \"reset\": 8, \"locked\": 8,\n    \"link\": 9, \"email\": 9,\n    \"warranty\": 10, \"defects\": 10, \"defect\": 10, \"repair\": 10,\n    \"damage\": 11, \"damaged\": 11, \"accidental\": 11, \"broken\": 11,\n    \"return\": 12, \"returns\": 12, \"returned\": 12, \"unused\": 12, \"packaging\": 12,\n}\nDIM = max(CONCEPTS.values()) + 1\n\nCHUNKS = [\n    {\"source\": \"returns.md\", \"text\": \"Refunds are issued to the original payment method within 14 days of the return.\"},\n    {\"source\": \"returns.md\", \"text\": \"Returned items must be unused and in their original packaging.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Standard shipping takes 3 to 5 days. Express delivery arrives the next day.\"},\n    {\"source\": \"shipping.md\", \"text\": \"Orders over 50 euros ship free. Shipping costs are not refunded.\"},\n    {\"source\": \"lost.md\", \"text\": \"If a package is marked delivered but is missing, file a claim within 7 days.\"},\n    {\"source\": \"lost.md\", \"text\": \"After a claim is approved we ship a replacement at no cost.\"},\n    {\"source\": \"account.md\", \"text\": \"Reset your password from the login page. The reset link expires after 30 minutes.\"},\n    {\"source\": \"account.md\", \"text\": \"Error E42 means the reset link was already used. Request a new one.\"},\n    {\"source\": \"warranty.md\", \"text\": \"Electronics carry a two year warranty against defects, not accidental damage.\"},\n]\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\ndef embed(text):\n    \"\"\"Unit-length concept counts: a readable stand-in for an embedding model.\"\"\"\n    v = np.zeros(DIM)\n    for t in tokens(text):\n        if t in CONCEPTS:\n            v[CONCEPTS[t]] += 1\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v\n\nCHUNK_VECS = np.array([embed(c[\"text\"]) for c in CHUNKS])   # one unit row per chunk\n\nDRAFTS = {   # what a model might write; the facts may be wrong, only the wording matters\n    \"money\": [\"You will be refunded to your card within 30 days.\", \"Refunds reach the original payment method in about a week.\"],\n    \"parcel\": [\"If your package is lost, report it and we will send a replacement.\", \"Missing parcels can be claimed and replaced within a few days.\"],\n    \"screen\": [\"Accidental damage like a cracked screen is not covered by the warranty.\", \"The warranty covers defects, so a screen broken in a fall needs a paid repair.\"],\n    \"account\": [\"Use the reset link on the login page to choose a new password.\", \"If you are locked out, reset your password from the email link.\"],\n}\n\ndef draft_answer(question, seed=0):\n    \"\"\"A stand-in LLM: writes a plausible answer, a different one per seed.\"\"\"\n    for cue, drafts in DRAFTS.items():\n        if cue in question.lower():\n            return drafts[seed % len(drafts)]\n    return \"I am not sure.\"\n\nEVAL = [   # (question, the source that answers it)\n    (\"How long until I get my money back?\", \"returns.md\"),\n    (\"My parcel never showed up. What now?\", \"lost.md\"),\n    (\"I dropped my phone and the screen cracked. Is that covered?\", \"warranty.md\"),\n    (\"I can't get into my account.\", \"account.md\"),\n]",
    "steps": [
      {
        "title": "Draft hypothetical answers",
        "instruction": "Define `drafts(question, n=2)`: a list of `n` answers from `draft_answer`, one for each seed 0, 1, … n − 1.",
        "code": "def drafts(question, n=2):\n    return [draft_answer(question, seed) for seed in range(n)]",
        "check": "_q = EVAL[0][0]\ntest(\"Draft hypothetical answers\", lambda: drafts(_q, 3) == [draft_answer(_q, 0), draft_answer(_q, 1), draft_answer(_q, 2)] and drafts(_q, 0) == [], \"One draft per seed, in seed order; n = 0 gives none.\")",
        "expected": "One draft per seed, in seed order; n = 0 gives none.",
        "reassurance": "Drafts are cheap to read: look at one before trusting it."
      },
      {
        "title": "One HyDE vector",
        "instruction": "Define `hyde_vector(question, n=2)`: embed each draft and the question itself, average those vectors element-wise, and rescale the mean to unit length, leaving a zero mean as zeros.",
        "code": "def hyde_vector(question, n=2):\n    vecs = [embed(d) for d in drafts(question, n)] + [embed(question)]\n    v = np.mean(vecs, axis=0)\n    norm = np.linalg.norm(v)\n    return v / norm if norm > 0 else v",
        "check": "_q = EVAL[0][0]\n_m = np.mean([embed(draft_answer(_q, 0)), embed(draft_answer(_q, 1)), embed(_q)], axis=0)\ntest(\"One HyDE vector\", lambda: np.allclose(hyde_vector(_q), _m / np.linalg.norm(_m)) and all(np.isclose(np.linalg.norm(hyde_vector(question)), 1.0) for question, _ in EVAL) and np.array_equal(hyde_vector(\"Zxq?\"), np.zeros(DIM)), \"The mean of two drafts and the question, at unit length; an unknown question stays the zero vector.\")",
        "expected": "The mean of two drafts and the question, at unit length; an unknown question stays the zero vector.",
        "reassurance": "The question keeps a vote, so a draft that wanders off topic cannot take over."
      },
      {
        "title": "Search with any vector",
        "instruction": "Define `top1(vector)`: score every chunk against the vector, and return the index of the best one as an int, or `None` when the best score is not above 0.",
        "code": "def top1(vector):\n    scores = CHUNK_VECS @ vector\n    best = int(np.argmax(scores))\n    return best if scores[best] > 0 else None",
        "check": "test(\"Search with any vector\", lambda: top1(embed(\"reset password\")) == 6 and top1(np.zeros(DIM)) is None, \"The password chunk for a password vector; None when nothing matches.\")",
        "expected": "The password chunk for a password vector; None when nothing matches.",
        "reassurance": ""
      },
      {
        "title": "Measure the hit rate",
        "instruction": "Define `hit_rate(to_vector)`: for each `(question, source)` in `EVAL`, find the top chunk of `to_vector(question)`, count a hit when there is one and its source matches, and return hits divided by the number of questions.",
        "code": "def hit_rate(to_vector):\n    hits = 0\n    for question, source in EVAL:\n        best = top1(to_vector(question))\n        hits += best is not None and CHUNKS[best][\"source\"] == source\n    return hits / len(EVAL)",
        "check": "test(\"Measure the hit rate\", lambda: hit_rate(lambda question: embed(\"refund\")) == 0.25 and hit_rate(lambda question: np.zeros(DIM)) == 0.0, \"A function that always searches for refunds hits only the first question; one that finds nothing scores 0.\")",
        "expected": "A function that always searches for refunds hits only the first question; one that finds nothing scores 0.",
        "reassurance": "Any retrieval idea can now be compared with one number."
      },
      {
        "title": "Compare plain and HyDE",
        "instruction": "Print `plain:` with the hit rate of plain `embed`, then `HyDE: ` (with a trailing space) with the hit rate of `hyde_vector`. Then run the check.",
        "code": "print(\"plain:\", hit_rate(embed))\nprint(\"HyDE: \", hit_rate(hyde_vector))",
        "check": "",
        "expected": "plain: 0.25 and HyDE:  1.0.",
        "reassurance": "The complete check verifies drafts, the averaged vector, the zero case, top1, both hit rates and the printout."
      }
    ]
  }
}
