---
id: vz-two-lines
track: viz
order: 2
title: Two Lines, One Story
tagline: Train and validation loss on one chart is how you see overfitting with your own eyes.
kind: build
xp: 35
minutes: 6
packages: matplotlib
---
@@body
# Comparison is the point of a chart

One curve says "loss went down". Two curves on the same axes say "training loss kept falling while validation loss turned around at epoch 5": that is **overfitting**, and no table shows it as fast as a chart.

Each `ax.plot` call adds a line; give each a `label` and call `ax.legend()` so the reader knows which is which. A vertical marker (`ax.axvline`) pins the epoch worth talking about.

> **Mission:** implement `plot_curves(ax, epochs, train, val)`: draw both curves labelled `train` and `val`, add a legend and axis labels (`epoch`, `loss`), mark the epoch with the lowest validation loss with a dashed vertical line, and **return that epoch**.

@@step Two labelled lines
Two calls, two labels. Labels do nothing visible until a legend uses them:

```python
ax.plot(epochs, train, label="train")
ax.plot(epochs, val, label="val")
```

**Do:** draw both lines, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
plot_curves(a, [1, 2, 3], [1.0, 0.5, 0.2], [1.1, 0.7, 0.8])
test("two lines, labelled train and val", lambda: [l.get_label() for l in a.get_lines()[:2]] == ["train", "val"] and list(a.get_lines()[1].get_ydata()) == [1.1, 0.7, 0.8], 'ax.plot(..., label="train") and ax.plot(..., label="val")')
@@step Legend and axis labels
`ax.legend()` reads the labels you set. Axis labels say what the numbers mean:

```python
ax.set_xlabel("epoch")
ax.set_ylabel("loss")
ax.legend()
```

**Do:** add the legend and labels, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
plot_curves(a, [1, 2, 3], [1.0, 0.5, 0.2], [1.1, 0.7, 0.8])
test("the axes carry a legend and labels", lambda: a.get_legend() is not None and [t.get_text() for t in a.get_legend().get_texts()] == ["train", "val"] and a.get_xlabel() == "epoch" and a.get_ylabel() == "loss", "ax.legend() after setting the labels")
@@step Mark the best epoch and return it
`np.argmin` finds the position of the smallest validation loss; the epoch at that position is the one to report:

```python
i = int(np.argmin(val))
best = epochs[i]
ax.axvline(best, linestyle="--", color="gray")
return best
```

**Do:** add the marker and return the epoch, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
best = plot_curves(a, [1, 2, 3, 4], [1.0, 0.5, 0.3, 0.2], [1.1, 0.7, 0.6, 0.8])
vlines = [l for l in a.get_lines() if len(set(l.get_xdata())) == 1]
test("the best validation epoch is returned", lambda: best == 3, "epochs[int(np.argmin(val))]")
test("a dashed vertical line marks it", lambda: any(list(l.get_xdata())[0] == 3 and l.get_linestyle() == "--" for l in vlines), 'ax.axvline(best, linestyle="--")')
@@starter
import numpy as np
import matplotlib.pyplot as plt

def plot_curves(ax, epochs, train, val):
    """Train and validation loss on one axes; mark and return the best validation epoch."""
    # TODO
    return None

epochs = list(range(1, 11))
train = [1.2, 0.9, 0.7, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23, 0.2]
val = [1.25, 0.95, 0.78, 0.66, 0.6, 0.62, 0.67, 0.74, 0.82, 0.9]

fig, ax = plt.subplots()
print("best epoch:", plot_curves(ax, epochs, train, val))
@@solution
import numpy as np
import matplotlib.pyplot as plt

def plot_curves(ax, epochs, train, val):
    """Train and validation loss on one axes; mark and return the best validation epoch."""
    ax.plot(epochs, train, label="train")
    ax.plot(epochs, val, label="val")
    ax.set_xlabel("epoch")
    ax.set_ylabel("loss")
    ax.legend()
    i = int(np.argmin(val))
    best = epochs[i]
    ax.axvline(best, linestyle="--", color="gray")
    return best

epochs = list(range(1, 11))
train = [1.2, 0.9, 0.7, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23, 0.2]
val = [1.25, 0.95, 0.78, 0.66, 0.6, 0.62, 0.67, 0.74, 0.82, 0.9]

fig, ax = plt.subplots()
print("best epoch:", plot_curves(ax, epochs, train, val))
@@check
import matplotlib.pyplot as plt
f, a = plt.subplots()
best = plot_curves(a, [1, 2, 3, 4], [1.0, 0.5, 0.3, 0.2], [1.1, 0.7, 0.6, 0.8])
lines = a.get_lines()
test("two labelled curves carry the data", lambda: [l.get_label() for l in lines[:2]] == ["train", "val"] and list(lines[0].get_ydata()) == [1.0, 0.5, 0.3, 0.2] and list(lines[1].get_ydata()) == [1.1, 0.7, 0.6, 0.8])
test("legend and axis labels are present", lambda: a.get_legend() is not None and a.get_xlabel() == "epoch" and a.get_ylabel() == "loss")
test("the best validation epoch is returned", lambda: best == 3)
test("a dashed vertical line marks it", lambda: any(len(set(l.get_xdata())) == 1 and list(l.get_xdata())[0] == 3 and l.get_linestyle() == "--" for l in lines))
test("the demo found epoch 5", lambda: "best epoch: 5" in __stdout__)
f2, a2 = plt.subplots()
test("a different history gives a different epoch", lambda: plot_curves(a2, [10, 20, 30], [3, 2, 1], [3, 1, 2]) == 20)
@@hint
Two `ax.plot(..., label=...)` calls, then `ax.legend()`. Labels only appear in a legend.
@@hint
`i = int(np.argmin(val))`, `best = epochs[i]`, `ax.axvline(best, linestyle="--", color="gray")`, `return best`.
@@q
What does it look like on a chart when a model overfits?
@@a
Training loss keeps falling while validation loss flattens and then rises; the gap between the curves grows.
@@q
Why does `ax.plot(..., label="val")` show nothing until `ax.legend()`?
@@a
The label is metadata stored on the line; the legend is the artist that displays it.
@@real
Training dashboards (TensorBoard, Weights & Biases, MLflow's metric charts) are this chart with live updates. Early stopping is the automated version of "return the best validation epoch".
