---
id: nn-loss
track: nn
order: 4
title: What Does Cross-Entropy Punish?
tagline: The loss that trains every classifier has one strong opinion about confidence.
kind: predict
xp: 30
minutes: 4
answer: 0
---
@@body
# Predict the output

**Cross-entropy** scores a predicted distribution against the true class: `−log(p_true)`, the negative log of the probability the model gave to the correct answer. Three predictions for an example whose true class is `0`: confident and right, unsure, confident and wrong.

Each line prints one loss, rounded to two decimals. What comes out?
@@starter
import numpy as np

def cross_entropy(p, true_class):
    return -np.log(p[true_class])

confident_right = np.array([0.9, 0.05, 0.05])
unsure = np.array([0.4, 0.3, 0.3])
confident_wrong = np.array([0.05, 0.9, 0.05])

for p in (confident_right, unsure, confident_wrong):
    print(round(cross_entropy(p, 0), 2))
@@choice
0.11
0.92
3.0
@@choice
0.1
0.6
0.95
@@choice
0.11
0.92
0.11
@@choice
0.9
0.4
0.05
@@explain
`−log(0.9) ≈ 0.11`: being right and confident costs almost nothing. `−log(0.4) ≈ 0.92`: hedging costs more. `−log(0.05) ≈ 3.0`: being confidently wrong is punished hardest, and the penalty grows without bound as the probability of the truth approaches zero. That asymmetry is why cross-entropy produces calibrated, cautious models: the loss only looks at the probability assigned to the true class, so the `0.9` on the wrong class matters only through the `0.05` it left for the truth.
@@hint
Only `p[0]` matters in each case: 0.9, 0.4 and 0.05. Take the negative natural log of each.
@@hint
`−ln(0.9) = 0.105`, `−ln(0.4) = 0.916`, `−ln(0.05) = 2.996`.
@@q
Which prediction does cross-entropy punish most?
@@a
A confident prediction that is wrong: the loss is −log of a tiny probability, which is very large.
@@q
Why does cross-entropy only look at the probability of the true class?
@@a
Because the probabilities sum to 1, raising the true class's probability necessarily lowers the others; the loss captures everything it needs from that one number.
