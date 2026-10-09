---
id: sk-threshold
track: ml
order: 8
title: Choose the Threshold, Not Just the Model
tagline: predict() hides a 0.5 inside. The right cutoff depends on what a miss costs.
kind: build
xp: 60
minutes: 8
packages: scikit-learn
---
@@body
# Probabilities first, decisions second

A classifier really outputs a **probability** (`predict_proba`); `predict` just compares it with 0.5. Lower the cutoff and you catch more positives (higher recall) at the price of more false alarms (lower precision). The cutoff is a business decision: for fraud or disease you often demand a minimum recall and then take the best precision you can get.

> **Mission:** implement `pr_at(probs, y, t)` → `(precision, recall)` when predicting positive for `probs >= t` (precision is `0.0` when nothing is predicted positive), and `pick_threshold(probs, y, min_recall=0.8)` → `(threshold, precision, recall)` for the threshold among the unique probability values with the **highest precision** subject to `recall >= min_recall`; ties go to the higher threshold. No positive labels, or `min_recall` outside `(0, 1]`, raise `ValueError`.

@@step Precision and recall at one cutoff
Turn probabilities into predictions with a comparison, then count:

```python
probs, y = np.asarray(probs), np.asarray(y)
pred = probs >= t
tp = int((pred & (y == 1)).sum())
fp = int((pred & (y == 0)).sum())
fn = int((~pred & (y == 1)).sum())
precision = tp / (tp + fp) if tp + fp else 0.0
recall = tp / (tp + fn) if tp + fn else 0.0
return precision, recall
```

**Do:** implement `pr_at`, then Run.
@@stepcheck
import numpy as np
P = np.array([0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1])
Y = np.array([1, 1, 0, 1, 1, 0, 0, 0])
test("precision and recall at a cutoff", lambda: np.allclose(pr_at(P, Y, 0.6), (0.75, 0.75)) and np.allclose(pr_at(P, Y, 0.4), (0.8, 1.0)), "pred = probs >= t, then tp / (tp + fp) and tp / (tp + fn)")
test("a cutoff above every probability gives precision 0.0", lambda: pr_at(P, Y, 0.95) == (0.0, 0.0))
@@step Sweep the candidate thresholds
Every distinct probability is a candidate cutoff. Walk them from high to low, keep the ones that reach the required recall, and remember the best precision; walking high-to-low means the first best you see is also the highest threshold:

```python
best = None
for t in sorted(np.unique(probs), reverse=True):
    precision, recall = pr_at(probs, y, t)
    if recall >= min_recall and (best is None or precision > best[1]):
        best = (float(t), precision, recall)
return best
```

**Do:** implement the sweep, then Run.
@@stepcheck
import numpy as np
P = np.array([0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1])
Y = np.array([1, 1, 0, 1, 1, 0, 0, 0])
test("the best precision with enough recall, highest threshold on ties", lambda: pick_threshold(P, Y, 0.8) == (0.4, 0.8, 1.0) and pick_threshold(P, Y, 0.5) == (0.8, 1.0, 0.5), "sorted(np.unique(probs), reverse=True), replace best only on strictly higher precision")
@@step Refuse impossible requests
With no positive labels recall is undefined; a `min_recall` of 0 or above 1 makes no sense:

```python
if not 0 < min_recall <= 1:
    raise ValueError("min_recall must be in (0, 1]")
if np.asarray(y).sum() == 0:
    raise ValueError("no positive labels to recall")
```

**Do:** add both guards at the top of `pick_threshold`, then Run.
@@stepcheck
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("bad min_recall and label-free data are rejected", lambda: rejects(lambda: pick_threshold([0.5], [1], min_recall=0)) and rejects(lambda: pick_threshold([0.5], [1], min_recall=1.5)) and rejects(lambda: pick_threshold([0.5, 0.2], [0, 0])), "raise ValueError")
@@starter
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

def pr_at(probs, y, t):
    """(precision, recall) when predicting positive for probs >= t."""
    # TODO
    return 0.0, 0.0

def pick_threshold(probs, y, min_recall=0.8):
    """(threshold, precision, recall): the best precision that still reaches min_recall."""
    # TODO
    return 0.5, 0.0, 0.0

rng = np.random.default_rng(0)
X = rng.normal(size=(600, 3))
y = (X[:, 0] + 0.6 * X[:, 1] + rng.normal(0, 0.9, 600) > 1.2).astype(int)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
probs = LogisticRegression().fit(X_train, y_train).predict_proba(X_test)[:, 1]
print("default 0.5:", pr_at(probs, y_test, 0.5))
print("recall >= 0.8:", pick_threshold(probs, y_test, 0.8))
@@solution
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

def pr_at(probs, y, t):
    """(precision, recall) when predicting positive for probs >= t."""
    probs, y = np.asarray(probs), np.asarray(y)
    pred = probs >= t
    tp = int((pred & (y == 1)).sum())
    fp = int((pred & (y == 0)).sum())
    fn = int((~pred & (y == 1)).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return precision, recall

def pick_threshold(probs, y, min_recall=0.8):
    """(threshold, precision, recall): the best precision that still reaches min_recall."""
    if not 0 < min_recall <= 1:
        raise ValueError("min_recall must be in (0, 1]")
    if np.asarray(y).sum() == 0:
        raise ValueError("no positive labels to recall")
    best = None
    for t in sorted(np.unique(probs), reverse=True):
        precision, recall = pr_at(probs, y, t)
        if recall >= min_recall and (best is None or precision > best[1]):
            best = (float(t), precision, recall)
    return best

rng = np.random.default_rng(0)
X = rng.normal(size=(600, 3))
y = (X[:, 0] + 0.6 * X[:, 1] + rng.normal(0, 0.9, 600) > 1.2).astype(int)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
probs = LogisticRegression().fit(X_train, y_train).predict_proba(X_test)[:, 1]
print("default 0.5:", pr_at(probs, y_test, 0.5))
print("recall >= 0.8:", pick_threshold(probs, y_test, 0.8))
@@check
import numpy as np
from sklearn.metrics import precision_score, recall_score
P = np.array([0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1])
Y = np.array([1, 1, 0, 1, 1, 0, 0, 0])
test("pr_at matches scikit-learn at several cutoffs", lambda: all(np.allclose(pr_at(P, Y, t), (precision_score(Y, P >= t), recall_score(Y, P >= t))) for t in (0.9, 0.6, 0.4, 0.1)))
test("a cutoff above every probability gives (0.0, 0.0)", lambda: pr_at(P, Y, 0.95) == (0.0, 0.0))
test("the best precision with enough recall", lambda: pick_threshold(P, Y, 0.8) == (0.4, 0.8, 1.0))
test("a looser recall requirement allows a stricter, more precise threshold", lambda: pick_threshold(P, Y, 0.5) == (0.8, 1.0, 0.5))
test("the threshold is a plain float", lambda: type(pick_threshold(P, Y, 0.8)[0]) is float)
test("the chosen threshold really reaches the recall on the demo data", lambda: pick_threshold(probs, y_test, 0.8)[2] >= 0.8 and pick_threshold(probs, y_test, 0.8)[0] < 0.5)
def rejects(fn):
    try:
        fn()
    except ValueError:
        return True
    return False
test("bad min_recall and label-free data are rejected", lambda: rejects(lambda: pick_threshold([0.5], [1], min_recall=0)) and rejects(lambda: pick_threshold([0.5], [1], min_recall=1.5)) and rejects(lambda: pick_threshold([0.5, 0.2], [0, 0])))
@@hint
`pred = probs >= t` is a boolean array; combine it with `y == 1` / `y == 0` using `&` and `~` to count tp, fp and fn.
@@hint
Candidates are `sorted(np.unique(probs), reverse=True)`. Keep `best` as a tuple and replace it only when `recall >= min_recall` and the precision is strictly higher.
@@q
What does `predict` assume that `predict_proba` does not?
@@a
A fixed 0.5 cutoff. The probability lets you choose a cutoff that matches the cost of misses versus false alarms.
@@q
Why do precision and recall move in opposite directions as the threshold changes?
@@a
Lowering the cutoff flags more cases: more real positives are caught (recall up) but more negatives are flagged too (precision down).
@@real
`sklearn.metrics.precision_recall_curve` computes every (precision, recall, threshold) triple at once, and `TunedThresholdClassifierCV` wraps a model with a threshold chosen on cross-validated data. The chosen cutoff ships with the model as a parameter.
