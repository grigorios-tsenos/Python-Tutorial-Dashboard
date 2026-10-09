---
id: sk-pipeline
track: ml
order: 5
title: Scale Inside a Pipeline
tagline: Preprocessing is part of the model. Fit it on the same data, and only that data.
kind: build
xp: 50
minutes: 7
packages: scikit-learn
---
@@body
# One object, fitted once, applied everywhere

Features on wildly different scales (income in thousands, age in years) confuse many models, so you **standardize** them first. But the standardizer learns means and spreads from data, which makes it a model too: fit it on the training data only, and apply the same numbers at test time and in production. A `Pipeline` bundles the preprocessing and the model into one estimator with the usual `fit`, `predict` and `score`, so the discipline is automatic.

```python
model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])
model.fit(X_train, y_train)      # fits the scaler, transforms, fits the classifier
model.named_steps["scale"].mean_ # the means it learned, from X_train only
```

> **Mission:** implement `make_model()` → that two-step pipeline, and `fit_and_score(model, X, y, seed=0)` → the test accuracy after a 75/25 split with `random_state=seed`, fitting the pipeline on the training part only.

@@step Build the pipeline
A list of `(name, estimator)` pairs. Every step but the last must transform data; the last one predicts:

```python
return Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])
```

**Do:** implement `make_model`, then Run.
@@stepcheck
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
m = make_model()
test("a two-step pipeline: scale, then classify", lambda: isinstance(m, Pipeline) and list(m.named_steps) == ["scale", "clf"] and isinstance(m.named_steps["scale"], StandardScaler) and isinstance(m.named_steps["clf"], LogisticRegression), 'Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])')
@@step Fit on the training part, score on the test part
Split, fit the whole pipeline on the training arrays, score on the test arrays. The scaler never sees `X_test` during fitting:

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)
model.fit(X_train, y_train)
return model.score(X_test, y_test)
```

**Do:** implement `fit_and_score`, then Run. The step check confirms the scaler's means come from the training rows only.
@@stepcheck
import numpy as np
from sklearn.model_selection import train_test_split
rng = np.random.default_rng(1)
Xs = np.column_stack([rng.normal(0, 1, 300), rng.normal(0, 1000, 300)])
ys = (Xs[:, 0] + Xs[:, 1] / 1000 > 0).astype(int)
m = make_model()
acc = fit_and_score(m, Xs, ys, seed=7)
Xtr, Xte, ytr, yte = train_test_split(Xs, ys, test_size=0.25, random_state=7)
test("the scaler learned its means from the training rows only", lambda: np.allclose(m.named_steps["scale"].mean_, Xtr.mean(axis=0)), "model.fit(X_train, y_train) after the split")
test("the returned number is the test accuracy", lambda: np.isclose(acc, m.score(Xte, yte)) and acc > 0.8)
@@starter
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def make_model():
    """A pipeline: standardize, then logistic regression."""
    # TODO
    return LogisticRegression()

def fit_and_score(model, X, y, seed=0):
    """Fit on a 75% training split and return the accuracy on the held-out 25%."""
    # TODO
    return 0.0

rng = np.random.default_rng(0)
X = np.column_stack([rng.normal(0, 1, 400), rng.normal(50000, 15000, 400)])   # age-ish, income-ish
y = ((X[:, 0] + (X[:, 1] - 50000) / 15000) > 0).astype(int)
print("test accuracy:", fit_and_score(make_model(), X, y))
@@solution
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def make_model():
    """A pipeline: standardize, then logistic regression."""
    return Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])

def fit_and_score(model, X, y, seed=0):
    """Fit on a 75% training split and return the accuracy on the held-out 25%."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)
    model.fit(X_train, y_train)
    return model.score(X_test, y_test)

rng = np.random.default_rng(0)
X = np.column_stack([rng.normal(0, 1, 400), rng.normal(50000, 15000, 400)])   # age-ish, income-ish
y = ((X[:, 0] + (X[:, 1] - 50000) / 15000) > 0).astype(int)
print("test accuracy:", fit_and_score(make_model(), X, y))
@@check
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
m = make_model()
test("make_model returns a scale-then-classify pipeline", lambda: isinstance(m, Pipeline) and list(m.named_steps) == ["scale", "clf"] and isinstance(m.named_steps["scale"], StandardScaler) and isinstance(m.named_steps["clf"], LogisticRegression))
test("each call builds a fresh, unfitted model", lambda: make_model() is not m and not hasattr(make_model().named_steps["scale"], "mean_"))
rng = np.random.default_rng(1)
Xs = np.column_stack([rng.normal(0, 1, 300), rng.normal(0, 1000, 300)])
ys = (Xs[:, 0] + Xs[:, 1] / 1000 > 0).astype(int)
acc = fit_and_score(m, Xs, ys, seed=7)
Xtr, Xte, ytr, yte = train_test_split(Xs, ys, test_size=0.25, random_state=7)
test("the scaler learned its means from the training rows only", lambda: np.allclose(m.named_steps["scale"].mean_, Xtr.mean(axis=0)))
test("the returned number is the test accuracy", lambda: np.isclose(acc, m.score(Xte, yte)) and 0.8 < acc <= 1.0)
test("scaling makes both features count", lambda: abs(m.named_steps["clf"].coef_[0][0]) > 0.5 and abs(m.named_steps["clf"].coef_[0][1]) > 0.5)
test("the demo accuracy is printed", lambda: "test accuracy:" in __stdout__)
@@hint
`Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())])`. The names are up to you, but the checks look for `scale` and `clf`.
@@hint
Split with `train_test_split(X, y, test_size=0.25, random_state=seed)`, then `model.fit(X_train, y_train)` and `return model.score(X_test, y_test)`.
@@q
Why must the scaler be fitted on the training data only?
@@a
Its means and spreads are learned parameters; using test rows to compute them leaks information from the test set into the model.
@@q
What does a Pipeline guarantee that manual preprocessing does not?
@@a
That every transformation is fitted exactly once, on the same data as the model, and applied identically at predict time.
@@real
Pipelines are what you save and deploy: `joblib.dump(model, "model.pkl")` or `mlflow.sklearn.log_model(model, ...)` stores the scaler's numbers together with the classifier, so production inputs are scaled the same way as training inputs.
