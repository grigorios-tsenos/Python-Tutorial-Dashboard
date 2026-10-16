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
        "reassurance": ""
      },
      {
        "title": "Turn the list into an array",
        "instruction": "Create a NumPy array named `scores` from the supplied `raw` list. Keep the list and its values unchanged.",
        "code": "scores = np.array(raw)",
        "check": "test('Turn the list into an array', lambda: isinstance(scores, np.ndarray) and scores.tolist() == raw, 'scores contains the same five numbers as raw.')",
        "expected": "scores contains the same five numbers as raw.",
        "reassurance": ""
      },
      {
        "title": "Boost every score",
        "instruction": "Create an array named `boosted` whose values are each 0.05 higher than `scores`. Apply the operation to the whole array and keep `scores` unchanged.",
        "code": "boosted = scores + 0.05",
        "check": "test('Boost every score', lambda: np.allclose(boosted, [0.36, 0.73, 0.49, 0.96, 0.32]) and scores.tolist() == raw, 'boosted is [0.36, 0.73, 0.49, 0.96, 0.32]; scores is unchanged.')",
        "expected": "boosted is [0.36, 0.73, 0.49, 0.96, 0.32]; scores is unchanged.",
        "reassurance": ""
      },
      {
        "title": "Print the average",
        "instruction": "Print the arithmetic average of the values in `boosted`, then run Check.",
        "code": "print(boosted.mean())",
        "check": "",
        "expected": "The output includes 0.572.",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Create twelve numbers",
        "instruction": "Create a one-dimensional NumPy array named `a` containing the integers from 0 through 11 in order.",
        "code": "a = np.arange(12)",
        "check": "test('Create twelve numbers', lambda: a.shape == (12,) and int(a.sum()) == 66, 'a has shape (12,) and sums to 66.')",
        "expected": "a has shape (12,) and sums to 66.",
        "reassurance": ""
      },
      {
        "title": "Reshape into rows and columns",
        "instruction": "Arrange the values from `a` in a new array named `grid` with three rows and four columns. Keep the original order of the values.",
        "code": "grid = a.reshape(3, 4)",
        "check": "test('Reshape into rows and columns', lambda: grid.shape == (3, 4) and np.array_equal(grid.ravel(), a), 'grid.shape is (3, 4); flattening it restores a.')",
        "expected": "grid.shape is (3, 4); flattening it restores a.",
        "reassurance": ""
      },
      {
        "title": "Print the shape",
        "instruction": "Print the shape of `grid`: the pair of numbers that says how many rows and how many columns it has.",
        "code": "print(grid.shape)",
        "check": "test(\"Print the shape\", lambda: \"(3, 4)\" in __stdout__, \"The output shows (3, 4).\")",
        "expected": "The output shows (3, 4).",
        "reassurance": ""
      },
      {
        "title": "Total each column",
        "instruction": "Print the four column totals of `grid`, one number per column. Adding down a column collapses the rows, so think about which axis disappears.",
        "code": "print(grid.sum(axis=0))",
        "check": "test(\"Total each column\", lambda: \"[12 15 18 21]\" in __stdout__, \"The output shows [12 15 18 21].\")",
        "expected": "The output shows [12 15 18 21].",
        "reassurance": ""
      },
      {
        "title": "Total each row",
        "instruction": "Print the three row totals of `grid`, one number per row, then run Check.",
        "code": "print(grid.sum(axis=1))",
        "check": "",
        "expected": "The output shows (3, 4), then [12 15 18 21], then [ 6 22 38].",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Build every price and discount pair",
        "instruction": "Create `table` with every combination of product price from `prices` and retained fraction from `kept`. Use broadcasting so rows represent products and columns represent discounts.",
        "code": "table = prices * kept",
        "check": "test('Build every price and discount pair', lambda: table.shape == (3, 4) and np.allclose(table, [[10, 9, 7.5, 5], [20, 18, 15, 10], [30, 27, 22.5, 15]]), 'table is 3 × 4; the bottom-right price is 15.')",
        "expected": "table is 3 × 4; the bottom-right price is 15.",
        "reassurance": ""
      },
      {
        "title": "Inspect the broadcast",
        "instruction": "Use the supplied lab helper `orbit.show_broadcast` to inspect the shapes. It takes the left array, right array and operator symbol in that order; use `prices`, `kept` and the symbol `*`. Display `table` as well.",
        "code": "orbit.show_broadcast(prices, kept, \"*\")\ntable",
        "check": "",
        "expected": "The Broadcast Lab shows three product rows and four discount columns.",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Count observed cells",
        "instruction": "Create `observed` with the number of non-missing cells in each column of `values`. Use the information in `missing` without changing it.",
        "code": "observed = (~missing).sum(axis=0)",
        "check": "test('Count observed cells', lambda: observed.tolist() == [3, 3, 3], 'observed is [3, 3, 3].')",
        "expected": "observed is [3, 3, 3].",
        "reassurance": "Each mean divides by the real observations only, not by the missing readings."
      },
      {
        "title": "Blank out the gaps",
        "instruction": "Create `observed_only`, a new array like `values` in which every cell marked in `missing` holds 0.0 instead of NaN. Every observed value stays as it is, and `values` keeps its gaps.",
        "code": "observed_only = np.where(missing, 0.0, values)",
        "check": "test(\"Blank out the gaps\", lambda: not np.isnan(observed_only).any() and observed_only[:, 0].tolist() == [30, 0, 34, 38] and np.isnan(values).sum() == 3, \"observed_only has no NaN; its first column is [30, 0, 34, 38].\")",
        "expected": "observed_only has no NaN; its first column is [30, 0, 34, 38].",
        "reassurance": ""
      },
      {
        "title": "Sum only observed values",
        "instruction": "Create `totals` with the sum of each column of `observed_only`.",
        "code": "totals = observed_only.sum(axis=0)",
        "check": "test(\"Sum only observed values\", lambda: np.allclose(totals, [102, 165000, 21]), \"totals is [102, 165000, 21].\")",
        "expected": "totals is [102, 165000, 21].",
        "reassurance": "The sums are finite because NaN never entered the arithmetic."
      },
      {
        "title": "Prepare a fallback",
        "instruction": "Create `fallback`, an array of zeros with one entry per column of `values`. It is the answer for any column that has no observed values at all.",
        "code": "fallback = np.zeros(values.shape[1])",
        "check": "test(\"Prepare a fallback\", lambda: fallback.shape == (3,) and not fallback.any(), \"fallback is three zeros, one per column.\")",
        "expected": "fallback is three zeros, one per column.",
        "reassurance": ""
      },
      {
        "title": "Divide only where it is safe",
        "instruction": "Create `means` by dividing `totals` by `observed`, column by column, but only where `observed` is greater than zero; every other column keeps its value from `fallback`. The division function can write into an existing array and can take a condition saying where to divide.",
        "code": "means = np.divide(totals, observed, out=fallback, where=observed > 0)",
        "check": "test(\"Divide only where it is safe\", lambda: np.allclose(means, [34, 55000, 7]) and np.divide([0.0], [0], out=np.zeros(1), where=np.array([False])).tolist() == [0], \"means is [34, 55000, 7]; an unobserved column keeps zero.\")",
        "expected": "means is [34, 55000, 7]; an unobserved column keeps zero.",
        "reassurance": ""
      },
      {
        "title": "Fill the gaps",
        "instruction": "Create a new array named `filled`, replacing only missing cells in `values` with the corresponding column value from `means`. Keep every observed value and preserve `values`.",
        "code": "filled = np.where(missing, means, values)",
        "check": "test('Fill the gaps', lambda: np.allclose(filled, [[30, 55000, 12], [34, 50000, 3], [34, 60000, 7], [38, 55000, 6]]) and np.isnan(values).sum() == 3, 'The three gaps become 55000, 34 and 7; the source still has three gaps.')",
        "expected": "The three gaps become 55000, 34 and 7; the source still has three gaps.",
        "reassurance": ""
      },
      {
        "title": "Wrap the column means",
        "instruction": "Define `column_means(values, missing)`. Inside it, repeat your steps from counting the observed cells to the safe division on its two arguments, keeping the same names for the in-between results, and return the column means.",
        "code": "def column_means(values, missing):\n    observed = (~missing).sum(axis=0)\n    observed_only = np.where(missing, 0.0, values)\n    totals = observed_only.sum(axis=0)\n    fallback = np.zeros(values.shape[1])\n    means = np.divide(totals, observed, out=fallback, where=observed > 0)\n    return means",
        "check": "test(\"Wrap the column means\", lambda: np.allclose(column_means(values, missing), means) and np.isnan(values).sum() == 3, \"column_means(values, missing) returns [34, 55000, 7]; values keeps its gaps.\")",
        "expected": "column_means(values, missing) returns [34, 55000, 7]; values keeps its gaps.",
        "reassurance": "",
        "startFrom": [
          1,
          2,
          3,
          4,
          5
        ]
      },
      {
        "title": "Wrap the steps in a function",
        "instruction": "Define `impute_columns(values)`. Inside it, find the gaps in the `values` it receives, get the means from `column_means`, and fill the gaps. Return two results in order: the filled matrix and the number of missing cells in each column. For now you can assume a two-dimensional float matrix.",
        "code": "def impute_columns(values):\n    missing = np.isnan(values)\n    means = column_means(values, missing)\n    return np.where(missing, means, values), missing.sum(axis=0)",
        "check": "test(\"Wrap the steps in a function\", lambda: np.allclose(impute_columns(values)[0], filled) and impute_columns(values)[1].tolist() == [1, 1, 1] and np.isnan(values).sum() == 3, \"impute_columns(values) returns your filled matrix and the counts [1, 1, 1]; values keeps its gaps.\")",
        "expected": "impute_columns(values) returns your filled matrix and the counts [1, 1, 1]; values keeps its gaps.",
        "reassurance": "",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Accept any numeric matrix",
        "instruction": "Update `impute_columns` so it first converts whatever it receives into a floating-point NumPy array. Lists of lists and integer matrices should then work as well.",
        "code": "def impute_columns(values):\n    values = np.asarray(values, dtype=float)\n    missing = np.isnan(values)\n    means = column_means(values, missing)\n    return np.where(missing, means, values), missing.sum(axis=0)",
        "check": "test(\"Accept any numeric matrix\", lambda: np.issubdtype(impute_columns([[1, 2], [3, 4]])[0].dtype, np.floating) and impute_columns([[1, 2], [3, 4]])[0].tolist() == [[1, 2], [3, 4]], \"A list of integer lists comes back as the same numbers in a float array.\")",
        "expected": "A list of integer lists comes back as the same numbers in a float array.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Reject the wrong shape",
        "instruction": "Update `impute_columns` once more: after converting the input, if it is not two-dimensional, stop with a `ValueError` carrying a short message instead of computing anything. Then run Check for the full exercise.",
        "code": "def impute_columns(values):\n    values = np.asarray(values, dtype=float)\n    if values.ndim != 2: raise ValueError(\"expected a two-dimensional matrix\")\n    missing = np.isnan(values)\n    means = column_means(values, missing)\n    return np.where(missing, means, values), missing.sum(axis=0)",
        "check": "",
        "expected": "The full check covers integer input, an all-missing column, an empty matrix and one-dimensional input.",
        "reassurance": "",
        "startFrom": [
          9
        ]
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
        "reassurance": ""
      },
      {
        "title": "Measure each column spread",
        "instruction": "Create `scales` with the population standard deviation of each column of `values`. Use a degrees-of-freedom adjustment of zero; a constant column should have a scale of zero.",
        "code": "scales = values.std(axis=0)",
        "check": "test('Measure each column spread', lambda: np.allclose(scales, [np.sqrt(200 / 3), np.sqrt(20000 / 3), 0]), 'The first two scales are about 8.165 and 81.650; the last is 0.')",
        "expected": "The first two scales are about 8.165 and 81.650; the last is 0.",
        "reassurance": "A constant feature has a scale of zero, so dividing by it needs care."
      },
      {
        "title": "Scale without dividing by zero",
        "instruction": "Create `scaled` by scaling each column of `centered` according to `scales`. Nonconstant columns should have unit population standard deviation, while constant columns must remain zero without dividing by zero.",
        "code": "scaled = np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "test('Scale without dividing by zero', lambda: np.allclose(scaled[:, :2].mean(axis=0), 0) and np.allclose(scaled[:, :2].std(axis=0), 1) and np.allclose(scaled[:, 2], 0), 'Varying columns have mean 0 and standard deviation 1; the constant column stays 0.')",
        "expected": "Varying columns have mean 0 and standard deviation 1; the constant column stays 0.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `standardize(values)` that centers and scales each column of the `values` it receives, exactly as your three steps did, and returns the scaled matrix. For now you can assume a non-empty two-dimensional float matrix.",
        "code": "def standardize(values):\n    centered = values - values.mean(axis=0)\n    scales = values.std(axis=0)\n    return np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "test(\"Wrap it in a function\", lambda: np.allclose(standardize(values), scaled) and values[0].tolist() == [10, 100, 7], \"standardize(values) matches scaled, and values is unchanged.\")",
        "expected": "standardize(values) matches scaled, and values is unchanged.",
        "reassurance": "",
        "startFrom": [
          0,
          1
        ]
      },
      {
        "title": "Convert and check the input",
        "instruction": "Update `standardize` so it converts its input to a floating-point array first, and raises a `ValueError` when that array is not two-dimensional.",
        "code": "def standardize(values):\n    values = np.asarray(values, dtype=float)\n    if values.ndim != 2: raise ValueError(\"expected a two-dimensional matrix\")\n    centered = values - values.mean(axis=0)\n    scales = values.std(axis=0)\n    return np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Convert and check the input\", lambda: np.allclose(standardize([[1, 3], [3, 3]]), [[-1, 0], [1, 0]]) and _rejects(lambda: standardize([1.0, 2.0])), \"A list of integer lists is standardized, and a one-dimensional input raises ValueError.\")",
        "expected": "A list of integer lists is standardized, and a one-dimensional input raises ValueError.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Handle an empty matrix",
        "instruction": "A matrix with zero rows has no mean to subtract. Update `standardize` so that, when the converted input has no rows, it returns a copy of it straight away, keeping its shape. Then run Check.",
        "code": "def standardize(values):\n    values = np.asarray(values, dtype=float)\n    if values.ndim != 2: raise ValueError(\"expected a two-dimensional matrix\")\n    if len(values) == 0: return values.copy()\n    centered = values - values.mean(axis=0)\n    scales = values.std(axis=0)\n    return np.divide(centered, scales, out=np.zeros_like(centered), where=scales != 0)",
        "check": "",
        "expected": "The complete check covers constant features, a single row, empty matrices, new shapes and unchanged inputs.",
        "reassurance": "",
        "startFrom": [
          4
        ]
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
        "reassurance": ""
      },
      {
        "title": "Shift each row safely",
        "instruction": "Create `shifted` by moving each row of `logits` so that its largest score becomes zero. Keep the differences between scores and preserve the matrix shape.",
        "code": "shifted = logits - logits.max(axis=1, keepdims=True)",
        "check": "test('Shift each row safely', lambda: np.allclose(shifted.max(axis=1), 0) and np.allclose(shifted[0], [0, -6, -4]), 'Each row has maximum 0; the first row is [0, -6, -4].')",
        "expected": "Each row has maximum 0; the first row is [0, -6, -4].",
        "reassurance": "The shift keeps the differences between scores and stops the exponential from overflowing."
      },
      {
        "title": "Exponentiate the shifted scores",
        "instruction": "Create an array named `exp` containing the exponential of each value in `shifted`. Keep `shifted` unchanged.",
        "code": "exp = np.exp(shifted)",
        "check": "test('Exponentiate the shifted scores', lambda: bool(np.isfinite(exp).all()) and np.allclose(exp.max(axis=1), 1), 'All values are finite and each row has maximum 1.')",
        "expected": "All values are finite and each row has maximum 1.",
        "reassurance": ""
      },
      {
        "title": "Normalize each row",
        "instruction": "Create `probs` by normalizing each row of `exp` independently. Each value should represent its share of that row’s total.",
        "code": "probs = exp / exp.sum(axis=1, keepdims=True)",
        "check": "test('Normalize each row', lambda: np.allclose(probs.sum(axis=1), 1) and bool((probs >= 0).all()), 'Every row sums to 1, with no negative probabilities.')",
        "expected": "Every row sums to 1, with no negative probabilities.",
        "reassurance": ""
      },
      {
        "title": "Choose the winning labels",
        "instruction": "Create the list `winners` by choosing the label in `labels` with the greatest probability for each row of `probs`. If probabilities tie, choose the first class in label order.",
        "code": "winners = [labels[i] for i in probs.argmax(axis=1)]",
        "check": "test('Choose the winning labels', lambda: winners == [\"billing\", \"bug\", \"feature\"], 'winners is [\"billing\", \"bug\", \"feature\"].')",
        "expected": "winners is [\"billing\", \"bug\", \"feature\"].",
        "reassurance": ""
      },
      {
        "title": "Turn the steps into predict_proba",
        "instruction": "Define `predict_proba(X, W, b)`, with parameters in that order. It computes the logits and applies the same stable softmax you just built (shift each row by its maximum, exponentiate, normalize each row), then returns the probabilities.",
        "code": "def predict_proba(X, W, b):\n    logits = X @ W + b\n    exp = np.exp(logits - logits.max(axis=1, keepdims=True))\n    return exp / exp.sum(axis=1, keepdims=True)",
        "check": "test(\"Turn the steps into predict_proba\", lambda: np.allclose(predict_proba(X, W, b), probs) and np.isfinite(predict_proba(np.array([[1.0]]), np.array([[1000.0, 999.0]]), np.zeros(2))).all(), \"The function matches the example probabilities and stays finite for logits near 1000.\")",
        "expected": "The function matches the example probabilities and stays finite for logits near 1000.",
        "reassurance": "",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Validate the shapes",
        "instruction": "Update `predict_proba` so it first converts `X`, `W` and `b` to floating-point arrays, then raises a `ValueError` unless `X` has shape (n, d), `W` has shape (d, k) and `b` has shape (k,). Keep the stable softmax.",
        "code": "def predict_proba(X, W, b):\n    X, W, b = (np.asarray(a, dtype=float) for a in (X, W, b))\n    if X.ndim != 2 or W.ndim != 2 or X.shape[1] != W.shape[0] or b.shape != (W.shape[1],):\n        raise ValueError(\"expected X (n, d), W (d, k) and b (k,)\")\n    logits = X @ W + b\n    exp = np.exp(logits - logits.max(axis=1, keepdims=True))\n    return exp / exp.sum(axis=1, keepdims=True)",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Validate the shapes\", lambda: np.allclose(predict_proba([[1]], [[1000, 999]], [0, 0]).sum(), 1) and _rejects(lambda: predict_proba(np.ones((2, 2)), W, b)) and _rejects(lambda: predict_proba(X, W, [0.0])), \"Plain lists work, and mismatched shapes raise ValueError.\")",
        "expected": "Plain lists work, and mismatched shapes raise ValueError.",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Count the classes",
        "instruction": "Create `n_classes`: the number of classes, which is the number of columns of `W`. Use NumPy's shape function rather than the `.shape` attribute, so a plain list of lists works too.",
        "code": "n_classes = np.shape(W)[1]",
        "check": "test(\"Count the classes\", lambda: n_classes == 3, \"n_classes is 3.\")",
        "expected": "n_classes is 3.",
        "reassurance": ""
      },
      {
        "title": "Build predict_labels",
        "instruction": "Define `predict_labels(X, W, b, labels)`, with parameters in that order. Using your probability function, choose one label per row (the first label on ties) and return them as a list.",
        "code": "def predict_labels(X, W, b, labels):\n    winners = [labels[i] for i in predict_proba(X, W, b).argmax(axis=1)]\n    return winners",
        "check": "test(\"Build predict_labels\", lambda: predict_labels(X, W, b, labels) == [\"billing\", \"bug\", \"feature\"] and predict_labels(np.zeros((0, 3)), W, b, labels) == [], \"It returns [\\\"billing\\\", \\\"bug\\\", \\\"feature\\\"], and an empty batch gives [].\")",
        "expected": "It returns [\"billing\", \"bug\", \"feature\"], and an empty batch gives [].",
        "reassurance": ""
      },
      {
        "title": "Require one label per class",
        "instruction": "Update `predict_labels` so that, before predicting anything, it raises a `ValueError` unless there is exactly one label per class of `W`. Keep inputs unchanged. Then run Check.",
        "code": "def predict_labels(X, W, b, labels):\n    n_classes = np.shape(W)[1]\n    if len(labels) != n_classes:\n        raise ValueError(\"need exactly one label per class\")\n    winners = [labels[i] for i in predict_proba(X, W, b).argmax(axis=1)]\n    return winners",
        "check": "",
        "expected": "The full check includes huge logits, empty batches, tied classes, malformed shapes and unchanged inputs.",
        "reassurance": "",
        "startFrom": [
          7,
          8
        ]
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
        "reassurance": ""
      },
      {
        "title": "Make room for every pair",
        "instruction": "Create `differences` with the coordinate differences for every left/right pair. Use broadcasting rather than Python loops. Its axes should represent left point, right point and coordinate, in that order.",
        "code": "differences = left_float[:, None, :] - right_float[None, :, :]",
        "check": "test('Make room for every pair', lambda: differences.shape == (2, 3, 2) and differences[1, 0].tolist() == [3, 4], 'The shape is (2, 3, 2); the second-left/first-right difference is [3, 4].')",
        "expected": "The shape is (2, 3, 2); the second-left/first-right difference is [3, 4].",
        "reassurance": ""
      },
      {
        "title": "Reduce coordinates to distances",
        "instruction": "Create `distances` with one squared Euclidean distance per pair in `differences`. Reduce the coordinate axis, keeping the left and right point axes.",
        "code": "distances = np.sum(differences ** 2, axis=-1)",
        "check": "test('Reduce coordinates to distances', lambda: np.allclose(distances, [[0, 16, 9], [25, 9, 16]]), 'distances is [[0, 16, 9], [25, 9, 16]], with shape (2, 3).')",
        "expected": "distances is [[0, 16, 9], [25, 9, 16]], with shape (2, 3).",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `pairwise_squared(left, right)`, with parameters in that order. Inside it, repeat your three steps on its own arguments, keeping the same names for the in-between results, and return the matrix of squared distances.",
        "code": "def pairwise_squared(left, right):\n    left_float = np.asarray(left, dtype=float)\n    right_float = np.asarray(right, dtype=float)\n    differences = left_float[:, None, :] - right_float[None, :, :]\n    return np.sum(differences ** 2, axis=-1)",
        "check": "test(\"Wrap it in a function\", lambda: np.allclose(pairwise_squared(left, right), distances) and np.allclose(pairwise_squared([[50000]], [[-50000]]), [[1e10]]), \"The function matches distances and handles large integers without overflow.\")",
        "expected": "The function matches distances and handles large integers without overflow.",
        "reassurance": "",
        "startFrom": [
          0,
          1
        ]
      },
      {
        "title": "Reject mismatched shapes",
        "instruction": "Update `pairwise_squared` so that, after converting, it raises a `ValueError` unless both inputs are two-dimensional and have the same number of feature columns. Then run Check.",
        "code": "def pairwise_squared(left, right):\n    left_float = np.asarray(left, dtype=float)\n    right_float = np.asarray(right, dtype=float)\n    if left_float.ndim != 2 or right_float.ndim != 2 or left_float.shape[1] != right_float.shape[1]:\n        raise ValueError(\"expected matrices with matching feature counts\")\n    # ponytail: n*m*d temporary values; chunk rows when vector collections outgrow memory.\n    differences = left_float[:, None, :] - right_float[None, :, :]\n    return np.sum(differences ** 2, axis=-1)",
        "check": "",
        "expected": "The full check includes swapped inputs, empty collections, large integers, invalid shapes and unchanged inputs.",
        "reassurance": "",
        "startFrom": [
          3
        ]
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
        "reassurance": "Dividing by length means a long vector is not rewarded just for being long."
      },
      {
        "title": "Score every document",
        "instruction": "Create `dots` with the dot product of each row of `docs` with `query`: one number per document.",
        "code": "dots = docs @ query",
        "check": "test(\"Score every document\", lambda: np.allclose(dots, [1.0, 0.905, 31.5, 0.0, -1.0]), \"dots is [1.0, 0.905, 31.5, 0.0, -1.0].\")",
        "expected": "dots is [1.0, 0.905, 31.5, 0.0, -1.0].",
        "reassurance": ""
      },
      {
        "title": "Compute safe cosine scores",
        "instruction": "Create `scores` by dividing `dots` by `norms`. A zero-length document or query must yield a score of zero without dividing by zero.",
        "code": "scores = np.divide(dots, norms, out=np.zeros(len(docs)), where=norms != 0)",
        "check": "test(\"Compute safe cosine scores\", lambda: int(np.argmax(scores)) == 0 and np.allclose(scores[3], 0) and scores[4] < 0, \"Row 0 scores highest, row 3 scores 0, and the opposite row scores below 0.\")",
        "expected": "Row 0 scores highest, row 3 scores 0, and the opposite row scores below 0.",
        "reassurance": "The long off-topic document no longer wins just because it is long."
      },
      {
        "title": "Rank best first",
        "instruction": "Create `ranked`, an array of document row indices ordered from highest to lowest `scores`. Equal scores must keep their original row order.",
        "code": "ranked = np.argsort(-scores, kind=\"stable\")",
        "check": "test('Rank best first', lambda: ranked[:3].tolist() == [0, 1, 2] and np.argsort(-np.array([0.0, 1.0, 1.0]), kind=\"stable\").tolist() == [1, 2, 0], 'The top three rows are [0, 1, 2]; equal scores retain their original order.')",
        "expected": "The top three rows are [0, 1, 2]; equal scores retain their original order.",
        "reassurance": ""
      },
      {
        "title": "Score any matrix",
        "instruction": "Define `cosine_scores(query, matrix)`: the cosine score of `query` against every row of `matrix`, computed the way you built `scores`, with zero where a row or the query has zero length.",
        "code": "def cosine_scores(query, matrix):\n    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)\n    return np.divide(matrix @ query, norms, out=np.zeros(len(matrix)), where=norms != 0)",
        "check": "test(\"Score any matrix\", lambda: np.allclose(cosine_scores(query, docs), scores), \"cosine_scores(query, docs) matches scores.\")",
        "expected": "cosine_scores(query, docs) matches scores.",
        "reassurance": ""
      },
      {
        "title": "Finish top_k",
        "instruction": "Implement `top_k(query, matrix, k)`, with parameters in that order: score the rows with `cosine_scores`, then return the row indices of the best ones, best first, with ties in row order. Return no indices for non-positive k or an empty matrix, and all available rows if k is too large. Preserve inputs.",
        "code": "def top_k(query, matrix, k):\n    scores = cosine_scores(query, matrix)\n    return np.argsort(-scores, kind=\"stable\")[:max(0, k)]",
        "check": "",
        "expected": "The complete check includes zero vectors, a zero query, tied scores, empty data and non-positive k.",
        "reassurance": ""
      }
    ]
  }
}
