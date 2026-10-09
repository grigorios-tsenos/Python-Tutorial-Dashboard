---
id: sk-overfit
track: ml
order: 3
title: Which Model Memorised?
tagline: A perfect training score is a warning, not a win.
kind: predict
xp: 30
minutes: 4
answer: 0
packages: scikit-learn
---
@@body
# Predict the output

A decision tree with no depth limit keeps splitting until every training example sits alone in a leaf. A straight line cannot do that. Both are fitted to six noisy points on a line and scored on training data and on three new points.

Each line prints the model name, its training R² and its test R², both rounded to one decimal. What comes out?
@@starter
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression

X_train = [[1], [2], [3], [4], [5], [6]]
y_train = [2.1, 3.9, 6.2, 7.8, 10.1, 11.9]
X_test = [[1.5], [3.5], [5.5]]
y_test = [3, 7, 11]

for name, model in [("tree", DecisionTreeRegressor(random_state=0)), ("linear", LinearRegression())]:
    model.fit(X_train, y_train)
    print(name, round(model.score(X_train, y_train), 1), round(model.score(X_test, y_test), 1))
@@choice
tree 1.0 0.9
linear 1.0 1.0
@@choice
tree 1.0 1.0
linear 1.0 1.0
@@choice
tree 0.9 0.9
linear 1.0 1.0
@@choice
tree 1.0 0.9
linear 0.9 0.9
@@explain
The tree reproduces every training target exactly, so its training R² is a perfect `1.0`, yet it can only predict values it has seen: each test point lands in a neighbour's leaf and the test score drops to `0.9`. The line never reaches `1.0` exactly on noisy data, but rounded to one decimal it scores `1.0` on both, because it learned the trend rather than the points. The gap between a model's training and test scores is the overfitting you should watch for.
@@hint
Can a full-depth tree reproduce its training targets exactly? What would its training R² be?
@@hint
A tree predicts the target of the nearest training leaf; 1.5 falls into the leaf of x = 1, far from the true 3.
@@q
What does a large gap between training and test score indicate?
@@a
Overfitting: the model learned details specific to the training examples that do not generalise.
@@q
Why can a linear model not overfit six points the way a tree can?
@@a
It has only two adjustable numbers (slope and intercept), so it cannot bend to pass through every point.
