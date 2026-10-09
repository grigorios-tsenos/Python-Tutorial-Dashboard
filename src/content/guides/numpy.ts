import type { CodingGuide } from '../guided'

export const NUMPY_GUIDES: Record<string, CodingGuide> = {
  "np-first-array": {
    "setup": "raw = [0.31, 0.68, 0.44, 0.91, 0.27]",
    "steps": [
      {
        "title": "Import NumPy",
        "instruction": "Import the NumPy library with the alias `np` so array operations are available.",
        "code": "import numpy as np",
        "check": "test('Import NumPy', lambda: np.array([1, 2]).sum() == 3, 'A tiny array adds to 3; no lesson output is needed yet.')",
        "expected": "A tiny array adds to 3; no lesson output is needed yet.",
        "reassurance": "The array tools are available. The next step converts your own data."
      },
      {
        "title": "Turn the list into an array",
        "instruction": "Create a NumPy array named `scores` from the supplied `raw` list. Keep the list and its values unchanged.",
        "code": "scores = np.array(raw)",
        "check": "test('Turn the list into an array', lambda: isinstance(scores, np.ndarray) and scores.tolist() == raw, 'scores contains the same five numbers as raw.')",
        "expected": "scores contains the same five numbers as raw.",
        "reassurance": "The values survived the conversion; you can now apply arithmetic to all of them."
      },
      {
        "title": "Boost every score",
        "instruction": "Create an array named `boosted` whose values are each 0.05 higher than `scores`. Apply the operation to the whole array and keep `scores` unchanged.",
        "code": "boosted = scores + 0.05",
        "check": "test('Boost every score', lambda: np.allclose(boosted, [0.36, 0.73, 0.49, 0.96, 0.32]) and scores.tolist() == raw, 'boosted is [0.36, 0.73, 0.49, 0.96, 0.32]; scores is unchanged.')",
        "expected": "boosted is [0.36, 0.73, 0.49, 0.96, 0.32]; scores is unchanged.",
        "reassurance": "Your vectorized addition is correct. One final step will show its average."
      },
      {
        "title": "Print the average",
        "instruction": "Print the arithmetic average of the values in `boosted`, then run Check.",
        "code": "print(boosted.mean())",
        "check": "",
        "expected": "The output includes 0.572.",
        "reassurance": "The full check confirms the conversion, every boosted value, the printed average and the untouched input."
      }
    ]
  },
  "np-shapes": {
    "setup": "",
    "steps": [
      {
        "title": "Import the array tools",
        "instruction": "Import NumPy with the alias `np`.",
        "code": "import numpy as np",
        "check": "test('Import the array tools', lambda: np.arange(3).tolist() == [0, 1, 2], 'arange(3) produces 0, 1, 2.')",
        "expected": "NumPy is available, and its small-array check produces the values 0, 1, 2.",
        "reassurance": "NumPy is ready; next you will create the twelve values."
      },
      {
        "title": "Create twelve numbers",
        "instruction": "Create a one-dimensional NumPy array named `a` containing the integers from 0 through 11 in order.",
        "code": "a = np.arange(12)",
        "check": "test('Create twelve numbers', lambda: a.shape == (12,) and int(a.sum()) == 66, 'a has shape (12,) and sums to 66.')",
        "expected": "a has shape (12,) and sums to 66.",
        "reassurance": "All twelve values are present before you reshape them."
      },
      {
        "title": "Reshape into rows and columns",
        "instruction": "Arrange the values from `a` in a new array named `grid` with three rows and four columns. Keep the original order of the values.",
        "code": "grid = a.reshape(3, 4)",
        "check": "test('Reshape into rows and columns', lambda: grid.shape == (3, 4) and np.array_equal(grid.ravel(), a), 'grid.shape is (3, 4); flattening it restores a.')",
        "expected": "grid.shape is (3, 4); flattening it restores a.",
        "reassurance": "Only the arrangement changed. The column totals are ready to inspect."
      },
      {
        "title": "Read the column totals",
        "instruction": "Print the shape of `grid`, then its four column totals, then its three row totals. Think about which axis must disappear when each column (and then each row) is reduced to one number.",
        "code": "print(grid.shape)\nprint(grid.sum(axis=0))\nprint(grid.sum(axis=1))",
        "check": "",
        "expected": "The output shows (3, 4), then [12 15 18 21], then [ 6 22 38].",
        "reassurance": "The complete check verifies the shape, retained values and printed column sums."
      }
    ]
  },
  "np-broadcast": {
    "setup": "import numpy as np\nimport orbit\nprices = np.array([[10.0], [20.0], [30.0]])\ndiscounts = np.array([0.0, 0.1, 0.25, 0.5])",
    "steps": [
      {
        "title": "Keep the fraction after each discount",
        "instruction": "Create an array named `kept` with the fraction of each price left after each value in `discounts` is applied. A discount of 0.25 should leave a fraction of 0.75.",
        "code": "kept = 1 - discounts",
        "check": "test('Keep the fraction after each discount', lambda: np.allclose(kept, [1, 0.9, 0.75, 0.5]) and kept.shape == (4,), 'kept is [1, 0.9, 0.75, 0.5], with shape (4,).')",
        "expected": "kept is [1, 0.9, 0.75, 0.5], with shape (4,).",
        "reassurance": "The discount fractions are right. Their shape can stretch across each product row."
      },
      {
        "title": "Build every price and discount pair",
        "instruction": "Create `table` with every combination of product price from `prices` and retained fraction from `kept`. Use broadcasting so rows represent products and columns represent discounts.",
        "code": "table = prices * kept",
        "check": "test('Build every price and discount pair', lambda: table.shape == (3, 4) and np.allclose(table, [[10, 9, 7.5, 5], [20, 18, 15, 10], [30, 27, 22.5, 15]]), 'table is 3 × 4; the bottom-right price is 15.')",
        "expected": "table is 3 × 4; the bottom-right price is 15.",
        "reassurance": "Every product now has every discounted price. The next step draws how the shapes stretch."
      },
      {
        "title": "Inspect the broadcast",
        "instruction": "Use the supplied lab helper `orbit.show_broadcast` to inspect the shapes. It takes the left array, right array and operator symbol in that order; use `prices`, `kept` and the symbol `*`. Display `table` as well.",
        "code": "orbit.show_broadcast(prices, kept, \"*\")\ntable",
        "check": "",
        "expected": "The Broadcast Lab shows three product rows and four discount columns.",
        "reassurance": "The complete check confirms the result shape, unchanged full-price column and the 50% discount."
      }
    ]
  },
  "np-impute": {
    "setup": "import numpy as np\nvalues = np.array([[30.0, np.nan, 12.0], [np.nan, 50000.0, 3.0], [34.0, 60000.0, np.nan], [38.0, 55000.0, 6.0]])",
    "steps": [
      {
        "title": "Find the missing cells",
        "instruction": "Create a boolean array named `missing`, matching the shape of `values`. Mark each missing NaN cell as True and every observed cell as False.",
        "code": "missing = np.isnan(values)",
        "check": "test('Find the missing cells', lambda: missing.shape == values.shape and missing.sum(axis=0).tolist() == [1, 1, 1], 'There is one missing cell in each of the three columns.')",
        "expected": "There is one missing cell in each of the three columns.",
        "reassurance": "Your mask identifies the gaps without changing any data."
      },
      {
        "title": "Count observed cells",
        "instruction": "Create `observed` with the number of non-missing cells in each column of `values`. Use the information in `missing` without changing it.",
        "code": "observed = (~missing).sum(axis=0)",
        "check": "test('Count observed cells', lambda: observed.tolist() == [3, 3, 3], 'observed is [3, 3, 3].')",
        "expected": "observed is [3, 3, 3].",
        "reassurance": "Each mean will use three real observations, rather than counting a missing reading."
      },
      {
        "title": "Sum only observed values",
        "instruction": "Create `totals` with the sum of observed values in each column of `values`. A missing cell should contribute zero; preserve the source data.",
        "code": "totals = np.where(missing, 0.0, values).sum(axis=0)",
        "check": "test('Sum only observed values', lambda: np.allclose(totals, [102, 165000, 21]), 'totals is [102, 165000, 21].')",
        "expected": "totals is [102, 165000, 21].",
        "reassurance": "The sums are finite because NaN never entered the arithmetic."
      },
      {
        "title": "Divide safely",
        "instruction": "Create `means` with the observed average of each column, using `totals` and `observed`. A column with no observations must receive zero without dividing by zero.",
        "code": "means = np.divide(totals, observed, out=np.zeros(values.shape[1]), where=observed > 0)",
        "check": "test('Divide safely', lambda: np.allclose(means, [34, 55000, 7]) and np.divide([0.0], [0], out=np.zeros(1), where=np.array([False])).tolist() == [0], 'means is [34, 55000, 7]; an unobserved column keeps zero.')",
        "expected": "means is [34, 55000, 7]; an unobserved column keeps zero.",
        "reassurance": "The safe divide covers all-missing columns as well as this example."
      },
      {
        "title": "Fill the gaps",
        "instruction": "Create a new array named `filled`, replacing only missing cells in `values` with the corresponding column value from `means`. Keep every observed value and preserve `values`.",
        "code": "filled = np.where(missing, means, values)",
        "check": "test('Fill the gaps', lambda: np.allclose(filled, [[30, 55000, 12], [34, 50000, 3], [34, 60000, 7], [38, 55000, 6]]) and np.isnan(values).sum() == 3, 'The three gaps become 55000, 34 and 7; the source still has three gaps.')",
        "expected": "The three gaps become 55000, 34 and 7; the source still has three gaps.",
        "reassurance": "The example is filled correctly and the source is intact. Now make it reusable."
      },
      {
        "title": "Make the imputation reusable",
        "instruction": "Implement `impute_columns(values)` for two-dimensional numeric input. Return two results in order: a new floating-point matrix with missing cells replaced by their column mean, and the original missing count per column. Use zero for an entirely missing column. Keep inputs unchanged, preserve empty matrix shapes and reject non-matrix input with `ValueError`.",
        "code": "def impute_columns(values):\n    values = np.asarray(values, dtype=float)\n    if values.ndim != 2: raise ValueError(\"expected a two-dimensional matrix\")\n    missing = np.isnan(values)\n    observed = (~missing).sum(axis=0)\n    totals = np.where(missing, 0.0, values).sum(axis=0)\n    means = np.divide(totals, observed, out=np.zeros(values.shape[1]), where=observed > 0)\n    return np.where(missing, means, values), missing.sum(axis=0)",
        "check": "",
        "expected": "The full check also covers new data, an all-missing column, empty matrices and a rejected 1-D input.",
        "reassurance": "These checks verify the reusable function beyond the small example you built."
      }
    ]
  },
  "np-standardize": {
    "setup": "import numpy as np\nvalues = np.array([[10, 100, 7], [20, 200, 7], [30, 300, 7]], dtype=float)",
    "steps": [
      {
        "title": "Center each feature",
        "instruction": "Create `centered` by centering each column of `values` around its own mean. Preserve the input and the matrix shape.",
        "code": "centered = values - values.mean(axis=0)",
        "check": "test('Center each feature', lambda: np.allclose(centered, [[-10, -100, 0], [0, 0, 0], [10, 100, 0]]), 'The centered columns have mean zero; the constant column is all zeros.')",
        "expected": "The centered columns have mean zero; the constant column is all zeros.",
        "reassurance": "Centering worked independently for each feature."
      },
      {
        "title": "Measure each column spread",
        "instruction": "Create `scales` with the population standard deviation of each column of `values`. Use a degrees-of-freedom adjustment of zero; a constant column should have a scale of zero.",
        "code": "scales = values.std(axis=0)",
        "check": "test('Measure each column spread', lambda: np.allclose(scales, [np.sqrt(200 / 3), np.sqrt(20000 / 3), 0]), 'The first two scales are about 8.165 and 81.650; the last is 0.')",
        "expected": "The first two scales are about 8.165 and 81.650; the last is 0.",
        "reassurance": "The zero scale is expected for a constant feature. The next step handles it safely."
      },
      {
        "title": "Scale without dividing by zero",
        "instruction": "Create `scaled` by scaling each column of `centered` according to `scales`. Nonconstant columns should have unit population standard deviation, while constant columns must remain zero without dividing by zero.",
        "code": "scaled = np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "test('Scale without dividing by zero', lambda: np.allclose(scaled[:, :2].mean(axis=0), 0) and np.allclose(scaled[:, :2].std(axis=0), 1) and np.allclose(scaled[:, 2], 0), 'Varying columns have mean 0 and standard deviation 1; the constant column stays 0.')",
        "expected": "Varying columns have mean 0 and standard deviation 1; the constant column stays 0.",
        "reassurance": "The example has the intended scale, with no invalid constant-column values."
      },
      {
        "title": "Make standardize reusable",
        "instruction": "Implement `standardize(values)` for finite, two-dimensional numeric input. Return a new floating-point matrix with columns independently centered and scaled, using population standard deviation. Constant columns become zeros. Keep the input unchanged, preserve the shape of an empty matrix and reject non-matrix input with `ValueError`.",
        "code": "def standardize(values):\n    values = np.asarray(values, dtype=float)\n    if values.ndim != 2: raise ValueError(\"expected a two-dimensional matrix\")\n    if len(values) == 0: return values.copy()\n    centered = values - values.mean(axis=0)\n    scales = values.std(axis=0)\n    return np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "",
        "expected": "The complete check covers constant features, a single row, empty matrices, new shapes and unchanged inputs.",
        "reassurance": "The reusable function is checked on both typical data and the required boundary cases."
      }
    ]
  },
  "np-softmax": {
    "setup": "import numpy as np\nX = np.array([[2.0, 0.0, 0.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])\nW = np.array([[2.0, -1.0, 0.0], [-0.5, 2.0, 0.0], [0.0, 0.5, 1.5]])\nb = np.zeros(3)\nlabels = [\"billing\", \"bug\", \"feature\"]",
    "steps": [
      {
        "title": "Compute class scores",
        "instruction": "Create `logits`, one score per ticket and class, from the features `X`, weights `W` and class biases `b`. Combine features with weights using matrix multiplication, then account for the bias.",
        "code": "logits = X @ W + b",
        "check": "test('Compute class scores', lambda: logits.shape == (3, 3) and np.allclose(logits[0], [4, -2, 0]), 'logits has shape (3, 3); its first row is [4, -2, 0].')",
        "expected": "logits has shape (3, 3); its first row is [4, -2, 0].",
        "reassurance": "Each ticket now has a score for each of the three classes."
      },
      {
        "title": "Shift each row safely",
        "instruction": "Create `shifted` by moving each row of `logits` so that its largest score becomes zero. Keep the differences between scores and preserve the matrix shape.",
        "code": "shifted = logits - logits.max(axis=1, keepdims=True)",
        "check": "test('Shift each row safely', lambda: np.allclose(shifted.max(axis=1), 0) and np.allclose(shifted[0], [0, -6, -4]), 'Each row has maximum 0; the first row is [0, -6, -4].')",
        "expected": "Each row has maximum 0; the first row is [0, -6, -4].",
        "reassurance": "This shift preserves relative scores and prevents positive exponential overflow."
      },
      {
        "title": "Exponentiate the shifted scores",
        "instruction": "Create an array named `exp` containing the exponential of each value in `shifted`. Keep `shifted` unchanged.",
        "code": "exp = np.exp(shifted)",
        "check": "test('Exponentiate the shifted scores', lambda: bool(np.isfinite(exp).all()) and np.allclose(exp.max(axis=1), 1), 'All values are finite and each row has maximum 1.')",
        "expected": "All values are finite and each row has maximum 1.",
        "reassurance": "The exponential step is stable for these scores. Next normalize each row independently."
      },
      {
        "title": "Normalize each row",
        "instruction": "Create `probs` by normalizing each row of `exp` independently. Each value should represent its share of that row’s total.",
        "code": "probs = exp / exp.sum(axis=1, keepdims=True)",
        "check": "test('Normalize each row', lambda: np.allclose(probs.sum(axis=1), 1) and bool((probs >= 0).all()), 'Every row sums to 1, with no negative probabilities.')",
        "expected": "Every row sums to 1, with no negative probabilities.",
        "reassurance": "You have three valid probability distributions; the full function will also validate shapes."
      },
      {
        "title": "Choose the winning labels",
        "instruction": "Create the list `winners` by choosing the label in `labels` with the greatest probability for each row of `probs`. If probabilities tie, choose the first class in label order.",
        "code": "winners = [labels[i] for i in probs.argmax(axis=1)]",
        "check": "test('Choose the winning labels', lambda: winners == [\"billing\", \"bug\", \"feature\"], 'winners is [\"billing\", \"bug\", \"feature\"].')",
        "expected": "winners is [\"billing\", \"bug\", \"feature\"].",
        "reassurance": "The example routes all three tickets correctly. Now preserve those operations for new inputs."
      },
      {
        "title": "Build predict_proba",
        "instruction": "Implement `predict_proba(X, W, b)`, with parameters in that order, returning floating-point class probabilities per row. Accept feature shape (n, d), weight shape (d, k) and bias shape (k,) only; reject incompatible shapes with `ValueError`. Use a stable softmax that stays finite for huge scores. Preserve inputs, and return shape (0, k) for an empty feature batch.",
        "code": "def predict_proba(X, W, b):\n    X, W, b = (np.asarray(a, dtype=float) for a in (X, W, b))\n    if X.ndim != 2 or W.ndim != 2 or X.shape[1] != W.shape[0] or b.shape != (W.shape[1],):\n        raise ValueError(\"expected X (n, d), W (d, k) and b (k,)\")\n    logits = X @ W + b\n    exp = np.exp(logits - logits.max(axis=1, keepdims=True))\n    return exp / exp.sum(axis=1, keepdims=True)",
        "check": "test('Build predict_proba', lambda: np.allclose(predict_proba(X, W, b), probs) and np.isfinite(predict_proba([[1]], [[1000, 999]], [0, 0])).all(), 'The function matches the example probabilities and stays finite for logits near 1000.')",
        "expected": "The function matches the example probabilities and stays finite for logits near 1000.",
        "reassurance": "The probability function is checked on normal and huge scores. The label-selection goal is next."
      },
      {
        "title": "Build predict_labels",
        "instruction": "Implement `predict_labels(X, W, b, labels)`, with parameters in that order, using your probability function. Return one label per row as a list, choosing the first label on ties. Require exactly one label per class or raise `ValueError`; an empty batch returns an empty list. Keep inputs unchanged.",
        "code": "def predict_labels(X, W, b, labels):\n    if len(labels) != np.shape(W)[1]:\n        raise ValueError(\"need exactly one label per class\")\n    return [labels[i] for i in predict_proba(X, W, b).argmax(axis=1)]",
        "check": "",
        "expected": "The full check includes huge logits, empty batches, tied classes, malformed shapes and unchanged inputs.",
        "reassurance": "The complete checks exercise the stability and validation that the example alone cannot prove."
      }
    ]
  },
  "np-pairwise": {
    "setup": "import numpy as np\nleft = np.array([[0, 0], [3, 4]])\nright = np.array([[0, 0], [0, 4], [3, 0]])",
    "steps": [
      {
        "title": "Convert before subtracting",
        "instruction": "Create floating-point arrays named `left_float` and `right_float` from `left` and `right`. Preserve their coordinates and source arrays so later arithmetic cannot overflow as integer arithmetic.",
        "code": "left_float = np.asarray(left, dtype=float)\nright_float = np.asarray(right, dtype=float)",
        "check": "test('Convert before subtracting', lambda: np.issubdtype(left_float.dtype, np.floating) and np.array_equal(left_float, left) and np.array_equal(right_float, right), 'Both arrays hold the same coordinates as floating-point numbers.')",
        "expected": "Both arrays hold the same coordinates as floating-point numbers.",
        "reassurance": "The coordinates are intact and ready for safe arithmetic."
      },
      {
        "title": "Make room for every pair",
        "instruction": "Create `differences` with the coordinate differences for every left/right pair. Use broadcasting rather than Python loops. Its axes should represent left point, right point and coordinate, in that order.",
        "code": "differences = left_float[:, None, :] - right_float[None, :, :]",
        "check": "test('Make room for every pair', lambda: differences.shape == (2, 3, 2) and differences[1, 0].tolist() == [3, 4], 'The shape is (2, 3, 2); the second-left/first-right difference is [3, 4].')",
        "expected": "The shape is (2, 3, 2); the second-left/first-right difference is [3, 4].",
        "reassurance": "The pair axes are correct. The last axis still holds the two coordinate differences."
      },
      {
        "title": "Reduce coordinates to distances",
        "instruction": "Create `distances` with one squared Euclidean distance per pair in `differences`. Reduce the coordinate axis, keeping the left and right point axes.",
        "code": "distances = np.sum(differences ** 2, axis=-1)",
        "check": "test('Reduce coordinates to distances', lambda: np.allclose(distances, [[0, 16, 9], [25, 9, 16]]), 'distances is [[0, 16, 9], [25, 9, 16]], with shape (2, 3).')",
        "expected": "distances is [[0, 16, 9], [25, 9, 16]], with shape (2, 3).",
        "reassurance": "The entire example distance table is correct; no Python loop was needed."
      },
      {
        "title": "Reuse it with shape validation",
        "instruction": "Implement `pairwise_squared(left, right)`, with parameters in that order. Return a floating-point matrix of every squared Euclidean distance without Python loops, converting integers before arithmetic. Allow different row counts and empty collections. Reject non-matrices or mismatched feature counts with `ValueError`, and preserve both inputs.",
        "code": "def pairwise_squared(left, right):\n    left = np.asarray(left, dtype=float)\n    right = np.asarray(right, dtype=float)\n    if left.ndim != 2 or right.ndim != 2 or left.shape[1] != right.shape[1]:\n        raise ValueError(\"expected matrices with matching feature counts\")\n    # ponytail: n*m*d temporary values; chunk rows when vector collections outgrow memory.\n    differences = left[:, None, :] - right[None, :, :]\n    return np.sum(differences ** 2, axis=-1)",
        "check": "",
        "expected": "The full check includes swapped inputs, empty collections, large integers, invalid shapes and unchanged inputs.",
        "reassurance": "The complete check verifies the function beyond this two-point example."
      }
    ]
  },
  "np-cosine": {
    "setup": "import numpy as np\ndocs = np.array([[1.0, 0.0, 0.0], [0.9, 0.1, 0.0], [30.0, 30.0, 0.0], [0.0, 0.0, 1.0], [-1.0, 0.0, 0.0]])\nquery = np.array([1.0, 0.05, 0.0])",
    "steps": [
      {
        "title": "Measure vector lengths",
        "instruction": "Create `norms` with one cosine denominator per document in `docs`: its vector length combined with the length of `query`.",
        "code": "norms = np.linalg.norm(docs, axis=1) * np.linalg.norm(query)",
        "check": "test('Measure vector lengths', lambda: norms.shape == (5,) and np.allclose(norms[0], np.linalg.norm(query)) and norms[2] > norms[0], 'There is one denominator per document; the long third document has the largest.')",
        "expected": "There is one denominator per document; the long third document has the largest.",
        "reassurance": "Vector length is now accounted for rather than rewarded."
      },
      {
        "title": "Compute safe cosine scores",
        "instruction": "Create `scores` with the cosine similarity of each document in `docs` to `query`, using `norms`. A zero-length document or query must yield a score of zero without dividing by zero.",
        "code": "scores = np.divide(docs @ query, norms, out=np.zeros(len(docs)), where=norms != 0)",
        "check": "test('Compute safe cosine scores', lambda: int(np.argmax(scores)) == 0 and np.allclose(scores[3], 0) and scores[4] < 0, 'Row 0 scores highest, row 3 scores 0, and the opposite row scores below 0.')",
        "expected": "Row 0 scores highest, row 3 scores 0, and the opposite row scores below 0.",
        "reassurance": "The long off-topic document no longer wins just because it is long."
      },
      {
        "title": "Rank best first",
        "instruction": "Create `ranked`, an array of document row indices ordered from highest to lowest `scores`. Equal scores must keep their original row order.",
        "code": "ranked = np.argsort(-scores, kind=\"stable\")",
        "check": "test('Rank best first', lambda: ranked[:3].tolist() == [0, 1, 2] and np.argsort(-np.array([0.0, 1.0, 1.0]), kind=\"stable\").tolist() == [1, 2, 0], 'The top three rows are [0, 1, 2]; equal scores retain their original order.')",
        "expected": "The top three rows are [0, 1, 2]; equal scores retain their original order.",
        "reassurance": "The example ranking and tie rule are both checked."
      },
      {
        "title": "Finish top_k",
        "instruction": "Implement `top_k(query, matrix, k)`, with parameters in that order, returning the row indices of the most cosine-similar rows, best first. Work on all rows without Python loops; zero vectors receive score zero and ties keep row order. Return no indices for non-positive k or an empty matrix, and all available rows if k is too large. Preserve inputs.",
        "code": "def top_k(query, matrix, k):\n    \"\"\"Indices of the k rows of `matrix` most cosine-similar to `query`, best first.\"\"\"\n    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)\n    scores = np.divide(matrix @ query, norms, out=np.zeros(len(matrix)), where=norms != 0)\n    return np.argsort(-scores, kind=\"stable\")[:max(0, k)]",
        "check": "",
        "expected": "The complete check includes zero vectors, a zero query, tied scores, empty data and non-positive k.",
        "reassurance": "Your search function is verified on the required edge cases as well as the sample query."
      }
    ]
  }
}
