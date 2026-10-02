---
id: py-generators
track: python
order: 2
title: Streaming Tokens, Lazily
tagline: Why a generator doesn't start until you ask it to.
kind: predict
xp: 25
minutes: 4
answer: 1
---
@@body
# Predict the output

When an LLM streams a response, your code receives tokens one at a time. In Python that's a **generator**: a function with `yield` that *pauses* and resumes. The subtle part is *when* the code inside actually runs.

Read the code and decide the exact order of the printed lines.
@@starter
def tokens():
    print("start")
    for t in ["Hel", "lo"]:
        yield t
        print("after", t)

gen = tokens()
print("created")
print(next(gen))
@@choice
start
created
Hel
@@choice
created
start
Hel
@@choice
created
Hel
@@choice
start
Hel
after Hel
@@explain
Calling `tokens()` runs **nothing**: it only creates the generator object. `"created"` prints first. The first `next(gen)` runs the body until the first `yield`: it prints `"start"`, then hands out `"Hel"`. The `"after Hel"` line runs only when you ask for the *next* token.
@@hint
Does calling `tokens()` execute its body, or just create an object?
@@hint
`next(gen)` runs the body up to (and including) the first `yield`, then freezes.
@@q
When does the code inside a generator function start running?
@@a
On the first `next()` (or first loop iteration), not when the generator is created.
@@q
Why are generators ideal for streaming LLM output?
@@a
They produce one token at a time on demand, with no need to hold the whole response in memory.
