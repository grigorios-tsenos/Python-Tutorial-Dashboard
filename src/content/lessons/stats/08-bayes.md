---
id: st-bayes
track: stats
order: 8
title: Update a Belief with Evidence
tagline: A positive test on a rare condition is usually a false alarm. Bayes says by how much.
kind: build
xp: 55
minutes: 8
---
@@body
# Bayes' rule: prior, evidence, posterior

A spam filter flags 99% of spam (**sensitivity**) and wrongly flags 5% of good mail (**false positive rate**). Only 1% of mail is spam (**prior**). An email is flagged. How likely is it spam? Far less than 99%:

```
P(spam | flagged) = P(flagged | spam) · P(spam) / P(flagged)
P(flagged) = sens · prior + fpr · (1 − prior)
```

The denominator is the key: a tiny prior means most flags come from the huge pile of good mail. Each new piece of evidence turns the posterior into the next prior.

> **Mission:** implement `posterior(prior, sens, fpr, positive=True)` → the probability of the condition after one test result, and `posterior_after(prior, sens, fpr, results)` → the probability after a sequence of boolean results, applied in order. All probabilities must be in `[0, 1]`, else `ValueError`.
@@starter
def posterior(prior, sens, fpr, positive=True):
    """P(condition | one test result) via Bayes' rule."""
    # TODO
    return prior

def posterior_after(prior, sens, fpr, results):
    """P(condition) after applying each boolean test result in order."""
    # TODO
    return prior

spam_rate, sensitivity, false_positive = 0.01, 0.99, 0.05
print("flagged once:  ", round(posterior(spam_rate, sensitivity, false_positive), 3))
print("flagged twice: ", round(posterior_after(spam_rate, sensitivity, false_positive, [True, True]), 3))
print("flagged, then cleared:", round(posterior_after(spam_rate, sensitivity, false_positive, [True, False]), 4))
@@solution
def posterior(prior, sens, fpr, positive=True):
    """P(condition | one test result) via Bayes' rule."""
    if not all(0 <= p <= 1 for p in (prior, sens, fpr)):
        raise ValueError("probabilities must be between 0 and 1")
    if positive:
        p_positive = sens * prior + fpr * (1 - prior)
        return sens * prior / p_positive
    p_negative = (1 - sens) * prior + (1 - fpr) * (1 - prior)
    return (1 - sens) * prior / p_negative

def posterior_after(prior, sens, fpr, results):
    """P(condition) after applying each boolean test result in order."""
    for result in results:
        prior = posterior(prior, sens, fpr, result)
    return prior

spam_rate, sensitivity, false_positive = 0.01, 0.99, 0.05
print("flagged once:  ", round(posterior(spam_rate, sensitivity, false_positive), 3))
print("flagged twice: ", round(posterior_after(spam_rate, sensitivity, false_positive, [True, True]), 3))
print("flagged, then cleared:", round(posterior_after(spam_rate, sensitivity, false_positive, [True, False]), 4))
@@check
import numpy as np
test("a positive test on a rare condition is mostly false alarms", lambda: np.isclose(posterior(0.01, 0.99, 0.05), 0.99 * 0.01 / (0.99 * 0.01 + 0.05 * 0.99)))
test("a negative result lowers the belief", lambda: np.isclose(posterior(0.3, 0.9, 0.1, positive=False), 0.1 * 0.3 / (0.1 * 0.3 + 0.9 * 0.7)))
test("a perfect test is decisive", lambda: posterior(0.01, 1.0, 0.0) == 1.0 and posterior(0.99, 1.0, 0.0, positive=False) == 0.0)
test("a useless test changes nothing", lambda: np.isclose(posterior(0.3, 0.5, 0.5), 0.3) and np.isclose(posterior(0.3, 0.5, 0.5, positive=False), 0.3))
test("evidence accumulates in order", lambda: np.isclose(posterior_after(0.2, 0.9, 0.1, [True, False]), posterior(posterior(0.2, 0.9, 0.1, True), 0.9, 0.1, False)) and posterior_after(0.01, 0.99, 0.05, [True, True]) > 0.75)
test("no evidence leaves the prior alone", lambda: posterior_after(0.37, 0.9, 0.1, []) == 0.37)
def rejects(*args):
    try:
        posterior(*args)
    except ValueError:
        return True
    return False
test("probabilities outside [0, 1] are rejected", lambda: rejects(1.2, 0.9, 0.1) and rejects(0.5, -0.1, 0.1) and rejects(0.5, 0.9, 1.5))
test("the demo numbers are printed", lambda: "0.167" in __stdout__)
@@hint
Positive result: `sens * prior / (sens * prior + fpr * (1 - prior))`. Negative result: replace `sens` with `1 - sens` and `fpr` with `1 - fpr`.
@@hint
`posterior_after` is a loop: `prior = posterior(prior, sens, fpr, result)` for each result, then return `prior`. Validate the three probabilities at the top of `posterior`.
@@q
Why is P(spam | flagged) so much lower than the filter's 99% sensitivity?
@@a
Spam is rare, so even a 5% false-positive rate on the much larger pile of good mail produces more flags than the spam does.
@@q
What happens to the posterior after each new test result?
@@a
It becomes the prior for the next result, so evidence accumulates multiplicatively.
@@real
This is the whole logic of medical screening, fraud scoring and spam filtering. Naive Bayes classifiers apply the same update once per feature, and Bayesian A/B testing replaces p-values with a posterior over the lift.
