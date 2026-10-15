import type { CodingGuide } from '../guided'

export const NN_GUIDES: Record<string, CodingGuide> = {
  "nn-neuron": {
    "setup": "import numpy as np\n\nw = np.array([0.5, -1.0])     # one weight per input feature\nb = 0.5                       # the bias\nx = np.array([2.0, 1.0])      # one input\nX = np.array([[2.0, 1.0], [0.0, 0.0], [-1.0, 2.0]])   # a batch of three inputs",
    "steps": [
      {
        "title": "The weighted sum",
        "instruction": "Create `z`: the dot product of the weights `w` with the input `x`, plus the bias `b`. Use a matrix-product operator, not a loop.",
        "code": "z = w @ x + b",
        "check": "test('The weighted sum', lambda: np.isclose(z, 0.5), 'z is 0.5: 0.5 · 2 + (−1) · 1 + 0.5.')",
        "expected": "z is 0.5: 0.5 · 2 + (−1) · 1 + 0.5.",
        "reassurance": "That one number is the whole neuron before the squash."
      },
      {
        "title": "Squash it",
        "instruction": "Define `sigmoid(t)` returning 1 over 1 plus e to the minus t, working for both scalars and arrays. Then create `a`, the sigmoid of `z`.",
        "code": "def sigmoid(t):\n    return 1 / (1 + np.exp(-t))\n\na = sigmoid(z)",
        "check": "test('Squash it', lambda: np.isclose(sigmoid(0), 0.5) and sigmoid(10) > 0.99 and sigmoid(-10) < 0.01 and sigmoid(np.array([0.0, 0.0])).shape == (2,) and np.isclose(a, 0.6224593), 'sigmoid maps 0 to 0.5 and large inputs toward 0 or 1, works on arrays, and a is about 0.622.')",
        "expected": "sigmoid maps 0 to 0.5 and large inputs toward 0 or 1, works on arrays, and a is about 0.622.",
        "reassurance": ""
      },
      {
        "title": "A batch at once",
        "instruction": "Create `Z`: one weighted sum per row of `X` (matrix product with `w`, plus `b`, which broadcasts). Then create `A`, the sigmoid of `Z`.",
        "code": "Z = X @ w + b\nA = sigmoid(Z)",
        "check": "test('A batch at once', lambda: np.allclose(Z, [0.5, 0.5, -2.0]) and A.shape == (3,) and np.allclose(A, 1 / (1 + np.exp(-np.array([0.5, 0.5, -2.0])))), 'Z is [0.5, 0.5, −2.0] and A squashes each entry.')",
        "expected": "Z is [0.5, 0.5, −2.0] and A squashes each entry.",
        "reassurance": ""
      },
      {
        "title": "Print the results",
        "instruction": "Print `z` and `a` on one line (labels `z =` and ` a =`), then `Z` (label `Z =`), then `A` (label `A =`). Then run the check.",
        "code": "print(\"z =\", z, \" a =\", a)\nprint(\"Z =\", Z)\nprint(\"A =\", A)",
        "check": "",
        "expected": "Three lines: z = 0.5 with a ≈ 0.622, then the three Z values and their activations.",
        "reassurance": ""
      }
    ]
  },
  "nn-activations": {
    "setup": "import numpy as np\n\nx = np.linspace(-4, 4, 9)",
    "steps": [
      {
        "title": "The bend",
        "instruction": "Define `relu(x)` returning the element-wise maximum of 0 and `x`. It must work on arrays of any shape and leave its input unchanged.",
        "code": "def relu(x):\n    return np.maximum(0, x)",
        "check": "_v = np.array([-2.0, 0.0, 3.0])\n_before = _v.copy()\ntest(\"The bend\", lambda: np.array_equal(relu(_v), [0.0, 0.0, 3.0]) and relu(np.array([[-1.0, 2.0], [0.5, -0.5]])).tolist() == [[0.0, 2.0], [0.5, 0.0]] and np.array_equal(_v, _before), \"relu zeroes negatives, keeps positives and shape, and leaves the input unchanged.\")",
        "expected": "relu zeroes negatives, keeps positives and shape, and leaves the input unchanged.",
        "reassurance": ""
      },
      {
        "title": "Its slope",
        "instruction": "Define `relu_grad(x)` returning 1.0 where `x` is positive and 0.0 elsewhere, as a float array. Compare with zero to get a boolean mask, then convert it to floats.",
        "code": "def relu_grad(x):\n    return (x > 0).astype(float)",
        "check": "_v = np.array([-2.0, 0.0, 3.0])\n_before = _v.copy()\ntest(\"Its slope\", lambda: np.array_equal(relu_grad(_v), [0.0, 0.0, 1.0]) and relu_grad(_v).dtype == float and np.array_equal(_v, _before), \"relu_grad is the float mask [0, 0, 1], and the input is unchanged.\")",
        "expected": "relu_grad is the float mask [0, 0, 1], and the input is unchanged.",
        "reassurance": "At exactly 0 the slope is undefined; frameworks pick 0, as you did."
      },
      {
        "title": "A sigmoid that survives huge inputs",
        "instruction": "Define `sigmoid(x)` using the identity 0.5 · (1 + tanh(x / 2)), which equals 1 / (1 + e^−x) but never overflows for x = ±1000.",
        "code": "def sigmoid(x):\n    return 0.5 * (1 + np.tanh(x / 2))",
        "check": "import warnings\ndef _quiet():\n    with warnings.catch_warnings():\n        warnings.simplefilter('error')\n        out = sigmoid(np.array([-1000.0, 0.0, 1000.0]))\n    return np.allclose(out, [0.0, 0.5, 1.0])\ntest('A sigmoid that survives huge inputs', lambda: _quiet() and np.allclose(sigmoid(np.array([-2.0, 0.5, 3.0])), 1 / (1 + np.exp(-np.array([-2.0, 0.5, 3.0])))), 'sigmoid(±1000) is 0 and 1 with no warning, and ordinary inputs match the textbook formula.')",
        "expected": "sigmoid(±1000) is 0 and 1 with no warning, and ordinary inputs match the textbook formula.",
        "reassurance": "tanh saturates at ±1 instead of overflowing, so this form is safe for any input."
      },
      {
        "title": "The sigmoid's slope",
        "instruction": "Define `sigmoid_grad(x)`: compute s = sigmoid(x) once and return s · (1 − s).",
        "code": "def sigmoid_grad(x):\n    s = sigmoid(x)\n    return s * (1 - s)",
        "check": "_xs = np.array([-3.0, -0.5, 0.0, 1.2, 4.0])\n_h = 1e-5\ntest(\"The sigmoid's slope\", lambda: np.allclose(sigmoid_grad(_xs), (sigmoid(_xs + _h) - sigmoid(_xs - _h)) / (2 * _h), atol=1e-6) and np.isclose(sigmoid_grad(0.0), 0.25), 'sigmoid_grad matches the numerical slope at five points and peaks at 0.25.')",
        "expected": "sigmoid_grad matches the numerical slope at five points and peaks at 0.25.",
        "reassurance": ""
      },
      {
        "title": "Print the relu rows",
        "instruction": "Print two labelled rows: `x`, then `relu(x)`.",
        "code": "print(\"x          \", x)\nprint(\"relu       \", relu(x))",
        "check": "test(\"Print the relu rows\", lambda: '[0. 0. 0. 0. 0. 1. 2. 3. 4.]' in __stdout__, \"The relu row shows [0. 0. 0. 0. 0. 1. 2. 3. 4.].\")",
        "expected": "The relu row shows [0. 0. 0. 0. 0. 1. 2. 3. 4.].",
        "reassurance": ""
      },
      {
        "title": "Print the sigmoid rows",
        "instruction": "Print two more labelled rows: the sigmoid of `x` rounded to 3 decimals, and its slope rounded to 3 decimals. Then run Check.",
        "code": "print(\"sigmoid    \", np.round(sigmoid(x), 3))\nprint(\"sigmoid'   \", np.round(sigmoid_grad(x), 3))",
        "check": "",
        "expected": "Nine columns from −4 to 4: relu clips the left half, sigmoid runs 0.018 to 0.982, its slope peaks at 0.25 in the middle.",
        "reassurance": ""
      }
    ]
  },
  "nn-forward": {
    "setup": "import numpy as np\n\ndef relu(x):\n    return np.maximum(0, x)\n\ndef init_params(d, hidden_size, k, seed=0):\n    rng = np.random.default_rng(seed)\n    return {\"W1\": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d), \"b1\": np.zeros(hidden_size),\n            \"W2\": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size), \"b2\": np.zeros(k)}\n\nparams = init_params(d=2, hidden_size=4, k=3)\nX = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0]])",
    "steps": [
      {
        "title": "The hidden layer",
        "instruction": "Define `hidden(X, params)` returning relu of `X` times `W1` plus `b1`, using the matrices in the `params` dict.",
        "code": "def hidden(X, params):\n    return relu(X @ params[\"W1\"] + params[\"b1\"])",
        "check": "_P = init_params(2, 3, 2, seed=1)\n_Xs = np.array([[1.0, -1.0], [0.5, 2.0], [100.0, 100.0]])\n_h_ref = np.maximum(0, _Xs @ _P['W1'] + _P['b1'])\ntest('The hidden layer', lambda: hidden(_Xs, _P).shape == (3, 3) and np.allclose(hidden(_Xs, _P), _h_ref) and bool((hidden(_Xs, _P) >= 0).all()), 'Three rows become three hidden features each, all non-negative.')",
        "expected": "Three rows become three hidden features each, all non-negative.",
        "reassurance": ""
      },
      {
        "title": "Logits for the demo batch",
        "instruction": "Create `h`, the hidden layer of the demo `X` and `params`, and `logits`: `h` times `W2` plus `b2`.",
        "code": "h = hidden(X, params)\nlogits = h @ params[\"W2\"] + params[\"b2\"]",
        "check": "test(\"Logits for the demo batch\", lambda: h.shape == (3, 4) and logits.shape == (3, 3) and np.allclose(logits, np.maximum(0, X @ params['W1'] + params['b1']) @ params['W2'] + params['b2']), \"h is 3 by 4 and logits is 3 by 3: one score per class for each row.\")",
        "expected": "h is 3 by 4 and logits is 3 by 3: one score per class for each row.",
        "reassurance": ""
      },
      {
        "title": "Shift each row",
        "instruction": "Create `shifted`: `logits` with each row's maximum subtracted from that row. Keep the dimensions when taking the maximum so it broadcasts back across the row.",
        "code": "shifted = logits - logits.max(axis=1, keepdims=True)",
        "check": "test(\"Shift each row\", lambda: shifted.shape == (3, 3) and np.allclose(shifted.max(axis=1), 0) and np.allclose(logits - shifted, (logits - shifted)[:, :1]), \"Every row of shifted peaks at exactly 0, and each row moved by one constant.\")",
        "expected": "Every row of shifted peaks at exactly 0, and each row moved by one constant.",
        "reassurance": ""
      },
      {
        "title": "Exponentiate and normalise",
        "instruction": "Create `exp`, the exponential of `shifted`, and `probs`: each row of `exp` divided by that row's sum.",
        "code": "exp = np.exp(shifted)\nprobs = exp / exp.sum(axis=1, keepdims=True)",
        "check": "test(\"Exponentiate and normalise\", lambda: np.allclose(probs.sum(axis=1), 1) and np.allclose(probs, np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)), \"Each row of probs sums to 1 and matches the textbook softmax of logits.\")",
        "expected": "Each row of probs sums to 1 and matches the textbook softmax of logits.",
        "reassurance": ""
      },
      {
        "title": "A stable softmax",
        "instruction": "Define `softmax(logits)` for a 2-D array by wrapping your last two steps: shift each row, exponentiate, and return each row divided by its sum.",
        "code": "def softmax(logits):\n    shifted = logits - logits.max(axis=1, keepdims=True)\n    exp = np.exp(shifted)\n    return exp / exp.sum(axis=1, keepdims=True)",
        "check": "_L = np.array([[1.0, 2.0, 3.0], [1000.0, 0.0, -1000.0]])\ntest('A stable softmax', lambda: np.allclose(softmax(_L).sum(axis=1), 1) and bool(np.isfinite(softmax(_L)).all()) and np.allclose(softmax(_L)[0], np.exp([1, 2, 3]) / np.exp([1, 2, 3]).sum()) and np.isclose(softmax(_L)[1, 0], 1.0), 'Rows sum to 1, a row with 1000 stays finite, and the first row matches the textbook softmax.')",
        "expected": "Rows sum to 1, a row with 1000 stays finite, and the first row matches the textbook softmax.",
        "reassurance": "The max subtraction cancels in the ratio and saves you from overflow."
      },
      {
        "title": "The forward pass",
        "instruction": "Define `forward(X, params)`: compute `h` and `logits` as you did for the demo, take their softmax as `probs`, and return `probs` together with a cache dict with keys `X`, `h` and `probs`.",
        "code": "def forward(X, params):\n    h = hidden(X, params)\n    logits = h @ params[\"W2\"] + params[\"b2\"]\n    probs = softmax(logits)\n    return probs, {\"X\": X, \"h\": h, \"probs\": probs}",
        "check": "_P = init_params(2, 3, 2, seed=1)\n_Xs = np.array([[1.0, -1.0], [0.5, 2.0], [100.0, 100.0]])\n_h_ref = np.maximum(0, _Xs @ _P['W1'] + _P['b1'])\n_logits = _h_ref @ _P['W2'] + _P['b2']\n_e = np.exp(_logits - _logits.max(axis=1, keepdims=True))\n_probs, _cache = forward(_Xs, _P)\ntest('The forward pass', lambda: _probs.shape == (3, 2) and np.allclose(_probs, _e / _e.sum(axis=1, keepdims=True)) and set(_cache) == {'X', 'h', 'probs'} and _cache['X'] is _Xs and np.allclose(_cache['h'], _h_ref) and forward(np.ones((6, 5)), init_params(5, 7, 4, seed=3))[0].shape == (6, 4), 'probs matches the reference, the cache holds X, h and probs, and other sizes work.')",
        "expected": "probs matches the reference, the cache holds X, h and probs, and other sizes work.",
        "reassurance": "Two matrix products and a softmax: that is the whole network."
      },
      {
        "title": "Run the demo batch",
        "instruction": "Create `probs, cache` from `forward` on the demo `X` and `params`, print the probabilities rounded to 3 decimals, and print the row sums after the label `rows sum to`. Then run the check.",
        "code": "probs, cache = forward(X, params)\nprint(np.round(probs, 3))\nprint(\"rows sum to\", probs.sum(axis=1))",
        "check": "",
        "expected": "A 3 by 3 table of probabilities and the line rows sum to [1. 1. 1.].",
        "reassurance": ""
      }
    ]
  },
  "nn-descent": {
    "setup": "import numpy as np\n\ndef grad(w):               # slope of loss(w) = (w - 3) ** 2\n    return 2 * (w - 3)",
    "steps": [
      {
        "title": "One step downhill",
        "instruction": "Create `w0`, `lr` and `steps` holding 0.0, 0.1 and 10. Create `w` as `w0` converted to a float, then update it once with w ← w − lr · grad(w).",
        "code": "w0, lr, steps = 0.0, 0.1, 10\nw = float(w0)\nw = w - lr * grad(w)",
        "check": "test(\"One step downhill\", lambda: np.isclose(w, 0.6), \"w is 0.6: 0 \\u2212 0.1 \\u00b7 grad(0) = 0 \\u2212 0.1 \\u00b7 (\\u22126).\")",
        "expected": "w is 0.6: 0 − 0.1 · grad(0) = 0 − 0.1 · (−6).",
        "reassurance": ""
      },
      {
        "title": "Record the walk",
        "instruction": "Restart `w` from `w0` (as a float) and create `history`, a list holding that start. Then repeat the update `steps` times, appending each new position to `history`.",
        "code": "w = float(w0)\nhistory = [w]\nfor _ in range(steps):\n    w = w - lr * grad(w)\n    history.append(w)",
        "check": "test(\"Record the walk\", lambda: len(history) == 11 and history[0] == 0.0 and np.isclose(history[1], 0.6) and np.isclose(history[-1], 3 - 3 * 0.8 ** 10), \"history holds 11 positions, from 0 through 0.6 to about 2.68, closing in on 3.\")",
        "expected": "history holds 11 positions, from 0 through 0.6 to about 2.68, closing in on 3.",
        "reassurance": ""
      },
      {
        "title": "Walk downhill",
        "instruction": "Define `descend(grad, w0, lr, steps)` by wrapping your walk: start at `w0` as a float, take `steps` updates while recording every position, and return the positions as a NumPy array of `steps + 1` values.",
        "code": "def descend(grad, w0, lr, steps):\n    w = float(w0)\n    history = [w]\n    for _ in range(steps):\n        w = w - lr * grad(w)\n        history.append(w)\n    return np.array(history)",
        "check": "_h = descend(grad, 0.0, 0.1, 50)\ntest('Walk downhill', lambda: _h.shape == (51,) and _h[0] == 0.0 and np.isclose(_h[1], 0.6) and abs(_h[-1] - 3) < 1e-3 and np.isclose(descend(grad, 10.0, 0.5, 1)[-1], 3.0) and descend(grad, 7.0, 0.1, 0).tolist() == [7.0], 'Fifty steps at lr 0.1 converge on 3; lr 0.5 lands on it in one step; zero steps returns just the start.')",
        "expected": "Fifty steps at lr 0.1 converge on 3; lr 0.5 lands on it in one step; zero steps returns just the start.",
        "reassurance": ""
      },
      {
        "title": "Score one walk",
        "instruction": "Create `final`, the last position of a `descend` walk with the current `w0`, `lr` and `steps`, and `score`, the absolute value of the gradient there. A score near 0 means the walk ended near the bottom.",
        "code": "final = descend(grad, w0, lr, steps)[-1]\nscore = abs(grad(final))",
        "check": "test(\"Score one walk\", lambda: np.isclose(final, 3 - 3 * 0.8 ** 10) and np.isclose(score, 6 * 0.8 ** 10), \"final is about 2.678 and score about 0.644.\")",
        "expected": "final is about 2.678 and score about 0.644.",
        "reassurance": ""
      },
      {
        "title": "Remember the best so far",
        "instruction": "Create `best_lr` as None and `best_score` as infinity (NumPy has a constant for it). Then, if `score` is smaller than `best_score`, set `best_lr` to `lr` and `best_score` to `score`.",
        "code": "best_lr, best_score = None, np.inf\nif score < best_score:\n    best_lr, best_score = lr, score",
        "check": "test(\"Remember the best so far\", lambda: best_lr == 0.1 and np.isclose(best_score, 6 * 0.8 ** 10), \"Any finite score beats infinity, so best_lr is 0.1 with its score.\")",
        "expected": "Any finite score beats infinity, so best_lr is 0.1 with its score.",
        "reassurance": ""
      },
      {
        "title": "Try every rate",
        "instruction": "Create `lrs` = [0.01, 0.1, 0.5, 1.1]. Reset the best, then loop over `lrs` as `lr`: score each walk as before, and keep a rate only if `final` is finite and its score beats the best.",
        "code": "lrs = [0.01, 0.1, 0.5, 1.1]\nbest_lr, best_score = None, np.inf\nfor lr in lrs:\n    final = descend(grad, w0, lr, steps)[-1]\n    score = abs(grad(final))\n    if np.isfinite(final) and score < best_score:\n        best_lr, best_score = lr, score",
        "check": "test(\"Try every rate\", lambda: best_lr == 0.5 and best_score == 0, \"lr 0.5 lands exactly on 3, so best_lr is 0.5 with score 0.\")",
        "expected": "lr 0.5 lands exactly on 3, so best_lr is 0.5 with score 0.",
        "reassurance": "A diverging walk ends at infinity or NaN; the finiteness test keeps it out."
      },
      {
        "title": "Choose a learning rate",
        "instruction": "Define `find_lr(grad, w0, lrs, steps)` by wrapping your loop: return the rate whose walk ends finite with the smallest |grad|.",
        "code": "def find_lr(grad, w0, lrs, steps):\n    best_lr, best_score = None, np.inf\n    for lr in lrs:\n        final = descend(grad, w0, lr, steps)[-1]\n        score = abs(grad(final))\n        if np.isfinite(final) and score < best_score:\n            best_lr, best_score = lr, score\n    return best_lr",
        "check": "_g2 = lambda w: 4 * w ** 3\ntest('Choose a learning rate', lambda: find_lr(grad, 0.0, [0.01, 0.1, 0.5, 1.1], 30) == 0.5 and find_lr(grad, 0.0, [1.5, 0.01], 400) == 0.01 and find_lr(_g2, 1.0, [0.001, 0.05], 200) == 0.05, 'lr 0.5 wins on the bowl, a diverging 1.5 is skipped, and another loss picks 0.05.')",
        "expected": "lr 0.5 wins on the bowl, a diverging 1.5 is skipped, and another loss picks 0.05.",
        "reassurance": ""
      },
      {
        "title": "Print the walks",
        "instruction": "Print the first ten positions at lr 0.1 rounded to 3 decimals, the final position after 20 steps at lr 1.1, and the best learning rate among 0.01, 0.1, 0.5 and 1.1 after 30 steps, each with a label. Then run the check.",
        "code": "print(\"lr 0.1:\", np.round(descend(grad, 0.0, 0.1, 10), 3))\nprint(\"lr 1.1 after 20 steps:\", descend(grad, 0.0, 1.1, 20)[-1])\nprint(\"best lr:\", find_lr(grad, 0.0, [0.01, 0.1, 0.5, 1.1], 30))",
        "check": "",
        "expected": "A sequence creeping toward 3, a huge negative number for lr 1.1, and best lr: 0.5.",
        "reassurance": ""
      }
    ]
  },
  "nn-backprop": {
    "setup": "import numpy as np\n\ndef relu(x):\n    return np.maximum(0, x)\n\ndef init_params(d, hidden_size, k, seed=0):\n    rng = np.random.default_rng(seed)\n    return {\"W1\": rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d), \"b1\": np.zeros(hidden_size),\n            \"W2\": rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size), \"b2\": np.zeros(k)}\n\ndef forward(X, params):\n    h = relu(X @ params[\"W1\"] + params[\"b1\"])\n    logits = h @ params[\"W2\"] + params[\"b2\"]\n    exp = np.exp(logits - logits.max(axis=1, keepdims=True))\n    probs = exp / exp.sum(axis=1, keepdims=True)\n    return probs, {\"X\": X, \"h\": h, \"probs\": probs}\n\ndef loss(probs, y):\n    \"\"\"Mean cross-entropy of the true classes.\"\"\"\n    return float(-np.log(probs[np.arange(len(y)), y]).mean())\n\nparams = init_params(2, 4, 3)\nX = np.array([[1.0, 2.0], [-1.0, 0.5], [3.0, -2.0], [0.2, 0.1]])\ny = np.array([0, 1, 2, 1])",
    "steps": [
      {
        "title": "Run the demo forward",
        "instruction": "Create `probs, cache` from `forward` on the demo `X` and `params`, and unpack the shape of `probs` into `n` (rows) and `k` (classes).",
        "code": "probs, cache = forward(X, params)\nn, k = probs.shape",
        "check": "test(\"Run the demo forward\", lambda: probs.shape == (4, 3) and (n, k) == (4, 3) and set(cache) == {'X', 'h', 'probs'}, \"probs is 4 by 3, so n is 4 and k is 3.\")",
        "expected": "probs is 4 by 3, so n is 4 and k is 3.",
        "reassurance": ""
      },
      {
        "title": "One-hot the labels",
        "instruction": "Create `onehot`: an `n` by `k` array of zeros, then set a 1 in each row at the column given by `y`. Index rows and columns together with an array of row numbers and `y`.",
        "code": "onehot = np.zeros((n, k))\nonehot[np.arange(n), y] = 1",
        "check": "test(\"One-hot the labels\", lambda: np.array_equal(onehot, np.eye(3)[y]), \"onehot has a single 1 per row, in the columns 0, 1, 2, 1.\")",
        "expected": "onehot has a single 1 per row, in the columns 0, 1, 2, 1.",
        "reassurance": ""
      },
      {
        "title": "The gradient at the output",
        "instruction": "Define `output_grad(probs, y)` by wrapping the last two steps: read `n` and `k` from `probs`, build the one-hot matrix, and return (probs − onehot) divided by `n`.",
        "code": "def output_grad(probs, y):\n    n, k = probs.shape\n    onehot = np.zeros((n, k))\n    onehot[np.arange(n), y] = 1\n    return (probs - onehot) / n",
        "check": "_p = np.array([[0.7, 0.3], [0.2, 0.8], [0.5, 0.5]])\ntest('The gradient at the output', lambda: np.allclose(output_grad(_p, np.array([0, 0, 1])), (_p - np.array([[1, 0], [1, 0], [0, 1]])) / 3), 'output_grad is (probs − onehot) / n for the three example rows.')",
        "expected": "output_grad is (probs − onehot) / n for the three example rows.",
        "reassurance": "Softmax and cross-entropy collapse into this one subtraction."
      },
      {
        "title": "Output-layer gradients on the demo",
        "instruction": "Create `dlogits` from `output_grad` on the cached probabilities and `y`, then `dW2`: the cached hidden values transposed times `dlogits`, and `db2`: `dlogits` summed over rows.",
        "code": "dlogits = output_grad(cache[\"probs\"], y)\ndW2 = cache[\"h\"].T @ dlogits\ndb2 = dlogits.sum(axis=0)",
        "check": "def _numgrad(P, name, Xs, ys):\n    out = np.zeros_like(P[name])\n    it = np.nditer(P[name], flags=['multi_index'])\n    for _ in it:\n        i = it.multi_index\n        old = P[name][i]\n        P[name][i] = old + 1e-5; lp = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old - 1e-5; lm = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old\n        out[i] = (lp - lm) / 2e-5\n    return out\ntest(\"Output-layer gradients on the demo\", lambda: dW2.shape == (4, 3) and db2.shape == (3,) and np.allclose(dW2, _numgrad(params, 'W2', X, y), atol=1e-6) and np.allclose(db2, _numgrad(params, 'b2', X, y), atol=1e-6), \"dW2 is 4 by 3, db2 has 3 entries, and both match finite differences.\")",
        "expected": "dW2 is 4 by 3, db2 has 3 entries, and both match finite differences.",
        "reassurance": ""
      },
      {
        "title": "Gradients of the output layer",
        "instruction": "Define `backward(params, cache, y)` that, for now, wraps the last step: compute `dlogits`, `dW2` and `db2` from the `cache` it receives and return them in a dict keyed `dW2` and `db2`.",
        "code": "def backward(params, cache, y):\n    dlogits = output_grad(cache[\"probs\"], y)\n    dW2 = cache[\"h\"].T @ dlogits\n    db2 = dlogits.sum(axis=0)\n    return {\"dW2\": dW2, \"db2\": db2}",
        "check": "def _numgrad(P, name, Xs, ys):\n    out = np.zeros_like(P[name])\n    it = np.nditer(P[name], flags=['multi_index'])\n    for _ in it:\n        i = it.multi_index\n        old = P[name][i]\n        P[name][i] = old + 1e-5; lp = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old - 1e-5; lm = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old\n        out[i] = (lp - lm) / 2e-5\n    return out\n_P = init_params(2, 3, 2, seed=2)\n_Xs = np.array([[1.0, -1.0], [0.5, 2.0], [-2.0, 0.3], [0.1, 0.1]])\n_ys = np.array([0, 1, 1, 0])\n_probs, _cache = forward(_Xs, _P)\n_g = backward(_P, _cache, _ys)\ntest('Gradients of the output layer', lambda: _g['dW2'].shape == _P['W2'].shape and _g['db2'].shape == _P['b2'].shape and np.allclose(_g['dW2'], _numgrad(_P, 'W2', _Xs, _ys), atol=1e-6) and np.allclose(_g['db2'], _numgrad(_P, 'b2', _Xs, _ys), atol=1e-6), 'dW2 and db2 have their parameters\\' shapes and match finite differences.')",
        "expected": "dW2 and db2 have their parameters' shapes and match finite differences.",
        "reassurance": ""
      },
      {
        "title": "Into the first layer on the demo",
        "instruction": "Create `dz1`: `dlogits` times the transpose of `W2`, zeroed where the cached hidden values are not positive (relu's slope). From it create `dW1` (the cached `X` transposed times `dz1`) and `db1` (`dz1` summed over rows).",
        "code": "dz1 = (dlogits @ params[\"W2\"].T) * (cache[\"h\"] > 0)\ndW1 = cache[\"X\"].T @ dz1\ndb1 = dz1.sum(axis=0)",
        "check": "def _numgrad(P, name, Xs, ys):\n    out = np.zeros_like(P[name])\n    it = np.nditer(P[name], flags=['multi_index'])\n    for _ in it:\n        i = it.multi_index\n        old = P[name][i]\n        P[name][i] = old + 1e-5; lp = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old - 1e-5; lm = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old\n        out[i] = (lp - lm) / 2e-5\n    return out\ntest(\"Into the first layer on the demo\", lambda: dW1.shape == (2, 4) and np.allclose(dW1, _numgrad(params, 'W1', X, y), atol=1e-6) and np.allclose(db1, _numgrad(params, 'b1', X, y), atol=1e-6), \"dW1 is 2 by 4, and dW1 and db1 match finite differences.\")",
        "expected": "dW1 is 2 by 4, and dW1 and db1 match finite differences.",
        "reassurance": ""
      },
      {
        "title": "Through relu into the first layer",
        "instruction": "Extend `backward` with the first-layer lines you just wrote, and return all four gradients keyed `dW1`, `db1`, `dW2`, `db2`.",
        "code": "def backward(params, cache, y):\n    dlogits = output_grad(cache[\"probs\"], y)\n    dW2 = cache[\"h\"].T @ dlogits\n    db2 = dlogits.sum(axis=0)\n    dz1 = (dlogits @ params[\"W2\"].T) * (cache[\"h\"] > 0)\n    dW1 = cache[\"X\"].T @ dz1\n    db1 = dz1.sum(axis=0)\n    return {\"dW1\": dW1, \"db1\": db1, \"dW2\": dW2, \"db2\": db2}",
        "check": "def _numgrad(P, name, Xs, ys):\n    out = np.zeros_like(P[name])\n    it = np.nditer(P[name], flags=['multi_index'])\n    for _ in it:\n        i = it.multi_index\n        old = P[name][i]\n        P[name][i] = old + 1e-5; lp = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old - 1e-5; lm = loss(forward(Xs, P)[0], ys)\n        P[name][i] = old\n        out[i] = (lp - lm) / 2e-5\n    return out\n_P = init_params(2, 3, 2, seed=2)\n_Xs = np.array([[1.0, -1.0], [0.5, 2.0], [-2.0, 0.3], [0.1, 0.1]])\n_ys = np.array([0, 1, 1, 0])\n_probs, _cache = forward(_Xs, _P)\n_g = backward(_P, _cache, _ys)\ntest('Through relu into the first layer', lambda: set(_g) == {'dW1', 'db1', 'dW2', 'db2'} and np.allclose(_g['dW1'], _numgrad(_P, 'W1', _Xs, _ys), atol=1e-6) and np.allclose(_g['db1'], _numgrad(_P, 'b1', _Xs, _ys), atol=1e-6) and loss(forward(_Xs, {n: _P[n] - 0.5 * _g['d' + n] for n in _P})[0], _ys) < loss(_probs, _ys), 'dW1 and db1 match finite differences, and one descent step lowers the loss.')",
        "expected": "dW1 and db1 match finite differences, and one descent step lowers the loss.",
        "reassurance": ""
      },
      {
        "title": "Print the demo gradients",
        "instruction": "Print the loss of `probs` after the label `loss:`, then for each gradient from `backward` print its name, shape and mean absolute value (rounded to 4 decimals) after the label `mean |grad| =`. Then run Check.",
        "code": "print(\"loss:\", loss(probs, y))\nfor name, value in backward(params, cache, y).items():\n    print(name, value.shape, \"mean |grad| =\", np.abs(value).mean().round(4))",
        "check": "",
        "expected": "The loss, then four lines such as dW1 (2, 4) and db2 (3,) with their mean gradient sizes.",
        "reassurance": ""
      }
    ]
  },
  "nn-train-bug": {
    "setup": "import numpy as np\n\ndef sigmoid(x):\n    return 0.5 * (1 + np.tanh(x / 2))\n\ndef loss(w, b, X, y):\n    p = sigmoid(X @ w + b)\n    return float(-np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12)))\n\nrng = np.random.default_rng(0)\nX = np.vstack([rng.normal([-2, -2], 1, (100, 2)), rng.normal([2, 2], 1, (100, 2))])\ny = np.array([0] * 100 + [1] * 100)",
    "steps": [
      {
        "title": "Predictions at the start",
        "instruction": "Create `w` and `b` as the untrained starting point: zero weights (one per column of `X`) and a bias of 0.0. Then create `p`, the sigmoid of X·w + b.",
        "code": "w, b = np.zeros(X.shape[1]), 0.0\np = sigmoid(X @ w + b)",
        "check": "test(\"Predictions at the start\", lambda: w.shape == (2,) and b == 0 and p.shape == (200,) and np.allclose(p, 0.5), \"With zero weights every prediction p is 0.5.\")",
        "expected": "With zero weights every prediction p is 0.5.",
        "reassurance": ""
      },
      {
        "title": "Bug 1: average, don't sum",
        "instruction": "The buggy gradient summed X transposed times (p − y) over all 200 examples, so its size grows with the dataset. Create `n`, the number of examples, and `dw, db`: X transposed times (p − y), and the sum of (p − y), each divided by `n`.",
        "code": "n = len(y)\ndw, db = X.T @ (p - y) / n, (p - y).sum() / n",
        "check": "test(\"Bug 1: average, don't sum\", lambda: n == 200 and np.allclose(dw, X.T @ (p - y) / 200) and np.isclose(db, (p - y).sum() / 200), \"dw and db are the mean gradient: the sums divided by 200.\")",
        "expected": "dw and db are the mean gradient: the sums divided by 200.",
        "reassurance": ""
      },
      {
        "title": "Fix gradient",
        "instruction": "Define `gradient(w, b, X, y)` from the last two steps: compute `p` and `n` for the arguments it receives and return the mean (dw, db).",
        "code": "def gradient(w, b, X, y):\n    p = sigmoid(X @ w + b)\n    n = len(y)\n    return X.T @ (p - y) / n, (p - y).sum() / n",
        "check": "_Xs = np.array([[1.0, 2.0], [-1.0, 0.5], [0.3, -0.7]])\n_ys = np.array([1, 0, 1])\n_w0, _b0 = np.array([0.2, -0.1]), 0.05\n_p = sigmoid(_Xs @ _w0 + _b0)\n_dw, _db = gradient(_w0, _b0, _Xs, _ys)\n_h = 1e-5\n_num = [(loss(_w0 + np.eye(2)[i] * _h, _b0, _Xs, _ys) - loss(_w0 - np.eye(2)[i] * _h, _b0, _Xs, _ys)) / (2 * _h) for i in range(2)]\ntest('Average the gradient over the batch', lambda: np.allclose(_dw, _Xs.T @ (_p - _ys) / 3) and np.isclose(_db, (_p - _ys).sum() / 3) and np.allclose(_dw, _num, atol=1e-5), 'The gradient is divided by the batch size and matches finite differences of the loss.')",
        "expected": "The gradient is divided by the batch size and matches finite differences of the loss.",
        "reassurance": "A mean loss has a mean gradient, so the step no longer grows with the dataset."
      },
      {
        "title": "Bug 2: step against the gradient",
        "instruction": "The buggy update added the gradient and climbed the loss. Create `lr` and `epochs` holding 0.5 and 200, take `dw, db` from `gradient` at the current `w` and `b`, and move both parameters by `lr` times their gradient in the downhill direction.",
        "code": "lr, epochs = 0.5, 200\ndw, db = gradient(w, b, X, y)\nw, b = w - lr * dw, b - lr * db",
        "check": "test(\"Bug 2: step against the gradient\", lambda: loss(w, b, X, y) < loss(np.zeros(2), 0.0, X, y) and w[0] > 0 and w[1] > 0, \"One step lowers the loss, and both weights turn positive.\")",
        "expected": "One step lowers the loss, and both weights turn positive.",
        "reassurance": ""
      },
      {
        "title": "Record the loss each epoch",
        "instruction": "Restart `w` and `b` from zeros, create an empty list `losses`, then for `epochs` epochs repeat the gradient step and append the loss after each update.",
        "code": "w, b = np.zeros(X.shape[1]), 0.0\nlosses = []\nfor _ in range(epochs):\n    dw, db = gradient(w, b, X, y)\n    w, b = w - lr * dw, b - lr * db\n    losses.append(loss(w, b, X, y))",
        "check": "test(\"Record the loss each epoch\", lambda: len(losses) == 200 and bool(np.isfinite(losses).all()) and losses[-1] < losses[0] / 2, \"Two hundred finite losses, ending below half the first.\")",
        "expected": "Two hundred finite losses, ending below half the first.",
        "reassurance": ""
      },
      {
        "title": "Fix train",
        "instruction": "Define `train(X, y, lr=0.5, epochs=200)` by wrapping the last step: start from zeros, run the corrected update each epoch, record the loss, and return (w, b, losses).",
        "code": "def train(X, y, lr=0.5, epochs=200):\n    w, b = np.zeros(X.shape[1]), 0.0\n    losses = []\n    for _ in range(epochs):\n        dw, db = gradient(w, b, X, y)\n        w, b = w - lr * dw, b - lr * db\n        losses.append(loss(w, b, X, y))\n    return w, b, losses",
        "check": "_w, _b, _losses = train(X, y, lr=0.5, epochs=200)\ntest('Step against the gradient', lambda: len(_losses) == 200 and bool(np.isfinite(_losses).all()) and _losses[-1] < _losses[0] / 2 and _losses[-1] < 0.1 and ((sigmoid(X @ _w + _b) > 0.5).astype(int) == y).mean() > 0.95 and _w[0] > 0 and _w[1] > 0, 'Two hundred finite losses that fall far below the start, over 95% accuracy, and weights pointing toward the positive cluster.')",
        "expected": "Two hundred finite losses that fall far below the start, over 95% accuracy, and weights pointing toward the positive cluster.",
        "reassurance": ""
      },
      {
        "title": "Print the training summary",
        "instruction": "Train on the demo data as `w, b, losses`, print the first and last loss rounded to 3 decimals after the label `loss: first`, and print the accuracy after the label `accuracy:`. Then run the check.",
        "code": "w, b, losses = train(X, y)\nprint(\"loss: first\", round(losses[0], 3), \"last\", round(losses[-1], 3))\nprint(\"accuracy:\", ((sigmoid(X @ w + b) > 0.5).astype(int) == y).mean())",
        "check": "",
        "expected": "A loss that falls from about 0.3 to a few hundredths, and an accuracy of 1.0 or very close.",
        "reassurance": ""
      }
    ]
  },
  "nn-attention": {
    "setup": "import numpy as np\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(4, 3))          # 4 tokens, 3 dims\nWq, Wk, Wv = (rng.normal(size=(3, 3)) for _ in range(3))\nQ, K, V = X @ Wq, X @ Wk, X @ Wv",
    "steps": [
      {
        "title": "Compare queries with keys",
        "instruction": "Define `scores(Q, K)` returning Q times K transposed, divided by the square root of the key dimension (the number of columns of K).",
        "code": "def scores(Q, K):\n    return Q @ K.T / np.sqrt(K.shape[1])",
        "check": "_Qs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\n_Ks = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])\ntest('Compare queries with keys', lambda: scores(_Qs, _Ks).shape == (3, 3) and np.allclose(scores(_Qs, _Ks), _Qs @ _Ks.T / np.sqrt(2)) and not np.allclose(scores(_Qs, _Ks), _Qs @ _Ks.T), 'A 3 by 3 table of scaled dot products, not the plain ones.')",
        "expected": "A 3 by 3 table of scaled dot products, not the plain ones.",
        "reassurance": ""
      },
      {
        "title": "Shift the demo scores",
        "instruction": "Create `s`, the scores of the demo `Q` and `K`, then replace it with `s` minus each row's maximum (keeping dimensions so it broadcasts).",
        "code": "s = scores(Q, K)\ns = s - s.max(axis=1, keepdims=True)",
        "check": "test(\"Shift the demo scores\", lambda: s.shape == (4, 4) and np.allclose(s.max(axis=1), 0) and np.allclose(scores(Q, K) - s, (scores(Q, K) - s)[:, :1]), \"Every row of s peaks at exactly 0, and each row moved by one constant.\")",
        "expected": "Every row of s peaks at exactly 0, and each row moved by one constant.",
        "reassurance": ""
      },
      {
        "title": "Normalise each row",
        "instruction": "Create `e`, the exponential of `s`, and `weights`: each row of `e` divided by that row's sum.",
        "code": "e = np.exp(s)\nweights = e / e.sum(axis=1, keepdims=True)",
        "check": "test(\"Normalise each row\", lambda: weights.shape == (4, 4) and np.allclose(weights.sum(axis=1), 1) and bool((weights > 0).all()), \"weights is 4 by 4, positive, and each row sums to 1.\")",
        "expected": "weights is 4 by 4, positive, and each row sums to 1.",
        "reassurance": ""
      },
      {
        "title": "Weigh each row",
        "instruction": "Define `attention_weights(Q, K, causal=False)` by wrapping the last two steps (ignore `causal` for now): score, shift each row, exponentiate and return each row divided by its sum.",
        "code": "def attention_weights(Q, K, causal=False):\n    s = scores(Q, K)\n    s = s - s.max(axis=1, keepdims=True)\n    e = np.exp(s)\n    return e / e.sum(axis=1, keepdims=True)",
        "check": "_Qs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\n_Ks = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])\n_s = _Qs @ _Ks.T / np.sqrt(2)\n_e = np.exp(_s - _s.max(axis=1, keepdims=True))\ntest('Weigh each row', lambda: np.allclose(attention_weights(_Qs, _Ks), _e / _e.sum(axis=1, keepdims=True)) and np.allclose(attention_weights(_Qs, _Ks).sum(axis=1), 1) and attention_weights(np.array([[0.0, 5.0]]), _Ks)[0].argmax() == 1, 'Each row is a distribution that sums to 1, and a query matching a key attends to it most.')",
        "expected": "Each row is a distribution that sums to 1, and a query matching a key attends to it most.",
        "reassurance": ""
      },
      {
        "title": "Hide the future",
        "instruction": "Update `attention_weights`: when `causal` is true, set every score above the diagonal (key index greater than query index) to minus infinity before the softmax, so each position attends only to itself and earlier positions.",
        "code": "def attention_weights(Q, K, causal=False):\n    s = scores(Q, K)\n    if causal:\n        mask = np.triu(np.ones_like(s, dtype=bool), k=1)\n        s = np.where(mask, -np.inf, s)\n    s = s - s.max(axis=1, keepdims=True)\n    e = np.exp(s)\n    return e / e.sum(axis=1, keepdims=True)",
        "check": "_Qs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\n_Ks = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])\n_w = attention_weights(_Qs, _Ks, causal=True)\ntest('Hide the future', lambda: np.allclose(np.triu(_w, k=1), 0) and np.allclose(_w.sum(axis=1), 1) and bool(np.isfinite(_w).all()) and np.isclose(_w[0, 0], 1.0) and np.allclose(_w[-1], attention_weights(_Qs, _Ks)[-1]), 'Weights above the diagonal are 0, rows still sum to 1, the first position attends only to itself, and the last row is unchanged.')",
        "expected": "Weights above the diagonal are 0, rows still sum to 1, the first position attends only to itself, and the last row is unchanged.",
        "reassurance": "A language model cannot peek at the next token now."
      },
      {
        "title": "Mix the values",
        "instruction": "Define `attention(Q, K, V, causal=False)` returning the attention weights times V.",
        "code": "def attention(Q, K, V, causal=False):\n    return attention_weights(Q, K, causal) @ V",
        "check": "_Qs = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])\n_Ks = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])\n_Vs = np.array([[10.0, 0.0], [0.0, 10.0], [5.0, 5.0]])\ntest('Mix the values', lambda: np.allclose(attention(_Qs, _Ks, _Vs), attention_weights(_Qs, _Ks) @ _Vs) and np.allclose(attention(_Qs, _Ks, _Vs, causal=True)[0], _Vs[0]) and attention(np.ones((2, 2)), _Ks, np.ones((3, 4))).shape == (2, 4), 'The output is weights times V, the first causal position returns its own value, and 2 queries with 3 keys and 4-dim values give (2, 4).')",
        "expected": "The output is weights times V, the first causal position returns its own value, and 2 queries with 3 keys and 4-dim values give (2, 4).",
        "reassurance": ""
      },
      {
        "title": "Print the demo weights",
        "instruction": "Print the attention weights for the demo `Q` and `K` rounded to 2 decimals after the label `weights:` and a newline, the causal weights the same way after `causal weights:`, and the shape of the causal attention output after `output shape:`. Then run the check.",
        "code": "print(\"weights:\\n\", np.round(attention_weights(Q, K), 2))\nprint(\"causal weights:\\n\", np.round(attention_weights(Q, K, causal=True), 2))\nprint(\"output shape:\", attention(Q, K, V, causal=True).shape)",
        "check": "",
        "expected": "Two 4 by 4 weight tables, the second with zeros above the diagonal, and output shape: (4, 3).",
        "reassurance": ""
      }
    ]
  },
  "nn-mlp-boss": {
    "setup": "import numpy as np\n\ndef relu(x):\n    return np.maximum(0, x)\n\ndef forward(X, params):\n    h = relu(X @ params[\"W1\"] + params[\"b1\"])\n    logits = h @ params[\"W2\"] + params[\"b2\"]\n    exp = np.exp(logits - logits.max(axis=1, keepdims=True))\n    probs = exp / exp.sum(axis=1, keepdims=True)\n    return probs, {\"X\": X, \"h\": h, \"probs\": probs}\n\ndef loss(probs, y):\n    return float(-np.log(probs[np.arange(len(y)), y]).mean())\n\ndef backward(params, cache, y):\n    n, k = cache[\"probs\"].shape\n    onehot = np.zeros((n, k))\n    onehot[np.arange(n), y] = 1\n    dlogits = (cache[\"probs\"] - onehot) / n\n    dW2 = cache[\"h\"].T @ dlogits\n    db2 = dlogits.sum(axis=0)\n    dz1 = (dlogits @ params[\"W2\"].T) * (cache[\"h\"] > 0)\n    return {\"dW1\": cache[\"X\"].T @ dz1, \"db1\": dz1.sum(axis=0), \"dW2\": dW2, \"db2\": db2}\n\ndef make_moons(n, noise=0.1, seed=0):\n    rng = np.random.default_rng(seed)\n    t = rng.uniform(0, np.pi, n // 2)\n    outer = np.column_stack([np.cos(t), np.sin(t)])\n    inner = np.column_stack([1 - np.cos(t), 1 - np.sin(t) - 0.5])\n    X = np.vstack([outer, inner]) + rng.normal(0, noise, (2 * (n // 2), 2))\n    y = np.array([0] * (n // 2) + [1] * (n // 2))\n    return X, y\n\nX, y = make_moons(300, noise=0.1, seed=0)",
    "steps": [
      {
        "title": "Draw the first weights",
        "instruction": "Create `d, hidden_size, k, seed` holding 2, 16, 2 and 0, then `rng`, a NumPy random generator seeded with `seed`, and `W1`: standard normal draws of shape (d, hidden_size) from `rng`, scaled by sqrt(2 / d).",
        "code": "d, hidden_size, k, seed = 2, 16, 2, 0\nrng = np.random.default_rng(seed)\nW1 = rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d)",
        "check": "test(\"Draw the first weights\", lambda: W1.shape == (2, 16) and np.allclose(W1, np.random.default_rng(0).normal(0, 1, (2, 16))), \"W1 is 2 by 16, drawn from the seed-0 generator and scaled by sqrt(2 / 2) = 1.\")",
        "expected": "W1 is 2 by 16, drawn from the seed-0 generator and scaled by sqrt(2 / 2) = 1.",
        "reassurance": ""
      },
      {
        "title": "Initialise the parameters",
        "instruction": "Define `init_params(d, hidden_size, k, seed=0)` by wrapping the last step: from one seeded generator draw `W1` as before, then `W2` of shape (hidden_size, k) scaled by sqrt(2 / hidden_size); biases `b1` and `b2` are zeros. Return them in a dict with those four keys.",
        "code": "def init_params(d, hidden_size, k, seed=0):\n    rng = np.random.default_rng(seed)\n    W1 = rng.normal(0, 1, (d, hidden_size)) * np.sqrt(2 / d)\n    W2 = rng.normal(0, 1, (hidden_size, k)) * np.sqrt(2 / hidden_size)\n    return {\"W1\": W1, \"b1\": np.zeros(hidden_size), \"W2\": W2, \"b2\": np.zeros(k)}",
        "check": "_P = init_params(2, 5, 3, seed=4)\n_r = np.random.default_rng(4)\n_W1 = _r.normal(0, 1, (2, 5)) * np.sqrt(2 / 2)\n_W2 = _r.normal(0, 1, (5, 3)) * np.sqrt(2 / 5)\ntest('Initialise the parameters', lambda: set(_P) == {'W1', 'b1', 'W2', 'b2'} and np.allclose(_P['W1'], _W1) and np.allclose(_P['W2'], _W2) and np.array_equal(_P['b1'], np.zeros(5)) and np.array_equal(_P['b2'], np.zeros(3)), 'Shapes, scaling and seed all match: W1 first, then W2, zero biases.')",
        "expected": "Shapes, scaling and seed all match: W1 first, then W2, zero biases.",
        "reassurance": "He initialisation keeps the signal alive through relu."
      },
      {
        "title": "Forward and backward on the demo",
        "instruction": "Create `params` from `init_params` with 2 inputs, 16 hidden units and 2 classes, then `probs, cache` from `forward` on the demo `X`, and `grads` from `backward`.",
        "code": "params = init_params(2, 16, 2)\nprobs, cache = forward(X, params)\ngrads = backward(params, cache, y)",
        "check": "test(\"Forward and backward on the demo\", lambda: probs.shape == (300, 2) and set(grads) == {'dW1', 'db1', 'dW2', 'db2'} and grads['dW1'].shape == (2, 16), \"probs is 300 by 2, and grads holds dW1, db1, dW2 and db2 with their parameters' shapes.\")",
        "expected": "probs is 300 by 2, and grads holds dW1, db1, dW2 and db2 with their parameters' shapes.",
        "reassurance": ""
      },
      {
        "title": "Move every parameter",
        "instruction": "Create `lr` = 1.0 and `new`: a dict with the same keys as `params` in which each parameter is moved against its gradient (the gradient of `W1` is under `dW1`, and so on) by `lr`.",
        "code": "lr = 1.0\nnew = {name: params[name] - lr * grads[\"d\" + name] for name in params}",
        "check": "test(\"Move every parameter\", lambda: set(new) == set(params) and np.allclose(new['W1'], params['W1'] - grads['dW1']) and loss(forward(X, new)[0], y) < loss(probs, y), \"new has the same four keys, and its loss is below the untrained loss.\")",
        "expected": "new has the same four keys, and its loss is below the untrained loss.",
        "reassurance": ""
      },
      {
        "title": "One step of descent",
        "instruction": "Define `step_once(params, X, y, lr)` by wrapping the last two steps: forward, backward, move each parameter, and return (new_params, loss after the update).",
        "code": "def step_once(params, X, y, lr):\n    probs, cache = forward(X, params)\n    grads = backward(params, cache, y)\n    new = {name: params[name] - lr * grads[\"d\" + name] for name in params}\n    return new, loss(forward(X, new)[0], y)",
        "check": "_P0 = init_params(2, 16, 2, 0)\n_P1, _l1 = step_once(_P0, X, y, 1.0)\ntest('One step of descent', lambda: set(_P1) == set(_P0) and all(_P1[n].shape == _P0[n].shape for n in _P0) and _l1 < loss(forward(X, _P0)[0], y) and not np.allclose(_P1['W1'], _P0['W1']), 'The parameters keep their shapes, change, and the loss after one step is below the untrained loss.')",
        "expected": "The parameters keep their shapes, change, and the loss after one step is below the untrained loss.",
        "reassurance": ""
      },
      {
        "title": "Start a fresh network",
        "instruction": "Create `params` again from `init_params`, this time reading the input width from `X`, using `hidden_size` and `seed`, and taking the number of classes as the largest label in `y` plus 1. Also create an empty list `losses` and `epochs` = 50.",
        "code": "params = init_params(X.shape[1], hidden_size, int(y.max()) + 1, seed)\nlosses = []\nepochs = 50",
        "check": "test(\"Start a fresh network\", lambda: params['W1'].shape == (2, 16) and params['W2'].shape == (16, 2) and np.allclose(params['W1'], init_params(2, 16, 2, 0)['W1']) and losses == [], \"W1 is 2 by 16, W2 is 16 by 2 (two classes), and losses is empty.\")",
        "expected": "W1 is 2 by 16, W2 is 16 by 2 (two classes), and losses is empty.",
        "reassurance": ""
      },
      {
        "title": "Repeat the step",
        "instruction": "For `epochs` epochs replace `params` with the result of `step_once` and append the returned loss to `losses`.",
        "code": "for _ in range(epochs):\n    params, current = step_once(params, X, y, lr)\n    losses.append(current)",
        "check": "test(\"Repeat the step\", lambda: len(losses) == 50 and bool(np.isfinite(losses).all()) and losses[-1] < losses[0], \"Fifty finite losses, and the last is below the first.\")",
        "expected": "Fifty finite losses, and the last is below the first.",
        "reassurance": ""
      },
      {
        "title": "The training loop",
        "instruction": "Define `train_mlp(X, y, hidden_size=16, lr=1.0, epochs=500, seed=0)` by wrapping the last two steps: initialise from the data, run `step_once` each epoch, record its loss, and return (params, losses).",
        "code": "def train_mlp(X, y, hidden_size=16, lr=1.0, epochs=500, seed=0):\n    params = init_params(X.shape[1], hidden_size, int(y.max()) + 1, seed)\n    losses = []\n    for _ in range(epochs):\n        params, current = step_once(params, X, y, lr)\n        losses.append(current)\n    return params, losses",
        "check": "_Xm, _ym = make_moons(300, noise=0.1, seed=2)\n_params, _losses = train_mlp(_Xm, _ym, hidden_size=16, lr=1.0, epochs=120, seed=0)\ntest('The training loop', lambda: len(_losses) == 120 and bool(np.isfinite(_losses).all()) and _losses[-1] < _losses[0] / 2 and np.allclose(_losses, train_mlp(_Xm, _ym, epochs=120, seed=0)[1]) and not np.allclose(train_mlp(_Xm, _ym, epochs=40, seed=1)[1], train_mlp(_Xm, _ym, epochs=40, seed=0)[1]), 'One loss per epoch, all finite, falling below half the start, reproducible per seed and different across seeds.')",
        "expected": "One loss per epoch, all finite, falling below half the start, reproducible per seed and different across seeds.",
        "reassurance": ""
      },
      {
        "title": "Predict classes",
        "instruction": "Define `predict(params, X)` returning the index of the most probable class for each row of the forward pass.",
        "code": "def predict(params, X):\n    return forward(X, params)[0].argmax(axis=1)",
        "check": "_Xm, _ym = make_moons(300, noise=0.1, seed=2)\n_params, _ = train_mlp(_Xm, _ym, hidden_size=16, lr=1.0, epochs=500, seed=0)\n_pred = predict(_params, _Xm)\ntest('Predict classes', lambda: _pred.shape == (300,) and set(np.unique(_pred)).issubset({0, 1}) and (_pred == _ym).mean() >= 0.93, 'One integer class per row and at least 93% training accuracy on the moons.')",
        "expected": "One integer class per row and at least 93% training accuracy on the moons.",
        "reassurance": "A straight line could never separate the moons."
      },
      {
        "title": "Train and report",
        "instruction": "Train on the demo `X` and `y` as `params, losses`, print the first and last loss rounded to 3 decimals after the label `loss: first`, and print the training accuracy after the label `training accuracy:`. Then run the boss check.",
        "code": "params, losses = train_mlp(X, y)\nprint(\"loss: first\", round(losses[0], 3), \"last\", round(losses[-1], 3))\nprint(\"training accuracy:\", (predict(params, X) == y).mean())",
        "check": "",
        "expected": "A loss that drops by far more than half and a training accuracy above 0.93.",
        "reassurance": ""
      }
    ]
  }
}
