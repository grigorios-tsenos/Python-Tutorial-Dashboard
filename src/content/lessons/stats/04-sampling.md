---
id: st-sampling
track: stats
order: 4
title: Simulate Before You Believe
tagline: A 12% conversion rate from 50 visitors is a rumour. From 5000 it is a fact.
kind: build
xp: 45
minutes: 7
---
@@body
# Sampling noise, made visible

Run the same experiment many times and the measured rate wobbles. How much it wobbles depends on the sample size: that is the **law of large numbers** in action, and simulation is the fastest way to feel it.

NumPy's random generator is explicit and reproducible:

```python
rng = np.random.default_rng(seed)        # same seed -> same numbers
rng.binomial(n, p, size=trials)          # successes out of n, repeated `trials` times
```

> **Mission:** implement `simulate_rates(p, n, trials, seed=0)` → an array of `trials` conversion rates, each from `n` visitors who convert with probability `p`. Reject `n < 1`, `trials < 1` or `p` outside `[0, 1]` with `ValueError`. Then prove the law of large numbers: rates from 1000 visitors must vary less than rates from 10.
@@starter
import numpy as np

def simulate_rates(p, n, trials, seed=0):
    """Conversion rates from `trials` experiments of n visitors each, converting with probability p."""
    # TODO
    return np.zeros(trials)

# TODO: compare the spread of rates from 10 visitors with the spread from 1000 (2000 trials each)
small = 0.0
large = 0.0
print(simulate_rates(0.12, 50, 5))
@@solution
import numpy as np

def simulate_rates(p, n, trials, seed=0):
    """Conversion rates from `trials` experiments of n visitors each, converting with probability p."""
    if not 0 <= p <= 1 or n < 1 or trials < 1:
        raise ValueError("need 0 <= p <= 1, n >= 1 and trials >= 1")
    rng = np.random.default_rng(seed)
    counts = rng.binomial(n, p, size=trials)
    return counts / n

small = simulate_rates(0.12, 10, 2000).std()
large = simulate_rates(0.12, 1000, 2000).std()
print(simulate_rates(0.12, 50, 5))
print(f"spread with 10 visitors: {small:.3f}, with 1000: {large:.3f}")
@@check
import numpy as np
r = simulate_rates(0.1, 50, 200, seed=3)
test("one rate per trial, reproducible from the seed", lambda: r.shape == (200,) and np.array_equal(r, simulate_rates(0.1, 50, 200, seed=3)))
test("different seeds give different draws", lambda: not np.array_equal(r, simulate_rates(0.1, 50, 200, seed=4)))
test("rates are fractions in [0, 1] that average near p", lambda: bool((r >= 0).all() and (r <= 1).all()) and abs(r.mean() - 0.1) < 0.02)
test("rates are multiples of 1/n", lambda: np.allclose(r * 50, np.round(r * 50)))
test("p = 0 and p = 1 are deterministic", lambda: simulate_rates(0.0, 20, 5).sum() == 0 and simulate_rates(1.0, 20, 5).sum() == 5)
def rejects(*args):
    try:
        simulate_rates(*args)
    except ValueError:
        return True
    return False
test("invalid inputs are rejected", lambda: rejects(1.5, 10, 10) and rejects(-0.1, 10, 10) and rejects(0.5, 0, 10) and rejects(0.5, 10, 0))
test("large samples wobble far less than small ones", lambda: large < small / 5 and large > 0)
@@hint
`np.random.default_rng(seed).binomial(n, p, size=trials)` gives the conversion counts; divide by `n` for rates. Validate the arguments before creating the generator.
@@hint
`small = simulate_rates(0.12, 10, 2000).std()` and the same with `n=1000` for `large`. The ratio should be roughly `sqrt(1000 / 10) = 10`.
@@q
Why does the spread of a measured rate shrink with sample size?
@@a
Random ups and downs partly cancel out as more observations are averaged; the standard error falls with the square root of n.
@@q
Why seed a random generator in an experiment?
@@a
So the result is reproducible: the same seed gives the same draws, which makes debugging and reviewing possible.
@@real
`np.random.default_rng` is the modern NumPy API; avoid the legacy `np.random.seed`. Power calculations for A/B tests answer the reverse question: how many visitors do we need before the wobble is smaller than the effect we hope to see?
