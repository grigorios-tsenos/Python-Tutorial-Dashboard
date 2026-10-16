import type { CodingGuide } from '../guided'

export const ML_GUIDES: Record<string, CodingGuide> = {
  "sk-fit": {
    "setup": "from sklearn.linear_model import LinearRegression\n\nX = [[50], [70], [90], [110], [130]]     # flat size in m², one row per flat\ny = [112, 148, 193, 229, 271]            # price in thousands",
    "steps": [
      {
        "title": "Create the model",
        "instruction": "Create `model`: a new, empty linear regression. It has not seen any data yet.",
        "code": "model = LinearRegression()",
        "check": "test(\"Create the model\", lambda: isinstance(model, LinearRegression) and not hasattr(model, 'coef_'), \"model is a LinearRegression that has not been fitted yet.\")",
        "expected": "model is a LinearRegression that has not been fitted yet.",
        "reassurance": ""
      },
      {
        "title": "Fit it to the examples",
        "instruction": "Fit `model` to the flat sizes `X` and the prices `y`. Fitting changes the model in place.",
        "code": "model.fit(X, y)",
        "check": "test(\"Fit it to the examples\", lambda: hasattr(model, 'coef_') and abs(model.coef_[0] - 2.0) < 0.1, \"model is fitted, with a slope of about 2 per square metre.\")",
        "expected": "model is fitted, with a slope of about 2 per square metre.",
        "reassurance": "Learned attributes end in an underscore, so you can tell fitted numbers from settings."
      },
      {
        "title": "Read the learned line",
        "instruction": "Print the learned slope (the first coefficient) after the label `slope:` and the intercept after the label `intercept:`.",
        "code": "print(\"slope:\", model.coef_[0], \"intercept:\", model.intercept_)",
        "check": "test(\"Read the learned line\", lambda: 'slope:' in __stdout__ and 'intercept:' in __stdout__, \"The output shows the slope and the intercept, each after its label.\")",
        "expected": "The output shows the slope and the intercept, each after its label.",
        "reassurance": ""
      },
      {
        "title": "Predict the price of a new flat",
        "instruction": "Create `pred`: the predicted price for a single 120 square metre flat. Remember that predict wants a list of rows, and returns an array; keep only its first element.",
        "code": "pred = model.predict([[120]])[0]",
        "check": "test('Predict the price of a new flat', lambda: abs(pred - 250) < 5 and not hasattr(pred, '__len__'), 'pred is a single number close to 250.')",
        "expected": "pred is a single number close to 250.",
        "reassurance": ""
      },
      {
        "title": "Score the fit",
        "instruction": "Create `r2`: the model's R² score on the training data `X` and `y`.",
        "code": "r2 = model.score(X, y)",
        "check": "test('Score the fit', lambda: 0.99 < r2 <= 1.0, 'r2 is above 0.99 on this nearly straight data.')",
        "expected": "r2 is above 0.99 on this nearly straight data.",
        "reassurance": "An R² near 1 on training data is only a sanity check: the model has already seen these rows."
      },
      {
        "title": "Print the prediction and the score",
        "instruction": "Print `pred` after the label `120 m² ->` and `r2` after the label `R²:`. Then run Check.",
        "code": "print(\"120 m² ->\", pred)\nprint(\"R²:\", r2)",
        "check": "",
        "expected": "Three lines: the slope and intercept, the prediction near 250, and an R² near 1.",
        "reassurance": ""
      }
    ]
  },
  "sk-split": {
    "setup": "import numpy as np\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\n\nrng = np.random.default_rng(0)\nX = rng.uniform(0, 10, (80, 1))                 # 80 flats, one feature\ny = 3 * X[:, 0] + rng.normal(0, 1, 80)          # price with noise",
    "steps": [
      {
        "title": "Split 75/25 with a seed",
        "instruction": "Define `split(X, y, seed)` returning the four arrays of a shuffled split that holds 25% of the rows out, in the standard order X_train, X_test, y_train, y_test, with `seed` controlling the shuffle.",
        "code": "def split(X, y, seed):\n    return train_test_split(X, y, test_size=0.25, random_state=seed)",
        "check": "_Xs = np.arange(40).reshape(-1, 1)\n_ys = np.arange(40)\n_a = split(_Xs, _ys, 0)\ntest('Split 75/25 with a seed', lambda: len(_a) == 4 and [len(p) for p in _a] == [30, 10, 30, 10] and np.array_equal(_a[1], split(_Xs, _ys, 0)[1]) and not np.array_equal(_a[1], split(_Xs, _ys, 1)[1]) and all(int(row[0]) == int(t) for row, t in zip(_a[1], _a[3])), 'Forty rows split 30/10, reproducible per seed, with each target travelling with its row.')",
        "expected": "Forty rows split 30/10, reproducible per seed, with each target travelling with its row.",
        "reassurance": ""
      },
      {
        "title": "Split the demo rows",
        "instruction": "Create `seed` holding 4, then unpack `split(X, y, seed)` into `X_train`, `X_test`, `y_train` and `y_test`.",
        "code": "seed = 4\nX_train, X_test, y_train, y_test = split(X, y, seed)",
        "check": "test(\"Split the demo rows\", lambda: len(X_train) == 60 and len(X_test) == 20 and len(y_train) == 60 and np.array_equal(X_test, train_test_split(X, y, test_size=0.25, random_state=4)[1]), \"60 training rows and 20 test rows, from the seed-4 split.\")",
        "expected": "60 training rows and 20 test rows, from the seed-4 split.",
        "reassurance": ""
      },
      {
        "title": "Fit on the training part only",
        "instruction": "Create `model`: a linear regression fitted on `X_train` and `y_train` only.",
        "code": "model = LinearRegression().fit(X_train, y_train)",
        "check": "test(\"Fit on the training part only\", lambda: isinstance(model, LinearRegression) and np.allclose(model.coef_, LinearRegression().fit(X_train, y_train).coef_), \"model is a linear regression fitted on the 60 training rows.\")",
        "expected": "model is a linear regression fitted on the 60 training rows.",
        "reassurance": ""
      },
      {
        "title": "Score both parts",
        "instruction": "Create `train_r2`, the model's R² on the training arrays, and `test_r2`, its R² on the test arrays.",
        "code": "train_r2 = model.score(X_train, y_train)\ntest_r2 = model.score(X_test, y_test)",
        "check": "test(\"Score both parts\", lambda: np.isclose(train_r2, model.score(X_train, y_train)) and np.isclose(test_r2, model.score(X_test, y_test)) and train_r2 > 0.9 and test_r2 > 0.9, \"train_r2 and test_r2 are the two R\\u00b2 values, both above 0.9.\")",
        "expected": "train_r2 and test_r2 are the two R² values, both above 0.9.",
        "reassurance": "The test score is honest because the model never saw those rows."
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `holdout_scores(X, y, seed)`: repeat the split, the fit on the training arrays and the two scores inside it, and return the pair (training R², test R²).",
        "code": "def holdout_scores(X, y, seed):\n    X_train, X_test, y_train, y_test = split(X, y, seed)\n    model = LinearRegression().fit(X_train, y_train)\n    return model.score(X_train, y_train), model.score(X_test, y_test)",
        "check": "_tr, _te = holdout_scores(X, y, 4)\n_Xtr, _Xte, _ytr, _yte = train_test_split(X, y, test_size=0.25, random_state=4)\n_m = LinearRegression().fit(_Xtr, _ytr)\ntest('Wrap it in a function', lambda: np.isclose(_tr, _m.score(_Xtr, _ytr)) and np.isclose(_te, _m.score(_Xte, _yte)) and _tr > 0.9 and _te > 0.9, 'Both scores match a model fitted on the seed-4 training rows only, and both are above 0.9.')",
        "expected": "Both scores match a model fitted on the seed-4 training rows only, and both are above 0.9.",
        "reassurance": "",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Compare three seeds",
        "instruction": "Loop over the seeds 0, 1 and 2 and print each seed with its pair of scores. Then run Check.",
        "code": "for seed in (0, 1, 2):\n    print(seed, holdout_scores(X, y, seed))",
        "check": "",
        "expected": "Three lines of (train, test) scores that differ slightly from seed to seed.",
        "reassurance": ""
      }
    ]
  },
  "sk-metrics": {
    "setup": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import train_test_split\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(400, 3))\ny = (X[:, 0] + 0.5 * X[:, 1] + rng.normal(0, 0.8, 400) > 1.0).astype(int)   # ~20% positives\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)\nclf = LogisticRegression().fit(X_train, y_train)",
    "steps": [
      {
        "title": "Pick the demo labels",
        "instruction": "Create `y_true` as the test labels `y_test`, and `y_pred` as the classifier's predictions on `X_test`.",
        "code": "y_true = y_test\ny_pred = clf.predict(X_test)",
        "check": "test(\"Pick the demo labels\", lambda: np.array_equal(y_true, y_test) and np.array_equal(y_pred, clf.predict(X_test)), \"y_true and y_pred each hold 100 labels of 0 or 1.\")",
        "expected": "y_true and y_pred each hold 100 labels of 0 or 1.",
        "reassurance": ""
      },
      {
        "title": "Count the true positives",
        "instruction": "Create `tp`: how many rows are 1 in both `y_true` and `y_pred`, as a plain int. Combine two boolean masks with `&` and count the True values.",
        "code": "tp = int(((y_true == 1) & (y_pred == 1)).sum())",
        "check": "from sklearn.metrics import confusion_matrix\n_tn, _fp, _fn, _tp = confusion_matrix(y_test, clf.predict(X_test)).ravel()\ntest(\"Count the true positives\", lambda: tp == _tp and type(tp) is int, \"tp matches scikit-learn's count of true positives, as a plain int.\")",
        "expected": "tp matches scikit-learn's count of true positives, as a plain int.",
        "reassurance": ""
      },
      {
        "title": "Count the other three cells",
        "instruction": "In the same way, create `fp` (predicted 1, really 0), `fn` (predicted 0, really 1) and `tn` (0 in both), each a plain int.",
        "code": "fp = int(((y_true == 0) & (y_pred == 1)).sum())\nfn = int(((y_true == 1) & (y_pred == 0)).sum())\ntn = int(((y_true == 0) & (y_pred == 0)).sum())",
        "check": "from sklearn.metrics import confusion_matrix\n_tn, _fp, _fn, _tp = confusion_matrix(y_test, clf.predict(X_test)).ravel()\ntest(\"Count the other three cells\", lambda: (fp, fn, tn) == (_fp, _fn, _tn) and tp + fp + fn + tn == len(y_test), \"fp, fn and tn match scikit-learn, and the four cells add up to 100.\")",
        "expected": "fp, fn and tn match scikit-learn, and the four cells add up to 100.",
        "reassurance": ""
      },
      {
        "title": "Wrap the counts in a function",
        "instruction": "Define `confusion(y_true, y_pred)`: convert both inputs to NumPy arrays, count the four cells as before, and return the tuple (tp, fp, fn, tn).",
        "code": "def confusion(y_true, y_pred):\n    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)\n    tp = int(((y_true == 1) & (y_pred == 1)).sum())\n    fp = int(((y_true == 0) & (y_pred == 1)).sum())\n    fn = int(((y_true == 1) & (y_pred == 0)).sum())\n    tn = int(((y_true == 0) & (y_pred == 0)).sum())\n    return tp, fp, fn, tn",
        "check": "test('Wrap the counts in a function', lambda: confusion([1, 1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 0]) == (2, 1, 1, 2) and all(type(v) is int for v in confusion([1], [1])), 'Two hits, one false alarm, one miss, two correct rejections, all plain ints.')",
        "expected": "Two hits, one false alarm, one miss, two correct rejections, all plain ints.",
        "reassurance": "Every metric is a ratio of these four counts.",
        "startFrom": [
          1,
          2
        ]
      },
      {
        "title": "Divide without crashing",
        "instruction": "Define `ratio(a, b)` returning `a / b`, or `0.0` when `b` is zero.",
        "code": "def ratio(a, b):\n    return a / b if b else 0.0",
        "check": "test('Divide without crashing', lambda: ratio(1, 4) == 0.25 and ratio(3, 0) == 0.0 and ratio(0, 5) == 0.0, 'ratio(1, 4) is 0.25 and dividing by zero gives 0.0.')",
        "expected": "ratio(1, 4) is 0.25 and dividing by zero gives 0.0.",
        "reassurance": "A model that flags nothing gets a precision of 0.0 instead of an error."
      },
      {
        "title": "Accuracy and precision",
        "instruction": "Unpack `confusion(y_true, y_pred)` into `tp`, `fp`, `fn`, `tn`. Create `accuracy` (correct over all rows) and `precision` (tp over everything flagged), both through `ratio`.",
        "code": "tp, fp, fn, tn = confusion(y_true, y_pred)\naccuracy = ratio(tp + tn, tp + fp + fn + tn)\nprecision = ratio(tp, tp + fp)",
        "check": "from sklearn.metrics import accuracy_score, precision_score\ntest(\"Accuracy and precision\", lambda: np.isclose(accuracy, accuracy_score(y_test, clf.predict(X_test))) and np.isclose(precision, precision_score(y_test, clf.predict(X_test))), \"accuracy and precision match scikit-learn on the demo predictions.\")",
        "expected": "accuracy and precision match scikit-learn on the demo predictions.",
        "reassurance": ""
      },
      {
        "title": "Recall and F1",
        "instruction": "Create `recall` (tp over the real positives) and `f1` (2·precision·recall over their sum), both through `ratio`.",
        "code": "recall = ratio(tp, tp + fn)\nf1 = ratio(2 * precision * recall, precision + recall)",
        "check": "from sklearn.metrics import recall_score, f1_score\ntest(\"Recall and F1\", lambda: np.isclose(recall, recall_score(y_test, clf.predict(X_test))) and np.isclose(f1, f1_score(y_test, clf.predict(X_test))), \"recall and f1 match scikit-learn on the demo predictions.\")",
        "expected": "recall and f1 match scikit-learn on the demo predictions.",
        "reassurance": "F1 is a harmonic mean: it stays low when either precision or recall is low."
      },
      {
        "title": "Wrap the metrics in a function",
        "instruction": "Define `evaluate(y_true, y_pred)`: compute the four metrics as above and return them in a dict with the keys `accuracy`, `precision`, `recall` and `f1`.",
        "code": "def evaluate(y_true, y_pred):\n    tp, fp, fn, tn = confusion(y_true, y_pred)\n    accuracy = ratio(tp + tn, tp + fp + fn + tn)\n    precision = ratio(tp, tp + fp)\n    recall = ratio(tp, tp + fn)\n    f1 = ratio(2 * precision * recall, precision + recall)\n    return {\"accuracy\": accuracy, \"precision\": precision, \"recall\": recall, \"f1\": f1}",
        "check": "from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score\n_yt = np.array([1, 1, 0, 0, 1, 0, 1, 0, 0, 1])\n_yp = np.array([1, 0, 1, 0, 1, 0, 1, 1, 0, 0])\n_out = evaluate(_yt, _yp)\ntest('Wrap the metrics in a function', lambda: all(np.isclose(_out[k], f(_yt, _yp)) for k, f in [('accuracy', accuracy_score), ('precision', precision_score), ('recall', recall_score), ('f1', f1_score)]) and evaluate([0] * 9 + [1], [0] * 10) == {'accuracy': 0.9, 'precision': 0.0, 'recall': 0.0, 'f1': 0.0}, 'All four metrics match scikit-learn, and the always-negative model scores 0.9 accuracy with zero recall.')",
        "expected": "All four metrics match scikit-learn, and the always-negative model scores 0.9 accuracy with zero recall.",
        "reassurance": "That last case is the whole lesson: 90% accurate and useless.",
        "startFrom": [
          5,
          6
        ]
      },
      {
        "title": "Evaluate the demo classifier",
        "instruction": "Print how many positives the test set holds out of its size, then print the dict returned by `evaluate` for `y_test` and the classifier's predictions on `X_test`. Then run Check.",
        "code": "print(\"positives in test:\", y_test.sum(), \"of\", len(y_test))\nprint(evaluate(y_test, clf.predict(X_test)))",
        "check": "",
        "expected": "About 20 positives out of 100, then a dict whose recall is noticeably lower than its accuracy.",
        "reassurance": ""
      }
    ]
  },
  "sk-pipeline": {
    "setup": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\n\nrng = np.random.default_rng(0)\nX = np.column_stack([rng.normal(0, 1, 400), rng.normal(50000, 15000, 400)])   # age-ish, income-ish\ny = ((X[:, 0] + (X[:, 1] - 50000) / 15000) > 0).astype(int)",
    "steps": [
      {
        "title": "Create the two parts",
        "instruction": "Create `scaler`, a new standard scaler, and `classifier`, a new logistic regression.",
        "code": "scaler = StandardScaler()\nclassifier = LogisticRegression()",
        "check": "test(\"Create the two parts\", lambda: isinstance(scaler, StandardScaler) and isinstance(classifier, LogisticRegression) and not hasattr(scaler, 'mean_'), \"scaler is an unfitted StandardScaler and classifier a LogisticRegression.\")",
        "expected": "scaler is an unfitted StandardScaler and classifier a LogisticRegression.",
        "reassurance": ""
      },
      {
        "title": "Chain them in a pipeline",
        "instruction": "Create `pipe`: a pipeline whose steps are the pair (`scale`, `scaler`) followed by the pair (`clf`, `classifier`).",
        "code": "pipe = Pipeline([(\"scale\", scaler), (\"clf\", classifier)])",
        "check": "test(\"Chain them in a pipeline\", lambda: isinstance(pipe, Pipeline) and list(pipe.named_steps) == ['scale', 'clf'] and pipe.named_steps['scale'] is scaler, \"pipe is a Pipeline with the steps scale and clf.\")",
        "expected": "pipe is a Pipeline with the steps scale and clf.",
        "reassurance": "A pipeline is itself an estimator: fitting it fits each step in order."
      },
      {
        "title": "Build a fresh pipeline on demand",
        "instruction": "Define `make_model()` returning the same two-step pipeline, built from a new scaler and a new logistic regression on every call, so each call gives an unfitted model.",
        "code": "def make_model():\n    return Pipeline([(\"scale\", StandardScaler()), (\"clf\", LogisticRegression())])",
        "check": "_m = make_model()\ntest('Build a fresh pipeline on demand', lambda: isinstance(_m, Pipeline) and list(_m.named_steps) == ['scale', 'clf'] and isinstance(_m.named_steps['scale'], StandardScaler) and isinstance(_m.named_steps['clf'], LogisticRegression) and make_model() is not _m and not hasattr(make_model().named_steps['scale'], 'mean_'), 'A Pipeline with steps scale and clf, new and unfitted on every call.')",
        "expected": "A Pipeline with steps scale and clf, new and unfitted on every call.",
        "reassurance": ""
      },
      {
        "title": "Split the demo rows",
        "instruction": "Create `seed` holding 0, then split `X` and `y` 75/25 with `random_state=seed` into `X_train`, `X_test`, `y_train` and `y_test`.",
        "code": "seed = 0\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)",
        "check": "test(\"Split the demo rows\", lambda: X_train.shape == (300, 2) and X_test.shape == (100, 2) and np.array_equal(X_test, train_test_split(X, y, test_size=0.25, random_state=0)[1]), \"300 training rows and 100 test rows from the seed-0 split.\")",
        "expected": "300 training rows and 100 test rows from the seed-0 split.",
        "reassurance": ""
      },
      {
        "title": "Fit on the training rows only",
        "instruction": "Create `model` with `make_model()` and fit it on `X_train` and `y_train`.",
        "code": "model = make_model()\nmodel.fit(X_train, y_train)",
        "check": "test(\"Fit on the training rows only\", lambda: np.allclose(model.named_steps['scale'].mean_, X_train.mean(axis=0)) and hasattr(model.named_steps['clf'], 'coef_'), \"The scaler learned its means from X_train, and the classifier is fitted.\")",
        "expected": "The scaler learned its means from X_train, and the classifier is fitted.",
        "reassurance": "No test row touched the scaler, so the test score stays honest."
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `fit_and_score(model, X, y, seed=0)`: split 75/25 with `random_state=seed`, fit the given pipeline on the training part, and return its accuracy on the held-out part.",
        "code": "def fit_and_score(model, X, y, seed=0):\n    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=seed)\n    model.fit(X_train, y_train)\n    return model.score(X_test, y_test)",
        "check": "_r = np.random.default_rng(1)\n_Xs = np.column_stack([_r.normal(0, 1, 300), _r.normal(0, 1000, 300)])\n_ys = (_Xs[:, 0] + _Xs[:, 1] / 1000 > 0).astype(int)\n_m = make_model()\n_acc = fit_and_score(_m, _Xs, _ys, seed=7)\n_Xtr, _Xte, _ytr, _yte = train_test_split(_Xs, _ys, test_size=0.25, random_state=7)\ntest('Wrap it in a function', lambda: np.allclose(_m.named_steps['scale'].mean_, _Xtr.mean(axis=0)) and np.isclose(_acc, _m.score(_Xte, _yte)) and 0.8 < _acc <= 1.0, 'The scaler learned its means from the training rows only and the returned number is the test accuracy.')",
        "expected": "The scaler learned its means from the training rows only and the returned number is the test accuracy.",
        "reassurance": ""
      },
      {
        "title": "Print the demo accuracy",
        "instruction": "Print the test accuracy of a fresh model on the demo `X` and `y`, after the label `test accuracy:`. Then run Check.",
        "code": "print(\"test accuracy:\", fit_and_score(make_model(), X, y))",
        "check": "",
        "expected": "A test accuracy well above 0.8, with both features contributing.",
        "reassurance": ""
      }
    ]
  },
  "sk-cv": {
    "setup": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.tree import DecisionTreeClassifier\nfrom sklearn.model_selection import StratifiedKFold, cross_val_score\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(300, 4))\ny = (X[:, 0] - X[:, 1] + 0.3 * rng.normal(size=300) > 0).astype(int)\nmodels = {\"logistic\": LogisticRegression(), \"tree\": DecisionTreeClassifier(random_state=0)}",
    "steps": [
      {
        "title": "Build the folds",
        "instruction": "Create `k` holding 5 and `seed` holding 0, then `cv`: a stratified k-fold splitter with `k` folds that shuffles with `random_state=seed`.",
        "code": "k, seed = 5, 0\ncv = StratifiedKFold(n_splits=k, shuffle=True, random_state=seed)",
        "check": "test(\"Build the folds\", lambda: isinstance(cv, StratifiedKFold) and cv.get_n_splits() == 5 and cv.shuffle and cv.random_state == 0, \"cv is a shuffled StratifiedKFold with 5 folds and seed 0.\")",
        "expected": "cv is a shuffled StratifiedKFold with 5 folds and seed 0.",
        "reassurance": "Stratified folds keep the share of each class the same in every fold."
      },
      {
        "title": "Score every fold",
        "instruction": "Create `model` as the logistic regression in `models`, then `scores`: one accuracy per fold of `cv` for that model on `X` and `y`.",
        "code": "model = models[\"logistic\"]\nscores = cross_val_score(model, X, y, cv=cv)",
        "check": "_ref = cross_val_score(LogisticRegression(), X, y, cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=0))\ntest(\"Score every fold\", lambda: len(scores) == 5 and np.allclose(scores, _ref), \"scores holds five fold accuracies that match the reference.\")",
        "expected": "scores holds five fold accuracies that match the reference.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `cv_report(model, X, y, k=5, seed=0)`: build the splitter, score every fold, and return the mean and the std of the scores as plain floats.",
        "code": "def cv_report(model, X, y, k=5, seed=0):\n    cv = StratifiedKFold(n_splits=k, shuffle=True, random_state=seed)\n    scores = cross_val_score(model, X, y, cv=cv)\n    return float(scores.mean()), float(scores.std())",
        "check": "_r = np.random.default_rng(0)\n_Xs = _r.normal(size=(200, 2))\n_ys = (_Xs[:, 0] + _Xs[:, 1] > 0).astype(int)\n_mean, _std = cv_report(LogisticRegression(), _Xs, _ys, k=4, seed=3)\n_ref = cross_val_score(LogisticRegression(), _Xs, _ys, cv=StratifiedKFold(n_splits=4, shuffle=True, random_state=3))\ntest('Wrap it in a function', lambda: np.isclose(_mean, _ref.mean()) and np.isclose(_std, _ref.std()) and type(_mean) is float and type(_std) is float, 'The mean and std of the four fold accuracies match the reference, as plain floats.')",
        "expected": "The mean and std of the four fold accuracies match the reference, as plain floats.",
        "reassurance": "One number became a mean with error bars."
      },
      {
        "title": "Score every candidate",
        "instruction": "Loop over the names and models in `models`; for each, unpack `cv_report` on `X` and `y` into `mean` and `_` (the std is not needed here), and print the name with its mean.",
        "code": "for name, model in models.items():\n    mean, _ = cv_report(model, X, y)\n    print(name, mean)",
        "check": "test(\"Score every candidate\", lambda: 'logistic' in __stdout__ and 'tree' in __stdout__, \"The output shows the mean accuracy of logistic and of tree.\")",
        "expected": "The output shows the mean accuracy of logistic and of tree.",
        "reassurance": ""
      },
      {
        "title": "Keep the best mean",
        "instruction": "Start `best_name` at None and `best_mean` at -1.0. Loop over `models` again and replace both whenever a model's mean is strictly higher than `best_mean`.",
        "code": "best_name, best_mean = None, -1.0\nfor name, model in models.items():\n    mean, _ = cv_report(model, X, y)\n    if mean > best_mean:\n        best_name, best_mean = name, mean",
        "check": "test(\"Keep the best mean\", lambda: best_name == 'logistic' and np.isclose(best_mean, cv_report(models['logistic'], X, y)[0]), \"best_name is logistic, with its mean accuracy in best_mean.\")",
        "expected": "best_name is logistic, with its mean accuracy in best_mean.",
        "reassurance": "A strictly-higher test keeps the first model on a tie.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Wrap the comparison",
        "instruction": "Define `compare(models, X, y)` for a dict of name to model: run the same loop and return the best name. An empty dict returns None.",
        "code": "def compare(models, X, y):\n    best_name, best_mean = None, -1.0\n    for name, model in models.items():\n        mean, _ = cv_report(model, X, y)\n        if mean > best_mean:\n            best_name, best_mean = name, mean\n    return best_name",
        "check": "from sklearn.dummy import DummyClassifier\n_r = np.random.default_rng(0)\n_Xs = _r.normal(size=(200, 2))\n_ys = (_Xs[:, 0] + _Xs[:, 1] > 0).astype(int)\ntest('Wrap the comparison', lambda: compare({'dummy': DummyClassifier(), 'logistic': LogisticRegression()}, _Xs, _ys) == 'logistic' and compare({'a': DummyClassifier(), 'b': DummyClassifier()}, _Xs, _ys) == 'a' and compare({}, _Xs, _ys) is None, 'Logistic beats the dummy, a tie keeps a, and no models gives None.')",
        "expected": "Logistic beats the dummy, a tie keeps a, and no models gives None.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Print the comparison",
        "instruction": "For each name and model in `models`, print the name and its `cv_report` result; then print the winner after the label `winner:`. Then run Check.",
        "code": "for name, model in models.items():\n    print(name, cv_report(model, X, y))\nprint(\"winner:\", compare(models, X, y))",
        "check": "",
        "expected": "Two lines of (mean, std), then winner: logistic.",
        "reassurance": ""
      }
    ]
  },
  "sk-leak": {
    "setup": "import numpy as np\nimport pandas as pd\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\n\ndef make_churn(n=600, seed=0):\n    rng = np.random.default_rng(seed)\n    tenure = rng.integers(1, 60, n)\n    monthly = rng.normal(50, 15, n)\n    support_calls = rng.poisson(1.0, n)\n    logit = -1.5 + 0.03 * (30 - tenure) + 0.6 * support_calls + 0.02 * (monthly - 50)\n    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))\n    days_since_churn = np.where(churned == 1, rng.integers(1, 90, n), 0)\n    return pd.DataFrame({\"tenure\": tenure, \"monthly\": monthly, \"support_calls\": support_calls, \"days_since_churn\": days_since_churn, \"churned\": churned})\n\ndf = make_churn()\ny = df[\"churned\"].values",
    "steps": [
      {
        "title": "Drop the feature that is the answer",
        "instruction": "Create `FEATURES`: the list `tenure`, `monthly` and `support_calls`, leaving out the column that is computed from the label. Create `X` as the values of those columns of `df`.",
        "code": "FEATURES = [\"tenure\", \"monthly\", \"support_calls\"]\nX = df[FEATURES].values",
        "check": "test('Drop the feature that is the answer', lambda: 'days_since_churn' not in FEATURES and set(FEATURES) == {'tenure', 'monthly', 'support_calls'} and X.shape == (600, 3), 'FEATURES holds the three honest columns and X has 600 rows by 3 columns.')",
        "expected": "FEATURES holds the three honest columns and X has 600 rows by 3 columns.",
        "reassurance": ""
      },
      {
        "title": "Split the raw rows first",
        "instruction": "Create `X_train`, `X_test`, `y_train`, `y_test` by splitting the raw `X` and `y` 75/25 with `random_state=0`, before any scaling happens.",
        "code": "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=0)",
        "check": "_Xtr, _Xte, _ytr, _yte = train_test_split(df[FEATURES].values, df['churned'].values, test_size=0.25, random_state=0)\ntest('Split the raw rows first', lambda: X_train.shape == (450, 3) and X_test.shape == (150, 3) and np.array_equal(X_train, _Xtr) and np.array_equal(y_test, _yte), '450 training rows and 150 test rows, taken from the unscaled features.')",
        "expected": "450 training rows and 150 test rows, taken from the unscaled features.",
        "reassurance": ""
      },
      {
        "title": "Fit a pipeline on the training rows only",
        "instruction": "Create `model`: a pipeline with a `scale` step (standard scaler) and a `clf` step (logistic regression), fitted on `X_train` and `y_train` in the same expression.",
        "code": "model = Pipeline([(\"scale\", StandardScaler()), (\"clf\", LogisticRegression())]).fit(X_train, y_train)",
        "check": "test('Fit a pipeline on the training rows only', lambda: isinstance(model, Pipeline) and np.allclose(model.named_steps['scale'].mean_, X_train.mean(axis=0)) and hasattr(model.named_steps['clf'], 'coef_'), 'The scaler inside the pipeline learned its means from X_train, and the classifier is fitted.')",
        "expected": "The scaler inside the pipeline learned its means from X_train, and the classifier is fitted.",
        "reassurance": "The scaler's means and spreads are learned from data, so they must come from the training rows only."
      },
      {
        "title": "Report the honest accuracy",
        "instruction": "Create `accuracy`: the pipeline's score on `X_test` and `y_test`, and print it rounded to three decimals after the label `test accuracy:`. Then run the check.",
        "code": "accuracy = model.score(X_test, y_test)\nprint(\"test accuracy:\", round(accuracy, 3))",
        "check": "",
        "expected": "An accuracy around 0.7: clearly imperfect, clearly better than chance.",
        "reassurance": ""
      }
    ]
  },
  "sk-threshold": {
    "setup": "import numpy as np\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import train_test_split\n\nrng = np.random.default_rng(0)\nX = rng.normal(size=(600, 3))\ny = (X[:, 0] + 0.6 * X[:, 1] + rng.normal(0, 0.9, 600) > 1.2).astype(int)\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)\nprobs = LogisticRegression().fit(X_train, y_train).predict_proba(X_test)[:, 1]",
    "steps": [
      {
        "title": "Flag at one cutoff",
        "instruction": "Point `y` at the test labels `y_test` and set `t` to 0.5. Create `pred`: a boolean array that is True where `probs` is at least `t`.",
        "code": "y = y_test\nt = 0.5\npred = probs >= t",
        "check": "test(\"Flag at one cutoff\", lambda: np.array_equal(y, y_test) and pred.dtype == bool and np.array_equal(pred, probs >= 0.5), \"pred is True exactly where the probability is at least 0.5.\")",
        "expected": "pred is True exactly where the probability is at least 0.5.",
        "reassurance": ""
      },
      {
        "title": "Count the three cells",
        "instruction": "Create `tp` (flagged and really 1), `fp` (flagged but really 0) and `fn` (not flagged but really 1) as plain ints, combining `pred` with masks on `y`. `~pred` flips a boolean array.",
        "code": "tp, fp = int((pred & (y == 1)).sum()), int((pred & (y == 0)).sum())\nfn = int((~pred & (y == 1)).sum())",
        "check": "from sklearn.metrics import confusion_matrix\n_tn, _fp, _fn, _tp = confusion_matrix(y_test, probs >= 0.5).ravel()\ntest(\"Count the three cells\", lambda: (tp, fp, fn) == (_tp, _fp, _fn), \"tp, fp and fn match scikit-learn's confusion matrix at 0.5.\")",
        "expected": "tp, fp and fn match scikit-learn's confusion matrix at 0.5.",
        "reassurance": ""
      },
      {
        "title": "Precision and recall",
        "instruction": "Create `precision` (tp over everything flagged, or 0.0 when nothing is flagged) and `recall` (tp over the real positives, or 0.0 when there are none).",
        "code": "precision = tp / (tp + fp) if tp + fp else 0.0\nrecall = tp / (tp + fn) if tp + fn else 0.0",
        "check": "from sklearn.metrics import precision_score, recall_score\ntest(\"Precision and recall\", lambda: np.isclose(precision, precision_score(y_test, probs >= 0.5)) and np.isclose(recall, recall_score(y_test, probs >= 0.5)), \"precision and recall match scikit-learn at the cutoff 0.5.\")",
        "expected": "precision and recall match scikit-learn at the cutoff 0.5.",
        "reassurance": ""
      },
      {
        "title": "Wrap it in a function",
        "instruction": "Define `pr_at(probs, y, t)`: convert `probs` and `y` to NumPy arrays, then flag, count and divide as above, and return (precision, recall).",
        "code": "def pr_at(probs, y, t):\n    probs, y = np.asarray(probs), np.asarray(y)\n    pred = probs >= t\n    tp, fp = int((pred & (y == 1)).sum()), int((pred & (y == 0)).sum())\n    fn = int((~pred & (y == 1)).sum())\n    precision = tp / (tp + fp) if tp + fp else 0.0\n    recall = tp / (tp + fn) if tp + fn else 0.0\n    return precision, recall",
        "check": "from sklearn.metrics import precision_score, recall_score\n_P = np.array([0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1])\n_Y = np.array([1, 1, 0, 1, 1, 0, 0, 0])\ntest('Wrap it in a function', lambda: all(np.allclose(pr_at(_P, _Y, t), (precision_score(_Y, _P >= t), recall_score(_Y, _P >= t))) for t in (0.9, 0.6, 0.4, 0.1)) and pr_at(_P, _Y, 0.95) == (0.0, 0.0), 'Precision and recall match scikit-learn at four cutoffs, and a cutoff above every probability gives (0.0, 0.0).')",
        "expected": "Precision and recall match scikit-learn at four cutoffs, and a cutoff above every probability gives (0.0, 0.0).",
        "reassurance": "",
        "startFrom": [
          1,
          2
        ]
      },
      {
        "title": "Walk the candidate cutoffs",
        "instruction": "Set `min_recall` to 0.8. Loop `t` over each distinct probability in `probs`, from highest to lowest, and inside the loop unpack `pr_at(probs, y, t)` into `precision` and `recall`.",
        "code": "min_recall = 0.8\nfor t in sorted(np.unique(probs), reverse=True):\n    precision, recall = pr_at(probs, y, t)",
        "check": "test(\"Walk the candidate cutoffs\", lambda: min_recall == 0.8 and np.isclose(t, probs.min()) and recall == 1.0, \"The loop ends at the lowest probability, where recall is 1.0.\")",
        "expected": "The loop ends at the lowest probability, where recall is 1.0.",
        "reassurance": "Lowering the cutoff flags more rows: recall rises, precision usually falls."
      },
      {
        "title": "Keep the best qualifying cutoff",
        "instruction": "Start `best` at None and run the loop again. Whenever recall reaches `min_recall` and precision is strictly higher than the best so far (or there is no best yet), set `best` to (t as a plain float, precision, recall).",
        "code": "best = None\nfor t in sorted(np.unique(probs), reverse=True):\n    precision, recall = pr_at(probs, y, t)\n    if recall >= min_recall and (best is None or precision > best[1]):\n        best = (float(t), precision, recall)",
        "check": "test(\"Keep the best qualifying cutoff\", lambda: type(best[0]) is float and best[2] >= 0.8 and best[0] < 0.5 and np.isclose(best[1], max(pr_at(probs, y, u)[0] for u in np.unique(probs) if pr_at(probs, y, u)[1] >= 0.8)), \"best has the highest precision of all cutoffs with recall at least 0.8, and its cutoff is below 0.5.\")",
        "expected": "best has the highest precision of all cutoffs with recall at least 0.8, and its cutoff is below 0.5.",
        "reassurance": "",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Wrap the scan",
        "instruction": "Define `pick_threshold(probs, y, min_recall=0.8)`: run the same scan and return `best`.",
        "code": "def pick_threshold(probs, y, min_recall=0.8):\n    best = None\n    for t in sorted(np.unique(probs), reverse=True):\n        precision, recall = pr_at(probs, y, t)\n        if recall >= min_recall and (best is None or precision > best[1]):\n            best = (float(t), precision, recall)\n    return best",
        "check": "_P = np.array([0.9, 0.8, 0.7, 0.6, 0.4, 0.3, 0.2, 0.1])\n_Y = np.array([1, 1, 0, 1, 1, 0, 0, 0])\ntest('Wrap the scan', lambda: pick_threshold(_P, _Y, 0.8) == (0.4, 0.8, 1.0) and pick_threshold(_P, _Y, 0.5) == (0.8, 1.0, 0.5) and type(pick_threshold(_P, _Y, 0.8)[0]) is float, 'Recall 0.8 needs the cutoff 0.4 (precision 0.8); recall 0.5 allows 0.8 (precision 1.0); the threshold is a float.')",
        "expected": "Recall 0.8 needs the cutoff 0.4 (precision 0.8); recall 0.5 allows 0.8 (precision 1.0); the threshold is a float.",
        "reassurance": "The business constraint picks the cutoff, not the 0.5 default.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Refuse a bad min_recall",
        "instruction": "Define `validate(y, min_recall)` that raises `ValueError` when `min_recall` is not above 0 and at most 1. It returns nothing otherwise.",
        "code": "def validate(y, min_recall):\n    if not 0 < min_recall <= 1:\n        raise ValueError(\"min_recall must be in (0, 1]\")",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Refuse a bad min_recall\", lambda: _rejects(lambda: validate([1], 0)) and _rejects(lambda: validate([1], 1.5)) and validate([0, 1], 0.8) is None, \"min_recall of 0 or 1.5 raises ValueError; 0.8 passes silently.\")",
        "expected": "min_recall of 0 or 1.5 raises ValueError; 0.8 passes silently.",
        "reassurance": ""
      },
      {
        "title": "Refuse data without positives",
        "instruction": "Update `validate` to also raise `ValueError` when `y` contains no positive label.",
        "code": "def validate(y, min_recall):\n    if not 0 < min_recall <= 1:\n        raise ValueError(\"min_recall must be in (0, 1]\")\n    if np.asarray(y).sum() == 0:\n        raise ValueError(\"no positive labels to recall\")",
        "check": "def _rejects(y, m):\n    try:\n        validate(y, m)\n    except ValueError:\n        return True\n    return False\ntest('Refuse data without positives', lambda: _rejects([1], 0) and _rejects([1], 1.5) and _rejects([0, 0], 0.8) and validate([0, 1], 0.8) is None, 'min_recall of 0 or 1.5 and label-free data raise ValueError; a valid request passes silently.')",
        "expected": "min_recall of 0 or 1.5 and label-free data raise ValueError; a valid request passes silently.",
        "reassurance": "",
        "startFrom": [
          7
        ]
      },
      {
        "title": "Guard the picker",
        "instruction": "Update `pick_threshold` to call `validate` first, then scan as before.",
        "code": "def pick_threshold(probs, y, min_recall=0.8):\n    validate(y, min_recall)\n    best = None\n    for t in sorted(np.unique(probs), reverse=True):\n        precision, recall = pr_at(probs, y, t)\n        if recall >= min_recall and (best is None or precision > best[1]):\n            best = (float(t), precision, recall)\n    return best",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest('Guard the picker', lambda: _rejects(lambda: pick_threshold([0.5], [1], min_recall=0)) and _rejects(lambda: pick_threshold([0.5, 0.2], [0, 0])) and pick_threshold(probs, y_test, 0.8)[2] >= 0.8 and pick_threshold(probs, y_test, 0.8)[0] < 0.5, 'Bad requests raise ValueError; on the demo data the chosen cutoff is below 0.5 and reaches recall 0.8.')",
        "expected": "Bad requests raise ValueError; on the demo data the chosen cutoff is below 0.5 and reaches recall 0.8.",
        "reassurance": "",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Compare with the default cutoff",
        "instruction": "Print the (precision, recall) at the default cutoff 0.5 after the label `default 0.5:`, then the result of `pick_threshold` for recall 0.8 after the label `recall >= 0.8:`. Then run Check.",
        "code": "print(\"default 0.5:\", pr_at(probs, y_test, 0.5))\nprint(\"recall >= 0.8:\", pick_threshold(probs, y_test, 0.8))",
        "check": "",
        "expected": "The default cutoff has the higher precision; the chosen cutoff trades some of it for recall 0.8.",
        "reassurance": ""
      }
    ]
  },
  "sk-churn-boss": {
    "setup": "import numpy as np\nimport pandas as pd\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import OneHotEncoder, StandardScaler\n\nNUMERIC = [\"tenure\", \"monthly\", \"support_calls\"]\nFEATURES = NUMERIC + [\"plan\"]\n\ndef make_churn(n=600, seed=0):\n    rng = np.random.default_rng(seed)\n    plan = rng.choice([\"basic\", \"pro\", \"team\"], n, p=[0.5, 0.35, 0.15])\n    tenure = rng.integers(1, 60, n)\n    monthly = np.where(plan == \"basic\", 20, np.where(plan == \"pro\", 50, 120)) + rng.normal(0, 5, n)\n    support_calls = rng.poisson(1.0, n)\n    base = np.where(plan == \"basic\", 0.2, np.where(plan == \"pro\", -0.8, -1.6))\n    logit = base + 0.04 * (30 - tenure) + 0.7 * support_calls\n    churned = rng.binomial(1, 1 / (1 + np.exp(-logit)))\n    return pd.DataFrame({\"tenure\": tenure, \"monthly\": monthly, \"support_calls\": support_calls, \"plan\": plan, \"churned\": churned})\n\ntrain = make_churn(600, seed=0)\nnew_customers = pd.DataFrame({\"tenure\": [2, 40], \"monthly\": [21.0, 118.0], \"support_calls\": [4, 0], \"plan\": [\"basic\", \"enterprise\"]})",
    "steps": [
      {
        "title": "Encode the plan column",
        "instruction": "Create `encoder`: a one-hot encoder that ignores categories it never saw during fitting instead of raising an error.",
        "code": "encoder = OneHotEncoder(handle_unknown=\"ignore\")",
        "check": "test(\"Encode the plan column\", lambda: isinstance(encoder, OneHotEncoder) and encoder.handle_unknown == 'ignore', \"encoder is a OneHotEncoder that ignores unknown categories.\")",
        "expected": "encoder is a OneHotEncoder that ignores unknown categories.",
        "reassurance": "An unknown plan becomes all zeros, so a new product tier cannot crash the model."
      },
      {
        "title": "Route each column group",
        "instruction": "Create `prep`: a column transformer with two routes, `num` (a new standard scaler on the `NUMERIC` columns) and `cat` (`encoder` on the `plan` column).",
        "code": "prep = ColumnTransformer([(\"num\", StandardScaler(), NUMERIC), (\"cat\", encoder, [\"plan\"])])",
        "check": "test(\"Route each column group\", lambda: isinstance(prep, ColumnTransformer) and {n: list(c) for n, _, c in prep.transformers} == {'num': NUMERIC, 'cat': ['plan']}, \"prep routes the numeric columns to num and plan to cat.\")",
        "expected": "prep routes the numeric columns to num and plan to cat.",
        "reassurance": ""
      },
      {
        "title": "Build it on demand",
        "instruction": "Define `make_preprocessor()` returning the same column transformer, built from a new encoder and a new scaler on every call.",
        "code": "def make_preprocessor():\n    encoder = OneHotEncoder(handle_unknown=\"ignore\")\n    return ColumnTransformer([(\"num\", StandardScaler(), NUMERIC), (\"cat\", encoder, [\"plan\"])])",
        "check": "_p = make_preprocessor()\n_names = {name: (est, cols) for name, est, cols in _p.transformers}\ntest('Build it on demand', lambda: isinstance(_p, ColumnTransformer) and set(_names) == {'num', 'cat'} and isinstance(_names['num'][0], StandardScaler) and list(_names['num'][1]) == NUMERIC and isinstance(_names['cat'][0], OneHotEncoder) and list(_names['cat'][1]) == ['plan'] and _names['cat'][0].handle_unknown == 'ignore', 'A ColumnTransformer with a num route (scaler on the numeric columns) and a cat route (one-hot on plan, unknowns ignored).')",
        "expected": "A ColumnTransformer with a num route (scaler on the numeric columns) and a cat route (one-hot on plan, unknowns ignored).",
        "reassurance": "",
        "startFrom": [
          0
        ]
      },
      {
        "title": "Train the pipeline",
        "instruction": "Define `train_churn_model(df)` returning a pipeline of `prep` (a new preprocessor) and `clf` (logistic regression with `max_iter=500`), fitted on the `FEATURES` columns of `df` against its `churned` column.",
        "code": "def train_churn_model(df):\n    model = Pipeline([(\"prep\", make_preprocessor()), (\"clf\", LogisticRegression(max_iter=500))])\n    return model.fit(df[FEATURES], df[\"churned\"])",
        "check": "_m = train_churn_model(make_churn(600, seed=1))\ntest('Train the pipeline', lambda: isinstance(_m, Pipeline) and list(_m.named_steps) == ['prep', 'clf'] and hasattr(_m.named_steps['clf'], 'coef_') and list(_m.feature_names_in_) == FEATURES and train_churn_model(make_churn(200, seed=5)) is not _m, 'A fitted prep + clf pipeline that remembers the four feature names, fresh on every call.')",
        "expected": "A fitted prep + clf pipeline that remembers the four feature names, fresh on every call.",
        "reassurance": ""
      },
      {
        "title": "Predict churn probabilities",
        "instruction": "Define `predict_churn(model, df)` returning a 1-D array with the probability of churn (the positive class) for every row of `df`, selecting the `FEATURES` columns so extra or missing columns do not matter.",
        "code": "def predict_churn(model, df):\n    return model.predict_proba(df[FEATURES])[:, 1]",
        "check": "from sklearn.metrics import roc_auc_score\n_m = train_churn_model(make_churn(600, seed=1))\n_fresh = make_churn(300, seed=2)\n_probs = predict_churn(_m, _fresh.drop(columns='churned'))\n_weird = _fresh.head(5).copy()\n_weird['plan'] = 'enterprise'\ntest('Predict churn probabilities', lambda: _probs.shape == (300,) and bool((_probs >= 0).all() and (_probs <= 1).all()) and roc_auc_score(_fresh['churned'], _probs) > 0.7 and predict_churn(_m, _weird).shape == (5,) and bool(np.isfinite(predict_churn(_m, _weird)).all()), 'One probability per row without the label column, AUC above 0.7 on fresh data, and an unseen plan still works.')",
        "expected": "One probability per row without the label column, AUC above 0.7 on fresh data, and an unseen plan still works.",
        "reassurance": "Selecting `FEATURES` inside keeps production input identical to training input."
      },
      {
        "title": "Score two new customers",
        "instruction": "Create `model` by training on `train`, then print the churn probabilities for `new_customers`. Then run the boss check.",
        "code": "model = train_churn_model(train)\nprint(predict_churn(model, new_customers))",
        "check": "",
        "expected": "Two probabilities: the new basic customer with four support calls is riskier than the long-tenured enterprise one.",
        "reassurance": ""
      }
    ]
  }
}
