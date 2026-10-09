---
id: sk-split
track: ml
order: 2
title: Split Before You Judge
tagline: A model graded on its own training examples is a student grading their own exam.
kind: build
xp: 35
minutes: 6
packages: scikit-learn
---
@@body
# Hold data back, or the score is fiction

A model can memorise its training examples. The only honest measure of what it learned is its performance on examples it has **never seen**. So you split the data once, fit on the training part, and score on the test part. The test part is touched exactly once, at the end.

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)
```

`random_state` makes the split reproducible; a different seed gives a different split and slightly different scores, which is itself useful information.

> **Mission:** implement `split(X, y, seed)` → the four arrays from a 75/25 split, and `holdout_scores(X, y, seed)` → `(train_r2, test_r2)` for a `LinearRegression` fitted on the training part only.
@@starter
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

def split(X, y, seed):
    """X_train, X_test, y_train, y_test with 25% held out."""
    # TODO
    return X, X, y, y

def holdout_scores(X, y, seed):
    """(train R², test R²) for a linear model fitted on the training part."""
    # TODO
    return 0.0, 0.0

rng = np.random.default_rng(0)
X = rng.uniform(0, 10, (80, 1))                 # 80 flats, one feature
y = 3 * X[:, 0] + rng.normal(0, 1, 80)          # price with noise
for seed in (0, 1, 2):
    print(seed, holdout_scores(X, y, seed))
@@solution
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

def split(X, y, seed):
    """X_train, X_test, y_train, y_test with 25% held out."""
    return train_test_split(X, y, test_size=0.25, random_state=seed)

def holdout_scores(X, y, seed):
    """(train R², test R²) for a linear model fitted on the training part."""
    X_train, X_test, y_train, y_test = split(X, y, seed)
    model = LinearRegression().fit(X_train, y_train)
    return model.score(X_train, y_train), model.score(X_test, y_test)

rng = np.random.default_rng(0)
X = rng.uniform(0, 10, (80, 1))                 # 80 flats, one feature
y = 3 * X[:, 0] + rng.normal(0, 1, 80)          # price with noise
for seed in (0, 1, 2):
    print(seed, holdout_scores(X, y, seed))
@@check
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
Xs = np.arange(40).reshape(-1, 1)
ys = np.arange(40)
a = split(Xs, ys, 0)
test("a 75/25 split, in the standard order", lambda: len(a) == 4 and len(a[0]) == 30 and len(a[1]) == 10 and len(a[2]) == 30 and len(a[3]) == 10)
test("the same seed gives the same split, a different seed a different one", lambda: np.array_equal(a[1], split(Xs, ys, 0)[1]) and not np.array_equal(a[1], split(Xs, ys, 1)[1]))
test("targets travel with their rows", lambda: all(int(row[0]) == int(t) for row, t in zip(a[1], a[3])))
rng = np.random.default_rng(0)
Xr = rng.uniform(0, 10, (80, 1))
yr = 3 * Xr[:, 0] + rng.normal(0, 1, 80)
tr, te = holdout_scores(Xr, yr, 4)
Xtr, Xte, ytr, yte = train_test_split(Xr, yr, test_size=0.25, random_state=4)
m = LinearRegression().fit(Xtr, ytr)
test("scores come from a model fitted on the training part only", lambda: np.isclose(tr, m.score(Xtr, ytr)) and np.isclose(te, m.score(Xte, yte)))
test("both scores are high on clean linear data", lambda: tr > 0.9 and te > 0.9)
test("three seeds were printed", lambda: __stdout__.count("(") >= 3)
@@hint
`train_test_split(X, y, test_size=0.25, random_state=seed)` returns four arrays in the order `X_train, X_test, y_train, y_test`.
@@hint
`holdout_scores`: unpack `split(...)`, fit `LinearRegression()` on the train arrays, return `model.score(X_train, y_train), model.score(X_test, y_test)`.
@@q
Why is a test score more trustworthy than a training score?
@@a
The model never saw the test examples, so the score measures generalisation rather than memorisation.
@@q
What does `random_state` control in `train_test_split`?
@@a
The shuffle before splitting; fixing it makes the split, and therefore the scores, reproducible.
@@real
Real projects split three ways: train, validation (for choosing settings) and test (touched once, at the end). Cross-validation, a few lessons on, reuses the data more efficiently.
