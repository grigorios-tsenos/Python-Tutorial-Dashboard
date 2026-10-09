---
id: vz-annotate
track: viz
order: 8
title: Annotate What Matters
tagline: Point at the one thing you want the reader to see.
kind: build
xp: 55
minutes: 7
packages: matplotlib
---
@@body
# The chart should do the pointing

A reader has about three seconds. If the chart's point is "validation loss bottomed out at epoch 6", put an arrow there and say so. `ax.annotate` places text with an arrow from the text to a data point; `ax.axvline` draws a reference line.

```python
ax.annotate("best: epoch 6", xy=(6, 0.28),            # the point the arrow touches
            xytext=(7.5, 0.6),                        # where the text sits
            arrowprops=dict(arrowstyle="->"))
```

> **Mission:** implement `annotate_best(ax, epochs, val_loss)`: plot the validation loss with markers, annotate the minimum with the text `best: epoch N` and an arrow, draw a dashed vertical line at that epoch, and return `N`.

@@step Plot and find the minimum
Draw the curve, then locate the lowest value with `np.argmin` and translate the position into an epoch:

```python
ax.plot(epochs, val_loss, marker="o")
i = int(np.argmin(val_loss))
best = epochs[i]
return best
```

**Do:** plot and return the best epoch, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
best = annotate_best(a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])
test("the curve is drawn and the best epoch returned", lambda: best == 2 and len(a.get_lines()) >= 1 and list(a.get_lines()[0].get_ydata()) == [0.9, 0.5, 0.6, 0.8], "ax.plot(epochs, val_loss, marker='o'); epochs[int(np.argmin(val_loss))]")
@@step Annotate the point with an arrow
`xy` is the data point; `xytext` is where the words go, offset so they do not cover the curve:

```python
ax.annotate(f"best: epoch {best}", xy=(best, val_loss[i]), xytext=(best + 1, val_loss[i] + 0.2), arrowprops=dict(arrowstyle="->"))
```

**Do:** add the annotation, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
annotate_best(a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])
test("an annotation with an arrow points at the minimum", lambda: len(a.texts) == 1 and tuple(a.texts[0].xy) == (2, 0.5) and "epoch 2" in a.texts[0].get_text() and a.texts[0].arrow_patch is not None, 'ax.annotate(f"best: epoch {best}", xy=(best, val_loss[i]), xytext=..., arrowprops=dict(arrowstyle="->"))')
@@step A dashed reference line
A vertical line turns the epoch into something the eye can compare other curves against:

```python
ax.axvline(best, linestyle="--", color="gray")
```

**Do:** add the line, then Run.
@@stepcheck
import matplotlib.pyplot as plt
f, a = plt.subplots()
annotate_best(a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])
test("a dashed vertical line sits at the best epoch", lambda: any(len(set(l.get_xdata())) == 1 and list(l.get_xdata())[0] == 2 and l.get_linestyle() == "--" for l in a.get_lines()), 'ax.axvline(best, linestyle="--")')
@@starter
import numpy as np
import matplotlib.pyplot as plt

def annotate_best(ax, epochs, val_loss):
    """Plot validation loss, point at its minimum, and return the best epoch."""
    # TODO
    return None

epochs = list(range(1, 13))
val_loss = [1.9, 1.2, 0.8, 0.55, 0.4, 0.33, 0.3, 0.31, 0.35, 0.42, 0.5, 0.6]

fig, ax = plt.subplots()
print("best epoch:", annotate_best(ax, epochs, val_loss))
ax.set_xlabel("epoch")
ax.set_ylabel("validation loss")
@@solution
import numpy as np
import matplotlib.pyplot as plt

def annotate_best(ax, epochs, val_loss):
    """Plot validation loss, point at its minimum, and return the best epoch."""
    ax.plot(epochs, val_loss, marker="o")
    i = int(np.argmin(val_loss))
    best = epochs[i]
    ax.annotate(f"best: epoch {best}", xy=(best, val_loss[i]), xytext=(best + 1, val_loss[i] + 0.2), arrowprops=dict(arrowstyle="->"))
    ax.axvline(best, linestyle="--", color="gray")
    return best

epochs = list(range(1, 13))
val_loss = [1.9, 1.2, 0.8, 0.55, 0.4, 0.33, 0.3, 0.31, 0.35, 0.42, 0.5, 0.6]

fig, ax = plt.subplots()
print("best epoch:", annotate_best(ax, epochs, val_loss))
ax.set_xlabel("epoch")
ax.set_ylabel("validation loss")
@@check
import matplotlib.pyplot as plt
f, a = plt.subplots()
best = annotate_best(a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])
test("the best epoch is returned", lambda: best == 2)
test("the curve is drawn with markers", lambda: list(a.get_lines()[0].get_ydata()) == [0.9, 0.5, 0.6, 0.8] and a.get_lines()[0].get_marker() not in ("None", None, ""))
test("one annotation names the epoch and points at the minimum", lambda: len(a.texts) == 1 and tuple(a.texts[0].xy) == (2, 0.5) and a.texts[0].get_text() == "best: epoch 2" and a.texts[0].arrow_patch is not None)
test("the text is offset from the point", lambda: tuple(a.texts[0].get_position()) != (2, 0.5))
test("a dashed vertical line sits at the best epoch", lambda: any(len(set(l.get_xdata())) == 1 and list(l.get_xdata())[0] == 2 and l.get_linestyle() == "--" for l in a.get_lines()))
test("the demo found epoch 7", lambda: "best epoch: 7" in __stdout__ and ax.texts[0].get_text() == "best: epoch 7")
f2, a2 = plt.subplots()
test("a different curve gives a different epoch", lambda: annotate_best(a2, [10, 20, 30], [0.5, 0.9, 0.1]) == 30)
@@hint
`i = int(np.argmin(val_loss))` gives the position of the minimum; `epochs[i]` and `val_loss[i]` are the point to annotate.
@@hint
`ax.annotate(f"best: epoch {best}", xy=(best, val_loss[i]), xytext=(best + 1, val_loss[i] + 0.2), arrowprops=dict(arrowstyle="->"))`, then `ax.axvline(best, linestyle="--", color="gray")`.
@@q
What is the difference between `xy` and `xytext` in `ax.annotate`?
@@a
`xy` is the data point the arrow touches; `xytext` is where the label text is placed.
@@q
Why annotate a chart instead of explaining it in a caption?
@@a
The reader's eye goes to the chart first; an annotation delivers the conclusion at the moment of looking.
@@real
Dashboards annotate deploys, incidents and experiment starts on time-series charts the same way (`ax.axvline` at the timestamp). In matplotlib, `ax.text` places text without an arrow and `ax.axhline` draws horizontal references such as a target metric.
