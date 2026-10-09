---
id: st-center
track: stats
order: 1
title: Averages That Lie
tagline: One slow request can make a fast service look slow. Pick the summary that tells the truth.
kind: run
xp: 25
minutes: 4
---
@@body
# Mean, median, and the outlier that moves one of them

Statistics starts with one question: *what single number describes this data?* The **mean** adds everything up and divides. The **median** is the middle value when sorted. They agree on well-behaved data and disagree the moment an outlier shows up, and that disagreement is information.

```python
np.mean(x)      # sum / count: every value pulls on it
np.median(x)    # the middle value: outliers cannot drag it
```

> **Mission:** eight API latencies, one of them a 900 ms disaster. Compute `mean`, `median` and `trimmed_mean` (the mean without latencies above 500 ms), then print all three.

@@step The mean: every value pulls on it
`np.mean` sums all eight numbers and divides by eight. The 900 adds about 100 ms to the result on its own:

```python
mean = np.mean(latency)
```

**Do:** replace `mean = 0`, then Run. You should see `225.0`.
@@stepcheck
import numpy as np
test("mean is the arithmetic average", lambda: np.isclose(mean, 225.0), "mean = np.mean(latency)")
@@step The median: the middle value
Sort the latencies and take the middle. With eight values the median is the average of the 4th and 5th:

```python
median = np.median(latency)
```

The 900 is just "the largest value" to the median; it would be the same if it were 90 000.

**Do:** replace `median = 0`, then Run. You should see `129.5`.
@@stepcheck
import numpy as np
test("median is the middle value", lambda: np.isclose(median, 129.5), "median = np.median(latency)")
@@step Trim the outlier and compare
A boolean mask keeps only the normal requests. The mean of those is close to the median, which tells you the median was the honest summary all along:

```python
trimmed_mean = np.mean(latency[latency < 500])
```

**Do:** compute `trimmed_mean`, print all three, then Run.
@@stepcheck
import numpy as np
test("trimmed_mean ignores the outlier", lambda: np.isclose(trimmed_mean, 900 / 7), "np.mean(latency[latency < 500])")
test("all three summaries are printed", lambda: "225.0" in __stdout__ and "129.5" in __stdout__ and "128.57" in __stdout__)
@@starter
import numpy as np

latency = np.array([120, 135, 128, 142, 131, 119, 125, 900])   # ms

# TODO 1: the mean
mean = 0
# TODO 2: the median
median = 0
# TODO 3: the mean of the latencies below 500 ms
trimmed_mean = 0

print("mean:", mean)
print("median:", median)
print("trimmed mean:", trimmed_mean)
@@solution
import numpy as np

latency = np.array([120, 135, 128, 142, 131, 119, 125, 900])   # ms

mean = np.mean(latency)
median = np.median(latency)
trimmed_mean = np.mean(latency[latency < 500])

print("mean:", mean)
print("median:", median)
print("trimmed mean:", trimmed_mean)
@@check
import numpy as np
test("mean is the arithmetic average", lambda: np.isclose(mean, 225.0))
test("median is the middle value", lambda: np.isclose(median, 129.5))
test("trimmed_mean ignores the outlier", lambda: np.isclose(trimmed_mean, 900 / 7))
test("all three summaries are printed", lambda: "225.0" in __stdout__ and "129.5" in __stdout__ and "128.57" in __stdout__)
test("the data is unchanged", lambda: latency.tolist() == [120, 135, 128, 142, 131, 119, 125, 900])
@@hint
`np.mean(latency)` and `np.median(latency)` are one call each. A mask like `latency < 500` selects the normal requests.
@@hint
`trimmed_mean = np.mean(latency[latency < 500])`.
@@q
Which summary moves when one value becomes a huge outlier: the mean, the median, or both?
@@a
Only the mean. The median depends on the order of values, not their size, so one extreme value cannot drag it.
@@q
When should you report the median instead of the mean?
@@a
For skewed data with outliers, such as latencies, incomes or response lengths, where a few extreme values would misrepresent the typical case.
@@real
Service dashboards report **p50** (the median) and **p95/p99** rather than the mean for exactly this reason. In pandas, `df["latency"].describe()` prints count, mean, std and the quartiles in one go.
