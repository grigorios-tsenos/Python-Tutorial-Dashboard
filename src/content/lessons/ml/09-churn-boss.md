---
id: sk-churn-boss
track: ml
order: 9
title: "Boss: Churn Model, End to End"
tagline: Mixed columns in, calibrated probabilities out, robust to categories you never saw.
kind: boss
xp: 120
minutes: 15
packages: scikit-learn
---
@@body
# Boss: a model you could actually deploy

Real tables mix numbers and categories, and production sends categories training never saw. `ColumnTransformer` routes each column group to its own preprocessing; `OneHotEncoder(handle_unknown="ignore")` turns an unseen category into all zeros instead of a crash. Put the whole thing in a `Pipeline` and the model becomes one object that takes a raw DataFrame.

> **Mission:** with `NUMERIC = ["tenure", "monthly", "support_calls"]` and the category column `plan`:
>
> 1. `make_preprocessor()` → a `ColumnTransformer` with a `"num"` step (`StandardScaler` on `NUMERIC`) and a `"cat"` step (`OneHotEncoder(handle_unknown="ignore")` on `["plan"]`)
> 2. `train_churn_model(df)` → a fitted `Pipeline` of `("prep", make_preprocessor())` and `("clf", LogisticRegression(max_iter=500))`, trained on `df[FEATURES]` and `df["churned"]`
> 3. `predict_churn(model, df)` → a 1-D array of churn probabilities for the rows of `df`, which may lack the `churned` column and may contain unseen plans
>
> The boss scores your model with ROC AUC on fresh data and must beat `0.7`.

@@step Route columns to their preprocessing
Each transformer gets a name, an estimator and the columns it owns. The encoder must tolerate unknown categories.
@@stepcheck
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
p = make_preprocessor()
names = {name: (est, cols) for name, est, cols in p.transformers}
test("a ColumnTransformer with num and cat routes", lambda: isinstance(p, ColumnTransformer) and set(names) == {"num", "cat"} and isinstance(names["num"][0], StandardScaler) and list(names["num"][1]) == NUMERIC and isinstance(names["cat"][0], OneHotEncoder) and list(names["cat"][1]) == ["plan"], 'ColumnTransformer([("num", StandardScaler(), NUMERIC), ("cat", OneHotEncoder(handle_unknown="ignore"), ["plan"])])')
test("unknown categories are ignored, not fatal", lambda: names["cat"][0].handle_unknown == "ignore")
@@step Train the pipeline on features only
Build the pipeline, fit it on `df[FEATURES]` and `df["churned"]`, and return it. The label must never be inside `FEATURES`.
@@stepcheck
from sklearn.pipeline import Pipeline
m = train_churn_model(make_churn(400, seed=1))
test("a fitted prep + clf pipeline trained on the feature columns", lambda: isinstance(m, Pipeline) and list(m.named_steps) == ["prep", "clf"] and hasattr(m.named_steps["clf"], "coef_") and "churned" not in FEATURES and list(m.feature_names_in_) == FEATURES, 'Pipeline([("prep", make_preprocessor()), ("clf", LogisticRegression(max_iter=500))]).fit(df[FEATURES], df["churned"])')
@@step Probabilities for any batch
Select `FEATURES` from the incoming frame and return `predict_proba(...)[:, 1]`. A frame without the label column and a never-seen plan must both work.
@@stepcheck
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
m = train_churn_model(make_churn(600, seed=1))
fresh = make_churn(300, seed=2)
p = predict_churn(m, fresh.drop(columns="churned"))
test("one probability in [0, 1] per row, without the label column", lambda: p.shape == (300,) and bool((p >= 0).all() and (p <= 1).all()), "model.predict_proba(df[FEATURES])[:, 1]")
test("the model beats 0.7 AUC on fresh data", lambda: roc_auc_score(fresh["churned"], p) > 0.7)
weird = fresh.head(5).copy()
weird["plan"] = "enterprise"
test("an unseen plan does not crash and still yields probabilities", lambda: predict_churn(m, weird).shape == (5,))
@@starter
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC = ["tenure", "monthly", "support_calls"]
FEATURES = NUMERIC + ["plan"]

def make_churn(n=600, seed=0):
    rng = np.random.default_rng(seed)
    plan = rng.choice(["basic", "pro", "team"], n, p=[0.5, 0.35, 0.15])
    tenure = rng.integers(1, 60, n)
    monthly = np.where(plan == "basic", 20, np.where(plan == "pro", 50, 120)) + rng.normal(0, 5, n)
    support_calls = rng.poisson(1.0, n)
    base = np.where(plan == "basic", 0.2, np.where(plan == "pro", -0.8, -1.6))
    logit = base + 0.04 * (30 - tenure) + 0.7 * support_calls
    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))
    return pd.DataFrame({"tenure": tenure, "monthly": monthly, "support_calls": support_calls, "plan": plan, "churned": churned})

def make_preprocessor():
    """Scale the numeric columns, one-hot encode plan (unknown plans -> all zeros)."""
    # TODO
    return None

def train_churn_model(df):
    """A fitted Pipeline: preprocessing + logistic regression."""
    # TODO
    return None

def predict_churn(model, df):
    """Churn probability for every row of df."""
    # TODO
    return np.zeros(len(df))

train = make_churn(600, seed=0)
model = train_churn_model(train)
new_customers = pd.DataFrame({"tenure": [2, 40], "monthly": [21.0, 118.0], "support_calls": [4, 0], "plan": ["basic", "enterprise"]})
print(predict_churn(model, new_customers))
@@solution
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC = ["tenure", "monthly", "support_calls"]
FEATURES = NUMERIC + ["plan"]

def make_churn(n=600, seed=0):
    rng = np.random.default_rng(seed)
    plan = rng.choice(["basic", "pro", "team"], n, p=[0.5, 0.35, 0.15])
    tenure = rng.integers(1, 60, n)
    monthly = np.where(plan == "basic", 20, np.where(plan == "pro", 50, 120)) + rng.normal(0, 5, n)
    support_calls = rng.poisson(1.0, n)
    base = np.where(plan == "basic", 0.2, np.where(plan == "pro", -0.8, -1.6))
    logit = base + 0.04 * (30 - tenure) + 0.7 * support_calls
    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))
    return pd.DataFrame({"tenure": tenure, "monthly": monthly, "support_calls": support_calls, "plan": plan, "churned": churned})

def make_preprocessor():
    """Scale the numeric columns, one-hot encode plan (unknown plans -> all zeros)."""
    return ColumnTransformer([
        ("num", StandardScaler(), NUMERIC),
        ("cat", OneHotEncoder(handle_unknown="ignore"), ["plan"]),
    ])

def train_churn_model(df):
    """A fitted Pipeline: preprocessing + logistic regression."""
    model = Pipeline([("prep", make_preprocessor()), ("clf", LogisticRegression(max_iter=500))])
    return model.fit(df[FEATURES], df["churned"])

def predict_churn(model, df):
    """Churn probability for every row of df."""
    return model.predict_proba(df[FEATURES])[:, 1]

train = make_churn(600, seed=0)
model = train_churn_model(train)
new_customers = pd.DataFrame({"tenure": [2, 40], "monthly": [21.0, 118.0], "support_calls": [4, 0], "plan": ["basic", "enterprise"]})
print(predict_churn(model, new_customers))
@@check
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import roc_auc_score
p = make_preprocessor()
names = {name: (est, cols) for name, est, cols in p.transformers}
test("a ColumnTransformer with num and cat routes", lambda: isinstance(p, ColumnTransformer) and set(names) == {"num", "cat"} and isinstance(names["num"][0], StandardScaler) and list(names["num"][1]) == NUMERIC and isinstance(names["cat"][0], OneHotEncoder) and list(names["cat"][1]) == ["plan"])
test("unknown categories are ignored, not fatal", lambda: names["cat"][0].handle_unknown == "ignore")
m = train_churn_model(make_churn(600, seed=1))
test("a fitted prep + clf pipeline trained on the feature columns", lambda: isinstance(m, Pipeline) and list(m.named_steps) == ["prep", "clf"] and hasattr(m.named_steps["clf"], "coef_") and list(m.feature_names_in_) == FEATURES)
fresh = make_churn(300, seed=2)
probs = predict_churn(m, fresh.drop(columns="churned"))
test("one probability in [0, 1] per row, without the label column", lambda: probs.shape == (300,) and bool((probs >= 0).all() and (probs <= 1).all()))
test("the model beats 0.7 AUC on fresh data", lambda: roc_auc_score(fresh["churned"], probs) > 0.7)
test("the label was not used as a feature", lambda: "churned" not in FEATURES)
weird = fresh.head(5).copy()
weird["plan"] = "enterprise"
test("an unseen plan does not crash and still yields probabilities", lambda: predict_churn(m, weird).shape == (5,) and bool(np.isfinite(predict_churn(m, weird)).all()))
test("a new customer with many support calls on basic is riskier than a long-tenured team customer", lambda: predict_churn(model, new_customers)[0] > predict_churn(model, new_customers)[1])
test("each training call fits a fresh model", lambda: train_churn_model(make_churn(200, seed=5)) is not m)
@@hint
`ColumnTransformer([("num", StandardScaler(), NUMERIC), ("cat", OneHotEncoder(handle_unknown="ignore"), ["plan"])])`. Column lists are names, because the input is a DataFrame.
@@hint
`Pipeline([("prep", make_preprocessor()), ("clf", LogisticRegression(max_iter=500))]).fit(df[FEATURES], df["churned"])`, and `predict_proba(df[FEATURES])[:, 1]` for the positive-class probability.
@@q
What does `handle_unknown="ignore"` do in a OneHotEncoder?
@@a
A category never seen during fitting is encoded as all zeros instead of raising an error, so production inputs cannot crash the model.
@@q
Why select `FEATURES` inside `predict_churn` instead of passing the whole frame?
@@a
Production frames may lack the label or carry extra columns; selecting the trained feature list keeps the input identical to training.
@@real
This pipeline is what `mlflow.sklearn.log_model` saves and what a serving endpoint loads. Add `TunedThresholdClassifierCV` for the decision cutoff, `calibration_curve` to check the probabilities, and `permutation_importance` to explain which features drive churn.
