---
id: sk-metrics
track: ml
order: 4
title: Accuracy Is Not Enough
tagline: Precision, recall and F1, computed by hand so you never misread them again.
kind: build
xp: 45
minutes: 8
packages: scikit-learn
---
@@body
# Four numbers from one 2×2 table

A classifier that says "no fraud" for every transaction is 99% accurate and useless. The **confusion matrix** splits predictions into true positives (`tp`), false positives (`fp`), false negatives (`fn`) and true negatives (`tn`), and three better metrics fall out of it:

```
precision = tp / (tp + fp)     of the alarms we raised, how many were real?
recall    = tp / (tp + fn)     of the real cases, how many did we catch?
f1        = 2 · precision · recall / (precision + recall)
```

> **Mission:** implement `confusion(y_true, y_pred)` → `(tp, fp, fn, tn)` as plain ints for 0/1 arrays, and `evaluate(y_true, y_pred)` → a dict with `accuracy`, `precision`, `recall` and `f1`. Any division by zero gives `0.0`. The starter trains a logistic regression for you to evaluate.
@@starter
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

def confusion(y_true, y_pred):
    """(tp, fp, fn, tn) for 0/1 labels."""
    # TODO
    return 0, 0, 0, 0

def evaluate(y_true, y_pred):
    """accuracy, precision, recall and f1 from the confusion counts."""
    # TODO
    return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0}

rng = np.random.default_rng(0)
X = rng.normal(size=(400, 3))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.8, 400) > 1.0).astype(int)   # ~20% positives
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
clf = LogisticRegression().fit(X_train, y_train)
print("positives in test:", y_test.sum(), "of", len(y_test))
print(evaluate(y_test, clf.predict(X_test)))
@@solution
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

def confusion(y_true, y_pred):
    """(tp, fp, fn, tn) for 0/1 labels."""
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    tp = int(((y_true == 1) & (y_pred == 1)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())
    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    return tp, fp, fn, tn

def ratio(a, b):
    return a / b if b else 0.0

def evaluate(y_true, y_pred):
    """accuracy, precision, recall and f1 from the confusion counts."""
    tp, fp, fn, tn = confusion(y_true, y_pred)
    accuracy = ratio(tp + tn, tp + fp + fn + tn)
    precision = ratio(tp, tp + fp)
    recall = ratio(tp, tp + fn)
    f1 = ratio(2 * precision * recall, precision + recall)
    return {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1}

rng = np.random.default_rng(0)
X = rng.normal(size=(400, 3))
y = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.8, 400) > 1.0).astype(int)   # ~20% positives
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)
clf = LogisticRegression().fit(X_train, y_train)
print("positives in test:", y_test.sum(), "of", len(y_test))
print(evaluate(y_test, clf.predict(X_test)))
@@check
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
test("the four cells are counted as ints", lambda: confusion([1, 1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 0]) == (2, 1, 1, 2) and all(type(v) is int for v in confusion([1], [1])))
yt = np.array([1, 1, 0, 0, 1, 0, 1, 0, 0, 1])
yp = np.array([1, 0, 1, 0, 1, 0, 1, 1, 0, 0])
out = evaluate(yt, yp)
test("all four metrics match scikit-learn", lambda: all(np.isclose(out[k], f(yt, yp)) for k, f in [("accuracy", accuracy_score), ("precision", precision_score), ("recall", recall_score), ("f1", f1_score)]))
test("the always-negative model has high accuracy and zero recall", lambda: (lambda r: r["accuracy"] == 0.9 and r["recall"] == 0.0 and r["precision"] == 0.0 and r["f1"] == 0.0)(evaluate([0] * 9 + [1], [0] * 10)))
test("a perfect model scores 1.0 everywhere", lambda: all(v == 1.0 for v in evaluate([1, 0, 1], [1, 0, 1]).values()))
test("f1 is the harmonic mean, not the average", lambda: (lambda r: r["precision"] == 1.0 and np.isclose(r["recall"], 0.1) and np.isclose(r["f1"], 2 * 0.1 / 1.1))(evaluate([1] * 10, [1] + [0] * 9)))
test("the demo model was evaluated on held-out data", lambda: "'f1':" in __stdout__ and evaluate(y_test, clf.predict(X_test))["accuracy"] > 0.7)
@@hint
Each confusion cell is a mask: `((y_true == 1) & (y_pred == 1)).sum()` counts true positives. Wrap in `int(...)`.
@@hint
Write `ratio(a, b)` returning `a / b if b else 0.0`, then precision `ratio(tp, tp + fp)`, recall `ratio(tp, tp + fn)` and f1 `ratio(2 * precision * recall, precision + recall)`.
@@q
When is high accuracy misleading?
@@a
When classes are imbalanced: predicting the majority class for everything scores well while catching none of the rare, important cases.
@@q
What is the difference between precision and recall?
@@a
Precision asks how many flagged cases were real; recall asks how many real cases were flagged. Raising one usually lowers the other.
@@real
`sklearn.metrics.classification_report(y_test, y_pred)` prints all of these per class. Which metric matters is a product decision: spam filters want precision, cancer screening wants recall.
