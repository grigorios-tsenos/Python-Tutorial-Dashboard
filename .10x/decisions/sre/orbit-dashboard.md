# sre — orbit-dashboard
No servers. Failure modes handled in-product: CDN unreachable → "Python couldn't start" panel + Retry; infinite loop → stop at 20 s + automatic runtime restart; IndexedDB blocked → memory fallback + warning banner; corrupt/old stored data → `sanitize()` resets bad fields instead of crashing.
Runbook: "Python won't load" → check network/CDN reachability of cdn.jsdelivr.net; self-host Pyodide if needed.
