---
id: sk-leak
track: ml
order: 7
title: "Bug Hunt: The 100% Accurate Model"
tagline: When a model is too good to be true, a future fact leaked into its features.
kind: bug
xp: 55
minutes: 8
packages: scikit-learn
---
@@body
# Leakage: the most expensive bug in machine learning

The churn model below scores a perfect test accuracy. Nobody celebrates, because two things leaked:

1. **A feature computed from the label.** `days_since_churn` is zero for every customer who stayed and positive for every customer who left. It is the answer, renamed.
2. **Preprocessing fitted on all rows before the split.** The scaler's means include the test rows, so the test score is slightly rosier than production will be.

> **Mission:** remove the leaky feature from `FEATURES`, and make `model` a `Pipeline` of `StandardScaler` and `LogisticRegression` fitted on the training rows only (keep the split's `random_state=0`). The honest accuracy is well below 1.0.

@@step Remove the feature that is the label in disguise
Run the starter and look at the accuracy. Then ask of every feature: *would I know this at prediction time?* `days_since_churn` only exists after the customer has churned. Delete it from `FEATURES`.

**Do:** fix the list, then Run.
@@stepcheck
test("the leaky feature is gone", lambda: "days_since_churn" not in FEATURES and set(FEATURES) == {"tenure", "monthly", "support_calls"}, 'FEATURES = ["tenure", "monthly", "support_calls"]')
test("accuracy drops to an honest level", lambda: accuracy < 0.97, "a perfect score means the answer is still in the features")
@@step Fit the scaler inside the split
Delete the manual scaling. Split the raw features, then fit a pipeline on the training part so the scaler never sees test rows:

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]).fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
```

**Do:** restructure the fitting, then Run.
@@stepcheck
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
Xtr, Xte, ytr, yte = train_test_split(df[FEATURES].values, df["churned"].values, test_size=0.25, random_state=0)
test("the model is a pipeline whose scaler saw only training rows", lambda: isinstance(model, Pipeline) and np.allclose(model.named_steps["scale"].mean_, Xtr.mean(axis=0)), "Pipeline([...]).fit(X_train, y_train) after the split")
@@starter
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def make_churn(n=600, seed=0):
    rng = np.random.default_rng(seed)
    tenure = rng.integers(1, 60, n)
    monthly = rng.normal(50, 15, n)
    support_calls = rng.poisson(1.0, n)
    logit = -1.5 + 0.03 * (30 - tenure) + 0.6 * support_calls + 0.02 * (monthly - 50)
    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))
    days_since_churn = np.where(churned == 1, rng.integers(1, 90, n), 0)
    return pd.DataFrame({"tenure": tenure, "monthly": monthly, "support_calls": support_calls, "days_since_churn": days_since_churn, "churned": churned})

df = make_churn()
FEATURES = ["tenure", "monthly", "support_calls", "days_since_churn"]   # BUG HUNT: one of these is the answer
X = df[FEATURES].values
y = df["churned"].values

scaler = StandardScaler().fit(X)                   # BUG HUNT: fitted before the split
X_scaled = scaler.transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.25, random_state=0)
model = LogisticRegression().fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
print("test accuracy:", round(accuracy, 3))
@@solution
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

def make_churn(n=600, seed=0):
    rng = np.random.default_rng(seed)
    tenure = rng.integers(1, 60, n)
    monthly = rng.normal(50, 15, n)
    support_calls = rng.poisson(1.0, n)
    logit = -1.5 + 0.03 * (30 - tenure) + 0.6 * support_calls + 0.02 * (monthly - 50)
    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))
    days_since_churn = np.where(churned == 1, rng.integers(1, 90, n), 0)
    return pd.DataFrame({"tenure": tenure, "monthly": monthly, "support_calls": support_calls, "days_since_churn": days_since_churn, "churned": churned})

df = make_churn()
FEATURES = ["tenure", "monthly", "support_calls"]
X = df[FEATURES].values
y = df["churned"].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]).fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
print("test accuracy:", round(accuracy, 3))
@@check
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
test("the leaky feature is gone", lambda: "days_since_churn" not in FEATURES and set(FEATURES) == {"tenure", "monthly", "support_calls"})
test("accuracy is honest: clearly below perfect, clearly above chance", lambda: 0.55 < accuracy < 0.97)
Xtr, Xte, ytr, yte = train_test_split(df[FEATURES].values, df["churned"].values, test_size=0.25, random_state=0)
test("the model is a pipeline whose scaler saw only training rows", lambda: isinstance(model, Pipeline) and np.allclose(model.named_steps["scale"].mean_, Xtr.mean(axis=0)))
test("the reported accuracy is the pipeline's test score", lambda: np.isclose(accuracy, model.score(Xte, yte)))
test("the accuracy is printed", lambda: "test accuracy:" in __stdout__)
@@hint
A feature that is zero for everyone who stayed and positive for everyone who left is the label in disguise. Remove it from `FEATURES`.
@@hint
Split the raw `X` first, then `model = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression())]).fit(X_train, y_train)` and `accuracy = model.score(X_test, y_test)`.
@@q
What is target leakage?
@@a
A feature that contains information about the label which would not be available at prediction time, producing unrealistically good scores.
@@q
Why is fitting a scaler on all rows before splitting a (smaller) leak?
@@a
Test-row statistics influence the transformation applied to training data, so the test score no longer measures performance on truly unseen data.
@@real
The classic real-world leaks: timestamps after the event, aggregates computed over the whole dataset, and IDs correlated with the outcome. If a model is suspiciously good, audit the features before celebrating.
