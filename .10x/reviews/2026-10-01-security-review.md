# Security review — Orbit v0.1.0

Scope: client-only SPA, no backend, no accounts, no secrets, no analytics.

| area | finding | status |
|---|---|---|
| Untrusted code execution | Learner code runs in a Web Worker via Pyodide (WASM): no host filesystem or process access. Worker is terminated on 20 s timeout. | OK |
| Imported progress JSON | Parsed then passed through `sanitize()`: unknown lesson ids dropped, numbers clamped, strings length-capped, theme/booleans coerced; no prototype pollution (tested). 5 MB import cap. | OK |
| `dangerouslySetInnerHTML` | (a) lesson Markdown: first-party bundled content. (b) hints: HTML-escaped before inline-md conversion. (c) pandas `to_html`: pandas escapes cell values; a learner could emit their own HTML only into their own page (self-XSS). | Accepted |
| Third-party runtime | Pyodide + wheels loaded from cdn.jsdelivr.net at a pinned version, no SRI hash. A CDN compromise would run attacker JS in the app origin. Mitigation for deployers: self-host `pyodide/` and point `INDEX_URL` at it, or add a CSP. | Accepted risk, documented |
| Network calls from learner code | Pyodide can reach the network (e.g. `pyfetch`); lessons never need it. This is the learner's own code in their own browser. | Accepted |
| Storage | IndexedDB only, no PII. Failure falls back to memory with a visible banner. | OK |
| Dependencies | `npm audit`: 0 vulnerabilities at install time. | OK |
| Secrets | None in repo. Fake LLM requires no keys. | OK |

Recommendation before any public deployment: serve with a CSP (`script-src 'self' https://cdn.jsdelivr.net`, `worker-src 'self' blob:`) or self-host Pyodide.
