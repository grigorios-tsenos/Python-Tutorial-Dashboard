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
        "reassurance": "No real request took 225 ms: the mean describes none of them."
      },
      {
        "title": "Find the median",
        "instruction": "Create `median`: the middle value of `latency` once sorted. With eight values, NumPy averages the two middle ones.",
        "code": "median = np.median(latency)",
        "check": "test('Find the median', lambda: np.isclose(median, 129.5), 'median is 129.5, halfway between the two middle values 128 and 131.')",
        "expected": "median is 129.5, halfway between the two middle values 128 and 131.",
        "reassurance": "The median ignores the outlier completely."
      },
      {
        "title": "Average only the normal requests",
        "instruction": "Create `trimmed_mean`: the mean of the values in `latency` that are below 500 ms. Select them with a boolean mask; do not modify `latency`.",
        "code": "trimmed_mean = np.mean(latency[latency < 500])",
        "check": "test('Average only the normal requests', lambda: np.isclose(trimmed_mean, 900 / 7) and latency.tolist() == [120, 135, 128, 142, 131, 119, 125, 900], 'trimmed_mean is about 128.57 (900 / 7) and latency is unchanged.')",
        "expected": "trimmed_mean is about 128.57 (900 / 7) and latency is unchanged.",
        "reassurance": ""
      },
      {
        "title": "Print all three summaries",
        "instruction": "Print `mean`, `median` and `trimmed_mean`, each on its own line with a short label, then run the check.",
        "code": "print(\"mean:\", mean)\nprint(\"median:\", median)\nprint(\"trimmed mean:\", trimmed_mean)",
        "check": "",
        "expected": "The output shows 225.0, 129.5 and 128.57…, and the data is untouched.",
        "reassurance": ""
      }
    ]
  },
  "st-spread": {
    "setup": "import numpy as np\n\nlatency = [120, 135, 128, 142, 131, 119, 125, 900]",
    "steps": [
      {
        "title": "Convert the sample",
        "instruction": "Create `x`: `latency` converted to a NumPy array of floats. Leave `latency` itself a list.",
        "code": "x = np.asarray(latency, dtype=float)",
        "check": "test('Convert the sample', lambda: isinstance(x, np.ndarray) and x.dtype == float and x.tolist() == latency and isinstance(latency, list), 'x is a float array holding the eight latencies; latency is still a list.')",
        "expected": "x is a float array holding the eight latencies; latency is still a list.",
        "reassurance": ""
      },
      {
        "title": "Read five percentiles in one call",
        "instruction": "Create `p25`, `p50`, `p75`, `p95` and `p99`: the 25th, 50th, 75th, 95th and 99th percentiles of `x`. One NumPy call computes several percentiles at once; unpack its result into the five names.",
        "code": "p25, p50, p75, p95, p99 = np.percentile(x, [25, 50, 75, 95, 99])",
        "check": "test('Read five percentiles in one call', lambda: all(np.isclose(v, np.percentile(latency, q)) for v, q in [(p25, 25), (p50, 50), (p75, 75), (p95, 95), (p99, 99)]), 'The five percentiles match NumPy: p50 is 129.5 while p99 sits close to the 900 ms outlier.')",
        "expected": "The five percentiles match NumPy: p50 is 129.5 while p99 sits close to the 900 ms outlier.",
        "reassurance": "p50 describes a typical request; p99 describes the unlucky one in a hundred."
      },
      {
        "title": "Measure the spread",
        "instruction": "Create `iqr`, the 75th percentile minus the 25th, and `std`, the sample standard deviation of `x` that divides by n − 1 rather than n.",
        "code": "iqr = p75 - p25\nstd = np.std(x, ddof=1)",
        "check": "test('Measure the spread', lambda: np.isclose(iqr, np.percentile(latency, 75) - np.percentile(latency, 25)) and np.isclose(std, np.std(latency, ddof=1)) and not np.isclose(std, np.std(latency)), 'iqr is p75 − p25 and std divides by n − 1 (it differs from the population formula).')",
        "expected": "iqr is p75 − p25 and std divides by n − 1 (it differs from the population formula).",
        "reassurance": "The 900 ms outlier inflates std to about 270 but leaves iqr near 14."
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `summarize(x)`: convert `x` to a float array, repeat your percentile and spread steps on it, and return a dict with keys `p50`, `p95`, `p99`, `iqr` and `std`.",
        "code": "def summarize(x):\n    x = np.asarray(x, dtype=float)\n    p25, p50, p75, p95, p99 = np.percentile(x, [25, 50, 75, 95, 99])\n    iqr = p75 - p25\n    std = np.std(x, ddof=1)\n    return {\"p50\": p50, \"p95\": p95, \"p99\": p99, \"iqr\": iqr, \"std\": std}",
        "check": "test('Wrap it in a function', lambda: set(summarize(latency)) == {'p50', 'p95', 'p99', 'iqr', 'std'} and all(np.isclose(summarize(latency)[k], v) for k, v in [('p50', p50), ('p95', p95), ('p99', p99), ('iqr', iqr), ('std', std)]) and np.isclose(summarize(np.array([3.0, 1.0, 2.0]))['p50'], 2.0), 'summarize(latency) matches your five numbers, and an array works as well as a list.')",
        "expected": "summarize(latency) matches your five numbers, and an array works as well as a list.",
        "reassurance": "",
        "startFrom": [
          1,
          2
        ]
      },
      {
        "title": "Refuse an empty input",
        "instruction": "Update `summarize` so that, right after converting, it raises `ValueError` when `x` holds no values.",
        "code": "def summarize(x):\n    x = np.asarray(x, dtype=float)\n    if x.size == 0:\n        raise ValueError(\"summarize needs at least one value\")\n    p25, p50, p75, p95, p99 = np.percentile(x, [25, 50, 75, 95, 99])\n    iqr = p75 - p25\n    std = np.std(x, ddof=1)\n    return {\"p50\": p50, \"p95\": p95, \"p99\": p99, \"iqr\": iqr, \"std\": std}",
        "check": "def _rejects():\n    try:\n        summarize([])\n    except ValueError:\n        return True\n    return False\ntest('Refuse an empty input', lambda: _rejects() and set(summarize(latency)) == {'p50', 'p95', 'p99', 'iqr', 'std'} and np.isclose(summarize([5])['iqr'], 0.0), 'An empty input raises ValueError; a single value still has an iqr of 0.')",
        "expected": "An empty input raises ValueError; a single value still has an iqr of 0.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Print the summary",
        "instruction": "Loop over the items of `summarize(latency)` and print each key with its value rounded to one decimal. Then run Check.",
        "code": "for key, value in summarize(latency).items():\n    print(f\"{key:>4}: {value:.1f}\")",
        "check": "",
        "expected": "Five labelled lines: p50 129.5, a p95 and p99 near 900, a small iqr and a large std.",
        "reassurance": ""
      }
    ]
  },
  "st-sampling": {
    "setup": "import numpy as np",
    "steps": [
      {
        "title": "Make a seeded generator",
        "instruction": "Store `seed` (0) and create `rng`: a NumPy random generator seeded with `seed`, so every run draws the same numbers.",
        "code": "seed = 0\nrng = np.random.default_rng(seed)",
        "check": "test(\"Make a seeded generator\", lambda: seed == 0 and isinstance(rng, np.random.Generator) and rng.bit_generator.state == np.random.default_rng(0).bit_generator.state, \"rng is a NumPy generator seeded with 0.\")",
        "expected": "rng is a NumPy generator seeded with 0.",
        "reassurance": ""
      },
      {
        "title": "Draw conversion counts",
        "instruction": "Store the settings `p` (0.12), `n` (50 visitors) and `trials` (5). Create `counts`: `trials` binomial draws from `rng`, each the number of conversions among `n` visitors who convert with probability `p`.",
        "code": "p, n, trials = 0.12, 50, 5\ncounts = rng.binomial(n, p, size=trials)",
        "check": "test('Draw conversion counts', lambda: np.array_equal(counts, np.random.default_rng(0).binomial(50, 0.12, size=5)), 'counts holds five conversion counts out of 50, reproducible from seed 0.')",
        "expected": "counts holds five conversion counts out of 50, reproducible from seed 0.",
        "reassurance": ""
      },
      {
        "title": "Turn counts into rates",
        "instruction": "Create `rates`: each count divided by `n`.",
        "code": "rates = counts / n",
        "check": "test('Turn counts into rates', lambda: np.allclose(rates, counts / 50) and bool((rates >= 0).all() and (rates <= 1).all()), 'rates holds five conversion rates between 0 and 1.')",
        "expected": "rates holds five conversion rates between 0 and 1.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `simulate_rates(p, n, trials, seed=0)` that repeats your generator, draw and rate steps with its own arguments and returns the array of rates.",
        "code": "def simulate_rates(p, n, trials, seed=0):\n    rng = np.random.default_rng(seed)\n    counts = rng.binomial(n, p, size=trials)\n    rates = counts / n\n    return rates",
        "check": "test('Wrap it in a function', lambda: simulate_rates(0.1, 50, 200, seed=3).shape == (200,) and np.allclose(simulate_rates(0.1, 50, 200, seed=3), np.random.default_rng(3).binomial(50, 0.1, size=200) / 50) and not np.array_equal(simulate_rates(0.1, 50, 200, seed=3), simulate_rates(0.1, 50, 200, seed=4)), 'Two hundred rates, multiples of 1/50, identical for the same seed and different for another seed.')",
        "expected": "Two hundred rates, multiples of 1/50, identical for the same seed and different for another seed.",
        "reassurance": "",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Reject impossible experiments",
        "instruction": "Before creating the generator, raise `ValueError` when `p` is outside 0 to 1 inclusive, when `n` is below 1, or when `trials` is below 1.",
        "code": "def simulate_rates(p, n, trials, seed=0):\n    if not 0 <= p <= 1 or n < 1 or trials < 1:\n        raise ValueError(\"need 0 <= p <= 1, n >= 1 and trials >= 1\")\n    rng = np.random.default_rng(seed)\n    counts = rng.binomial(n, p, size=trials)\n    rates = counts / n\n    return rates",
        "check": "def _rejects(*args):\n    try:\n        simulate_rates(*args)\n    except ValueError:\n        return True\n    return False\ntest('Reject impossible experiments', lambda: _rejects(1.5, 10, 10) and _rejects(-0.1, 10, 10) and _rejects(0.5, 0, 10) and _rejects(0.5, 10, 0) and simulate_rates(1.0, 20, 5).sum() == 5, 'Bad p, n or trials raise ValueError; p = 1 still converts everyone.')",
        "expected": "Bad p, n or trials raise ValueError; p = 1 still converts everyone.",
        "reassurance": "",
        "startFrom": [
          3
        ]
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
        "instruction": "Print five simulated rates for 50 visitors at `p = 0.12`, then print `small` and `large` to three decimals with labels. Then run Check.",
        "code": "print(simulate_rates(0.12, 50, 5))\nprint(f\"spread with 10 visitors: {small:.3f}, with 1000: {large:.3f}\")",
        "check": "",
        "expected": "Five rates near 0.12, then the two spreads, the second about ten times smaller.",
        "reassurance": ""
      }
    ]
  },
  "st-bootstrap": {
    "setup": "import numpy as np\n\nlatency = [120, 135, 128, 142, 131, 119, 125, 900]",
    "steps": [
      {
        "title": "Set up the resampling",
        "instruction": "Create `x`: `latency` as a float array. Store the settings `n_boot` (1000) and `seed` (0), and create `rng`, a NumPy random generator seeded with `seed`.",
        "code": "x = np.asarray(latency, dtype=float)\nn_boot, seed = 1000, 0\nrng = np.random.default_rng(seed)",
        "check": "test('Set up the resampling', lambda: x.dtype == float and x.tolist() == latency and n_boot == 1000 and rng.bit_generator.state == np.random.default_rng(0).bit_generator.state, 'x is a float copy of latency and rng is a fresh generator seeded with 0.')",
        "expected": "x is a float copy of latency and rng is a fresh generator seeded with 0.",
        "reassurance": ""
      },
      {
        "title": "Resample with replacement",
        "instruction": "Create `resamples`: a 2-D array with `n_boot` rows, each a resample of `x` as long as `x`, drawn with replacement using `rng`.",
        "code": "resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)",
        "check": "test('Resample with replacement', lambda: resamples.shape == (1000, 8) and bool(np.isin(resamples, x).all()) and np.array_equal(resamples, np.random.default_rng(0).choice(x, size=(1000, 8), replace=True)), 'A thousand rows of eight values, each drawn from latency, reproducible from seed 0.')",
        "expected": "A thousand rows of eight values, each drawn from latency, reproducible from seed 0.",
        "reassurance": "Each row repeats some values and leaves others out: that variation mimics drawing a fresh sample."
      },
      {
        "title": "Apply the statistic to every row",
        "instruction": "Store the function `np.mean` itself (not called) in `stat`. Then create `stats` by applying `stat` to every row of `resamples` in one call.",
        "code": "stat = np.mean\nstats = stat(resamples, axis=1)",
        "check": "test('Apply the statistic to every row', lambda: stat is np.mean and stats.shape == (1000,) and np.allclose(stats, resamples.mean(axis=1)), 'stats holds one resampled mean per row: a thousand of them.')",
        "expected": "stats holds one resampled mean per row: a thousand of them.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0)`: convert `x` to a float array, repeat your steps with the arguments, and return the statistic of every resample.",
        "code": "def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):\n    x = np.asarray(x, dtype=float)\n    rng = np.random.default_rng(seed)\n    resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)\n    return stat(resamples, axis=1)",
        "check": "test('Wrap it in a function', lambda: bootstrap_stats(latency, n_boot=500, seed=1).shape == (500,) and np.allclose(bootstrap_stats(latency, n_boot=500, seed=1), np.mean(np.random.default_rng(1).choice(np.asarray(latency, dtype=float), size=(500, 8), replace=True), axis=1)), 'Five hundred resampled means, reproducible from seed 1, every one inside the data range.')",
        "expected": "Five hundred resampled means, reproducible from seed 1, every one inside the data range.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Refuse an empty sample",
        "instruction": "Right after converting `x`, raise `ValueError` when it holds no values.",
        "code": "def bootstrap_stats(x, stat=np.mean, n_boot=1000, seed=0):\n    x = np.asarray(x, dtype=float)\n    if len(x) == 0:\n        raise ValueError(\"cannot bootstrap an empty sample\")\n    rng = np.random.default_rng(seed)\n    resamples = rng.choice(x, size=(n_boot, len(x)), replace=True)\n    return stat(resamples, axis=1)",
        "check": "def _rejects():\n    try:\n        bootstrap_stats([])\n    except ValueError:\n        return True\n    return False\ntest('Refuse an empty sample', lambda: _rejects() and bootstrap_stats([5.0] * 10).tolist() == [5.0] * 1000, 'An empty list raises ValueError; a constant sample gives constant statistics.')",
        "expected": "An empty list raises ValueError; a constant sample gives constant statistics.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Read off the interval",
        "instruction": "Store `alpha` (0.05). Create `low` and `high`: the `alpha/2` and `1 − alpha/2` percentiles of `stats`, written in percent (2.5 and 97.5 here).",
        "code": "alpha = 0.05\nlow, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])",
        "check": "test('Read off the interval', lambda: np.isclose(low, np.percentile(stats, 2.5)) and np.isclose(high, np.percentile(stats, 97.5)) and low < np.mean(latency) < high, 'low and high are the 2.5th and 97.5th percentiles of stats and bracket the mean.')",
        "expected": "low and high are the 2.5th and 97.5th percentiles of stats and bracket the mean.",
        "reassurance": "That is a 95% confidence interval for the mean, found without any formula."
      },
      {
        "title": "Wrap the interval",
        "instruction": "Define `bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0)`: get the bootstrap statistics from `bootstrap_stats`, read off the two percentiles, and return them as a tuple of two plain floats.",
        "code": "def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):\n    stats = bootstrap_stats(x, stat, n_boot, seed)\n    low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "test('Wrap the interval', lambda: (lambda ci: ci[0] < np.mean(latency) < ci[1] and all(type(v) is float for v in ci) and ci == bootstrap_ci(latency, n_boot=2000) and bootstrap_ci(latency, stat=np.median, n_boot=2000)[1] < 200)(bootstrap_ci(latency, n_boot=2000)), 'The interval brackets the mean, is made of floats, is reproducible, and the median version stays below 200.')",
        "expected": "The interval brackets the mean, is made of floats, is reproducible, and the median version stays below 200.",
        "reassurance": "Pass np.median as stat and the same code gives an interval for the median."
      },
      {
        "title": "Guard alpha",
        "instruction": "At the top of `bootstrap_ci`, raise `ValueError` unless `alpha` lies strictly between 0 and 1.",
        "code": "def bootstrap_ci(x, stat=np.mean, n_boot=1000, alpha=0.05, seed=0):\n    if not 0 < alpha < 1:\n        raise ValueError(\"alpha must be between 0 and 1\")\n    stats = bootstrap_stats(x, stat, n_boot, seed)\n    low, high = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "def _rejects(alpha):\n    try:\n        bootstrap_ci([1, 2, 3], alpha=alpha)\n    except ValueError:\n        return True\n    return False\ntest('Guard alpha', lambda: _rejects(0) and _rejects(1.5) and (lambda w, n: w[1] - w[0] < n[1] - n[0])(bootstrap_ci(latency, alpha=0.5, n_boot=2000), bootstrap_ci(latency, n_boot=2000)), 'alpha of 0 or 1.5 raises ValueError; a larger alpha gives a narrower interval.')",
        "expected": "alpha of 0 or 1.5 raises ValueError; a larger alpha gives a narrower interval.",
        "reassurance": "",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Print the intervals",
        "instruction": "Print the mean of `latency`, its 95% bootstrap interval, and the 95% interval for the median, each with a label. Then run Check.",
        "code": "print(\"mean:\", np.mean(latency))\nprint(\"95% CI for the mean:\", bootstrap_ci(latency))\nprint(\"95% CI for the median:\", bootstrap_ci(latency, stat=np.median))",
        "check": "",
        "expected": "The mean's interval is wide because of the 900; the median's is narrow.",
        "reassurance": ""
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
        "reassurance": ""
      },
      {
        "title": "Pool the groups",
        "instruction": "Create `a` and `b`: `control` and `treatment` as float arrays. Then create `pooled`: one array holding `a` followed by `b`.",
        "code": "a, b = np.asarray(control, dtype=float), np.asarray(treatment, dtype=float)\npooled = np.concatenate([a, b])",
        "check": "test('Pool the groups', lambda: pooled.shape == (40,) and pooled.dtype == float and pooled[:20].tolist() == control and pooled[20:].tolist() == treatment, 'pooled holds the 20 control values followed by the 20 treatment values.')",
        "expected": "pooled holds the 20 control values followed by the 20 treatment values.",
        "reassurance": ""
      },
      {
        "title": "Try a shuffle",
        "instruction": "Create `shuffled`: a shuffled copy of the array `a`, drawn with a NumPy generator seeded with 1. `a` itself must stay in its original order.",
        "code": "shuffled = np.random.default_rng(1).permutation(a)",
        "check": "test(\"Try a shuffle\", lambda: sorted(shuffled.tolist()) == sorted(a.tolist()) and shuffled.tolist() != a.tolist() and a.tolist() == control, \"shuffled holds the 20 control values in a new order; a is unchanged.\")",
        "expected": "shuffled holds the 20 control values in a new order; a is unchanged.",
        "reassurance": ""
      },
      {
        "title": "Shuffle once",
        "instruction": "Store the settings `n_perm` (2000) and `seed` (0), create `rng` seeded with `seed`, and create `s`: a shuffled copy of `pooled` drawn with `rng`.",
        "code": "n_perm, seed = 2000, 0\nrng = np.random.default_rng(seed)\ns = rng.permutation(pooled)",
        "check": "test('Shuffle once', lambda: n_perm == 2000 and sorted(s.tolist()) == sorted(pooled.tolist()) and pooled[:20].tolist() == control, 's holds the same 40 values in a new order; pooled is unchanged.')",
        "expected": "s holds the same 40 values in a new order; pooled is unchanged.",
        "reassurance": ""
      },
      {
        "title": "Measure the gap of one shuffle",
        "instruction": "Create `gap`: in `s`, the mean of the values after the first `len(a)` minus the mean of the first `len(a)`.",
        "code": "gap = s[len(a):].mean() - s[:len(a)].mean()",
        "check": "test('Measure the gap of one shuffle', lambda: np.isclose(gap, s[20:].mean() - s[:20].mean()), 'gap is the difference chance alone produced for this one relabelling.')",
        "expected": "gap is the difference chance alone produced for this one relabelling.",
        "reassurance": ""
      },
      {
        "title": "Shuffle many times",
        "instruction": "Create `diffs`: an array of `n_perm` such gaps, each from a fresh shuffle of `pooled` drawn with `rng`. A generator of shuffles fed into a list comprehension keeps it to two lines.",
        "code": "shuffles = (rng.permutation(pooled) for _ in range(n_perm))\ndiffs = np.array([s[len(a):].mean() - s[:len(a)].mean() for s in shuffles])",
        "check": "test('Shuffle many times', lambda: diffs.shape == (2000,) and abs(diffs.mean()) < 0.05 and np.allclose(diffs * 20, np.round(diffs * 20)), 'Two thousand shuffled gaps, centred near zero.')",
        "expected": "Two thousand shuffled gaps, centred near zero.",
        "reassurance": "This is the distribution of gaps when the labels mean nothing: the null hypothesis."
      },
      {
        "title": "Wrap the shuffles",
        "instruction": "Define `permutation_diffs(a, b, n_perm=2000, seed=0)`: convert both groups to float arrays, repeat your pooling and shuffling with the arguments, and return the array of gaps.",
        "code": "def permutation_diffs(a, b, n_perm=2000, seed=0):\n    a, b = np.asarray(a, dtype=float), np.asarray(b, dtype=float)\n    rng = np.random.default_rng(seed)\n    pooled = np.concatenate([a, b])\n    shuffles = (rng.permutation(pooled) for _ in range(n_perm))\n    diffs = np.array([s[len(a):].mean() - s[:len(a)].mean() for s in shuffles])\n    return diffs",
        "check": "_a = np.array([0.0, 1, 0, 0, 1, 0, 0, 0, 1, 0])\n_b = np.array([1.0, 1, 0, 1, 1, 0, 1, 1, 0, 1])\n_g = np.random.default_rng(2)\n_pool = np.concatenate([_a, _b])\n_ref = np.array([(lambda s: s[10:].mean() - s[:10].mean())(_g.permutation(_pool)) for _ in range(300)])\ntest('Wrap the shuffles', lambda: permutation_diffs(_a, _b, n_perm=300, seed=2).shape == (300,) and np.allclose(permutation_diffs(_a, _b, n_perm=300, seed=2), _ref) and permutation_diffs([1, 2, 3], [10, 20, 30, 40], n_perm=5).shape == (5,), 'Three hundred shuffled gaps, reproducible from the seed; unequal group sizes split at len(a).')",
        "expected": "Three hundred shuffled gaps, reproducible from the seed; unequal group sizes split at len(a).",
        "reassurance": "",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Count the extreme shuffles",
        "instruction": "Create `observed`: the absolute gap between `a` and `b` from `mean_diff`. Create `count`: how many values in `diffs` have an absolute value at least as large, as a plain int.",
        "code": "observed = abs(mean_diff(a, b))\ncount = int((np.abs(diffs) >= observed).sum())",
        "check": "test('Count the extreme shuffles', lambda: np.isclose(observed, 0.4) and type(count) is int and count == int((np.abs(diffs) >= observed).sum()) and count < 100, 'observed is 0.4, and only a few dozen of the 2000 shuffles reach it.')",
        "expected": "observed is 0.4, and only a few dozen of the 2000 shuffles reach it.",
        "reassurance": "(count + 1) / (n_perm + 1) is the p-value: the observed labelling counts as one shuffle, so it is never exactly zero."
      },
      {
        "title": "Wrap the p-value",
        "instruction": "Define `permutation_pvalue(a, b, n_perm=2000, seed=0)`: repeat your count with gaps from `permutation_diffs`, and return `(count + 1) / (n_perm + 1)`.",
        "code": "def permutation_pvalue(a, b, n_perm=2000, seed=0):\n    observed = abs(mean_diff(a, b))\n    diffs = permutation_diffs(a, b, n_perm, seed)\n    count = int((np.abs(diffs) >= observed).sum())\n    return (count + 1) / (n_perm + 1)",
        "check": "_r = np.random.default_rng(0)\n_same = _r.normal(0, 1, 40)\n_fa, _fb = _r.normal(0, 1, 40), _r.normal(2, 1, 40)\ntest('Wrap the p-value', lambda: permutation_pvalue(_same, _same.copy(), n_perm=500) == 1.0 and 0 < permutation_pvalue(_fa, _fb, n_perm=500) < 0.01 and np.isclose(permutation_pvalue(_fa, _fb, n_perm=500), permutation_pvalue(_fb, _fa, n_perm=500)), 'Identical groups give exactly 1.0; groups two units apart give a tiny, non-zero, symmetric p-value.')",
        "expected": "Identical groups give exactly 1.0; groups two units apart give a tiny, non-zero, symmetric p-value.",
        "reassurance": "",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Reject empty groups",
        "instruction": "At the top of `permutation_pvalue`, raise `ValueError` when either group is empty.",
        "code": "def permutation_pvalue(a, b, n_perm=2000, seed=0):\n    if len(a) == 0 or len(b) == 0:\n        raise ValueError(\"both groups need data\")\n    observed = abs(mean_diff(a, b))\n    diffs = permutation_diffs(a, b, n_perm, seed)\n    count = int((np.abs(diffs) >= observed).sum())\n    return (count + 1) / (n_perm + 1)",
        "check": "def _rejects():\n    try:\n        permutation_pvalue([], [1, 2])\n    except ValueError:\n        return True\n    return False\ntest('Reject empty groups', lambda: _rejects() and 0 < permutation_pvalue(control, treatment) < 0.05, 'An empty group raises ValueError; the demo groups differ with p below 0.05.')",
        "expected": "An empty group raises ValueError; the demo groups differ with p below 0.05.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Report the result",
        "instruction": "Print the observed gap and the p-value for `control` versus `treatment`, each with a label. Then run Check.",
        "code": "print(\"gap:\", mean_diff(control, treatment))\nprint(\"p-value:\", permutation_pvalue(control, treatment))",
        "check": "",
        "expected": "A gap of 0.4 and a p-value well below 0.05.",
        "reassurance": ""
      }
    ]
  },
  "st-stderr": {
    "setup": "import numpy as np\n\nrng = np.random.default_rng(0)\nbefore = rng.normal(130, 20, 400)        # 400 latencies before a change\nafter = rng.normal(125, 20, 400)         # 400 after: 5 ms faster on average",
    "steps": [
      {
        "title": "Compute the standard error",
        "instruction": "Store `x` (the `before` sample) and `z` (1.96). Create `se`: the sample standard deviation of `x` (dividing by n − 1) divided by the square root of the sample size.",
        "code": "x, z = before, 1.96\nse = np.std(x, ddof=1) / np.sqrt(len(x))",
        "check": "test('Compute the standard error', lambda: z == 1.96 and np.isclose(se, np.std(before, ddof=1) / 20), 'se is about 1 ms: the standard deviation of about 20 divided by sqrt(400).')",
        "expected": "se is about 1 ms: the standard deviation of about 20 divided by sqrt(400).",
        "reassurance": "The data spread by 20 ms, but their mean is uncertain by only about 1 ms."
      },
      {
        "title": "Build the interval",
        "instruction": "Create `low` and `high`: the mean of `x` minus and plus `z` standard errors.",
        "code": "low, high = x.mean() - z * se, x.mean() + z * se",
        "check": "test('Build the interval', lambda: np.isclose((low + high) / 2, before.mean()) and np.isclose((high - low) / 2, 1.96 * se), 'The interval is centred on the mean with half-width 1.96 · se.')",
        "expected": "The interval is centred on the mean with half-width 1.96 · se.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `mean_ci(x, z=1.96)`: convert `x` to a float array, repeat your standard-error step, and return the interval as a tuple of two plain floats.",
        "code": "def mean_ci(x, z=1.96):\n    x = np.asarray(x, dtype=float)\n    se = np.std(x, ddof=1) / np.sqrt(len(x))\n    return float(x.mean() - z * se), float(x.mean() + z * se)",
        "check": "test('Wrap it in a function', lambda: np.isclose((mean_ci(before)[0] + mean_ci(before)[1]) / 2, before.mean()) and np.isclose((mean_ci(before)[1] - mean_ci(before)[0]) / 2, 1.96 * np.std(before, ddof=1) / 20) and all(type(v) is float for v in mean_ci(before)), 'The interval is centred on the mean with half-width 1.96 · s / sqrt(400), as plain floats.')",
        "expected": "The interval is centred on the mean with half-width 1.96 · s / sqrt(400), as plain floats.",
        "reassurance": ""
      },
      {
        "title": "Refuse a single value",
        "instruction": "A spread needs at least two values. Raise `ValueError` when `x` holds fewer than two, right after converting it.",
        "code": "def mean_ci(x, z=1.96):\n    x = np.asarray(x, dtype=float)\n    if len(x) < 2:\n        raise ValueError(\"need at least two values for an interval\")\n    se = np.std(x, ddof=1) / np.sqrt(len(x))\n    return float(x.mean() - z * se), float(x.mean() + z * se)",
        "check": "def _rejects():\n    try:\n        mean_ci([4.0])\n    except ValueError:\n        return True\n    return False\ntest('Refuse a single value', lambda: _rejects() and mean_ci(after)[1] < mean_ci(before)[0], 'A single value raises ValueError; the before and after intervals no longer overlap.')",
        "expected": "A single value raises ValueError; the before and after intervals no longer overlap.",
        "reassurance": "The 5 ms improvement is now detectable.",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Print both intervals",
        "instruction": "Print the interval for `before` and the interval for `after`, each with a label. Then run Check.",
        "code": "print(\"before:\", mean_ci(before))\nprint(\"after: \", mean_ci(after))",
        "check": "",
        "expected": "Two intervals about 4 ms wide, around 130 and 125, that do not overlap.",
        "reassurance": ""
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
        "reassurance": "A 99% filter leaves a flagged email only 17% likely to be spam, because spam is rare."
      },
      {
        "title": "Update on a negative result",
        "instruction": "When `positive` is false, use the complementary numbers: the probability of a negative is `(1 − sens) · prior + (1 − fpr) · (1 − prior)`, and the posterior is `(1 − sens) · prior` divided by it.",
        "code": "def posterior(prior, sens, fpr, positive=True):\n    if positive:\n        p_positive = sens * prior + fpr * (1 - prior)\n        return sens * prior / p_positive\n    p_negative = (1 - sens) * prior + (1 - fpr) * (1 - prior)\n    return (1 - sens) * prior / p_negative",
        "check": "test('Update on a negative result', lambda: abs(posterior(0.3, 0.9, 0.1, positive=False) - 0.1 * 0.3 / (0.1 * 0.3 + 0.9 * 0.7)) < 1e-12 and posterior(0.99, 1.0, 0.0, positive=False) == 0.0 and abs(posterior(0.01, 0.99, 0.05) - 0.99 * 0.01 / (0.99 * 0.01 + 0.05 * 0.99)) < 1e-12, 'A negative result lowers the belief; a perfect negative drives it to 0; positives still work.')",
        "expected": "A negative result lowers the belief; a perfect negative drives it to 0; positives still work.",
        "reassurance": "",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Reject impossible probabilities",
        "instruction": "At the top of `posterior`, raise `ValueError` unless `prior`, `sens` and `fpr` all lie between 0 and 1 inclusive.",
        "code": "def posterior(prior, sens, fpr, positive=True):\n    if not all(0 <= p <= 1 for p in (prior, sens, fpr)):\n        raise ValueError(\"probabilities must be between 0 and 1\")\n    if positive:\n        p_positive = sens * prior + fpr * (1 - prior)\n        return sens * prior / p_positive\n    p_negative = (1 - sens) * prior + (1 - fpr) * (1 - prior)\n    return (1 - sens) * prior / p_negative",
        "check": "def _rejects(*args):\n    try:\n        posterior(*args)\n    except ValueError:\n        return True\n    return False\ntest('Reject impossible probabilities', lambda: _rejects(1.2, 0.9, 0.1) and _rejects(0.5, -0.1, 0.1) and _rejects(0.5, 0.9, 1.5) and 0 < posterior(0.5, 0.9, 0.1) < 1, 'Values outside 0 to 1 raise ValueError; valid ones still produce a probability.')",
        "expected": "Values outside 0 to 1 raise ValueError; valid ones still produce a probability.",
        "reassurance": "",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Apply two results in turn",
        "instruction": "Store `prior`, `sens` and `fpr` from the spam numbers in the setup, and `results` as a list of two positive results. Then loop over `results`, replacing `prior` with its posterior after each result.",
        "code": "prior, sens, fpr, results = spam_rate, sensitivity, false_positive, [True, True]\nfor result in results:\n    prior = posterior(prior, sens, fpr, result)",
        "check": "test('Apply two results in turn', lambda: abs(prior - posterior(posterior(0.01, 0.99, 0.05), 0.99, 0.05)) < 1e-12 and prior > 0.75, 'After two flags prior is above 0.75: the first posterior became the second prior.')",
        "expected": "After two flags prior is above 0.75: the first posterior became the second prior.",
        "reassurance": "Each posterior becomes the next prior."
      },
      {
        "title": "Wrap the loop",
        "instruction": "Define `posterior_after(prior, sens, fpr, results)` that runs your loop on its arguments and returns the final value. No results means the prior comes back unchanged.",
        "code": "def posterior_after(prior, sens, fpr, results):\n    for result in results:\n        prior = posterior(prior, sens, fpr, result)\n    return prior",
        "check": "test('Wrap the loop', lambda: abs(posterior_after(0.2, 0.9, 0.1, [True, False]) - posterior(posterior(0.2, 0.9, 0.1, True), 0.9, 0.1, False)) < 1e-12 and posterior_after(0.01, 0.99, 0.05, [True, True]) > 0.75 and posterior_after(0.37, 0.9, 0.1, []) == 0.37, 'Two flags push 1% up past 75%; a flag then a clear equals two single updates; no results leaves the prior.')",
        "expected": "Two flags push 1% up past 75%; a flag then a clear equals two single updates; no results leaves the prior.",
        "reassurance": "",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Print the spam numbers",
        "instruction": "Print the posterior after one flag (rounded to 3 decimals), after two flags (3 decimals), and after a flag followed by a clear (4 decimals), each with a label. Then run Check.",
        "code": "print(\"flagged once:  \", round(posterior(spam_rate, sensitivity, false_positive), 3))\nprint(\"flagged twice: \", round(posterior_after(spam_rate, sensitivity, false_positive, [True, True]), 3))\nprint(\"flagged, then cleared:\", round(posterior_after(spam_rate, sensitivity, false_positive, [True, False]), 4))",
        "check": "",
        "expected": "0.167 after one flag, about 0.8 after two, and a tiny number after a flag and a clear.",
        "reassurance": ""
      }
    ]
  },
  "st-ab-boss": {
    "setup": "import numpy as np\n\nrng = np.random.default_rng(42)\ncontrol = rng.binomial(1, 0.10, 800)      # old checkout: ~10% convert\ntreatment = rng.binomial(1, 0.13, 800)    # new checkout: ~13% convert",
    "steps": [
      {
        "title": "Bootstrap the control group",
        "instruction": "Store the settings `alpha` (0.05), `n_boot` (2000) and `seed` (0), and create `rng` seeded with `seed`. Then create `boot_c`: the means of `n_boot` resamples of `control`, each drawn with replacement and as long as `control`, one resample per row of a 2-D array.",
        "code": "alpha, n_boot, seed = 0.05, 2000, 0\nrng = np.random.default_rng(seed)\nboot_c = rng.choice(control, size=(n_boot, len(control)), replace=True).mean(axis=1)",
        "check": "test('Bootstrap the control group', lambda: boot_c.shape == (2000,) and np.allclose(boot_c, np.random.default_rng(0).choice(control, size=(2000, 800), replace=True).mean(axis=1)), 'Two thousand resampled control rates from seed 0, centred near 0.094.')",
        "expected": "Two thousand resampled control rates from seed 0, centred near 0.094.",
        "reassurance": ""
      },
      {
        "title": "Bootstrap the treatment and read the interval",
        "instruction": "With the same `rng`, create `boot_t` the same way for `treatment`. Then create `low` and `high`: the `alpha/2` and `1 − alpha/2` percentiles (in percent) of `boot_t - boot_c`.",
        "code": "boot_t = rng.choice(treatment, size=(n_boot, len(treatment)), replace=True).mean(axis=1)\nlow, high = np.percentile(boot_t - boot_c, [100 * alpha / 2, 100 * (1 - alpha / 2)])",
        "check": "_g = np.random.default_rng(0)\n_bc = _g.choice(control, size=(2000, 800), replace=True).mean(axis=1)\n_bt = _g.choice(treatment, size=(2000, 800), replace=True).mean(axis=1)\ntest('Bootstrap the treatment and read the interval', lambda: np.allclose([low, high], np.percentile(_bt - _bc, [2.5, 97.5])) and 0 < low < treatment.mean() - control.mean() < high, 'The 95% interval of the lift runs from about 0.024 to 0.088: it excludes zero.')",
        "expected": "The 95% interval of the lift runs from about 0.024 to 0.088: it excludes zero.",
        "reassurance": ""
      },
      {
        "title": "Wrap the lift interval",
        "instruction": "Define `lift_ci(control, treatment, alpha=0.05, n_boot=2000, seed=0)` for two arrays: repeat your two steps with the arguments and return `low` and `high` as a tuple of plain floats.",
        "code": "def lift_ci(control, treatment, alpha=0.05, n_boot=2000, seed=0):\n    rng = np.random.default_rng(seed)\n    boot_c = rng.choice(control, size=(n_boot, len(control)), replace=True).mean(axis=1)\n    boot_t = rng.choice(treatment, size=(n_boot, len(treatment)), replace=True).mean(axis=1)\n    low, high = np.percentile(boot_t - boot_c, [100 * alpha / 2, 100 * (1 - alpha / 2)])\n    return float(low), float(high)",
        "check": "_c = np.asarray([0, 1, 0, 0, 1, 0, 1, 0] * 10, dtype=float)\n_t = np.asarray([1, 1, 0, 1, 1, 0, 1, 0] * 10, dtype=float)\n_g = np.random.default_rng(3)\n_bc = _g.choice(_c, size=(300, 80), replace=True).mean(axis=1)\n_bt = _g.choice(_t, size=(300, 80), replace=True).mean(axis=1)\n_ref = np.percentile(_bt - _bc, [2.5, 97.5])\ntest('Wrap the lift interval', lambda: np.allclose(lift_ci(_c, _t, 0.05, 300, 3), _ref) and lift_ci(_c, _t, 0.05, 300, 3)[0] < _t.mean() - _c.mean() < lift_ci(_c, _t, 0.05, 300, 3)[1] and all(type(v) is float for v in lift_ci(_c, _t, 0.05, 300, 3)), 'The interval matches a control-first resampling with seed 3, brackets the observed lift and holds plain floats.')",
        "expected": "The interval matches a control-first resampling with seed 3, brackets the observed lift and holds plain floats.",
        "reassurance": "",
        "startFrom": [
          0,
          1
        ]
      },
      {
        "title": "Pool the groups for shuffling",
        "instruction": "Store `n_perm` (2000) and reseed `rng` with `seed`, so the shuffles are reproducible on their own. Create `pooled`: `control` followed by `treatment` in one array, and `observed`: the absolute gap between the treatment and control means.",
        "code": "n_perm = 2000\nrng = np.random.default_rng(seed)\npooled = np.concatenate([control, treatment])\nobserved = abs(treatment.mean() - control.mean())",
        "check": "test('Pool the groups for shuffling', lambda: n_perm == 2000 and rng.bit_generator.state == np.random.default_rng(0).bit_generator.state and pooled.shape == (1600,) and np.array_equal(pooled[:800], control) and np.isclose(observed, 0.05625), 'rng is freshly seeded, pooled holds all 1600 visitors and observed is 0.05625.')",
        "expected": "rng is freshly seeded, pooled holds all 1600 visitors and observed is 0.05625.",
        "reassurance": ""
      },
      {
        "title": "Shuffle and count",
        "instruction": "Create `gaps`: for each of `n_perm` fresh shuffles of `pooled` drawn with `rng`, the mean of the values after the first `len(control)` minus the mean of the first `len(control)`. Then create `p_value`: the number of gaps whose absolute value is at least `observed`, plus one, divided by `n_perm + 1`.",
        "code": "shuffles = (rng.permutation(pooled) for _ in range(n_perm))\ngaps = np.array([s[len(control):].mean() - s[:len(control)].mean() for s in shuffles])\np_value = (int((np.abs(gaps) >= observed).sum()) + 1) / (n_perm + 1)",
        "check": "test('Shuffle and count', lambda: gaps.shape == (2000,) and abs(gaps.mean()) < 0.005 and np.isclose(p_value, ((np.abs(gaps) >= observed).sum() + 1) / 2001) and 0 < p_value < 0.01, 'p_value is about 0.0015: chance alone rarely produces a gap this large.')",
        "expected": "p_value is about 0.0015: chance alone rarely produces a gap this large.",
        "reassurance": ""
      },
      {
        "title": "Wrap the p-value",
        "instruction": "Define `permutation_p(control, treatment, n_perm=2000, seed=0)` for two arrays: repeat your two shuffling steps with the arguments and return the p-value.",
        "code": "def permutation_p(control, treatment, n_perm=2000, seed=0):\n    rng = np.random.default_rng(seed)\n    pooled = np.concatenate([control, treatment])\n    observed = abs(treatment.mean() - control.mean())\n    shuffles = (rng.permutation(pooled) for _ in range(n_perm))\n    gaps = np.array([s[len(control):].mean() - s[:len(control)].mean() for s in shuffles])\n    p_value = (int((np.abs(gaps) >= observed).sum()) + 1) / (n_perm + 1)\n    return p_value",
        "check": "_r = np.random.default_rng(1)\n_pc = _r.binomial(1, 0.10, 500).astype(float)\n_pt = _r.binomial(1, 0.16, 500).astype(float)\ntest('Wrap the p-value', lambda: permutation_p(_pc, _pc.copy(), n_perm=200) == 1.0 and 0 < permutation_p(_pc, _pt, n_perm=500, seed=3) < 0.05 and permutation_p(_pc, _pt, n_perm=500, seed=3) == permutation_p(_pc, _pt, n_perm=500, seed=3), 'Identical groups give exactly 1.0; a real 6-point lift gives a small, reproducible p-value.')",
        "expected": "Identical groups give exactly 1.0; a real 6-point lift gives a small, reproducible p-value.",
        "reassurance": "",
        "startFrom": [
          3,
          4
        ]
      },
      {
        "title": "Ship a significant win",
        "instruction": "Define `decide(lift, p_value, alpha)` returning `ship` when `p_value` is below `alpha` and `lift` is positive, and `inconclusive` otherwise.",
        "code": "def decide(lift, p_value, alpha):\n    if p_value < alpha and lift > 0: return \"ship\"\n    return \"inconclusive\"",
        "check": "test('Ship a significant win', lambda: decide(0.03, 0.01, 0.05) == 'ship' and decide(0.03, 0.2, 0.05) == 'inconclusive' and decide(0.0, 0.001, 0.05) == 'inconclusive', 'Significant and positive ships; a large p-value or a zero lift is inconclusive.')",
        "expected": "Significant and positive ships; a large p-value or a zero lift is inconclusive.",
        "reassurance": ""
      },
      {
        "title": "Stop a significant loss",
        "instruction": "Update `decide` so it returns `stop` when `p_value` is below `alpha` and `lift` is negative.",
        "code": "def decide(lift, p_value, alpha):\n    if p_value < alpha and lift > 0: return \"ship\"\n    if p_value < alpha and lift < 0: return \"stop\"\n    return \"inconclusive\"",
        "check": "test('Stop a significant loss', lambda: decide(0.03, 0.01, 0.05) == 'ship' and decide(-0.03, 0.01, 0.05) == 'stop' and decide(0.03, 0.2, 0.05) == 'inconclusive' and decide(0.0, 0.001, 0.05) == 'inconclusive', 'Significant and positive ships, significant and negative stops, everything else is inconclusive.')",
        "expected": "Significant and positive ships, significant and negative stops, everything else is inconclusive.",
        "reassurance": "Inconclusive is not the same as no effect: the data simply cannot tell the lift from chance.",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Gather the report numbers",
        "instruction": "On the demo groups, create `lift` (treatment rate minus control rate, as a plain float), `p_value` from `permutation_p` and `ci` from `lift_ci`, passing your stored settings.",
        "code": "lift = float(treatment.mean() - control.mean())\np_value = permutation_p(control, treatment, n_perm, seed)\nci = lift_ci(control, treatment, alpha, n_boot, seed)",
        "check": "test('Gather the report numbers', lambda: type(lift) is float and np.isclose(lift, 0.05625) and 0 < p_value < 0.01 and np.allclose(ci, (low, high)) and decide(lift, p_value, alpha) == 'ship', 'lift is 0.05625, its interval excludes zero and p_value is far below alpha: decide says ship.')",
        "expected": "lift is 0.05625, its interval excludes zero and p_value is far below alpha: decide says ship.",
        "reassurance": ""
      },
      {
        "title": "Assemble the report",
        "instruction": "Define `ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0)` for two arrays: repeat your three numbers and return a dict with keys `control_rate`, `treatment_rate`, `lift`, `ci`, `p_value` and `decision` (from `decide`), every number a plain float.",
        "code": "def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):\n    lift = float(treatment.mean() - control.mean())\n    p_value = permutation_p(control, treatment, n_perm, seed)\n    ci = lift_ci(control, treatment, alpha, n_boot, seed)\n    return {\"control_rate\": float(control.mean()), \"treatment_rate\": float(treatment.mean()), \"lift\": lift,\n            \"ci\": ci, \"p_value\": p_value, \"decision\": decide(lift, p_value, alpha)}",
        "check": "test('Assemble the report', lambda: (lambda _q: set(_q) == {'control_rate', 'treatment_rate', 'lift', 'ci', 'p_value', 'decision'} and np.isclose(_q['control_rate'], 0.25) and np.isclose(_q['lift'], 0.5) and type(_q['ci']) is tuple and type(_q['p_value']) is float and ab_report(control, treatment, n_boot=200, n_perm=200)['decision'] == 'ship')(ab_report(np.array([0.0, 1, 0, 0]), np.array([1.0, 1, 0, 1]), n_boot=10, n_perm=10)), 'A tiny test reports all six keys with a lift of 0.5, and the demo report says ship.')",
        "expected": "A tiny test reports all six keys with a lift of 0.5, and the demo report says ship.",
        "reassurance": "",
        "startFrom": [
          8
        ]
      },
      {
        "title": "Accept plain lists",
        "instruction": "Update `ab_report` so it first converts both groups to float arrays.",
        "code": "def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):\n    control, treatment = np.asarray(control, dtype=float), np.asarray(treatment, dtype=float)\n    lift = float(treatment.mean() - control.mean())\n    p_value = permutation_p(control, treatment, n_perm, seed)\n    ci = lift_ci(control, treatment, alpha, n_boot, seed)\n    return {\"control_rate\": float(control.mean()), \"treatment_rate\": float(treatment.mean()), \"lift\": lift,\n            \"ci\": ci, \"p_value\": p_value, \"decision\": decide(lift, p_value, alpha)}",
        "check": "test('Accept plain lists', lambda: (lambda _q: np.isclose(_q['lift'], 0.5) and type(_q['treatment_rate']) is float)(ab_report([0, 1, 0, 0], [1, 1, 0, 1], n_boot=10, n_perm=10)), 'Plain lists of 0s and 1s now work: the lift is 0.5.')",
        "expected": "Plain lists of 0s and 1s now work: the lift is 0.5.",
        "reassurance": "",
        "startFrom": [
          9
        ]
      },
      {
        "title": "Reject an empty group",
        "instruction": "Update `ab_report` so that, right after converting, it raises `ValueError` when either group is empty.",
        "code": "def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):\n    control, treatment = np.asarray(control, dtype=float), np.asarray(treatment, dtype=float)\n    if len(control) == 0 or len(treatment) == 0: raise ValueError(\"both groups need visitors\")\n    lift = float(treatment.mean() - control.mean())\n    p_value = permutation_p(control, treatment, n_perm, seed)\n    ci = lift_ci(control, treatment, alpha, n_boot, seed)\n    return {\"control_rate\": float(control.mean()), \"treatment_rate\": float(treatment.mean()), \"lift\": lift,\n            \"ci\": ci, \"p_value\": p_value, \"decision\": decide(lift, p_value, alpha)}",
        "check": "def _rejects():\n    try:\n        ab_report([], [1, 0])\n    except ValueError:\n        return True\n    return False\ndef _rejects2():\n    try:\n        ab_report([1, 0], [])\n    except ValueError:\n        return True\n    return False\ntest('Reject an empty group', lambda: _rejects() and _rejects2(), 'An empty control or treatment group raises ValueError.')",
        "expected": "An empty control or treatment group raises ValueError.",
        "reassurance": "",
        "startFrom": [
          10
        ]
      },
      {
        "title": "Print the checkout report",
        "instruction": "Loop over the items of the report for `control` versus `treatment` and print each key right-aligned with its value. Then run the boss Check.",
        "code": "for key, value in ab_report(control, treatment).items():\n    print(f\"{key:>15}: {value}\")",
        "check": "",
        "expected": "Rates near 0.10 and 0.13, a positive lift with an interval above zero, a small p-value and the decision ship.",
        "reassurance": ""
      }
    ]
  }
}
