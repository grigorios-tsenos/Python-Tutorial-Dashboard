---
id: st-ab-boss
track: stats
order: 9
title: "Boss: The Honest A/B Report"
tagline: Rates, lift, a confidence interval, a p-value and a decision rule, with no hand-waving.
kind: boss
xp: 110
minutes: 14
---
@@body
# Boss: decide whether to ship

A checkout redesign ran as an A/B test: each visitor is a `1` (converted) or `0`. Product wants one honest report, not a pile of numbers. You have every tool from this chapter: rates, bootstrap intervals, permutation tests and a decision rule.

> **Mission:** implement `ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0)` → a dict:
>
> | key | value |
> |---|---|
> | `control_rate`, `treatment_rate` | the two conversion rates |
> | `lift` | `treatment_rate − control_rate` |
> | `ci` | `(low, high)`: bootstrap percentile interval for the lift, resampling **each group separately** with one `np.random.default_rng(seed)` |
> | `p_value` | two-sided permutation p-value `(count + 1) / (n_perm + 1)` with a fresh `default_rng(seed)` |
> | `decision` | `"ship"` if `p_value < alpha` and `lift > 0`; `"stop"` if `p_value < alpha` and `lift < 0`; else `"inconclusive"` |
>
> Inputs are lists or arrays of 0/1. An empty group raises `ValueError`. The same inputs and seed must give the same report.
@@starter
import numpy as np

def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):
    """Rates, lift, bootstrap CI, permutation p-value and a decision for a 0/1 A/B test."""
    # TODO
    return {}

rng = np.random.default_rng(42)
control = rng.binomial(1, 0.10, 800)      # old checkout: ~10% convert
treatment = rng.binomial(1, 0.13, 800)    # new checkout: ~13% convert
for key, value in ab_report(control, treatment).items():
    print(f"{key:>15}: {value}")
@@solution
import numpy as np

def ab_report(control, treatment, alpha=0.05, n_boot=2000, n_perm=2000, seed=0):
    """Rates, lift, bootstrap CI, permutation p-value and a decision for a 0/1 A/B test."""
    control = np.asarray(control, dtype=float)
    treatment = np.asarray(treatment, dtype=float)
    if len(control) == 0 or len(treatment) == 0:
        raise ValueError("both groups need visitors")
    control_rate, treatment_rate = control.mean(), treatment.mean()
    lift = treatment_rate - control_rate

    rng = np.random.default_rng(seed)
    boot_c = rng.choice(control, size=(n_boot, len(control)), replace=True).mean(axis=1)
    boot_t = rng.choice(treatment, size=(n_boot, len(treatment)), replace=True).mean(axis=1)
    low, high = np.percentile(boot_t - boot_c, [100 * alpha / 2, 100 * (1 - alpha / 2)])

    rng = np.random.default_rng(seed)
    pooled = np.concatenate([control, treatment])
    count = 0
    for _ in range(n_perm):
        shuffled = rng.permutation(pooled)
        gap = shuffled[len(control):].mean() - shuffled[:len(control)].mean()
        count += abs(gap) >= abs(lift)
    p_value = (count + 1) / (n_perm + 1)

    if p_value < alpha and lift > 0:
        decision = "ship"
    elif p_value < alpha and lift < 0:
        decision = "stop"
    else:
        decision = "inconclusive"
    return {"control_rate": float(control_rate), "treatment_rate": float(treatment_rate), "lift": float(lift),
            "ci": (float(low), float(high)), "p_value": float(p_value), "decision": decision}

rng = np.random.default_rng(42)
control = rng.binomial(1, 0.10, 800)      # old checkout: ~10% convert
treatment = rng.binomial(1, 0.13, 800)    # new checkout: ~13% convert
for key, value in ab_report(control, treatment).items():
    print(f"{key:>15}: {value}")
@@check
import numpy as np
r = ab_report([0, 1, 0, 0], [1, 1, 0, 1], n_boot=10, n_perm=10)
test("the report has every key", lambda: set(r) == {"control_rate", "treatment_rate", "lift", "ci", "p_value", "decision"})
test("rates and lift", lambda: np.isclose(r["control_rate"], 0.25) and np.isclose(r["treatment_rate"], 0.75) and np.isclose(r["lift"], 0.5))
rng = np.random.default_rng(1)
c = rng.binomial(1, 0.10, 500)
t = rng.binomial(1, 0.16, 500)
win = ab_report(c, t, n_boot=500, n_perm=500, seed=3)
g = np.random.default_rng(3)
cb = g.choice(c.astype(float), size=(500, 500), replace=True).mean(axis=1)
tb = g.choice(t.astype(float), size=(500, 500), replace=True).mean(axis=1)
lo, hi = np.percentile(tb - cb, [2.5, 97.5])
test("ci is the bootstrap percentile interval of the lift", lambda: np.isclose(win["ci"][0], lo) and np.isclose(win["ci"][1], hi))
test("the interval brackets the lift and excludes zero for a real effect", lambda: win["ci"][0] < win["lift"] < win["ci"][1] and win["ci"][0] > 0)
test("a clear improvement ships with a small p-value", lambda: 0 < win["p_value"] < 0.05 and win["decision"] == "ship")
test("the same inputs and seed give the same report", lambda: ab_report(c, t, n_boot=500, n_perm=500, seed=3) == win)
tie = ab_report(c, c, n_boot=100, n_perm=200)
test("identical groups are inconclusive", lambda: tie["lift"] == 0 and tie["p_value"] > 0.5 and tie["decision"] == "inconclusive")
test("a clear regression says stop", lambda: ab_report(t, c, n_boot=100, n_perm=500)["decision"] == "stop")
test("a stricter alpha can turn ship into inconclusive", lambda: ab_report(c, t, alpha=1e-9, n_boot=100, n_perm=200)["decision"] == "inconclusive")
test("results are plain Python numbers", lambda: all(type(win[k]) is float for k in ("control_rate", "treatment_rate", "lift", "p_value")) and type(win["ci"]) is tuple)
def rejected():
    try:
        ab_report([], [1, 0])
    except ValueError:
        return True
    return False
test("an empty group is rejected", rejected)
test("the inputs are unchanged", lambda: control.sum() == np.random.default_rng(42).binomial(1, 0.10, 800).sum())
@@hint
Reuse the chapter: rates are means of 0/1 arrays, the CI comes from `rng.choice(..., size=(n_boot, n), replace=True).mean(axis=1)` for each group (control first), the p-value from `rng.permutation` on the pooled array.
@@hint
Create `np.random.default_rng(seed)` twice: once before the bootstrap, once before the permutations, so each part is reproducible on its own. The decision needs both `p_value < alpha` and the sign of `lift`.
@@q
Why report a confidence interval for the lift and not only a p-value?
@@a
The p-value says whether an effect is detectable; the interval says how large it plausibly is, which is what a business decision needs.
@@q
When is an A/B result inconclusive rather than negative?
@@a
When the p-value is above alpha: the data cannot distinguish the observed lift from chance, which is different from showing there is no effect.
@@real
Real experimentation platforms (Optimizely, GrowthBook, Statsig) add sequential testing so you can peek without inflating false positives, and guardrail metrics so a lift in conversion cannot hide a drop in revenue. The arithmetic underneath is this report.
