---
id: vz-bars
track: viz
order: 5
title: Bars with Honest Error Bars
tagline: A benchmark without error bars is a coin flip dressed as a result.
kind: build
xp: 50
minutes: 7
packages: matplotlib
---
@@body
# Ranked bars, with uncertainty attached

Benchmarks compare models with one bar each. Three habits make the comparison honest: **sort** the bars so the ranking is visible, draw **error bars** (the standard deviation across runs) so a 0.3-point gap can be judged against the noise, and start the y axis at **zero** for a quantity like accuracy, so bar heights are comparable.

```python
ax.bar(names, means, yerr=stds, capsize=4)
ax.set_ylim(0, 1)
```

> **Mission:** implement `plot_benchmark(ax, names, means, stds)`: draw one bar per model sorted from best to worst mean, with `yerr` error bars and caps, a `accuracy` y label and the y axis fixed to `[0, 1]`. Return the sorted list of names.
@@starter
import numpy as np
import matplotlib.pyplot as plt

def plot_benchmark(ax, names, means, stds):
    """Sorted bars with error bars; returns the names in plotted order."""
    # TODO
    return list(names)

names = ["baseline", "tuned", "distilled", "ours"]
means = [0.81, 0.86, 0.84, 0.88]
stds = [0.01, 0.03, 0.02, 0.025]

fig, ax = plt.subplots()
print(plot_benchmark(ax, names, means, stds))
ax.set_title("Accuracy over 5 seeds")
@@solution
import numpy as np
import matplotlib.pyplot as plt

def plot_benchmark(ax, names, means, stds):
    """Sorted bars with error bars; returns the names in plotted order."""
    order = np.argsort(means)[::-1]
    names = [names[i] for i in order]
    means = [means[i] for i in order]
    stds = [stds[i] for i in order]
    ax.bar(names, means, yerr=stds, capsize=4)
    ax.set_ylim(0, 1)
    ax.set_ylabel("accuracy")
    return names

names = ["baseline", "tuned", "distilled", "ours"]
means = [0.81, 0.86, 0.84, 0.88]
stds = [0.01, 0.03, 0.02, 0.025]

fig, ax = plt.subplots()
print(plot_benchmark(ax, names, means, stds))
ax.set_title("Accuracy over 5 seeds")
@@check
import matplotlib.pyplot as plt
f, a = plt.subplots()
out = plot_benchmark(a, ["b", "a", "c"], [0.7, 0.9, 0.8], [0.02, 0.01, 0.03])
heights = [p.get_height() for p in a.patches]
test("names come back best first", lambda: out == ["a", "c", "b"])
test("one bar per model, heights sorted descending", lambda: len(a.patches) == 3 and heights == [0.9, 0.8, 0.7])
a.figure.canvas.draw()
test("tick labels follow the sorted names", lambda: [t.get_text() for t in a.get_xticklabels()] == ["a", "c", "b"])
test("the bars carry error bars", lambda: any(type(c).__name__ == "ErrorbarContainer" for c in a.containers))
test("the y axis starts at zero, ends at one, and is labelled", lambda: a.get_ylim() == (0.0, 1.0) and a.get_ylabel() == "accuracy")
test("the demo ranks ours first", lambda: "['ours', 'tuned', 'distilled', 'baseline']" in __stdout__)
test("the caller's lists are untouched", lambda: names == ["baseline", "tuned", "distilled", "ours"] and means == [0.81, 0.86, 0.84, 0.88])
@@hint
`order = np.argsort(means)[::-1]` is the best-first order; build new lists with it rather than sorting the inputs in place.
@@hint
`ax.bar(names, means, yerr=stds, capsize=4)`, `ax.set_ylim(0, 1)`, `ax.set_ylabel("accuracy")`, `return names`.
@@q
What do error bars on a benchmark bar represent?
@@a
The spread of the metric across repeated runs (seeds, folds); if two bars' error bars overlap heavily, the ranking between them is not reliable.
@@q
Why start a bar chart's y axis at zero?
@@a
Readers compare bar heights; an axis that starts above zero exaggerates small differences.
@@real
Papers report mean ± std over several seeds for exactly this reason. `ax.bar_label(container, fmt="%.2f")` prints the value on each bar, and `seaborn.barplot(..., errorbar="sd")` draws this chart in one call.
