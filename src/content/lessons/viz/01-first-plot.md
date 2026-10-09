---
id: vz-first-plot
track: viz
order: 1
title: Your First Plot Is a Training Curve
tagline: A chart is an argument. Learn the three objects every matplotlib argument is made of.
kind: run
xp: 25
minutes: 5
packages: matplotlib
---
@@body
# Figure, axes, and the line between them

Every matplotlib chart has the same skeleton: a **figure** (the canvas), one or more **axes** (a plotting area with an x and a y axis), and the **artists** you draw on the axes (lines, bars, text). Use the object interface, `fig, ax = plt.subplots()`, and call methods on `ax`; it scales from one chart to a dashboard without surprises.

```python
fig, ax = plt.subplots()          # one figure, one axes
ax.plot(x, y, marker="o")         # a line with a dot on every point
ax.set_xlabel("epoch")            # labels are methods on the axes
```

Orbit renders every open figure below your output when the cell finishes.

> **Mission:** plot a model's training loss per epoch: create `fig, ax`, draw the loss with a marker on each point, and label the x axis `epoch`, the y axis `loss`, with a title of your choice.

@@step One figure, one axes
`plt.subplots()` returns both objects at once. Keep both names: you need `fig` to save or lay out, and `ax` to draw:

```python
fig, ax = plt.subplots()
```

**Do:** replace the `None, None` line, then Run. An empty chart appears below the output.
@@stepcheck
import matplotlib.axes
test("ax is a matplotlib Axes inside fig", lambda: isinstance(ax, matplotlib.axes.Axes) and ax.figure is fig, "fig, ax = plt.subplots()")
@@step Draw the loss per epoch
`ax.plot(x, y)` draws a line through the points; `marker="o"` adds a dot at each one so the reader can see where the data actually is:

```python
ax.plot(epochs, loss, marker="o")
```

**Do:** add the line, then Run.
@@stepcheck
test("one line carries the loss values with a marker on each point", lambda: len(ax.get_lines()) == 1 and list(ax.get_lines()[0].get_ydata()) == loss and ax.get_lines()[0].get_marker() not in ("None", None, ""), 'ax.plot(epochs, loss, marker="o")')
@@step Label it or it is not a chart
Unlabelled axes force the reader to guess. Three setters:

```python
ax.set_xlabel("epoch")
ax.set_ylabel("loss")
ax.set_title("Training loss")
```

**Do:** add the labels, then Run.
@@stepcheck
test("both axes are labelled and the chart has a title", lambda: ax.get_xlabel() == "epoch" and ax.get_ylabel() == "loss" and ax.get_title().strip() != "", 'ax.set_xlabel("epoch"), ax.set_ylabel("loss"), ax.set_title(...)')
@@starter
import matplotlib.pyplot as plt

epochs = [1, 2, 3, 4, 5, 6]
loss = [1.20, 0.85, 0.62, 0.51, 0.47, 0.45]

# TODO 1: one figure with one axes
fig, ax = None, None

# TODO 2: draw the loss per epoch, with a marker on each point

# TODO 3: label the x axis "epoch", the y axis "loss", and add a title
@@solution
import matplotlib.pyplot as plt

epochs = [1, 2, 3, 4, 5, 6]
loss = [1.20, 0.85, 0.62, 0.51, 0.47, 0.45]

fig, ax = plt.subplots()

ax.plot(epochs, loss, marker="o")

ax.set_xlabel("epoch")
ax.set_ylabel("loss")
ax.set_title("Training loss")
@@check
import matplotlib.axes
import orbit
test("ax is a matplotlib Axes inside fig", lambda: isinstance(ax, matplotlib.axes.Axes) and ax.figure is fig)
test("one line carries the loss values", lambda: len(ax.get_lines()) == 1 and list(ax.get_lines()[0].get_ydata()) == loss and list(ax.get_lines()[0].get_xdata()) == epochs)
test("every point has a marker", lambda: ax.get_lines()[0].get_marker() not in ("None", None, ""))
test("both axes are labelled and the chart has a title", lambda: ax.get_xlabel() == "epoch" and ax.get_ylabel() == "loss" and ax.get_title().strip() != "")
test("the figure was rendered below the output", lambda: any(e["kind"] == "figure" for e in orbit._emits))
@@hint
`fig, ax = plt.subplots()` creates both objects. Everything else is a method call on `ax`.
@@hint
`ax.plot(epochs, loss, marker="o")`, then `ax.set_xlabel("epoch")`, `ax.set_ylabel("loss")`, `ax.set_title("Training loss")`.
@@q
What is the difference between a figure and an axes in matplotlib?
@@a
The figure is the whole canvas; an axes is one plotting area on it with its own x and y axis. A figure can hold many axes.
@@q
Why prefer `fig, ax = plt.subplots()` over `plt.plot(...)`?
@@a
The object interface makes it explicit which axes you draw on, which is essential once a figure has more than one chart.
@@real
Jupyter shows figures the same way Orbit does. For production reports, `fig.savefig("loss.png", dpi=150, bbox_inches="tight")` writes the file, and `mlflow.log_figure(fig, "loss.png")` attaches it to a run.
