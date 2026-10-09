---
id: nn-activations
track: nn
order: 2
title: Activations and Their Slopes
tagline: Without a nonlinearity, a deep network is one matrix. The slope is what training uses.
kind: build
xp: 40
minutes: 7
---
@@body
# Why networks need a bend

Stack two linear layers and you still have a linear function: `W2 (W1 x) = (W2 W1) x`. The **activation function** between layers is the bend that lets a network draw curves. Two workhorses:

```
relu(x)    = max(0, x)              cheap, the default inside modern networks
sigmoid(x) = 1 / (1 + e^-x)         squashes to (0, 1): outputs and gates
```

Training needs each function's **slope** (derivative): `relu'(x)` is 1 where `x > 0` and 0 elsewhere; `sigmoid'(x) = s(x)(1 − s(x))`. And one numerical detail: `np.exp(-x)` overflows for `x = -1000`, so the stable sigmoid is written through `tanh`.

> **Mission:** implement `relu(x)`, `relu_grad(x)`, `sigmoid(x)` (stable for huge inputs) and `sigmoid_grad(x)`, all vectorised, all leaving the input unchanged.
@@starter
import numpy as np

def relu(x):
    # TODO
    return x

def relu_grad(x):
    # TODO
    return x

def sigmoid(x):
    # TODO: stable for x = -1000 and x = 1000
    return x

def sigmoid_grad(x):
    # TODO
    return x

x = np.linspace(-4, 4, 9)
print("x          ", x)
print("relu       ", relu(x))
print("sigmoid    ", np.round(sigmoid(x), 3))
print("sigmoid'   ", np.round(sigmoid_grad(x), 3))
@@solution
import numpy as np

def relu(x):
    return np.maximum(0, x)

def relu_grad(x):
    return (x > 0).astype(float)

def sigmoid(x):
    return 0.5 * (1 + np.tanh(x / 2))

def sigmoid_grad(x):
    s = sigmoid(x)
    return s * (1 - s)

x = np.linspace(-4, 4, 9)
print("x          ", x)
print("relu       ", relu(x))
print("sigmoid    ", np.round(sigmoid(x), 3))
print("sigmoid'   ", np.round(sigmoid_grad(x), 3))
@@check
import numpy as np, warnings
v = np.array([-2.0, 0.0, 3.0])
before = v.copy()
test("relu zeroes negatives, keeps positives, keeps shape", lambda: np.array_equal(relu(v), [0.0, 0.0, 3.0]) and relu(np.array([[-1.0, 2.0], [0.5, -0.5]])).tolist() == [[0.0, 2.0], [0.5, 0.0]])
test("relu_grad is a float mask", lambda: np.array_equal(relu_grad(v), [0.0, 0.0, 1.0]) and relu_grad(v).dtype == float)
def quiet():
    with warnings.catch_warnings():
        warnings.simplefilter("error")
        out = sigmoid(np.array([-1000.0, 0.0, 1000.0]))
    return np.allclose(out, [0.0, 0.5, 1.0])
test("sigmoid is stable at ±1000 without warnings", quiet)
test("sigmoid matches the textbook formula on ordinary inputs", lambda: np.allclose(sigmoid(np.array([-2.0, 0.5, 3.0])), 1 / (1 + np.exp(-np.array([-2.0, 0.5, 3.0])))))
xs = np.array([-3.0, -0.5, 0.0, 1.2, 4.0])
h = 1e-5
test("sigmoid_grad matches the numerical slope", lambda: np.allclose(sigmoid_grad(xs), (sigmoid(xs + h) - sigmoid(xs - h)) / (2 * h), atol=1e-6))
test("relu_grad matches the numerical slope away from zero", lambda: np.allclose(relu_grad(np.array([-1.0, 2.0])), (relu(np.array([-1.0, 2.0]) + h) - relu(np.array([-1.0, 2.0]) - h)) / (2 * h)))
test("inputs are left unchanged", lambda: np.array_equal(v, before))
@@hint
`np.maximum(0, x)` and `(x > 0).astype(float)` are each one line. For the sigmoid use the tanh identity: `0.5 * (1 + np.tanh(x / 2))`.
@@hint
`sigmoid_grad`: compute `s = sigmoid(x)` once and return `s * (1 - s)`.
@@q
Why does a network need a nonlinear activation between layers?
@@a
Without one, any stack of linear layers collapses into a single linear map and can only draw straight boundaries.
@@q
How can you check a derivative implementation?
@@a
Compare it with the numerical slope `(f(x + h) - f(x - h)) / (2h)` for a small h; they should agree to several decimals.
@@real
`torch.relu` and `torch.sigmoid` are these functions; autograd computes the slopes for you, but the numerical check (`torch.autograd.gradcheck`) is still how custom layers are verified. GELU and SiLU are the smoother relatives used inside transformers.
