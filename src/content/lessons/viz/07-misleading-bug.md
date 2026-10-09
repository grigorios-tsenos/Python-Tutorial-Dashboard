---
id: vz-honest
track: viz
order: 7
title: "Bug Hunt: The Chart That Lies"
tagline: Same data, two charts, opposite conclusions. Fix the one that exaggerates.
kind: bug
xp: 50
minutes: 6
packages: matplotlib
---
@@body
# A chart can be technically correct and still dishonest

Three models score 98.1%, 98.4% and 98.6%. The starter zooms the y axis into `[0.98, 0.99]`, so a half-point difference fills the whole chart and the title claims a 3x improvement. Nothing in the code is "wrong"; the chart just misleads.

The fixes are the habits from the last lesson, applied as rules: a zero-based axis for a bounded quantity, labelled axes, values printed on the bars so the reader sees the numbers, and a title that states what the data supports.

> **Mission:** fix the chart: y axis from `0` to `1`, axis labels `model` and `accuracy`, the exact value printed on each bar, and a title that does not contain `3x`.

@@step Start the axis at zero
Run the starter and look at the chart: "ours" towers over "baseline". Change the limits so the bars show the whole quantity:

```python
ax.set_ylim(0, 1)
```

**Do:** fix the limits, then Run. The three bars now look nearly identical, which is the truth.
@@stepcheck
test("the y axis runs from 0 to 1", lambda: ax.get_ylim() == (0.0, 1.0), "ax.set_ylim(0, 1)")
@@step Label, print the values, tell the truth
Axis labels, the exact numbers on the bars, and a title the data can support:

```python
ax.set_xlabel("model")
ax.set_ylabel("accuracy")
ax.bar_label(ax.containers[0], fmt="%.3f")
ax.set_title("Accuracy on the test set (n = 2000)")
```

**Do:** replace the old title and add the rest, then Run.
@@stepcheck
test("axes are labelled and the values are printed on the bars", lambda: ax.get_xlabel() == "model" and ax.get_ylabel() == "accuracy" and len(ax.texts) == 3, 'ax.bar_label(ax.containers[0], fmt="%.3f")')
test("the title no longer claims 3x", lambda: "3x" not in ax.get_title().lower() and ax.get_title().strip() != "")
@@starter
import matplotlib.pyplot as plt

models = ["baseline", "tuned", "ours"]
accuracy = [0.981, 0.984, 0.986]

fig, ax = plt.subplots()
ax.bar(models, accuracy)
ax.set_ylim(0.98, 0.99)              # BUG HUNT: a half-point gap looks like a cliff
ax.set_title("Ours is 3x better!")   # BUG HUNT: the data does not support this
@@solution
import matplotlib.pyplot as plt

models = ["baseline", "tuned", "ours"]
accuracy = [0.981, 0.984, 0.986]

fig, ax = plt.subplots()
ax.bar(models, accuracy)
ax.set_ylim(0, 1)
ax.set_xlabel("model")
ax.set_ylabel("accuracy")
ax.bar_label(ax.containers[0], fmt="%.3f")
ax.set_title("Accuracy on the test set (n = 2000)")
@@check
test("the bars are unchanged", lambda: [p.get_height() for p in ax.patches] == accuracy)
test("the y axis runs from 0 to 1", lambda: ax.get_ylim() == (0.0, 1.0))
test("axes are labelled", lambda: ax.get_xlabel() == "model" and ax.get_ylabel() == "accuracy")
test("the exact value is printed on each bar", lambda: len(ax.texts) == 3 and sorted(t.get_text() for t in ax.texts) == ["0.981", "0.984", "0.986"])
test("the title no longer claims 3x", lambda: "3x" not in ax.get_title().lower() and ax.get_title().strip() != "")
@@hint
`ax.set_ylim(0, 1)` is the first fix. The bars are in `ax.containers[0]`, which `ax.bar_label` can annotate.
@@hint
`ax.set_xlabel("model")`, `ax.set_ylabel("accuracy")`, `ax.bar_label(ax.containers[0], fmt="%.3f")`, and a factual `ax.set_title(...)`.
@@q
Why is a truncated y axis misleading on a bar chart?
@@a
Bar heights invite comparison by length; cutting the axis makes a tiny difference look enormous.
@@q
What should a chart title state?
@@a
What was measured, on what data, and under what conditions; conclusions belong in the text, backed by the numbers.
@@real
Reviewers and stakeholders will spot a truncated axis eventually, and it costs you credibility for every chart after it. Line charts of a *change over time* may legitimately zoom the axis; bars of a bounded quantity should not.
