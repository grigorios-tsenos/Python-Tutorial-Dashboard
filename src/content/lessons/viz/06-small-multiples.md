---
id: vz-multiples
track: viz
order: 6
title: Small Multiples and Log Scales
tagline: Two panels beat one cluttered chart. A log axis beats squinting at a flat tail.
kind: build
xp: 55
minutes: 8
packages: matplotlib
---
@@body
# One figure, several axes

Loss and accuracy live on different scales; forcing them onto one axes hides one of them. `plt.subplots(1, 2)` gives you two axes side by side in one figure: **small multiples**. And when a curve drops from 2.0 to 0.02, a **log scale** on y shows the whole descent instead of a flat line hugging zero.

```python
fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))   # axes is an array of two Axes
axes[0].set_yscale("log")
fig.suptitle("Training run 42")
```

> **Mission:** implement `plot_training(history)`, where `history` has lists `train_loss`, `val_loss`, `train_acc`, `val_acc`. Return a figure with two axes: the left shows both losses on a log y axis, the right shows both accuracies; each panel has a legend and a title, and the figure has a suptitle.

@@step Two axes in one figure
Ask for a 1×2 grid. `figsize` is in inches; wide and short suits two panels:

```python
fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
return fig
```

**Do:** create and return the figure, then Run.
@@stepcheck
h = {"train_loss": [1.0, 0.5], "val_loss": [1.1, 0.6], "train_acc": [0.5, 0.8], "val_acc": [0.5, 0.75]}
f = plot_training(h)
test("the figure holds two axes", lambda: f is not None and len(f.axes) == 2, "fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))")
@@step Curves on each panel
Index the array of axes. Each panel gets its own two lines, labels and legend:

```python
epochs = range(1, len(history["train_loss"]) + 1)
axes[0].plot(epochs, history["train_loss"], label="train")
axes[0].plot(epochs, history["val_loss"], label="val")
axes[1].plot(epochs, history["train_acc"], label="train")
axes[1].plot(epochs, history["val_acc"], label="val")
for ax in axes:
    ax.set_xlabel("epoch")
    ax.legend()
```

**Do:** draw the four curves, then Run.
@@stepcheck
h = {"train_loss": [1.0, 0.5, 0.2], "val_loss": [1.1, 0.6, 0.4], "train_acc": [0.5, 0.8, 0.9], "val_acc": [0.5, 0.75, 0.8]}
f = plot_training(h)
test("each panel has two labelled curves and a legend", lambda: all(len(ax.get_lines()) == 2 and ax.get_legend() is not None for ax in f.axes) and list(f.axes[1].get_lines()[1].get_ydata()) == [0.5, 0.75, 0.8], "axes[0] for losses, axes[1] for accuracies")
@@step Log scale, titles, suptitle
A log y axis on the loss panel; a title per panel so each stands on its own; one suptitle for the figure:

```python
axes[0].set_yscale("log")
axes[0].set_title("loss")
axes[1].set_title("accuracy")
fig.suptitle("Training history")
```

**Do:** add the scale and titles, then Run.
@@stepcheck
h = {"train_loss": [1.0, 0.5], "val_loss": [1.1, 0.6], "train_acc": [0.5, 0.8], "val_acc": [0.5, 0.75]}
f = plot_training(h)
test("the loss panel uses a log scale and every panel is titled", lambda: f.axes[0].get_yscale() == "log" and all(ax.get_title().strip() for ax in f.axes), 'axes[0].set_yscale("log")')
test("the figure has a suptitle", lambda: f._suptitle is not None and f._suptitle.get_text().strip() != "", "fig.suptitle(...)")
@@starter
import matplotlib.pyplot as plt

def plot_training(history):
    """Two panels: losses (log y) on the left, accuracies on the right. Returns the figure."""
    # TODO
    return None

history = {
    "train_loss": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06, 0.04, 0.03],
    "val_loss":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.28, 0.29, 0.31, 0.34],
    "train_acc":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95, 0.97, 0.98],
    "val_acc":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84, 0.83, 0.83],
}
fig = plot_training(history)
@@solution
import matplotlib.pyplot as plt

def plot_training(history):
    """Two panels: losses (log y) on the left, accuracies on the right. Returns the figure."""
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
    epochs = range(1, len(history["train_loss"]) + 1)
    axes[0].plot(epochs, history["train_loss"], label="train")
    axes[0].plot(epochs, history["val_loss"], label="val")
    axes[1].plot(epochs, history["train_acc"], label="train")
    axes[1].plot(epochs, history["val_acc"], label="val")
    for ax in axes:
        ax.set_xlabel("epoch")
        ax.legend()
    axes[0].set_yscale("log")
    axes[0].set_title("loss")
    axes[1].set_title("accuracy")
    fig.suptitle("Training history")
    return fig

history = {
    "train_loss": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06, 0.04, 0.03],
    "val_loss":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.28, 0.29, 0.31, 0.34],
    "train_acc":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95, 0.97, 0.98],
    "val_acc":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84, 0.83, 0.83],
}
fig = plot_training(history)
@@check
import matplotlib.figure
h = {"train_loss": [1.0, 0.5, 0.2], "val_loss": [1.1, 0.6, 0.4], "train_acc": [0.5, 0.8, 0.9], "val_acc": [0.5, 0.75, 0.8]}
f = plot_training(h)
test("a figure with exactly two axes is returned", lambda: isinstance(f, matplotlib.figure.Figure) and len(f.axes) == 2)
test("the left panel holds the losses, the right the accuracies", lambda: list(f.axes[0].get_lines()[0].get_ydata()) == [1.0, 0.5, 0.2] and list(f.axes[1].get_lines()[1].get_ydata()) == [0.5, 0.75, 0.8])
test("each panel has two labelled curves, a legend and an x label", lambda: all(len(ax.get_lines()) == 2 and ax.get_legend() is not None and ax.get_xlabel() == "epoch" for ax in f.axes) and [l.get_label() for l in f.axes[0].get_lines()] == ["train", "val"])
test("the loss panel uses a log scale and the accuracy panel does not", lambda: f.axes[0].get_yscale() == "log" and f.axes[1].get_yscale() == "linear")
test("panels and figure are titled", lambda: all(ax.get_title().strip() for ax in f.axes) and f._suptitle is not None and f._suptitle.get_text().strip() != "")
test("the demo figure was built", lambda: fig is not None and len(fig.axes) == 2 and len(fig.axes[0].get_lines()[0].get_ydata()) == 10)
@@hint
`fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))`; `axes[0]` and `axes[1]` are ordinary Axes. Build `epochs` from the length of a history list.
@@hint
After the four `plot` calls: `axes[0].set_yscale("log")`, set a title on each panel, `fig.suptitle(...)`, and `return fig`.
@@q
When should a chart use a log scale?
@@a
When the values span several orders of magnitude, such as a loss that falls from 2 to 0.02; a log axis shows relative change evenly.
@@q
What are small multiples?
@@a
Several small charts with the same axes layout placed side by side, so the eye compares panels instead of untangling one crowded chart.
@@real
`fig.savefig("history.png")` saves both panels at once. Grid layouts scale up with `plt.subplots(3, 4)` for per-class or per-dataset panels; `sharex=True` keeps the x axes aligned.
