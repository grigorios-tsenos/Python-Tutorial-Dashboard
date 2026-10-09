---
id: sk-cv
track: ml
order: 6
title: One Score Is a Coin Flip
tagline: Cross-validation turns a lucky split into an estimate with error bars.
kind: build
xp: 55
minutes: 8
packages: scikit-learn
---
@@body
# Score on every fold, then average

A single train/test split gives one number that depends on which rows landed in the test set. **k-fold cross-validation** rotates: split the data into `k` folds, train on `k − 1`, test on the remaining one, repeat `k` times. You get `k` scores, a mean and a spread, and every row is tested exactly once.

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)   # keeps class balance per fold
scores = cross_val_score(model, X, y, cv=cv)                          # one score per fold
```

> **Mission:** implement `cv_report(model, X, y, k=5, seed=0)` → `(mean, std)` of the `k` fold accuracies using a shuffled, seeded `StratifiedKFold`, and `compare(models, X, y)` → the name of the model with the highest mean (ties keep the first), for a dict `name -> model`.
@@starter
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score

def cv_report(model, X, y, k=5, seed=0):
    """(mean, std) of k-fold cross-validated accuracy."""
    # TODO
    return 0.0, 0.0

def compare(models, X, y):
    """The name of the model with the best mean cross-validated accuracy."""
    # TODO
    return None

rng = np.random.default_rng(0)
X = rng.normal(size=(300, 4))
y = (X[:, 0] - X[:, 1] + 0.3 * rng.normal(size=300) > 0).astype(int)
models = {"logistic": LogisticRegression(), "tree": DecisionTreeClassifier(random_state=0)}
for name, model in models.items():
    print(name, cv_report(model, X, y))
print("winner:", compare(models, X, y))
@@solution
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score

def cv_report(model, X, y, k=5, seed=0):
    """(mean, std) of k-fold cross-validated accuracy."""
    cv = StratifiedKFold(n_splits=k, shuffle=True, random_state=seed)
    scores = cross_val_score(model, X, y, cv=cv)
    return float(scores.mean()), float(scores.std())

def compare(models, X, y):
    """The name of the model with the best mean cross-validated accuracy."""
    best_name, best_mean = None, -1.0
    for name, model in models.items():
        mean, _ = cv_report(model, X, y)
        if mean > best_mean:
            best_name, best_mean = name, mean
    return best_name

rng = np.random.default_rng(0)
X = rng.normal(size=(300, 4))
y = (X[:, 0] - X[:, 1] + 0.3 * rng.normal(size=300) > 0).astype(int)
models = {"logistic": LogisticRegression(), "tree": DecisionTreeClassifier(random_state=0)}
for name, model in models.items():
    print(name, cv_report(model, X, y))
print("winner:", compare(models, X, y))
@@check
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
rng = np.random.default_rng(0)
Xs = rng.normal(size=(200, 2))
ys = (Xs[:, 0] + Xs[:, 1] > 0).astype(int)
mean, std = cv_report(LogisticRegression(), Xs, ys, k=4, seed=3)
ref = cross_val_score(LogisticRegression(), Xs, ys, cv=StratifiedKFold(n_splits=4, shuffle=True, random_state=3))
test("mean and std of the k fold scores, as floats", lambda: np.isclose(mean, ref.mean()) and np.isclose(std, ref.std()) and type(mean) is float and type(std) is float)
test("k and seed change the folds", lambda: not np.isclose(cv_report(LogisticRegression(), Xs, ys, k=3, seed=3)[0], mean) or not np.isclose(cv_report(LogisticRegression(), Xs, ys, k=4, seed=9)[0], mean))
test("the better model wins", lambda: compare({"dummy": DummyClassifier(), "logistic": LogisticRegression()}, Xs, ys) == "logistic")
test("ties keep the first model and no models gives None", lambda: compare({"a": DummyClassifier(), "b": DummyClassifier()}, Xs, ys) == "a" and compare({}, Xs, ys) is None)
test("the demo picks logistic regression on linear data", lambda: "winner: logistic" in __stdout__)
@@hint
`StratifiedKFold(n_splits=k, shuffle=True, random_state=seed)` is the splitter; pass it as `cv=` to `cross_val_score(model, X, y, cv=cv)`.
@@hint
`compare`: start with `best_mean = -1.0`, loop `models.items()`, call `cv_report`, and replace the best only when `mean > best_mean`.
@@q
Why does cross-validation give a more reliable estimate than one split?
@@a
Every row is tested once and the score is averaged over k different test sets, so one unlucky split cannot dominate.
@@q
What does the std of the fold scores tell you?
@@a
How much the score depends on which rows were held out; a large std means model comparisons within that range are not meaningful.
@@real
`GridSearchCV` and `RandomizedSearchCV` run this loop over hyperparameter settings and return the best model. On large datasets a single held-out set is often enough; on small ones, cross-validation is the only honest option.
