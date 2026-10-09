---
id: nn-descent
track: nn
order: 5
title: Gradient Descent on One Number
tagline: Walk downhill in small steps. Too small and you never arrive, too big and you fly off.
kind: build
xp: 45
minutes: 7
---
@@body
# The whole of training, in one dimension

Training a network means adjusting its numbers to lower a loss. The **gradient** says which direction raises the loss, so you step the other way, by a fraction called the **learning rate**:

```
w  <-  w − lr · grad(w)
```

Repeat. On the bowl `loss(w) = (w − 3)²` the gradient is `2(w − 3)`, and the walk converges to `w = 3` if the learning rate is small enough. Too large and each step overshoots further than the last: divergence.

> **Mission:** implement `descend(grad, w0, lr, steps)` → a NumPy array with the starting point and every later position (`steps + 1` values), and `find_lr(grad, w0, lrs, steps)` → the learning rate from `lrs` whose final position has the smallest `|grad|`, ignoring learning rates that produced a non-finite value.
@@starter
import numpy as np

def descend(grad, w0, lr, steps):
    """Positions visited by gradient descent: w0, then steps updates."""
    # TODO
    return np.array([w0])

def find_lr(grad, w0, lrs, steps):
    """The learning rate whose final position has the smallest |grad| (non-finite results ignored)."""
    # TODO
    return lrs[0]

def grad(w):               # slope of loss(w) = (w - 3) ** 2
    return 2 * (w - 3)

print("lr 0.1:", np.round(descend(grad, 0.0, 0.1, 10), 3))
print("best lr:", find_lr(grad, 0.0, [0.01, 0.1, 0.5, 1.1], 30))
@@solution
import numpy as np

def descend(grad, w0, lr, steps):
    """Positions visited by gradient descent: w0, then steps updates."""
    w = float(w0)
    history = [w]
    for _ in range(steps):
        w = w - lr * grad(w)
        history.append(w)
    return np.array(history)

def find_lr(grad, w0, lrs, steps):
    """The learning rate whose final position has the smallest |grad| (non-finite results ignored)."""
    best_lr, best_score = None, np.inf
    for lr in lrs:
        final = descend(grad, w0, lr, steps)[-1]
        if not np.isfinite(final):
            continue
        score = abs(grad(final))
        if score < best_score:
            best_lr, best_score = lr, score
    return best_lr

def grad(w):               # slope of loss(w) = (w - 3) ** 2
    return 2 * (w - 3)

print("lr 0.1:", np.round(descend(grad, 0.0, 0.1, 10), 3))
print("lr 1.1 after 20 steps:", descend(grad, 0.0, 1.1, 20)[-1])
print("best lr:", find_lr(grad, 0.0, [0.01, 0.1, 0.5, 1.1], 30))
@@check
import numpy as np
g = lambda w: 2 * (w - 3)
h = descend(g, 0.0, 0.1, 50)
test("steps + 1 positions, starting at w0", lambda: h.shape == (51,) and h[0] == 0.0)
test("a small learning rate converges on the minimum", lambda: abs(h[-1] - 3) < 1e-3 and all(abs(h[i + 1] - 3) <= abs(h[i] - 3) for i in range(50)))
test("the first step is exactly w0 - lr * grad(w0)", lambda: np.isclose(h[1], 0.0 - 0.1 * g(0.0)))
test("a too-large learning rate diverges geometrically", lambda: np.isclose(descend(g, 0.0, 1.1, 20)[-1] - 3, -3 * (1.2 ** 20)))
test("lr = 0.5 lands exactly on the minimum in one step", lambda: np.isclose(descend(g, 10.0, 0.5, 1)[-1], 3.0))
test("zero steps returns just the start", lambda: descend(g, 7.0, 0.1, 0).tolist() == [7.0])
test("find_lr prefers the rate that ends closest to the minimum", lambda: find_lr(g, 0.0, [0.01, 0.1, 0.5, 1.1], 30) == 0.5)
test("diverging rates are skipped", lambda: find_lr(g, 0.0, [1.5, 0.01], 400) == 0.01)
g2 = lambda w: 4 * w ** 3            # loss = w^4, a flatter bowl
test("another loss works too", lambda: abs(descend(g2, 1.0, 0.05, 200)[-1]) < 0.2 and find_lr(g2, 1.0, [0.001, 0.05], 200) == 0.05)
@@hint
Start `history = [float(w0)]`; inside `for _ in range(steps)` update `w = w - lr * grad(w)` and append. Return `np.array(history)`.
@@hint
`find_lr`: loop over `lrs`, take `descend(...)[-1]`, skip it when `not np.isfinite(final)`, and keep the lr with the smallest `abs(grad(final))`.
@@q
What happens when the learning rate is too large?
@@a
Each step overshoots the minimum by more than the last; the position oscillates and grows without bound.
@@q
Why step against the gradient rather than along it?
@@a
The gradient points in the direction of steepest increase of the loss; moving the opposite way decreases it fastest locally.
@@real
`torch.optim.SGD(params, lr=0.1)` performs exactly `w -= lr * grad` for every parameter tensor. Adam adapts the step per parameter, and learning-rate schedules shrink `lr` over time, but the update is this line.
