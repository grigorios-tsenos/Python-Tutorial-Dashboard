---
id: vz-report-boss
track: viz
order: 9
title: "Boss: The One-Figure Experiment Report"
tagline: Curves, a ranked benchmark and a confusion matrix, on one canvas, ready to attach to a run.
kind: boss
xp: 110
minutes: 14
packages: matplotlib
---
@@body
# Boss: everything a reviewer needs on one canvas

An experiment is finished when someone else can judge it from one figure. Four panels in a 2×2 grid: training and validation loss (log scale), accuracy curves, a sorted benchmark with error bars, and a confusion matrix as a heatmap (`ax.imshow`). Every panel titled; the figure titled.

> **Mission:** implement `report_figure(history, benchmark, confusion)` and return the figure:
>
> - `history`: dict with lists `train_loss`, `val_loss`, `train_acc`, `val_acc`
> - `benchmark`: dict `name -> (mean, std)`
> - `confusion`: a square 2-D array of counts
>
> Panels, in `fig.axes` order: `[0]` losses on a log y axis with a legend; `[1]` accuracies with a legend and y limits `(0, 1)`; `[2]` bars sorted best-first with `yerr` and y limits `(0, 1)`; `[3]` `imshow` of the confusion matrix with the count written in every cell. Each panel has a title and the figure has a suptitle.

@@step A 2×2 grid, titled
Create the grid, flatten the axes array so `axes[0]..axes[3]` index the panels, give every panel a title and the figure a suptitle, and return the figure.
@@stepcheck
import numpy as np
h = {"train_loss": [1.0, 0.5], "val_loss": [1.1, 0.6], "train_acc": [0.5, 0.8], "val_acc": [0.5, 0.75]}
f = report_figure(h, {"a": (0.9, 0.01), "b": (0.8, 0.02)}, np.array([[5, 1], [2, 7]]))
test("four titled panels and a figure title", lambda: f is not None and len(f.axes) == 4 and all(ax.get_title().strip() for ax in f.axes) and f._suptitle is not None and f._suptitle.get_text().strip() != "", "fig, axes = plt.subplots(2, 2, figsize=(10, 7)); axes = axes.flatten()")
@@step The two curve panels
Panel 0: both losses, `set_yscale("log")`, legend. Panel 1: both accuracies, legend, `set_ylim(0, 1)`.
@@stepcheck
import numpy as np
h = {"train_loss": [1.0, 0.5, 0.2], "val_loss": [1.1, 0.6, 0.4], "train_acc": [0.5, 0.8, 0.9], "val_acc": [0.5, 0.75, 0.8]}
f = report_figure(h, {"a": (0.9, 0.01)}, np.array([[5, 1], [2, 7]]))
test("panel 0 shows both losses on a log scale with a legend", lambda: len(f.axes[0].get_lines()) == 2 and f.axes[0].get_yscale() == "log" and f.axes[0].get_legend() is not None and list(f.axes[0].get_lines()[1].get_ydata()) == [1.1, 0.6, 0.4])
test("panel 1 shows both accuracies between 0 and 1 with a legend", lambda: len(f.axes[1].get_lines()) == 2 and f.axes[1].get_ylim() == (0.0, 1.0) and f.axes[1].get_legend() is not None)
@@step The benchmark and the confusion matrix
Panel 2: sort the benchmark by mean (best first), `ax.bar(names, means, yerr=stds, capsize=4)`, `set_ylim(0, 1)`. Panel 3: `ax.imshow(confusion)`, then loop over rows and columns and `ax.text(j, i, str(confusion[i, j]), ha="center", va="center")` for every cell.
@@stepcheck
import numpy as np
h = {"train_loss": [1.0, 0.5], "val_loss": [1.1, 0.6], "train_acc": [0.5, 0.8], "val_acc": [0.5, 0.75]}
cm = np.array([[5, 1], [2, 7]])
f = report_figure(h, {"b": (0.8, 0.02), "a": (0.9, 0.01), "c": (0.85, 0.03)}, cm)
heights = [p.get_height() for p in f.axes[2].patches]
test("panel 2 ranks the benchmark with error bars", lambda: heights == [0.9, 0.85, 0.8] and any(type(c).__name__ == "ErrorbarContainer" for c in f.axes[2].containers) and f.axes[2].get_ylim() == (0.0, 1.0), "sort by mean descending, yerr=stds")
test("panel 3 is a heatmap with every count written in", lambda: len(f.axes[3].images) == 1 and np.array_equal(f.axes[3].images[0].get_array(), cm) and sorted(t.get_text() for t in f.axes[3].texts) == ["1", "2", "5", "7"], "ax.imshow(confusion) and ax.text(j, i, str(confusion[i, j]), ha='center', va='center')")
@@starter
import numpy as np
import matplotlib.pyplot as plt

def report_figure(history, benchmark, confusion):
    """A 2x2 report: loss curves, accuracy curves, ranked benchmark, confusion matrix."""
    # TODO
    return None

history = {
    "train_loss": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06],
    "val_loss":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.29, 0.31],
    "train_acc":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95],
    "val_acc":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84],
}
benchmark = {"baseline": (0.81, 0.01), "tuned": (0.86, 0.03), "distilled": (0.84, 0.02), "ours": (0.88, 0.025)}
confusion = np.array([[412, 23, 9], [31, 377, 18], [12, 27, 391]])

fig = report_figure(history, benchmark, confusion)
@@solution
import numpy as np
import matplotlib.pyplot as plt

def report_figure(history, benchmark, confusion):
    """A 2x2 report: loss curves, accuracy curves, ranked benchmark, confusion matrix."""
    fig, axes = plt.subplots(2, 2, figsize=(10, 7))
    axes = axes.flatten()
    epochs = range(1, len(history["train_loss"]) + 1)

    axes[0].plot(epochs, history["train_loss"], label="train")
    axes[0].plot(epochs, history["val_loss"], label="val")
    axes[0].set_yscale("log")
    axes[0].set_title("loss")
    axes[0].legend()

    axes[1].plot(epochs, history["train_acc"], label="train")
    axes[1].plot(epochs, history["val_acc"], label="val")
    axes[1].set_ylim(0, 1)
    axes[1].set_title("accuracy")
    axes[1].legend()

    ranked = sorted(benchmark.items(), key=lambda item: item[1][0], reverse=True)
    names = [name for name, _ in ranked]
    means = [mean for _, (mean, _) in ranked]
    stds = [std for _, (_, std) in ranked]
    axes[2].bar(names, means, yerr=stds, capsize=4)
    axes[2].set_ylim(0, 1)
    axes[2].set_title("benchmark")

    axes[3].imshow(confusion)
    for i in range(confusion.shape[0]):
        for j in range(confusion.shape[1]):
            axes[3].text(j, i, str(confusion[i, j]), ha="center", va="center", color="white")
    axes[3].set_title("confusion matrix")
    axes[3].set_xlabel("predicted")
    axes[3].set_ylabel("true")

    fig.suptitle("Experiment report")
    fig.tight_layout()
    return fig

history = {
    "train_loss": [2.1, 1.2, 0.7, 0.4, 0.25, 0.15, 0.09, 0.06],
    "val_loss":   [2.2, 1.3, 0.8, 0.5, 0.36, 0.3, 0.29, 0.31],
    "train_acc":  [0.3, 0.55, 0.7, 0.8, 0.86, 0.9, 0.93, 0.95],
    "val_acc":    [0.3, 0.52, 0.66, 0.75, 0.8, 0.83, 0.84, 0.84],
}
benchmark = {"baseline": (0.81, 0.01), "tuned": (0.86, 0.03), "distilled": (0.84, 0.02), "ours": (0.88, 0.025)}
confusion = np.array([[412, 23, 9], [31, 377, 18], [12, 27, 391]])

fig = report_figure(history, benchmark, confusion)
@@check
import numpy as np
import matplotlib.figure
h = {"train_loss": [1.0, 0.5, 0.2], "val_loss": [1.1, 0.6, 0.4], "train_acc": [0.5, 0.8, 0.9], "val_acc": [0.5, 0.75, 0.8]}
cm = np.array([[5, 1], [2, 7]])
f = report_figure(h, {"b": (0.8, 0.02), "a": (0.9, 0.01), "c": (0.85, 0.03)}, cm)
test("a figure with four axes comes back", lambda: isinstance(f, matplotlib.figure.Figure) and len(f.axes) == 4)
test("every panel is titled and the figure has a suptitle", lambda: all(ax.get_title().strip() for ax in f.axes) and f._suptitle is not None and f._suptitle.get_text().strip() != "")
test("panel 0: both losses, log scale, legend", lambda: len(f.axes[0].get_lines()) == 2 and f.axes[0].get_yscale() == "log" and f.axes[0].get_legend() is not None and list(f.axes[0].get_lines()[0].get_ydata()) == [1.0, 0.5, 0.2])
test("panel 1: both accuracies, 0 to 1, legend", lambda: len(f.axes[1].get_lines()) == 2 and f.axes[1].get_ylim() == (0.0, 1.0) and f.axes[1].get_legend() is not None and list(f.axes[1].get_lines()[1].get_ydata()) == [0.5, 0.75, 0.8])
heights = [p.get_height() for p in f.axes[2].patches]
test("panel 2: bars sorted best first with error bars, 0 to 1", lambda: heights == [0.9, 0.85, 0.8] and any(type(c).__name__ == "ErrorbarContainer" for c in f.axes[2].containers) and f.axes[2].get_ylim() == (0.0, 1.0))
f.axes[2].figure.canvas.draw()
test("panel 2: tick labels follow the ranking", lambda: [t.get_text() for t in f.axes[2].get_xticklabels()] == ["a", "c", "b"])
test("panel 3: a heatmap of the confusion matrix with every count written in", lambda: len(f.axes[3].images) == 1 and np.array_equal(f.axes[3].images[0].get_array(), cm) and sorted(t.get_text() for t in f.axes[3].texts) == ["1", "2", "5", "7"])
test("the demo figure holds the 3x3 matrix with nine labels", lambda: fig is not None and len(fig.axes[3].texts) == 9 and len(fig.axes[2].patches) == 4)
@@hint
`fig, axes = plt.subplots(2, 2, figsize=(10, 7))` then `axes = axes.flatten()`. Sort the benchmark with `sorted(benchmark.items(), key=lambda item: item[1][0], reverse=True)`.
@@hint
For the heatmap: `axes[3].imshow(confusion)` then two nested loops calling `axes[3].text(j, i, str(confusion[i, j]), ha="center", va="center")`. Finish with `fig.suptitle(...)`, `fig.tight_layout()` and `return fig`.
@@q
Why put a confusion matrix in a report instead of a single accuracy number?
@@a
It shows which classes are confused with which; two models with equal accuracy can fail in very different, differently costly ways.
@@q
What does `ax.imshow` do with a 2-D array?
@@a
It draws each cell as a coloured square, with row index on y and column index on x, which is exactly a heatmap.
@@real
`mlflow.log_figure(fig, "report.png")` attaches this to a run so every experiment carries its own report. `sklearn.metrics.ConfusionMatrixDisplay` draws the matrix panel with labels in one call.
