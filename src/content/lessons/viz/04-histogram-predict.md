---
id: vz-hist
track: viz
order: 4
title: What Does This Histogram Count?
tagline: Bins decide the story. Predict where eight values land in four of them.
kind: predict
xp: 30
minutes: 4
answer: 0
packages: matplotlib
---
@@body
# Predict the output

A histogram splits the range of the data into **bins** of equal width and counts how many values fall in each. `ax.hist` returns those counts, the bin edges, and the bars. The edges run from the smallest value to the largest, and the last bin **includes** its right edge.

Eight values, four bins. What are the counts, and how wide is a bin?
@@starter
import numpy as np
import matplotlib.pyplot as plt

x = np.array([1, 2, 2, 3, 3, 3, 4, 8])
fig, ax = plt.subplots()
counts, edges, _ = ax.hist(x, bins=4)
print(counts.astype(int).tolist(), edges[1] - edges[0])
@@choice
[3, 4, 0, 1] 1.75
@@choice
[1, 2, 3, 2] 1.75
@@choice
[3, 4, 0, 1] 2.0
@@choice
[2, 3, 2, 1] 1.75
@@explain
The range is 1 to 8, so four bins are each `7 / 4 = 1.75` wide: `[1, 2.75)`, `[2.75, 4.5)`, `[4.5, 6.25)`, `[6.25, 8]`. The values 1, 2, 2 land in the first bin (3), the values 3, 3, 3, 4 in the second (4), nothing in the third, and the 8 in the last. A single outlier stretched the range and left an empty bin: try `bins=7` or a log scale when that happens.
@@hint
Bin width = (max − min) / number of bins. Then walk through the sorted values and place each one.
@@hint
Values in `[1, 2.75)` are 1, 2 and 2. The 4 is below 4.5, so it joins the 3s.
@@q
How does matplotlib choose histogram bin edges by default?
@@a
Equal-width bins spanning from the minimum to the maximum of the data; the last bin includes its right edge.
@@q
Why can a histogram with an outlier look empty in the middle?
@@a
The outlier stretches the range, so the bins covering the bulk of the data become few and wide while the middle bins stay empty.
