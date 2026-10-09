import type { CodingGuide } from '../guided'

export const STATS_GUIDES: Record<string, CodingGuide> = {
  "st-center": {
    "setup": "import numpy as np\n\nlatency = np.array([120, 135, 128, 142, 131, 119, 125, 900])   # ms",
    "steps": [
      {
        "title": "Compute the mean",
        "instruction": "Create `mean`: the arithmetic average of all eight values in `latency`. Use a NumPy summary rather than a loop.",
        "code": "mean = np.mean(latency)",
        "check": "test('Compute the mean', lambda: np.isclose(mean, 225.0), 'mean is 225.0: the single 900 ms request drags it far above every normal one.')",
        "expected": "mean is 225.0: the single 900 ms request drags it far above every normal one.",
        "reassurance": "The mean is right, and it already shows the problem: no real request took 225 ms."
      },
      {
        "title": "Find the median",
        "instruction": "Create `median`: the middle value of `latency` once sorted. With eight values, NumPy averages the two middle ones.",
        "code": "median = np.median(latency)",
        "check": "test('Find the median', lambda: np.isclose(median, 129.5), 'median is 129.5, halfway between the two middle values 128 and 131.')",
        "expected": "median is 129.5, halfway between the two middle values 128 and 131.",
        "reassurance": "The median ignored the outlier completely. One more summary and you can compare all three."
      },
      {
        "title": "Average only the normal requests",
        "instruction": "Create `trimmed_mean`: the mean of the values in `latency` that are below 500 ms. Select them with a boolean mask; do not modify `latency`.",
        "code": "trimmed_mean = np.mean(latency[latency < 500])",
        "check": "test('Average only the normal requests', lambda: np.isclose(trimmed_mean, 900 / 7) and latency.tolist() == [120, 135, 128, 142, 131, 119, 125, 900], 'trimmed_mean is about 128.57 (900 / 7) and latency is unchanged.')",
        "expected": "trimmed_mean is about 128.57 (900 / 7) and latency is unchanged.",
        "reassurance": "Seven normal requests average 128.6 ms, close to the median. Print the three summaries to finish."
      },
      {
        "title": "Print all three summaries",
        "instruction": "Print `mean`, `median` and `trimmed_mean`, each on its own line with a short label, then run the check.",
        "code": "print(\"mean:\", mean)\nprint(\"median:\", median)\nprint(\"trimmed mean:\", trimmed_mean)",
        "check": "",
        "expected": "The output shows 225.0, 129.5 and 128.57…, and the data is untouched.",
        "reassurance": "The complete check confirms all three summaries, the printed lines and the unchanged data."
      }
    ]
  },
  "st-spread": {
    "setup": "import numpy as np\n\nlatency = [120, 135, 128, 142, 131, 119, 125, 900]",
    "steps": [
      {
        "title": "Accept lists and refuse nothing",
        "instruction": "Define `summarize(x)` that converts `x` (a list or array) to a floating-point NumPy array and raises `ValueError` when it holds no values. For now return an empty dict for non-empty input.",
        "code": "def summarize(x):\n    x = np.asarray(x, dtype=float)\n    if x.size == 0:\n        raise ValueError(\"summarize needs at least one value\")\n    return {}",
        "check": "def _rejects():\n    try:\n        summarize([])\n    except ValueError:\n        return True\n    return False\ntest('Accept lists and refuse nothing', lambda: _rejects() and summarize(latency) == {} and summarize(np.array([1.0])) == {}, 'An empty input raises ValueError; lists and arrays are accepted.')",
        "expected": "An empty input raises ValueError; lists and arrays are accepted.",
        "reassurance": "The function guards its input. Now give it something to return."
      },
      {
        "title": "Read three percentiles in one call",
        "instruction": "Update `summarize` so the returned dict has keys `p50`, `p95` and `p99`: the 50th, 95th and 99th percentiles of `x`. One NumPy call can compute several percentiles at once.",
        "code": "def summarize(x):\n    x = np.asarray(x, dtype=float)\n    if x.size == 0:\n        raise ValueError(\"summarize needs at least one value\")\n    p50, p95, p99 = np.percentile(x, [50, 95, 99])\n    return {\"p50\": p50, \"p95\": p95, \"p99\": p99}",
        "check": "test('Read three percentiles in one call', lambda: set(summarize(latency)) == {'p50', 'p95', 'p99'} and all(np.isclose(summarize(latency)[k], np.percentile(latency, q)) for k, q in [('p50', 50), ('p95', 95), ('p99', 99)]), 'p50, p95 and p99 match NumPy for the latency list.')",
        "expected": "p50, p95 and p99 match NumPy for the latency list: p50 is 129.5 and p99 is close to 900.",
        "reassurance": "The tail is now visible: p99 sits near the 900 ms outlier while p50 stays at 129.5."
      },
      {
        "title": "Add the interquartile range and the sample spread",
        "instruction": "Extend the dict with `iqr`, the 75th percentile minus the 25th, and `std`, the sample standard deviation that divides by n − 1 rather than n.",
        "code": "def summarize(x):\n    x = np.asarray(x, dtype=float)\n    if x.size == 0:\n        raise ValueError(\"summarize needs at least one value\")\n    p25, p50, p75, p95, p99 = np.percentile(x, [25, 50, 75, 95, 99])\n    return {\"p50\": p50, \"p95\": p95, \"p99\": p99, \"iqr\": p75 - p25, \"std\": np.std(x, ddof=1)}",
        "check": "test('Add the interquartile range and the sample spread', lambda: np.isclose(summarize(latency)['iqr'], np.percentile(latency, 75) - np.percentile(latency, 25)) and np.isclose(summarize(latency)['std'], np.std(latency, ddof=1)) and not np.isclose(summarize(latency)['std'], np.std(latency)), 'iqr is p75 − p25 and std divides by n − 1 (it differs from the population formula).')",
        "expected": "iqr is p75 − p25 and std divides by n − 1 (it differs from the population formula).",
        "reassurance": "All five numbers are right. The full check also tries arrays, a single value and an extreme outlier."
      },
      {
        "title": "Print the summary",
        "instruction": "Loop over the items of `summarize(latency)` and print each key with its value rounded to one decimal, then run the check.",
        "code": "for key, value in summarize(latency).items():\n    print(f\"{key:>4}: {value:.1f}\")",
        "check": "",
        "expected": "Five labelled lines: p50 129.5, a p95 and p99 near 900, a small iqr and a large std.",
        "reassurance": "The complete check verifies every key, the n − 1 rule, outlier immunity of the iqr and the empty-input guard."
      }
    ]
  },
  "st-sampling": {
    "setup": "import numpy as np",
    "steps": [
      {
        "title": "Simulate the conversion counts",
        "instruction": "Define `simulate_rates(p, n, trials, seed=0)`. Create a seeded NumPy generator, draw `trials` binomial counts of successes out of `n` visitors who each convert with probability `p`, and return the counts divided by `n` as an array of rates.",
        "code": "def simulate_rates(p, n, trials, seed=0):\n    rng = np.random.default_rng(seed)\n    counts = rng.binomial(n, p, size=trials)\n    return counts / n",
        "check": "test('Simulate the conversion counts', lambda: simulate_rates(0.1, 50, 200, seed=3).shape == (200,) and np.allclose(simulate_rates(0.1, 50, 200, seed=3), np.random.default_rng(3).binomial(50, 0.1, size=200) / 50) and not np.array_equal(simulate_rates(0.1, 50, 200, seed=3), simulate_rates(0.1, 50, 200, seed=4)), 'Two hundred rates, multiples of 1/50, identical for the same seed and different for another seed.')",
        "expected": "Two hundred rates, multiples of 1/50, identical for the same seed and different for another seed.",
        "reassurance": "The simulation is reproducible. Next make it refuse impossible experiments."
      },
      {
        "title": "Reject impossible experiments",
        "instruction": "Before creating the generator, raise `ValueError` when `p` is outside 0 to 1 inclusive, when `n` is below 1, or when `trials` is below 1.",
        "code": "def simulate_rates(p, n, trials, seed=0):\n    if not 0 <= p <= 1 or n < 1 or trials < 1:\n        raise ValueError(\"need 0 <= p <= 1, n >= 1 and trials >= 1\")\n    rng = np.random.default_rng(seed)\n    counts = rng.binomial(n, p, size=trials)\n    return counts / n",
        "check": "def _rejects(*args):\n    try:\n        simulate_rates(*args)\n    except ValueError:\n        return True\n    return False\ntest('Reject impossible experiments', lambda: _rejects(1.5, 10, 10) and _rejects(-0.1, 10, 10) and _rejects(0.5, 0, 10) and _rejects(0.5, 10, 0) and simulate_rates(1.0, 20, 5).sum() == 5, 'Bad p, n or trials raise ValueError; p = 1 still converts everyone.')",
        "expected": "Bad p, n or trials raise ValueError; p = 1 still converts everyone.",
        "reassurance": "Invalid inputs fail loudly. Now use the simulator to measure sampling noise."
      },
      {
        "title": "Measure the wobble at two sample sizes",
        "instruction": "Create `small`: the standard deviation of 2000 simulated rates with 10 visitors each at `p = 0.12`. Create `large`: the same with 1000 visitors each. Use the default seed.",
        "code": "small = simulate_rates(0.12, 10, 2000).std()\nlarge = simulate_rates(0.12, 1000, 2000).std()",
        "check": "test('Measure the wobble at two sample sizes', lambda: large > 0 and large < small / 5 and abs(small - 0.1) < 0.03, 'small is about 0.10, large is about 0.01: a thousand visitors wobble far less than ten.')",
        "expected": "small is about 0.10, large is about 0.01: a thousand visitors wobble far less than ten.",
        "reassurance": "That ten-fold drop is the law of large numbers: spread shrinks with the square root of n."
      },
      {
        "title": "Print the evidence",
        "instruction": "Print five simulated rates for 50 visitors at `p = 0.12`, then print `small` and `large` to three decimals with labels, and run the check.",
        "code": "print(simulate_rates(0.12, 50, 5))\nprint(f\"spread with 10 visitors: {small:.3f}, with 1000: {large:.3f}\")",
        "check": "",
        "expected": "Five rates near 0.12, then the two spreads, the second about ten times smaller.",
        "reassurance": "The complete check confirms reproducibility, valid ranges, the guards and the shrinking spread."
      }
    ]
  },
  "st-bootstrap": {
    "setup": "import numpy as np\n\nlatency = [120, 135, 128, 142, 131, 119, 125, 900]",
    "steps": [
      {
        "title": "Resample with replacement",
        "instruction": "Define `bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0)`. Convert `x` to a float array, create a seeded generator, draw `n_boot` resamples of `x` with replacement as the rows of one 2-D array, and return `stat` applied to every row at once.",
        "code": "def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):\n    x = np.asarray(x, dtype=float)\n    rng = np.random.default_rng(seed)\n    resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)\n    return stat(resamples, axis=1)",
        "check": "test('Resample with replacement', lambda: bootstrap_stats(latency, n_boot=500, seed=1).shape == (500,) and np.allclose(bootstrap_stats(latency, n_boot=500, seed=1), np.mean(np.random.default_rng(1).choice(np.asarray(latency, dtype=float), size=(500, 8), replace=True), axis=1)), 'Five hundred resampled means, reproducible from seed 1, every one inside the data range.')",
        "expected": "Five hundred resampled means, reproducible from seed 1, every one inside the data range.",
        "reassurance": "The bootstrap distribution exists. It also needs to refuse an empty sample."
      },
      {
        "title": "Refuse an empty sample",
        "instruction": "Right after converting `x`, raise `ValueError` when it holds no values.",
        "code": "def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):\n    x = np.asarray(x, dtype=float)\n    if len(x) == 0:\n        raise ValueError(\"cannot bootstrap an empty sample\")\n    rng = np.random.default_rng(seed)\n    resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)\n    return stat(resamples, axis=1)",
        "check": "def _rejects():\n    try:\n        bootstrap_stats([])\n    except ValueError:\n        return True\n    return False\ntest('Refuse an empty sample', lambda: _rejects() and bootstrap_stats([5.0] * 10).tolist() == [5.0] * 1000, 'An empty list raises ValueError; a constant sample gives constant statistics.')",
        "expected": "An empty list raises ValueError; a constant sample gives constant statistics.",
        "reassurance": "The guard is in place. Now read an interval off the distribution."
      },
      {
        "title": "Read off the interval",
        "instruction": "Define `bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0)`: compute the bootstrap statistics, take their `alpha/2` and `1 − alpha/2` percentiles (in percent), and return them as a tuple of two plain floats.",
        "code": "def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):\n    stats = bootstrap_stats(x, stat, n_boot, seed)\n    low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "test('Read off the interval', lambda: (lambda ci: ci[0] < np.mean(latency) < ci[1] and all(type(v) is float for v in ci) and ci == bootstrap_ci(latency, n_boot=2000) and bootstrap_ci(latency, stat=np.median, n_boot=2000)[1] < 200)(bootstrap_ci(latency, n_boot=2000)), 'The interval brackets the mean, is made of floats, is reproducible, and the median version stays below 200.')",
        "expected": "The interval brackets the mean, is made of floats, is reproducible, and the median version stays below 200.",
        "reassurance": "You have a confidence interval for any statistic, with no formula. One guard remains."
      },
      {
        "title": "Guard alpha",
        "instruction": "At the top of `bootstrap_ci`, raise `ValueError` unless `alpha` lies strictly between 0 and 1.",
        "code": "def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):\n    if not 0 < alpha < 1:\n        raise ValueError(\"alpha must be between 0 and 1\")\n    stats = bootstrap_stats(x, stat, n_boot, seed)\n    low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "def _rejects(alpha):\n    try:\n        bootstrap_ci([1, 2, 3], alpha=alpha)\n    except ValueError:\n        return True\n    return False\ntest('Guard alpha', lambda: _rejects(0) and _rejects(1.5) and (lambda w, n: w[1] - w[0] < n[1] - n[0])(bootstrap_ci(latency, alpha=0.5, n_boot=2000), bootstrap_ci(latency, n_boot=2000)), 'alpha of 0 or 1.5 raises ValueError; a larger alpha gives a narrower interval.')",
        "expected": "alpha of 0 or 1.5 raises ValueError; a larger alpha gives a narrower interval.",
        "reassurance": "Both functions are complete and defensive. Print the intervals for the latency sample."
      },
      {
        "title": "Print the intervals",
        "instruction": "Print the mean of `latency`, its 95% bootstrap interval, and the 95% interval for the median, each with a label. Then run the check.",
        "code": "print(\"mean:\", np.mean(latency))\nprint(\"95% CI for the mean:\", bootstrap_ci(latency))\nprint(\"95% CI for the median:\", bootstrap_ci(latency, stat=np.median))",
        "check": "",
        "expected": "The mean's interval is wide because of the 900; the median's is narrow.",
        "reassurance": "The complete check verifies resampling, both guards, reproducibility, alpha and the untouched input."
      }
    ]
  },
  "st-permutation": {
    "setup": "import numpy as np\n\ncontrol = [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]\ntreatment = [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0]",
    "steps": [
      {
        "title": "Measure the observed gap",
        "instruction": "Define `mean_diff(a, b)` returning the mean of `b` minus the mean of `a` as a plain float, so a positive number means `b` did better.",
        "code": "def mean_diff(a, b):\n    return float(np.mean(b) - np.mean(a))",
        "check": "test('Measure the observed gap', lambda: np.isclose(mean_diff([1, 2, 3], [2, 3, 7]), 2.0) and np.isclose(mean_diff(control, treatment), 0.4) and type(mean_diff(control, treatment)) is float, 'The treatment converted 0.4 more per visitor than the control; the result is a float.')",
        "expected": "The treatment converted 0.4 more per visitor than the control; the result is a float.",
        "reassurance": "That 0.4 is the number to explain. Next, see what chance alone produces."
      },
      {
        "title": "Shuffle the pooled data",
        "instruction": "Define `permutation_diffs(a, b, n_perm=2000, seed=0)`. Convert both groups to float arrays, pool them, and with a seeded generator shuffle the pool `n_perm` times. For each shuffle treat the first `len(a)` values as group a and the rest as group b, and record mean of b minus mean of a. Return the gaps as an array.",
        "code": "def permutation_diffs(a, b, n_perm=2000, seed=0):\n    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)\n    rng = np.random.default_rng(seed)\n    pooled = np.concatenate([a, b])\n    shuffles = (rng.permutation(pooled) for _ in range(n_perm))\n    return np.array([s[len(a):].mean() - s[:len(a)].mean() for s in shuffles])",
        "check": "_a = np.array([0.0, 1, 0, 0, 1, 0, 0, 0, 1, 0])\n_b = np.array([1.0, 1, 0, 1, 1, 0, 1, 1, 0, 1])\n_g = np.random.default_rng(2)\n_pool = np.concatenate([_a, _b])\n_ref = np.array([(lambda s: s[10:].mean() - s[:10].mean())(_g.permutation(_pool)) for _ in range(300)])\ntest('Shuffle the pooled data', lambda: permutation_diffs(_a, _b, n_perm=300, seed=2).shape == (300,) and np.allclose(permutation_diffs(_a, _b, n_perm=300, seed=2), _ref) and permutation_diffs([1, 2, 3], [10, 20, 30, 40], n_perm=5).shape == (5,), 'Three hundred shuffled gaps, reproducible from the seed; unequal group sizes split at len(a).')",
        "expected": "Three hundred shuffled gaps, reproducible from the seed; unequal group sizes split at len(a).",
        "reassurance": "You now have the distribution of gaps under the null hypothesis."
      },
      {
        "title": "Count the extreme shuffles",
        "instruction": "Define `permutation_pvalue(a, b, n_perm=2000, seed=0)`: take the absolute observed gap, get the shuffled gaps, count how many have an absolute value at least as large, and return `(count + 1) / (n_perm + 1)`.",
        "code": "def permutation_pvalue(a, b, n_perm=2000, seed=0):\n    observed = abs(mean_diff(a, b))\n    diffs = permutation_diffs(a, b, n_perm, seed)\n    count = int((np.abs(diffs) >= observed).sum())\n    return (count + 1) / (n_perm + 1)",
        "check": "_r = np.random.default_rng(0)\n_same = _r.normal(0, 1, 40)\n_fa, _fb = _r.normal(0, 1, 40), _r.normal(2, 1, 40)\ntest('Count the extreme shuffles', lambda: permutation_pvalue(_same, _same.copy(), n_perm=500) == 1.0 and 0 < permutation_pvalue(_fa, _fb, n_perm=500) < 0.01 and np.isclose(permutation_pvalue(_fa, _fb, n_perm=500), permutation_pvalue(_fb, _fa, n_perm=500)), 'Identical groups give exactly 1.0; groups two units apart give a tiny, non-zero, symmetric p-value.')",
        "expected": "Identical groups give exactly 1.0; groups two units apart give a tiny, non-zero, symmetric p-value.",
        "reassurance": "The p-value behaves at both extremes. One guard and a printout remain."
      },
      {
        "title": "Reject empty groups",
        "instruction": "At the top of `permutation_pvalue`, raise `ValueError` when either group is empty.",
        "code": "def permutation_pvalue(a, b, n_perm=2000, seed=0):\n    if len(a) == 0 or len(b) == 0:\n        raise ValueError(\"both groups need data\")\n    observed = abs(mean_diff(a, b))\n    diffs = permutation_diffs(a, b, n_perm, seed)\n    count = int((np.abs(diffs) >= observed).sum())\n    return (count + 1) / (n_perm + 1)",
        "check": "def _rejects():\n    try:\n        permutation_pvalue([], [1, 2])\n    except ValueError:\n        return True\n    return False\ntest('Reject empty groups', lambda: _rejects() and 0 < permutation_pvalue(control, treatment) < 0.05, 'An empty group raises ValueError; the demo groups differ with p below 0.05.')",
        "expected": "An empty group raises ValueError; the demo groups differ with p below 0.05.",
        "reassurance": "Every function is complete. Report the result for the demo groups."
      },
      {
        "title": "Report the result",
        "instruction": "Print the observed gap and the p-value for `control` versus `treatment`, each with a label, then run the check.",
        "code": "print(\"gap:\", mean_diff(control, treatment))\nprint(\"p-value:\", permutation_pvalue(control, treatment))",
        "check": "",
        "expected": "A gap of 0.4 and a p-value well below 0.05.",
        "reassurance": "The complete check verifies the gap, the shuffles, both tails, reproducibility and the empty-group guard."
      }
    ]
  },
  "st-stderr": {
    "setup": "import numpy as np\n\nrng = np.random.default_rng(0)\nbefore = rng.normal(130, 20, 400)        # 400 latencies before a change\nafter = rng.normal(125, 20, 400)         # 400 after: 5 ms faster on average",
    "steps": [
      {
        "title": "Use the standard error, not the standard deviation",
        "instruction": "Define `mean_ci(x, z=1.96)`. Convert `x` to a float array, compute the standard error as the sample standard deviation (dividing by n − 1) divided by the square root of the sample size, and return the tuple of plain floats mean − z·se and mean + z·se.",
        "code": "def mean_ci(x, z=1.96):\n    x = np.asarray(x, dtype=float)\n    se = np.std(x, ddof=1) / np.sqrt(len(x))\n    return float(x.mean() - z * se), float(x.mean() + z * se)",
        "check": "test('Use the standard error, not the standard deviation', lambda: np.isclose((mean_ci(before)[0] + mean_ci(before)[1]) / 2, before.mean()) and np.isclose((mean_ci(before)[1] - mean_ci(before)[0]) / 2, 1.96 * np.std(before, ddof=1) / 20) and all(type(v) is float for v in mean_ci(before)), 'The interval is centred on the mean with half-width 1.96 · s / sqrt(400), as plain floats.')",
        "expected": "The interval is centred on the mean with half-width 1.96 · s / sqrt(400), as plain floats.",
        "reassurance": "The interval is twenty times narrower than before: that is the sqrt(n) at work."
      },
      {
        "title": "Refuse a single value",
        "instruction": "A spread needs at least two values. Raise `ValueError` when `x` holds fewer than two, right after converting it.",
        "code": "def mean_ci(x, z=1.96):\n    x = np.asarray(x, dtype=float)\n    if len(x) < 2:\n        raise ValueError(\"need at least two values for an interval\")\n    se = np.std(x, ddof=1) / np.sqrt(len(x))\n    return float(x.mean() - z * se), float(x.mean() + z * se)",
        "check": "def _rejects():\n    try:\n        mean_ci([4.0])\n    except ValueError:\n        return True\n    return False\ntest('Refuse a single value', lambda: _rejects() and mean_ci(after)[1] < mean_ci(before)[0], 'A single value raises ValueError; the before and after intervals no longer overlap.')",
        "expected": "A single value raises ValueError; the before and after intervals no longer overlap.",
        "reassurance": "The 5 ms improvement is now detectable. Print both intervals to see it."
      },
      {
        "title": "Print both intervals",
        "instruction": "Print the interval for `before` and the interval for `after`, each with a label, then run the check.",
        "code": "print(\"before:\", mean_ci(before))\nprint(\"after: \", mean_ci(after))",
        "check": "",
        "expected": "Two intervals about 4 ms wide, around 130 and 125, that do not overlap.",
        "reassurance": "The complete check verifies the centre, the half-width, the z factor, the guard and the non-overlap."
      }
    ]
  },
  "st-bayes": {
    "setup": "spam_rate, sensitivity, false_positive = 0.01, 0.99, 0.05",
    "steps": [
      {
        "title": "Update on a positive result",
        "instruction": "Define `posterior(prior, sens, fpr, positive=True)`. For a positive result, the probability of a positive is `sens · prior + fpr · (1 − prior)`; return `sens · prior` divided by that. Ignore negative results for now.",
        "code": "def posterior(prior, sens, fpr, positive=True):\n    p_positive = sens * prior + fpr * (1 - prior)\n    return sens * prior / p_positive",
        "check": "test('Update on a positive result', lambda: abs(posterior(0.01, 0.99, 0.05) - 0.99 * 0.01 / (0.99 * 0.01 + 0.05 * 0.99)) < 1e-12 and posterior(0.01, 1.0, 0.0) == 1.0 and abs(posterior(0.3, 0.5, 0.5) - 0.3) < 1e-12, 'A flagged email is spam with probability about 0.167; a perfect test is decisive and a useless one changes nothing.')",
        "expected": "A flagged email is spam with probability about 0.167; a perfect test is decisive and a useless one changes nothing.",
        "reassurance": "A 99% filter leaves a flagged email only 17% likely to be spam. Now handle a negative result."
      },
      {
        "title": "Update on a negative result",
        "instruction": "When `positive` is false, use the complementary numbers: the probability of a negative is `(1 − sens) · prior + (1 − fpr) · (1 − prior)`, and the posterior is `(1 − sens) · prior` divided by it.",
        "code": "def posterior(prior, sens, fpr, positive=True):\n    if positive:\n        p_positive = sens * prior + fpr * (1 - prior)\n        return sens * prior / p_positive\n    p_negative = (1 - sens) * prior + (1 - fpr) * (1 - prior)\n    return (1 - sens) * prior / p_negative",
        "check": "test('Update on a negative result', lambda: abs(posterior(0.3, 0.9, 0.1, positive=False) - 0.1 * 0.3 / (0.1 * 0.3 + 0.9 * 0.7)) < 1e-12 and posterior(0.99, 1.0, 0.0, positive=False) == 0.0 and abs(posterior(0.01, 0.99, 0.05) - 0.99 * 0.01 / (0.99 * 0.01 + 0.05 * 0.99)) < 1e-12, 'A negative result lowers the belief; a perfect negative drives it to 0; positives still work.')",
        "expected": "A negative result lowers the belief; a perfect negative drives it to 0; positives still work.",
        "reassurance": "Both directions of evidence are handled. Next, refuse nonsense inputs."
      },
      {
        "title": "Reject impossible probabilities",
        "instruction": "At the top of `posterior`, raise `ValueError` unless `prior`, `sens` and `fpr` all lie between 0 and 1 inclusive.",
        "code": "def posterior(prior, sens, fpr, positive=True):\n    if not all(0 <= p <= 1 for p in (prior, sens, fpr)):\n        raise ValueError(\"probabilities must be between 0 and 1\")\n    if positive:\n        p_positive = sens * prior + fpr * (1 - prior)\n        return sens * prior / p_positive\n    p_negative = (1 - sens) * prior + (1 - fpr) * (1 - prior)\n    return (1 - sens) * prior / p_negative",
        "check": "def _rejects(*args):\n    try:\n        posterior(*args)\n    except ValueError:\n        return True\n    return False\ntest('Reject impossible probabilities', lambda: _rejects(1.2, 0.9, 0.1) and _rejects(0.5, -0.1, 0.1) and _rejects(0.5, 0.9, 1.5) and 0 < posterior(0.5, 0.9, 0.1) < 1, 'Values outside 0 to 1 raise ValueError; valid ones still produce a probability.')",
        "expected": "Values outside 0 to 1 raise ValueError; valid ones still produce a probability.",
        "reassurance": "The single update is complete. Now chain several results."
      },
      {
        "title": "Accumulate evidence in order",
        "instruction": "Define `posterior_after(prior, sens, fpr, results)`. For each boolean in `results`, replace the prior with the posterior of that result, then return the final value. No results means the prior comes back unchanged.",
        "code": "def posterior_after(prior, sens, fpr, results):\n    for result in results:\n        prior = posterior(prior, sens, fpr, result)\n    return prior",
        "check": "test('Accumulate evidence in order', lambda: abs(posterior_after(0.2, 0.9, 0.1, [True, False]) - posterior(posterior(0.2, 0.9, 0.1, True), 0.9, 0.1, False)) < 1e-12 and posterior_after(0.01, 0.99, 0.05, [True, True]) > 0.75 and posterior_after(0.37, 0.9, 0.1, []) == 0.37, 'Two flags push 1% up past 75%; a flag then a clear equals two single updates; no results leaves the prior.')",
        "expected": "Two flags push 1% up past 75%; a flag then a clear equals two single updates; no results leaves the prior.",
        "reassurance": "Each posterior became the next prior. Print the demo numbers to finish."
      },
      {
        "title": "Print the spam numbers",
        "instruction": "Print the posterior after one flag (rounded to 3 decimals), after two flags (3 decimals), and after a flag followed by a clear (4 decimals), each with a label. Then run the check.",
        "code": "print(\"flagged once:  \", round(posterior(spam_rate, sensitivity, false_positive), 3))\nprint(\"flagged twice: \", round(posterior_after(spam_rate, sensitivity, false_positive, [True, True]), 3))\nprint(\"flagged, then cleared:\", round(posterior_after(spam_rate, sensitivity, false_positive, [True, False]), 4))",
        "check": "",
        "expected": "0.167 after one flag, about 0.8 after two, and a tiny number after a flag and a clear.",
        "reassurance": "The complete check verifies both update directions, the guards, the chaining and the printed 0.167."
      }
    ]
  },
  "st-ab-boss": {
    "setup": "import numpy as np\n\nrng = np.random.default_rng(42)\ncontrol = rng.binomial(1, 0.10, 800)      # old checkout: ~10% convert\ntreatment = rng.binomial(1, 0.13, 800)    # new checkout: ~13% convert",
    "steps": [
      {
        "title": "Bootstrap the lift",
        "instruction": "Define `lift_ci(control, treatment, alpha=0.05, n_boot=2000, seed=0)` for two float arrays. With one seeded generator, resample the control group `n_boot` times with replacement (one resample per row of a 2-D array) and take the row means; then do the same for the treatment group. Return the `alpha/2` and `1 − alpha/2` percentiles (in percent) of treatment means minus control means, as a tuple of plain floats.",
        "code": "def lift_ci(control, treatment, alpha=0.05, n_boot=2000, seed=0):\n    rng = np.random.default_rng(seed)\n    boot_c = rng.choice(control, size=(n_boot, len(control)), replace=True).mean(axis=1)\n    boot_t = rng.choice(treatment, size=(n_boot, len(treatment)), replace=True).mean(axis=1)\n    low, high = np.percentile(boot_t - boot_c, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "_c = np.asarray([0, 1, 0, 0, 1, 0, 1, 0] * 10, dtype=float)\n_t = np.asarray([1, 1, 0, 1, 1, 0, 1, 0] * 10, dtype=float)\n_g = np.random.default_rng(3)\n_bc = _g.choice(_c, size=(300, 80), replace=True).mean(axis=1)\n_bt = _g.choice(_t, size=(300, 80), replace=True).mean(axis=1)\n_ref = np.percentile(_bt - _bc, [2.5, 97.5])\ntest('Bootstrap the lift', lambda: np.allclose(lift_ci(_c, _t, 0.05, 300, 3), _ref) and lift_ci(_c, _t, 0.05, 300, 3)[0] < _t.mean() - _c.mean() < lift_ci(_c, _t, 0.05, 300, 3)[1] and all(type(v) is float for v in lift_ci(_c, _t, 0.05, 300, 3)), 'The interval matches a control-first resampling with seed 3, brackets the observed lift and holds plain floats.')",
        "expected": "The interval matches a control-first resampling with seed 3, brackets the observed lift and holds plain floats.",
        "reassurance": "The uncertainty of the lift is quantified. Next, how often chance produces it."
      },
      {
        "title": "Shuffle labels for a p-value",
        "instruction": "Define `permutation_p(control, treatment, n_perm=2000, seed=0)` for two float arrays. With a fresh seeded generator, pool both groups and shuffle the pool `n_perm` times; for each shuffle the first `len(control)` values play control and the rest treatment. Count the shuffles whose absolute gap (treatment mean minus control mean) is at least the absolute observed gap, and return `(count + 1) / (n_perm + 1)`.",
        "code": "def permutation_p(control, treatment, n_perm=2000, seed=0):\n    rng = np.random.default_rng(seed)\n    pooled = np.concatenate([control, treatment])\n    observed = abs(treatment.mean() - control.mean())\n    shuffles = (rng.permutation(pooled) for _ in range(n_perm))\n    gaps = np.array([s[len(control):].mean() - s[:len(control)].mean() for s in shuffles])\n    return (int((np.abs(gaps) >= observed).sum()) + 1) / (n_perm + 1)",
        "check": "_r = np.random.default_rng(1)\n_pc = _r.binomial(1, 0.10, 500).astype(float)\n_pt = _r.binomial(1, 0.16, 500).astype(float)\ntest('Shuffle labels for a p-value', lambda: permutation_p(_pc, _pc.copy(), n_perm=200) == 1.0 and 0 < permutation_p(_pc, _pt, n_perm=500, seed=3) < 0.05 and permutation_p(_pc, _pt, n_perm=500, seed=3) == permutation_p(_pc, _pt, n_perm=500, seed=3), 'Identical groups give exactly 1.0; a real 6-point lift gives a small, reproducible p-value.')",
        "expected": "Identical groups give exactly 1.0; a real 6-point lift gives a small, reproducible p-value.",
        "reassurance": "The p-value is in place. Now turn numbers into a decision."
      },
      {
        "title": "Turn the numbers into a decision",
        "instruction": "Define `decide(lift, p_value, alpha)` returning `ship` when the p-value is below `alpha` and the lift is positive, `stop` when it is below `alpha` and the lift is negative, and `inconclusive` otherwise.",
        "code": "def decide(lift, p_value, alpha):\n    if p_value < alpha and lift > 0:\n        return \"ship\"\n    if p_value < alpha and lift < 0:\n        return \"stop\"\n    return \"inconclusive\"",
        "check": "test('Turn the numbers into a decision', lambda: decide(0.03, 0.01, 0.05) == 'ship' and decide(-0.03, 0.01, 0.05) == 'stop' and decide(0.03, 0.2, 0.05) == 'inconclusive' and decide(0.0, 0.001, 0.05) == 'inconclusive', 'Significant and positive ships, significant and negative stops, everything else is inconclusive.')",
        "expected": "Significant and positive ships, significant and negative stops, everything else is inconclusive.",
        "reassurance": "The rule is explicit and testable. Assemble the report."
      },
      {
        "title": "Assemble the report",
        "instruction": "Define `ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0)`. Convert both groups to float arrays and raise `ValueError` if either is empty. Compute both rates, the lift (treatment minus control) and the p-value, and return a dict with keys `control_rate`, `treatment_rate`, `lift`, `ci`, `p_value` and `decision`, using your three helpers and plain floats.",
        "code": "def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):\n    control, treatment = np.asarray(control, dtype=float), np.asarray(treatment, dtype=float)\n    if len(control) == 0 or len(treatment) == 0:\n        raise ValueError(\"both groups need visitors\")\n    lift = float(treatment.mean() - control.mean())\n    p_value = permutation_p(control, treatment, n_perm, seed)\n    return {\"control_rate\": float(control.mean()), \"treatment_rate\": float(treatment.mean()), \"lift\": lift,\n            \"ci\": lift_ci(control, treatment, alpha, n_boot, seed), \"p_value\": float(p_value), \"decision\": decide(lift, p_value, alpha)}",
        "check": "def _rejects():\n    try:\n        ab_report([], [1, 0])\n    except ValueError:\n        return True\n    return False\n_q = ab_report([0, 1, 0, 0], [1, 1, 0, 1], n_boot=10, n_perm=10)\ntest('Assemble the report', lambda: _rejects() and set(_q) == {'control_rate', 'treatment_rate', 'lift', 'ci', 'p_value', 'decision'} and np.isclose(_q['lift'], 0.5) and type(_q['ci']) is tuple and _q['decision'] in ('ship', 'stop', 'inconclusive'), 'An empty group raises ValueError; a tiny test reports all six keys with a lift of 0.5.')",
        "expected": "An empty group raises ValueError; a tiny test reports all six keys with a lift of 0.5.",
        "reassurance": "The report is complete and reproducible. Print it for the checkout experiment."
      },
      {
        "title": "Print the checkout report",
        "instruction": "Loop over the items of the report for `control` versus `treatment` and print each key right-aligned with its value, then run the boss check.",
        "code": "for key, value in ab_report(control, treatment).items():\n    print(f\"{key:>15}: {value}\")",
        "check": "",
        "expected": "Rates near 0.10 and 0.13, a positive lift with an interval above zero, a small p-value and the decision ship.",
        "reassurance": "The boss check verifies every key, the interval, the p-value, the three decisions, reproducibility and the guards."
      }
    ]
  }
}
