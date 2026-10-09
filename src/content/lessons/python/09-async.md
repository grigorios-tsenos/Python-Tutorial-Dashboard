---
id: py-async
track: python
order: 9
title: "Boss: Fan Out 100 LLM Calls"
tagline: Concurrency with a speed limit and a safety net.
kind: boss
xp: 100
minutes: 12
---
@@body
# Boss: the async batch runner

LLM calls spend nearly all their time waiting on the network. `asyncio` waits on many at once, but naive fan-out gets you rate-limited, so add a **speed limit** and **retries**.

```python
sem = asyncio.Semaphore(3)               # at most 3 at once
async with sem:                          # take a slot, give it back automatically
    ...
results = await asyncio.gather(*coros)   # run concurrently, keep input order
```

> **Mission:** write `fetch_all(prompts, call_llm, limit=3, retries=3)`:
> - run `call_llm(prompt)` for every prompt **concurrently**, never more than `limit` in flight
> - on `TimeoutError`, retry that call (up to `retries` attempts in total); if the last attempt also fails, let the error propagate
> - return results in the **same order** as `prompts`
> - return `[]` for no prompts; reject `limit < 1` or `retries < 1` with `ValueError`

The boss changes completion order and checks the exact retry count. Retry `TimeoutError` only; other exceptions must propagate immediately. Orbit supports top-level `await`, so test it right in the cell.
@@starter
import asyncio

async def fetch_all(prompts, call_llm, limit=3, retries=3):
    """Run call_llm(prompt) for each prompt, concurrently."""
    ...

async def fake_llm(prompt):
    await asyncio.sleep(0.01)
    return prompt.upper()

await fetch_all(["a", "b", "c"], fake_llm)
@@solution
import asyncio

async def fetch_all(prompts, call_llm, limit=3, retries=3):
    """Run call_llm(prompt) for each prompt, concurrently."""
    if limit < 1 or retries < 1:
        raise ValueError("limit and retries must be positive")
    sem = asyncio.Semaphore(limit)

    async def one(prompt):
        async with sem:
            for attempt in range(retries):
                try:
                    return await call_llm(prompt)
                except TimeoutError:
                    if attempt == retries - 1:
                        raise

    return await asyncio.gather(*(one(p) for p in prompts))

async def fake_llm(prompt):
    await asyncio.sleep(0.01)
    return prompt.upper()

await fetch_all(["a", "b", "c"], fake_llm)
@@check
import asyncio

inflight = 0
peak = 0
async def llm(p):
    global inflight, peak
    inflight += 1
    peak = max(peak, inflight)
    await asyncio.sleep(0.03 if p == "a" else 0.005)
    inflight -= 1
    return p.upper()

res = await fetch_all(["a", "b", "c", "d", "e"], llm, limit=2)

attempts = {}
async def flaky(p):
    attempts[p] = attempts.get(p, 0) + 1
    if attempts[p] < 3:
        raise TimeoutError("slow")
    return p + "!"
res2 = await fetch_all(["x", "y"], flaky, limit=2, retries=3)

dead_attempts = 0
async def dead(p):
    global dead_attempts
    dead_attempts += 1
    raise TimeoutError("down")
try:
    await fetch_all(["z"], dead, retries=2)
    raised = False
except TimeoutError:
    raised = True

test("results keep input order", lambda: list(res) == ["A", "B", "C", "D", "E"])
test("runs concurrently, up to the limit (peak in flight is 2)", lambda: peak == 2, "peak in-flight calls was " + str(peak))
test("retries timeouts until success", lambda: list(res2) == ["x!", "y!"])
test("each prompt gets exactly three attempts", lambda: attempts == {"x": 3, "y": 3})
test("gives up after `retries` attempts and re-raises", lambda: raised and dead_attempts == 2)
empty = await fetch_all([], llm)
test("empty batch returns an empty list", lambda: empty == [])
other_attempts = 0
async def invalid(p):
    global other_attempts
    other_attempts += 1
    raise RuntimeError("bad response")
try:
    await fetch_all(["z"], invalid)
    propagated = False
except RuntimeError:
    propagated = True
test("non-timeout failures propagate without retries", lambda: propagated and other_attempts == 1)
invalid_settings = []
for kwargs in ({"limit": 0}, {"retries": 0}):
    try:
        await fetch_all([], llm, **kwargs)
        invalid_settings.append(False)
    except ValueError:
        invalid_settings.append(True)
test("invalid limits and retry counts are rejected", lambda: all(invalid_settings))
@@hint
Validate `limit` and `retries` before creating `asyncio.Semaphore(limit)`. An inner `async def one(prompt)` does `async with sem:` around the call.
@@hint
Loop `for attempt in range(retries)` with try/except TimeoutError; re-raise on the last attempt. Finish with `return await asyncio.gather(*(one(p) for p in prompts))`: `gather` preserves order.
@@q
What does `asyncio.Semaphore(n)` do?
@@a
Caps how many tasks can hold it at once: a concurrency limiter.
@@q
Does `asyncio.gather` return results in completion order or input order?
@@a
Input order.
@@real
Real SDKs (anthropic, openai) expose async clients that work with exactly this pattern. Add exponential backoff (`await asyncio.sleep(2 ** attempt)`) for real rate limits.
