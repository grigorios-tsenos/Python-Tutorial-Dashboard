import type { CodingGuide } from '../guided'

export const VIZ_GUIDES: Record<string, CodingGuide> = {
  "vz-first-plot": {
    "setup": "import matplotlib.pyplot as plt\n\nepochs = [1, 2, 3, 4, 5, 6]\nloss = [1.20, 0.85, 0.62, 0.51, 0.47, 0.45]",
    "steps": [
      {
        "title": "Create a figure with one axes",
        "instruction": "Create `fig` and `ax` in one call: a new matplotlib figure holding a single axes (one plotting area). Use the object interface rather than the pyplot state machine.",
        "code": "fig, ax = plt.subplots()",
        "check": "import matplotlib.axes\ntest('Create a figure with one axes', lambda: isinstance(ax, matplotlib.axes.Axes) and ax.figure is fig and len(fig.axes) == 1, 'fig holds exactly one axes, and ax is it.')",
        "expected": "fig holds exactly one axes, and ax is it.",
        "reassurance": "The canvas exists. Everything else is a method call on ax."
      },
      {
        "title": "Draw the loss with a marker on every point",
        "instruction": "Draw `loss` against `epochs` on `ax` as a single line, with a visible marker at each data point.",
        "code": "ax.plot(epochs, loss, marker=\"o\")",
        "check": "test('Draw the loss with a marker on every point', lambda: len(ax.get_lines()) == 1 and list(ax.get_lines()[0].get_ydata()) == loss and list(ax.get_lines()[0].get_xdata()) == epochs and ax.get_lines()[0].get_marker() not in ('None', None, ''), 'One line carries the six loss values, and it has a marker.')",
        "expected": "One line carries the six loss values, and it has a marker.",
        "reassurance": "The curve is on the axes. A chart without labels is a guess, so label it next."
      },
      {
        "title": "Label the axes and title the chart",
        "instruction": "Set the x-axis label of `ax` to `epoch`, the y-axis label to `loss`, and give the chart a title of your choice. Then run the check: the figure is rendered below the output when the cell finishes.",
        "code": "ax.set_xlabel(\"epoch\")\nax.set_ylabel(\"loss\")\nax.set_title(\"Training loss\")",
        "check": "",
        "expected": "A labelled training curve appears below the output.",
        "reassurance": "The complete check verifies the axes, the line, the marker, both labels, the title and the rendered figure."
      }
    ]
  },
  "vz-two-lines": {
    "setup": "import numpy as np\nimport matplotlib.pyplot as plt\n\nepochs = list(range(1, 11))\ntrain = [1.2, 0.9, 0.7, 0.55, 0.45, 0.38, 0.32, 0.27, 0.23, 0.2]\nval = [1.25, 0.95, 0.78, 0.66, 0.6, 0.62, 0.67, 0.74, 0.82, 0.9]",
    "steps": [
      {
        "title": "Draw two labelled curves",
        "instruction": "Define `plot_curves(ax, epochs, train, val)` that draws `train` and then `val` against `epochs` on `ax`, labelled `train` and `val`, labels the x axis `epoch` and the y axis `loss`, and shows a legend. It returns nothing yet.",
        "code": "def plot_curves(ax, epochs, train, val):\n    ax.plot(epochs, train, label=\"train\")\n    ax.plot(epochs, val, label=\"val\")\n    ax.set(xlabel=\"epoch\", ylabel=\"loss\")\n    ax.legend()",
        "check": "_f, _a = plt.subplots()\nplot_curves(_a, [1, 2, 3, 4], [1.0, 0.5, 0.3, 0.2], [1.1, 0.7, 0.6, 0.8])\ntest('Draw two labelled curves', lambda: [l.get_label() for l in _a.get_lines()[:2]] == ['train', 'val'] and list(_a.get_lines()[1].get_ydata()) == [1.1, 0.7, 0.6, 0.8] and _a.get_legend() is not None and _a.get_xlabel() == 'epoch' and _a.get_ylabel() == 'loss', 'Two curves labelled train and val, a legend, and axis labels epoch and loss.')",
        "expected": "Two curves labelled train and val, a legend, and axis labels epoch and loss.",
        "reassurance": "The comparison is on the page. Now find the epoch worth talking about."
      },
      {
        "title": "Find the best validation epoch",
        "instruction": "Define `best_epoch(epochs, val)` returning the entry of `epochs` at the position where `val` is smallest.",
        "code": "def best_epoch(epochs, val):\n    return epochs[int(np.argmin(val))]",
        "check": "test('Find the best validation epoch', lambda: best_epoch([1, 2, 3, 4], [1.1, 0.7, 0.6, 0.8]) == 3 and best_epoch([10, 20, 30], [3, 1, 2]) == 20 and best_epoch(epochs, val) == 5, 'The minimum of the validation loss is at epoch 3, 20 and 5 for the three examples.')",
        "expected": "The minimum of the validation loss is at epoch 3, 20 and 5 for the three examples.",
        "reassurance": "Epoch 5 is where the demo model started to overfit. Mark it on the chart."
      },
      {
        "title": "Mark it and return it",
        "instruction": "Update `plot_curves` so that after drawing it finds the best epoch, draws a dashed grey vertical line there, and returns that epoch.",
        "code": "def plot_curves(ax, epochs, train, val):\n    ax.plot(epochs, train, label=\"train\")\n    ax.plot(epochs, val, label=\"val\")\n    ax.set(xlabel=\"epoch\", ylabel=\"loss\")\n    ax.legend()\n    best = best_epoch(epochs, val)\n    ax.axvline(best, linestyle=\"--\", color=\"gray\")\n    return best",
        "check": "_f, _a = plt.subplots()\n_best = plot_curves(_a, [1, 2, 3, 4], [1.0, 0.5, 0.3, 0.2], [1.1, 0.7, 0.6, 0.8])\ntest('Mark it and return it', lambda: _best == 3 and any(len(set(l.get_xdata())) == 1 and list(l.get_xdata())[0] == 3 and l.get_linestyle() == '--' for l in _a.get_lines()), 'plot_curves returns 3 and a dashed vertical line stands at x = 3.')",
        "expected": "plot_curves returns 3 and a dashed vertical line stands at x = 3.",
        "reassurance": "The chart now points at its own conclusion. Draw the demo history."
      },
      {
        "title": "Draw the demo history",
        "instruction": "Create a figure and axes, call `plot_curves` with the demo `epochs`, `train` and `val`, and print the returned epoch with the label `best epoch:`. Then run the check.",
        "code": "fig, ax = plt.subplots()\nprint(\"best epoch:\", plot_curves(ax, epochs, train, val))",
        "check": "",
        "expected": "The output says best epoch: 5 and the chart shows validation loss turning upward after it.",
        "reassurance": "The complete check verifies the curves, legend, labels, the marker line and the returned epoch on new data."
      }
    ]
  },
  "vz-scatter": {
    "setup": "import numpy as np\nimport matplotlib.pyplot as plt\n\nrng = np.random.default_rng(0)\nX = np.vstack([rng.normal([0, 0], 0.6, (80, 2)), rng.normal([3, 1], 0.6, (80, 2)), rng.normal([1.5, 3], 0.6, (80, 2))])\ny = np.repeat([0, 1, 2], 80)",
    "steps": [
      {
        "title": "Scatter the points, coloured by label",
        "instruction": "Define `plot_embedding(ax, X, y)`: scatter column 0 of `X` on x against column 1 on y, colour each point by its label in `y`, make the points semi-transparent with alpha 0.6 and small with size 25, and return the scatter collection.",
        "code": "def plot_embedding(ax, X, y):\n    sc = ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)\n    return sc",
        "check": "_f, _a = plt.subplots()\n_X = np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5], [0.5, 2.0]])\n_sc = plot_embedding(_a, _X, np.array([0, 1, 1, 2]))\ntest('Scatter the points, coloured by label', lambda: len(_a.collections) == 1 and np.allclose(np.asarray(_sc.get_offsets()), _X) and list(_sc.get_array()) == [0, 1, 1, 2] and _sc.get_alpha() == 0.6 and list(_sc.get_sizes()) == [25], 'One collection with one point per row, coloured by label, alpha 0.6 and size 25.')",
        "expected": "One collection with one point per row, coloured by label, alpha 0.6 and size 25.",
        "reassurance": "The points are on the page with honest density. Now keep distances honest too."
      },
      {
        "title": "Label the axes and equalise the aspect",
        "instruction": "Update `plot_embedding` so it also labels the x axis `dim 1`, the y axis `dim 2`, and sets an equal aspect ratio so one unit is the same length in both directions.",
        "code": "def plot_embedding(ax, X, y):\n    sc = ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)\n    ax.set(xlabel=\"dim 1\", ylabel=\"dim 2\")\n    ax.set_aspect(\"equal\")\n    return sc",
        "check": "_f, _a = plt.subplots()\nplot_embedding(_a, np.array([[0.0, 0.0], [1.0, 1.0]]), np.array([0, 1]))\ntest('Label the axes and equalise the aspect', lambda: _a.get_xlabel() == 'dim 1' and _a.get_ylabel() == 'dim 2' and _a.get_aspect() == 1.0, 'The axes read dim 1 and dim 2 and the aspect ratio is 1.0.')",
        "expected": "The axes read dim 1 and dim 2 and the aspect ratio is 1.0.",
        "reassurance": "Clusters will look as round as they really are. Draw the three demo clusters."
      },
      {
        "title": "Draw the three clusters",
        "instruction": "Create a figure and axes, call `plot_embedding` with the demo `X` and `y`, and set the title `Three clusters of 2-D embeddings`. Then run the check.",
        "code": "fig, ax = plt.subplots()\nplot_embedding(ax, X, y)\nax.set_title(\"Three clusters of 2-D embeddings\")",
        "check": "",
        "expected": "Three coloured clouds of 80 points each, well separated.",
        "reassurance": "The complete check verifies the collection, colours, transparency, labels, aspect and the 240 demo points."
      }
    ]
  },
  "vz-bars": {
    "setup": "import numpy as np\nimport matplotlib.pyplot as plt\n\nnames = [\"baseline\", \"tuned\", \"distilled\", \"ours\"]\nmeans = [0.81, 0.86, 0.84, 0.88]\nstds = [0.01, 0.03, 0.02, 0.025]",
    "steps": [
      {
        "title": "Rank the models best first",
        "instruction": "Define `rank(names, means, stds)` returning three new lists reordered from the highest mean to the lowest, keeping each name with its mean and spread. Do not modify the inputs.",
        "code": "def rank(names, means, stds):\n    order = np.argsort(means)[::-1]\n    return [names[i] for i in order], [means[i] for i in order], [stds[i] for i in order]",
        "check": "_n, _m, _s = ['b', 'a', 'c'], [0.7, 0.9, 0.8], [0.02, 0.01, 0.03]\ntest('Rank the models best first', lambda: rank(_n, _m, _s) == (['a', 'c', 'b'], [0.9, 0.8, 0.7], [0.01, 0.03, 0.02]) and _n == ['b', 'a', 'c'] and _m == [0.7, 0.9, 0.8], 'The three lists come back ordered a, c, b and the originals are untouched.')",
        "expected": "The three lists come back ordered a, c, b and the originals are untouched.",
        "reassurance": "The ranking is visible before anything is drawn. Now draw it."
      },
      {
        "title": "Draw sorted bars with error bars",
        "instruction": "Define `plot_benchmark(ax, names, means, stds)`: rank the inputs, draw one bar per model with the spreads as error bars and small caps, and return the names in plotted order.",
        "code": "def plot_benchmark(ax, names, means, stds):\n    names, means, stds = rank(names, means, stds)\n    ax.bar(names, means, yerr=stds, capsize=4)\n    return names",
        "check": "_f, _a = plt.subplots()\n_out = plot_benchmark(_a, ['b', 'a', 'c'], [0.7, 0.9, 0.8], [0.02, 0.01, 0.03])\ntest('Draw sorted bars with error bars', lambda: _out == ['a', 'c', 'b'] and [p.get_height() for p in _a.patches] == [0.9, 0.8, 0.7] and any(type(c).__name__ == 'ErrorbarContainer' for c in _a.containers), 'Three bars with heights 0.9, 0.8, 0.7, error bars attached, names returned best first.')",
        "expected": "Three bars with heights 0.9, 0.8, 0.7, error bars attached, names returned best first.",
        "reassurance": "Ranking and uncertainty are both on the chart. One more honesty rule."
      },
      {
        "title": "Start the axis at zero",
        "instruction": "Update `plot_benchmark` so the y axis runs from 0 to 1 and is labelled `accuracy`.",
        "code": "def plot_benchmark(ax, names, means, stds):\n    names, means, stds = rank(names, means, stds)\n    ax.bar(names, means, yerr=stds, capsize=4)\n    ax.set_ylim(0, 1)\n    ax.set_ylabel(\"accuracy\")\n    return names",
        "check": "_f, _a = plt.subplots()\nplot_benchmark(_a, ['b', 'a'], [0.7, 0.9], [0.02, 0.01])\ntest('Start the axis at zero', lambda: _a.get_ylim() == (0.0, 1.0) and _a.get_ylabel() == 'accuracy', 'The y axis spans 0 to 1 and reads accuracy.')",
        "expected": "The y axis spans 0 to 1 and reads accuracy.",
        "reassurance": "Bar heights are now comparable at a glance. Draw the demo benchmark."
      },
      {
        "title": "Draw the demo benchmark",
        "instruction": "Create a figure and axes, print the list returned by `plot_benchmark` for the demo `names`, `means` and `stds`, and set the title `Accuracy over 5 seeds`. Then run the check.",
        "code": "fig, ax = plt.subplots()\nprint(plot_benchmark(ax, names, means, stds))\nax.set_title(\"Accuracy over 5 seeds\")",
        "check": "",
        "expected": "The output lists ours, tuned, distilled, baseline, and the bars descend from left to right.",
        "reassurance": "The complete check verifies the ordering, tick labels, error bars, axis limits and the untouched inputs."
      }
    ]
  },
  "vz-multiples": {
    "setup": "import matplotlib.pyplot as plt\n\nhistory = {\n    \"train_loss\": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06, 0.04, 0.03],\n    \"val_loss\":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.28, 0.29, 0.31, 0.34],\n    \"train_acc\":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95, 0.97, 0.98],\n    \"val_acc\":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84, 0.83, 0.83],\n}",
    "steps": [
      {
        "title": "Draw a train and val pair",
        "instruction": "Define `draw_pair(ax, epochs, train_values, val_values)` that plots the training values and then the validation values against `epochs` on `ax`, labelled `train` and `val`.",
        "code": "def draw_pair(ax, epochs, train_values, val_values):\n    ax.plot(epochs, train_values, label=\"train\")\n    ax.plot(epochs, val_values, label=\"val\")",
        "check": "_f, _a = plt.subplots()\ndraw_pair(_a, [1, 2, 3], [1.0, 0.5, 0.2], [1.1, 0.6, 0.4])\ntest('Draw a train and val pair', lambda: len(_a.get_lines()) == 2 and [l.get_label() for l in _a.get_lines()] == ['train', 'val'] and list(_a.get_lines()[1].get_ydata()) == [1.1, 0.6, 0.4], 'Two lines labelled train and val carry the two series.')",
        "expected": "Two lines labelled train and val carry the two series.",
        "reassurance": "One helper draws either panel. Now the decoration both panels share."
      },
      {
        "title": "Decorate the two panels",
        "instruction": "Define `decorate(fig)` for a figure with two axes: label every x axis `epoch` and add a legend to each; put the left axes on a logarithmic y scale; title the left `loss` and the right `accuracy`; give the figure a suptitle.",
        "code": "def decorate(fig):\n    for ax in fig.axes:\n        ax.set(xlabel=\"epoch\")\n        ax.legend()\n    fig.axes[0].set_yscale(\"log\")\n    fig.axes[0].set_title(\"loss\")\n    fig.axes[1].set_title(\"accuracy\")\n    fig.suptitle(\"Training history\")",
        "check": "_f, _axes = plt.subplots(1, 2)\ndraw_pair(_axes[0], [1, 2], [1.0, 0.5], [1.1, 0.6])\ndraw_pair(_axes[1], [1, 2], [0.5, 0.8], [0.5, 0.7])\ndecorate(_f)\ntest('Decorate the two panels', lambda: all(ax.get_legend() is not None and ax.get_xlabel() == 'epoch' and ax.get_title().strip() for ax in _f.axes) and _f.axes[0].get_yscale() == 'log' and _f.axes[1].get_yscale() == 'linear' and _f._suptitle is not None and _f._suptitle.get_text().strip() != '', 'Both panels have a legend, an epoch label and a title; only the left is logarithmic; the figure has a suptitle.')",
        "expected": "Both panels have a legend, an epoch label and a title; only the left is logarithmic; the figure has a suptitle.",
        "reassurance": "The shared finishing touches live in one place. Assemble the figure."
      },
      {
        "title": "Assemble the figure",
        "instruction": "Define `plot_training(history)`: create a figure with one row of two axes (about 9 by 3.5 inches), build the epoch numbers from the length of the training loss, draw the loss pair on the left and the accuracy pair on the right, decorate, and return the figure.",
        "code": "def plot_training(history):\n    fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))\n    epochs = range(1, len(history[\"train_loss\"]) + 1)\n    draw_pair(axes[0], epochs, history[\"train_loss\"], history[\"val_loss\"])\n    draw_pair(axes[1], epochs, history[\"train_acc\"], history[\"val_acc\"])\n    decorate(fig)\n    return fig",
        "check": "import matplotlib.figure\n_h = {'train_loss': [1.0, 0.5, 0.2], 'val_loss': [1.1, 0.6, 0.4], 'train_acc': [0.5, 0.8, 0.9], 'val_acc': [0.5, 0.75, 0.8]}\n_fig = plot_training(_h)\ntest('Assemble the figure', lambda: isinstance(_fig, matplotlib.figure.Figure) and len(_fig.axes) == 2 and list(_fig.axes[0].get_lines()[0].get_ydata()) == [1.0, 0.5, 0.2] and list(_fig.axes[1].get_lines()[1].get_ydata()) == [0.5, 0.75, 0.8] and _fig.axes[0].get_yscale() == 'log', 'A figure with two axes: losses on a log scale on the left, accuracies on the right.')",
        "expected": "A figure with two axes: losses on a log scale on the left, accuracies on the right.",
        "reassurance": "Small multiples, built from two helpers. Draw the demo run."
      },
      {
        "title": "Draw the demo run",
        "instruction": "Call `plot_training` with the demo `history` and keep the result as `fig`. Then run the check.",
        "code": "fig = plot_training(history)",
        "check": "",
        "expected": "Two panels: a falling loss on a log axis with validation flattening out, and accuracy curves that separate.",
        "reassurance": "The complete check verifies both panels, their legends, scales, titles, the suptitle and the demo figure."
      }
    ]
  },
  "vz-honest": {
    "setup": "import matplotlib.pyplot as plt\n\nmodels = [\"baseline\", \"tuned\", \"ours\"]\naccuracy = [0.981, 0.984, 0.986]\n\nfig, ax = plt.subplots()\nax.bar(models, accuracy)",
    "steps": [
      {
        "title": "Start the y axis at zero",
        "instruction": "The setup draws the three bars on `ax`. Set the y axis to run from 0 to 1 so the bars can be compared by height.",
        "code": "ax.set_ylim(0, 1)",
        "check": "test('Start the y axis at zero', lambda: ax.get_ylim() == (0.0, 1.0) and [p.get_height() for p in ax.patches] == accuracy, 'The y axis spans 0 to 1 and the three bars are unchanged.')",
        "expected": "The y axis spans 0 to 1 and the three bars are unchanged.",
        "reassurance": "The half-point gap now looks like what it is. Say what the axes mean."
      },
      {
        "title": "Label the axes",
        "instruction": "Label the x axis `model` and the y axis `accuracy`.",
        "code": "ax.set_xlabel(\"model\")\nax.set_ylabel(\"accuracy\")",
        "check": "test('Label the axes', lambda: ax.get_xlabel() == 'model' and ax.get_ylabel() == 'accuracy', 'The axes read model and accuracy.')",
        "expected": "The axes read model and accuracy.",
        "reassurance": "A reader can now tell what is measured. Give them the exact numbers too."
      },
      {
        "title": "Print the value on each bar",
        "instruction": "Write the exact accuracy on top of each bar with three decimals. The bars live in the first container of `ax`.",
        "code": "ax.bar_label(ax.containers[0], fmt=\"%.3f\")",
        "check": "test('Print the value on each bar', lambda: len(ax.texts) == 3 and sorted(t.get_text() for t in ax.texts) == ['0.981', '0.984', '0.986'], 'Three labels: 0.981, 0.984 and 0.986.')",
        "expected": "Three labels: 0.981, 0.984 and 0.986.",
        "reassurance": "Nobody has to estimate bar heights any more. Fix the title last."
      },
      {
        "title": "Write an honest title",
        "instruction": "Replace the title with a factual one that states what was measured and on what data, without any claim like 3x. Then run the check.",
        "code": "ax.set_title(\"Accuracy on the test set (n = 2000)\")",
        "check": "",
        "expected": "A bar chart from 0 to 1, labelled, with values on the bars and a factual title.",
        "reassurance": "The complete check verifies the unchanged bars, the axis range, labels, bar values and the title."
      }
    ]
  },
  "vz-annotate": {
    "setup": "import numpy as np\nimport matplotlib.pyplot as plt\n\nepochs = list(range(1, 13))\nval_loss = [1.9, 1.2, 0.8, 0.55, 0.4, 0.33, 0.3, 0.31, 0.35, 0.42, 0.5, 0.6]",
    "steps": [
      {
        "title": "Plot the curve and find its minimum",
        "instruction": "Define `annotate_best(ax, epochs, val_loss)` that plots `val_loss` against `epochs` with a marker on every point, finds the position of the smallest loss, and returns the epoch at that position.",
        "code": "def annotate_best(ax, epochs, val_loss):\n    ax.plot(epochs, val_loss, marker=\"o\")\n    i = int(np.argmin(val_loss))\n    return epochs[i]",
        "check": "_f, _a = plt.subplots()\n_best = annotate_best(_a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])\ntest('Plot the curve and find its minimum', lambda: _best == 2 and list(_a.get_lines()[0].get_ydata()) == [0.9, 0.5, 0.6, 0.8] and _a.get_lines()[0].get_marker() not in ('None', None, ''), 'The curve is drawn with markers and the best epoch, 2, is returned.')",
        "expected": "The curve is drawn with markers and the best epoch, 2, is returned.",
        "reassurance": "You know where to point. Now point."
      },
      {
        "title": "Point at it with an arrow",
        "instruction": "Update `annotate_best` to add an annotation reading `best: epoch N` (N being the best epoch). The arrow tip sits on the minimum point; place the text one epoch to the right and 0.2 above it, with an arrow drawn between them.",
        "code": "def annotate_best(ax, epochs, val_loss):\n    ax.plot(epochs, val_loss, marker=\"o\")\n    i = int(np.argmin(val_loss))\n    best = epochs[i]\n    ax.annotate(f\"best: epoch {best}\", xy=(best, val_loss[i]), xytext=(best + 1, val_loss[i] + 0.2), arrowprops=dict(arrowstyle=\"->\"))\n    return best",
        "check": "_f, _a = plt.subplots()\nannotate_best(_a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])\ntest('Point at it with an arrow', lambda: len(_a.texts) == 1 and tuple(_a.texts[0].xy) == (2, 0.5) and _a.texts[0].get_text() == 'best: epoch 2' and _a.texts[0].arrow_patch is not None and tuple(_a.texts[0].get_position()) != (2, 0.5), 'One annotation named best: epoch 2 with its arrow on (2, 0.5) and its text offset from the point.')",
        "expected": "One annotation named best: epoch 2 with its arrow on (2, 0.5) and its text offset from the point.",
        "reassurance": "The chart delivers its conclusion at a glance. Add a reference line."
      },
      {
        "title": "Add the reference line",
        "instruction": "Update `annotate_best` to also draw a dashed grey vertical line at the best epoch before returning it.",
        "code": "def annotate_best(ax, epochs, val_loss):\n    ax.plot(epochs, val_loss, marker=\"o\")\n    i = int(np.argmin(val_loss))\n    best = epochs[i]\n    ax.annotate(f\"best: epoch {best}\", xy=(best, val_loss[i]), xytext=(best + 1, val_loss[i] + 0.2), arrowprops=dict(arrowstyle=\"->\"))\n    ax.axvline(best, linestyle=\"--\", color=\"gray\")\n    return best",
        "check": "_f, _a = plt.subplots()\nannotate_best(_a, [1, 2, 3, 4], [0.9, 0.5, 0.6, 0.8])\ntest('Add the reference line', lambda: any(len(set(l.get_xdata())) == 1 and list(l.get_xdata())[0] == 2 and l.get_linestyle() == '--' for l in _a.get_lines()) and annotate_best(plt.subplots()[1], [10, 20, 30], [0.5, 0.9, 0.1]) == 30, 'A dashed vertical line stands at epoch 2, and another curve gives epoch 30.')",
        "expected": "A dashed vertical line stands at epoch 2, and another curve gives epoch 30.",
        "reassurance": "Arrow, text and reference line all agree. Run it on the demo curve."
      },
      {
        "title": "Run it on the demo curve",
        "instruction": "Create a figure and axes, print the epoch returned by `annotate_best` for the demo data with the label `best epoch:`, and label the axes `epoch` and `validation loss`. Then run the check.",
        "code": "fig, ax = plt.subplots()\nprint(\"best epoch:\", annotate_best(ax, epochs, val_loss))\nax.set_xlabel(\"epoch\")\nax.set_ylabel(\"validation loss\")",
        "check": "",
        "expected": "The output says best epoch: 7 and the arrow points at the bottom of the curve.",
        "reassurance": "The complete check verifies the markers, the annotation, the line and the returned epoch on new data."
      }
    ]
  },
  "vz-report-boss": {
    "setup": "import numpy as np\nimport matplotlib.pyplot as plt\n\nhistory = {\n    \"train_loss\": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06],\n    \"val_loss\":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.29, 0.31],\n    \"train_acc\":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95],\n    \"val_acc\":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84],\n}\nbenchmark = {\"baseline\": (0.81, 0.01), \"tuned\": (0.86, 0.03), \"distilled\": (0.84, 0.02), \"ours\": (0.88, 0.025)}\nconfusion = np.array([[412, 23, 9], [31, 377, 18], [12, 27, 391]])",
    "steps": [
      {
        "title": "A curves panel",
        "instruction": "Define `panel_curves(ax, train, val, title, log=False)`: plot `train` and `val` against epochs 1 to n, labelled `train` and `val`; when `log` is true put the y axis on a log scale, otherwise fix the y limits to 0 and 1; set the title and show a legend.",
        "code": "def panel_curves(ax, train, val, title, log=False):\n    epochs = range(1, len(train) + 1)\n    ax.plot(epochs, train, label=\"train\")\n    ax.plot(epochs, val, label=\"val\")\n    ax.set_yscale(\"log\") if log else ax.set_ylim(0, 1)\n    ax.set_title(title)\n    ax.legend()",
        "check": "_f, (_l, _r) = plt.subplots(1, 2)\npanel_curves(_l, [1.0, 0.5, 0.2], [1.1, 0.6, 0.4], 'loss', log=True)\npanel_curves(_r, [0.5, 0.8, 0.9], [0.5, 0.75, 0.8], 'accuracy')\ntest('A curves panel', lambda: _l.get_yscale() == 'log' and _r.get_yscale() == 'linear' and _r.get_ylim() == (0.0, 1.0) and all(len(a.get_lines()) == 2 and a.get_legend() is not None and a.get_title().strip() for a in (_l, _r)) and list(_l.get_lines()[0].get_ydata()) == [1.0, 0.5, 0.2] and list(_r.get_lines()[1].get_ydata()) == [0.5, 0.75, 0.8], 'The loss panel is logarithmic, the accuracy panel spans 0 to 1, both have two labelled lines, a legend and a title.')",
        "expected": "The loss panel is logarithmic, the accuracy panel spans 0 to 1, both have two labelled lines, a legend and a title.",
        "reassurance": "One helper serves both curve panels. Next, the ranked benchmark."
      },
      {
        "title": "A ranked benchmark panel",
        "instruction": "Define `panel_benchmark(ax, benchmark)` for a dict of name to (mean, std): sort the entries by mean, best first; draw one bar per name with the std as an error bar with small caps; fix the y limits to 0 and 1; title the panel `benchmark`.",
        "code": "def panel_benchmark(ax, benchmark):\n    ranked = sorted(benchmark.items(), key=lambda item: item[1][0], reverse=True)\n    names = [name for name, _ in ranked]\n    ax.bar(names, [m for _, (m, _) in ranked], yerr=[s for _, (_, s) in ranked], capsize=4)\n    ax.set_ylim(0, 1)\n    ax.set_title(\"benchmark\")",
        "check": "_f, _a = plt.subplots()\npanel_benchmark(_a, {'b': (0.8, 0.02), 'a': (0.9, 0.01), 'c': (0.85, 0.03)})\n_f.canvas.draw()\ntest('A ranked benchmark panel', lambda: [p.get_height() for p in _a.patches] == [0.9, 0.85, 0.8] and [t.get_text() for t in _a.get_xticklabels()] == ['a', 'c', 'b'] and any(type(c).__name__ == 'ErrorbarContainer' for c in _a.containers) and _a.get_ylim() == (0.0, 1.0) and _a.get_title() == 'benchmark', 'Bars 0.9, 0.85, 0.8 labelled a, c, b with error bars, from 0 to 1, titled benchmark.')",
        "expected": "Bars 0.9, 0.85, 0.8 labelled a, c, b with error bars, from 0 to 1, titled benchmark.",
        "reassurance": "The ranking panel is honest by construction. Now the confusion matrix."
      },
      {
        "title": "A confusion-matrix panel",
        "instruction": "Define `panel_confusion(ax, confusion)` for a square array of counts: draw it as an image, write each count in the centre of its cell in white text (column index on x, row index on y), title the panel `confusion matrix`, and label the axes `predicted` and `true`.",
        "code": "def panel_confusion(ax, confusion):\n    ax.imshow(confusion)\n    for i in range(confusion.shape[0]):\n        for j in range(confusion.shape[1]):\n            ax.text(j, i, str(confusion[i, j]), ha=\"center\", va=\"center\", color=\"white\")\n    ax.set_title(\"confusion matrix\")\n    ax.set(xlabel=\"predicted\", ylabel=\"true\")",
        "check": "_f, _a = plt.subplots()\n_cm = np.array([[5, 1], [2, 7]])\npanel_confusion(_a, _cm)\ntest('A confusion-matrix panel', lambda: len(_a.images) == 1 and np.array_equal(_a.images[0].get_array(), _cm) and sorted(t.get_text() for t in _a.texts) == ['1', '2', '5', '7'] and _a.get_title() == 'confusion matrix' and _a.get_xlabel() == 'predicted', 'One heatmap of the 2 by 2 matrix with all four counts written in, titled and labelled.')",
        "expected": "One heatmap of the 2 by 2 matrix with all four counts written in, titled and labelled.",
        "reassurance": "Every panel exists on its own. Put them on one canvas."
      },
      {
        "title": "Compose the report",
        "instruction": "Define `report_figure(history, benchmark, confusion)`: create a 2 by 2 grid of axes (about 10 by 7 inches, with constrained layout) unpacked as two rows; draw the losses with a log scale top left, the accuracies top right, the benchmark bottom left and the confusion matrix bottom right; add the suptitle `Experiment report` and return the figure.",
        "code": "def report_figure(history, benchmark, confusion):\n    fig, ((top_left, top_right), (bottom_left, bottom_right)) = plt.subplots(2, 2, figsize=(10, 7), layout=\"constrained\")\n    panel_curves(top_left, history[\"train_loss\"], history[\"val_loss\"], \"loss\", log=True)\n    panel_curves(top_right, history[\"train_acc\"], history[\"val_acc\"], \"accuracy\")\n    panel_benchmark(bottom_left, benchmark)\n    panel_confusion(bottom_right, confusion)\n    fig.suptitle(\"Experiment report\")\n    return fig",
        "check": "import matplotlib.figure\n_h = {'train_loss': [1.0, 0.5, 0.2], 'val_loss': [1.1, 0.6, 0.4], 'train_acc': [0.5, 0.8, 0.9], 'val_acc': [0.5, 0.75, 0.8]}\n_fig = report_figure(_h, {'b': (0.8, 0.02), 'a': (0.9, 0.01)}, np.array([[5, 1], [2, 7]]))\ntest('Compose the report', lambda: isinstance(_fig, matplotlib.figure.Figure) and len(_fig.axes) == 4 and _fig.axes[0].get_yscale() == 'log' and _fig.axes[1].get_ylim() == (0.0, 1.0) and len(_fig.axes[2].patches) == 2 and len(_fig.axes[3].images) == 1 and _fig._suptitle is not None and all(ax.get_title().strip() for ax in _fig.axes), 'Four titled panels in order: log losses, accuracies from 0 to 1, two bars, one heatmap; plus a suptitle.')",
        "expected": "Four titled panels in order: log losses, accuracies from 0 to 1, two bars, one heatmap; plus a suptitle.",
        "reassurance": "A reviewer can judge the experiment from this one figure. Build the demo report."
      },
      {
        "title": "Build the demo report",
        "instruction": "Call `report_figure` with the demo `history`, `benchmark` and `confusion` and keep the result as `fig`. Then run the boss check.",
        "code": "fig = report_figure(history, benchmark, confusion)",
        "check": "",
        "expected": "A 2 by 2 report: curves, accuracy, four ranked bars and a 3 by 3 heatmap with nine counts.",
        "reassurance": "The boss check verifies every panel on new data and the nine labels and four bars of the demo figure."
      }
    ]
  }
}
