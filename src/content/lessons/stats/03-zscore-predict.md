---
id: st-zscore
track: stats
order: 3
title: How Unusual Is This Value?
tagline: A z-score measures distance from the mean in units of spread.
kind: predict
xp: 30
minutes: 4
answer: 0
---
@@body
# Predict the output

A **z-score** rescales a value: subtract the mean, divide by the standard deviation. `z = 2` means "two standard deviations above average", whatever the units were. Flagging `|z| > threshold` is the simplest outlier detector there is.

Five values, one of them far away. How many are flagged at `|z| > 1.5`, and what is the last value's z-score, rounded to one decimal?
@@starter
import numpy as np

x = np.array([10, 12, 11, 13, 50])
z = (x - x.mean()) / x.std()
print((np.abs(z) > 1.5).sum(), round(z[-1], 1))
@@choice
1 2.0
@@choice
4 2.0
@@choice
1 1.0
@@choice
0 2.5
@@explain
The mean is `19.2` and the (population) standard deviation about `15.4`, both pulled up by the 50. The four normal values sit about half a standard deviation **below** the mean, so none of them is flagged; only the 50 is, at `z ≈ 2.0`. Note the trap: a big outlier inflates the standard deviation, which makes *itself* look less extreme. With a median and IQR instead, the 50 would stand out far more.
@@hint
Compute the mean first: (10 + 12 + 11 + 13 + 50) / 5. Which side of it do the four small values sit on, and how far?
@@hint
The standard deviation is large because of the 50 itself. A z-score of exactly 2.0 for the 50 means it is two of those large units above the mean.
@@q
What does a z-score of −1 mean?
@@a
The value is one standard deviation below the mean.
@@q
Why can a huge outlier end up with a modest z-score?
@@a
It inflates the standard deviation used to compute every z-score, including its own. Robust alternatives use the median and IQR.
