---
id: py-retry
track: python
order: 8
title: Retry Rate Limits with Exponential Backoff
tagline: A 429 means "not now", not "never". A 400 means stop.
kind: build
xp: 60
minutes: 8
---
@@body
# A decorator that knows when to try again

Rate limits (429), overload (529) and timeouts are **transient**: wait, then retry. Bad requests (400) and bad keys (401) are **permanent**. Back off exponentially (`base`, `2 × base`, `4 × base`, … up to a cap) and believe a `Retry-After` when the server sends one.

```python
@retry(attempts=4, base_delay=0.5)
def ask(question): ...
```

`retry(...)` returns `decorate`, `decorate(fn)` returns `wrapper`, and `wrapper` does the trying. `functools.wraps(fn)` keeps the name and docstring; injecting `sleep` lets tests check the waits without waiting.

> **Mission:** implement `retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep)`:
>
> - pass arguments through; return the result as soon as a call succeeds
> - on an exception in `retry_on`, `sleep(...)` and retry, up to `attempts` calls in total. After the `k`-th failure (from 0) wait `min(max_delay, base_delay * 2 ** k)`, **unless** the error has a non-`None` `retry_after`: then wait exactly that
> - after the last attempt fails, re-raise **that exception**; never sleep after the final failure
> - any other exception propagates at once, with no sleep
> - `attempts < 1` or `base_delay < 0` raises `ValueError` from `retry(...)`
> - keep `__name__` and `__doc__`; every call starts its backoff from the beginning
@@starter
import functools
import time

class RateLimitError(Exception):
    """HTTP 429. `retry_after` is the server's suggested wait in seconds, if it sent one."""
    def __init__(self, message="rate limited", retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after

def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):
    def decorate(fn):
        def wrapper(*args, **kwargs):
            # TODO: retry retryable errors with exponential backoff; re-raise after the last attempt
            return fn(*args, **kwargs)
        return wrapper
    return decorate

waits = []
replies = iter([RateLimitError(), TimeoutError("slow"), "Paris"])

@retry(sleep=waits.append)
def ask(question):
    """Ask the model a question."""
    reply = next(replies)
    if isinstance(reply, Exception):
        raise reply
    return reply

print(ask("Capital of France?"), waits)
@@solution
import functools
import time

class RateLimitError(Exception):
    """HTTP 429. `retry_after` is the server's suggested wait in seconds, if it sent one."""
    def __init__(self, message="rate limited", retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after

def retry(attempts=4, base_delay=0.5, max_delay=8.0, retry_on=(RateLimitError, TimeoutError), sleep=time.sleep):
    if attempts < 1 or base_delay < 0:
        raise ValueError("attempts must be >= 1 and base_delay >= 0")

    def decorate(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            for attempt in range(attempts):
                try:
                    return fn(*args, **kwargs)
                except retry_on as error:
                    if attempt == attempts - 1:
                        raise
                    suggested = getattr(error, "retry_after", None)
                    sleep(suggested if suggested is not None else min(max_delay, base_delay * 2 ** attempt))
        return wrapper
    return decorate

waits = []
replies = iter([RateLimitError(), TimeoutError("slow"), "Paris"])

@retry(sleep=waits.append)
def ask(question):
    """Ask the model a question."""
    reply = next(replies)
    if isinstance(reply, Exception):
        raise reply
    return reply

print(ask("Capital of France?"), waits)
@@check
def scripted(*outcomes):
    queue = list(outcomes)
    calls = []
    def call(*args, **kwargs):
        calls.append((args, kwargs))
        outcome = queue.pop(0)
        if isinstance(outcome, BaseException):
            raise outcome
        return outcome
    call.calls = calls
    return call

slept = []
fn = scripted(RateLimitError(), TimeoutError(), "ok")
wrapped = retry(sleep=slept.append)(fn)
test("succeeds after transient failures with doubling waits", lambda: wrapped("q", temperature=0) == "ok" and slept == [0.5, 1.0])
test("arguments are passed through on every attempt", lambda: fn.calls == [(("q",), {"temperature": 0})] * 3)
capped = []
many = retry(attempts=6, base_delay=1, max_delay=5, sleep=capped.append)(scripted(*[TimeoutError()] * 5, "done"))
test("waits double and then stay at max_delay", lambda: many() == "done" and capped == [1, 2, 4, 5, 5])
final_error = RateLimitError("still limited")
gave_up = []
dead = scripted(RateLimitError(), RateLimitError(), final_error)
try:
    retry(attempts=3, sleep=gave_up.append)(dead)()
    caught = None
except RateLimitError as e:
    caught = e
test("after the last attempt the same error is re-raised, with no final sleep", lambda: caught is final_error and len(dead.calls) == 3 and gave_up == [0.5, 1.0])
bad = scripted(ValueError("invalid request"), "never")
no_sleep = []
try:
    retry(sleep=no_sleep.append)(bad)()
    propagated = False
except ValueError:
    propagated = True
test("permanent errors propagate immediately", lambda: propagated and len(bad.calls) == 1 and no_sleep == [])
told = []
test("the server's retry_after wins over the computed backoff", lambda: retry(sleep=told.append)(scripted(RateLimitError(retry_after=3), RateLimitError(retry_after=None), "ok"))() == "ok" and told == [3, 1.0])
custom = []
conn = scripted(ConnectionError(), "up")
test("retry_on chooses which errors are transient", lambda: retry(retry_on=(ConnectionError,), sleep=custom.append)(conn)() == "up" and custom == [0.5])
only_timeout = scripted(RateLimitError(), "x")
try:
    retry(retry_on=(TimeoutError,), sleep=custom.append)(only_timeout)()
    leaked = False
except RateLimitError:
    leaked = True
test("errors outside retry_on are not retried", lambda: leaked and len(only_timeout.calls) == 1)
fresh = []
again = retry(sleep=fresh.append)(scripted(TimeoutError(), "a", TimeoutError(), "b"))
test("every call starts its backoff from the beginning", lambda: again() == "a" and again() == "b" and fresh == [0.5, 0.5])
once = scripted(TimeoutError())
try:
    retry(attempts=1, sleep=fresh.append)(once)()
    single = False
except TimeoutError:
    single = True
test("attempts=1 means no retries", lambda: single and len(once.calls) == 1)
test("the wrapped function keeps its name and docstring", lambda: ask.__name__ == "ask" and ask.__doc__ == "Ask the model a question.")
def rejects(**kwargs):
    try:
        retry(**kwargs)
    except ValueError:
        return True
    return False
test("invalid settings are rejected when the decorator is created", lambda: rejects(attempts=0) and rejects(base_delay=-1))
@@hint
Validate the settings at the top of `retry`, before defining `decorate`. Inside `wrapper`, loop `for attempt in range(attempts):` with `try: return fn(*args, **kwargs)` and `except retry_on as error:`. A bare `raise` on the last attempt re-raises the original exception.
@@hint
Compute the wait with `suggested = getattr(error, "retry_after", None)`, then `sleep(suggested if suggested is not None else min(max_delay, base_delay * 2 ** attempt))`. Decorate `wrapper` with `@functools.wraps(fn)`.
@@q
Which failures should a client retry automatically?
@@a
Transient ones such as rate limits, overload and timeouts. Invalid requests or bad credentials fail the same way every time.
@@q
What does `functools.wraps(fn)` do for a decorator's wrapper?
@@a
Copies the wrapped function's `__name__`, `__doc__` and other metadata, so logs and tracebacks show the real function.
@@real
The anthropic and openai SDKs already retry 429 and 5xx (`max_retries=2` by default), respecting `retry-after`. Add random **jitter** (`random.uniform(0, delay)`) so clients don't retry in lockstep; `tenacity` packages all of this.
