---
id: vz-scatter
track: viz
order: 3
title: Scatter: See the Shape of Your Data
tagline: Before any model, look at the points. Clusters, outliers and overlap are all visible.
kind: build
xp: 40
minutes: 6
packages: matplotlib
---
@@body
# Points, coloured by what you want to predict

A scatter plot puts one point per example. Colour the points by their class and you can *see* whether the classes are separable before training anything. Two refinements keep the picture honest: **transparency** (`alpha`) so dense regions look dense instead of becoming one blob, and **equal aspect** so distances on the page match distances in the data.

```python
sc = ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)
ax.set_aspect("equal")
```

> **Mission:** implement `plot_embedding(ax, X, y)` for a 2-D array `X` and integer labels `y`: scatter the points coloured by label with `alpha=0.6` and `s=25`, label the axes `dim 1` and `dim 2`, set an equal aspect ratio, and return the scatter collection.

@@step One point per row, coloured by label
`c=y` maps each label to a colour from the default colormap. Column 0 goes on x, column 1 on y:

```python
sc = ax.scatter(X[:, 0], X[:, 1], c=y)
return sc
```

**Do:** draw and return the scatter, then Run.
@@stepcheck
import numpy as np, matplotlib.pyplot as plt
f, a = plt.subplots()
X = np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5]])
sc = plot_embedding(a, X, np.array([0, 1, 1]))
test("one scatter collection with one point per row, coloured by label", lambda: len(a.collections) == 1 and len(sc.get_offsets()) == 3 and list(sc.get_array()) == [0, 1, 1], "ax.scatter(X[:, 0], X[:, 1], c=y)")
@@step Transparency and size
Overlapping opaque points hide their density. `alpha=0.6` lets overlaps show as darker spots; `s=25` keeps the dots small enough to see structure:

```python
sc = ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)
```

**Do:** add both arguments, then Run.
@@stepcheck
import numpy as np, matplotlib.pyplot as plt
f, a = plt.subplots()
sc = plot_embedding(a, np.array([[0.0, 0.0], [1.0, 1.0]]), np.array([0, 1]))
test("points are semi-transparent and small", lambda: sc.get_alpha() == 0.6 and list(sc.get_sizes()) == [25], "alpha=0.6, s=25")
@@step Labels and an honest aspect ratio
Name the dimensions and make one unit on x the same length as one unit on y, so a cluster that is round in the data is round on the page:

```python
ax.set_xlabel("dim 1")
ax.set_ylabel("dim 2")
ax.set_aspect("equal")
```

**Do:** add the three lines, then Run.
@@stepcheck
import numpy as np, matplotlib.pyplot as plt
f, a = plt.subplots()
plot_embedding(a, np.array([[0.0, 0.0], [1.0, 1.0]]), np.array([0, 1]))
test("axes are labelled and the aspect is equal", lambda: a.get_xlabel() == "dim 1" and a.get_ylabel() == "dim 2" and a.get_aspect() == 1.0, 'ax.set_aspect("equal")')
@@starter
import numpy as np
import matplotlib.pyplot as plt

def plot_embedding(ax, X, y):
    """Scatter the 2-D points in X coloured by label y; return the scatter collection."""
    # TODO
    return None

rng = np.random.default_rng(0)
X = np.vstack([rng.normal([0, 0], 0.6, (80, 2)), rng.normal([3, 1], 0.6, (80, 2)), rng.normal([1.5, 3], 0.6, (80, 2))])
y = np.repeat([0, 1, 2], 80)

fig, ax = plt.subplots()
plot_embedding(ax, X, y)
ax.set_title("Three clusters of 2-D embeddings")
@@solution
import numpy as np
import matplotlib.pyplot as plt

def plot_embedding(ax, X, y):
    """Scatter the 2-D points in X coloured by label y; return the scatter collection."""
    sc = ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)
    ax.set_xlabel("dim 1")
    ax.set_ylabel("dim 2")
    ax.set_aspect("equal")
    return sc

rng = np.random.default_rng(0)
X = np.vstack([rng.normal([0, 0], 0.6, (80, 2)), rng.normal([3, 1], 0.6, (80, 2)), rng.normal([1.5, 3], 0.6, (80, 2))])
y = np.repeat([0, 1, 2], 80)

fig, ax = plt.subplots()
plot_embedding(ax, X, y)
ax.set_title("Three clusters of 2-D embeddings")
@@check
import numpy as np, matplotlib.pyplot as plt
f, a = plt.subplots()
Xs = np.array([[0.0, 0.0], [1.0, 1.0], [2.0, 0.5], [0.5, 2.0]])
ys = np.array([0, 1, 1, 2])
sc = plot_embedding(a, Xs, ys)
test("one scatter collection with one point per row", lambda: len(a.collections) == 1 and len(sc.get_offsets()) == 4)
test("x comes from column 0 and y from column 1", lambda: np.allclose(np.asarray(sc.get_offsets()), Xs))
test("points are coloured by label", lambda: list(sc.get_array()) == [0, 1, 1, 2])
test("points are semi-transparent and small", lambda: sc.get_alpha() == 0.6 and list(sc.get_sizes()) == [25])
test("axes are labelled and the aspect is equal", lambda: a.get_xlabel() == "dim 1" and a.get_ylabel() == "dim 2" and a.get_aspect() == 1.0)
test("the demo scatter has 240 points", lambda: len(ax.collections[0].get_offsets()) == 240)
@@hint
`ax.scatter(X[:, 0], X[:, 1], c=y, alpha=0.6, s=25)` does the drawing; keep its return value to return it.
@@hint
`ax.set_xlabel("dim 1")`, `ax.set_ylabel("dim 2")`, `ax.set_aspect("equal")`.
@@q
Why add transparency to a scatter plot?
@@a
Overlapping points stack into darker regions, so density becomes visible instead of hiding behind the top point.
@@q
What does an equal aspect ratio protect you from?
@@a
Stretched axes that make distances look larger in one direction than the other, which distorts clusters and distances.
@@real
Real embeddings have hundreds of dimensions; you reduce them to 2-D with PCA, t-SNE or UMAP first (`sklearn.decomposition.PCA(n_components=2)`), then draw exactly this chart to inspect clusters and mislabelled points.
