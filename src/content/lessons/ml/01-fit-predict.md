---
id: sk-fit
track: ml
order: 1
title: Fit, Predict, Score
tagline: Every scikit-learn model speaks the same three verbs. Learn them on a line.
kind: run
xp: 25
minutes: 5
packages: scikit-learn
---
@@body
# The three verbs of machine learning

A model is a function with adjustable numbers inside. **Fit** sets those numbers from examples, **predict** applies the function to new inputs, **score** measures how well it did. scikit-learn makes every model, from a straight line to a gradient-boosted forest, answer to the same three methods:

```python
model = LinearRegression().fit(X, y)    # X: one row per example, y: one target per row
model.predict([[120]])                  # new rows in, predictions out
model.score(X, y)                       # R²: 1.0 is perfect, 0.0 is "predict the mean"
```

`X` is always two-dimensional, even with one feature: `(n_examples, n_features)`.

> **Mission:** fit a line from flat size to price, predict the price of a 120 m² flat, and print the model's R² score on the training data.

@@step Fit a line to the examples
`fit` finds the slope and intercept that minimise the squared error. It returns the model itself, so you can chain it:

```python
model = LinearRegression().fit(X, y)
print("slope:", model.coef_[0], "intercept:", model.intercept_)
```

Attributes that end in an underscore (`coef_`) are *learned* values; they only exist after `fit`.

**Do:** replace `model = None`, print the learned numbers, then Run.
@@stepcheck
test("the model is fitted: it has a learned slope near 2", lambda: model is not None and hasattr(model, "coef_") and abs(model.coef_[0] - 2.0) < 0.1, "model = LinearRegression().fit(X, y)")
@@step Predict a price for a new size
`predict` wants the same shape as `X`: a list of rows. One flat is one row with one feature:

```python
pred = model.predict([[120]])[0]
```

**Do:** replace `pred = 0`, then Run. Expect roughly 250 (thousand).
@@stepcheck
test("the prediction for 120 m² is about 250", lambda: abs(pred - 250) < 5, "model.predict([[120]])[0]")
@@step Score it
R² compares the model's errors with the errors of always predicting the mean. On this clean data it should be close to 1:

```python
r2 = model.score(X, y)
```

**Do:** replace `r2 = 0`, then Run.
@@stepcheck
test("R² on the training data is above 0.99", lambda: r2 > 0.99 and "0.99" in __stdout__, "r2 = model.score(X, y)")
@@starter
from sklearn.linear_model import LinearRegression

X = [[50], [70], [90], [110], [130]]     # flat size in m², one row per flat
y = [112, 148, 193, 229, 271]            # price in thousands

# TODO 1: fit a linear model and print its slope and intercept
model = None

# TODO 2: predict the price of a 120 m² flat
pred = 0

# TODO 3: the model's R² on the training data
r2 = 0

print("120 m² ->", pred)
print("R²:", r2)
@@solution
from sklearn.linear_model import LinearRegression

X = [[50], [70], [90], [110], [130]]     # flat size in m², one row per flat
y = [112, 148, 193, 229, 271]            # price in thousands

model = LinearRegression().fit(X, y)
print("slope:", model.coef_[0], "intercept:", model.intercept_)

pred = model.predict([[120]])[0]

r2 = model.score(X, y)

print("120 m² ->", pred)
print("R²:", r2)
@@check
from sklearn.linear_model import LinearRegression
test("the model is a fitted LinearRegression", lambda: isinstance(model, LinearRegression) and hasattr(model, "coef_"))
test("the learned slope is about 2 per m²", lambda: abs(model.coef_[0] - 2.0) < 0.1 and abs(model.intercept_ - 10) < 10)
test("the prediction for 120 m² is about 250", lambda: abs(pred - 250) < 5)
test("R² is above 0.99", lambda: r2 > 0.99)
test("slope, prediction and score are printed", lambda: "slope:" in __stdout__ and "120 m² ->" in __stdout__ and "R²:" in __stdout__)
@@hint
`LinearRegression().fit(X, y)` returns the fitted model. `predict` takes a list of rows: `[[120]]`.
@@hint
`pred = model.predict([[120]])[0]` and `r2 = model.score(X, y)`.
@@q
Why must X be two-dimensional even for a single feature?
@@a
scikit-learn treats X as a table of examples by features; a single feature is a table with one column, shape (n, 1).
@@q
What does R² = 0 mean?
@@a
The model is no better than always predicting the mean of y; negative values mean it is worse.
@@real
Every estimator follows this interface, so swapping `LinearRegression()` for `GradientBoostingRegressor()` changes one line. Scoring on the training data is only a sanity check; the next lesson holds data back.
