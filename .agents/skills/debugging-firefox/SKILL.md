---
compatibility: Requires Node.js 22+ and desktop Firefox exposing classic DevTools RDP browser-chrome actors. Executable path and loopback port are caller-selectable.
description: Use when inspecting Firefox browser chrome or add-on runtime behavior, working with classic DevTools RDP or --start-debugger-server, installing or reloading an XPI without restart, or proving a live Firefox regression in an existing profile.
license: MIT
metadata:
    github-path: skills/debugging-firefox
    github-ref: refs/tags/v0.1.10
    github-repo: https://github.com/117649/debugging-firefox
    github-tree-sha: 6bfa4accb6aed5990e018ddae3a0e2290fa95e42
name: debugging-firefox
---
# Debugging Firefox

## Core principle

Treat the live Firefox session as user data. Use one task-owned loopback RDP socket and restore every safely reversible task-owned change; follow the cleanup matrix and report retained state when safe restoration is unavailable.

## Target and ownership

A supplied executable overrides discovery. Resolve that file, preserve spaces and non-ASCII executable paths with native file-path APIs and arbitrary argument boundaries with a true argument-vector API, identify its version when safe, and never substitute it. Otherwise discover without hardcoded locations across desktop Release, ESR, Beta, Developer Edition, Nightly, custom, portable/extracted, and side-by-side installations.

On macOS require the binary inside the application bundle; elsewhere require the actual Firefox browser executable before starting a listener. A
wrapper or portable launcher may be inspected but cannot authorize listener start; stop and request the browser executable instead of substituting
one. A path does not authorize launch; launch only when a debugger listener is needed and ownership permits.

Before any listener invocation, prove the exact target's command handler will consume the flag and suppress default window creation. Firefox 156
requires effective `devtools.debugger.remote-enabled` and `devtools.chrome.enabled` true and `devtools.policy.disabled` false. Also prove
`devtools.debugger.force-local` true. Do not change a preference or policy; for other versions or derived builds, inspect the equivalent handler gates.

Before invoking `--start-debugger-server`, classify in this precedence: compatible listener, then Firefox's command-forwarding endpoint for the exact
selected instance. On Windows this is the hidden profile-specific remote-command HWND, not a DevTools listener or visible browser window. Require the
same update channel and full root profile, correlate the HWND owner to the validated main PID and executable, and revalidate immediately before the
invocation. If the endpoint is proven, invoke the exact executable once and then prove the retained listener owner. An absent, ambiguous, or
uncorrelatable endpoint on a pre-existing process stops before the flag; process presence and a profile lock alone are insufficient.

With trusted zero-process and zero-listener evidence, launch Firefox normally without the debugger flag, correlate the task-owned retained process and
profile, wait boundedly for its command-forwarding endpoint, then invoke the flag separately. Never use a combined cold debugger-server launch. If the
endpoint or process disappears before invocation, cancel the invocation. Normal launch and diagnostic logging do not authorize the `new-window`
option in either accepted dash spelling, `headless`, `screenshot`, hidden/no-new-window settings, or any argument that changes visible startup.

Visible-window enumeration is optional supporting evidence, not the listener gate when exact command-forwarding proof is available. After RDP
capability preflight, require at least one `navigator:browser` window with `gBrowser` and `gBrowserInit.delayedStartupFinished === true`; require every
window affected by the task to be ready. A failed native-window tool, `MainWindowHandle`, or screenshot does not override this browser-side result.
If no ready browser window appears within the bounded wait, perform no mutation and do not create a window or restart merely to satisfy the test.

Clean a causally proven task-owned cold-launch tree only after revalidating its identity, exclusive current ownership, and release by other tasks;
otherwise leave and report it. Verify a cleaned tree's selected port is closed and leave pre-existing processes untouched. Restarting the agent host
is an outside-task fallback after active work is safe; it is never a Firefox restart.

Afterward verify the selected port binds only to `127.0.0.1`; wildcard or non-loopback binding blocks use. Before an ordinary cold launch, detect
handoff and any profile lock owned by another or unproven process. An exact lock owned by the proven forwarder target is expected but is neither
forwarder proof nor a blocker. Stop rather than adding `--no-remote`, creating/selecting a profile, or changing channels.

Allow one mutation owner per instance and one live task-owned socket at a time. Other tasks may use read-only sockets; mutation requires handoff. At contention, report the exact retained executable, open no competing mutation socket, and state restart requires ownership release plus separate approval.

## Workflow

1. Capture the baseline: target identity, browser state, ownership, and privacy-minimized restoration invariants.
2. Read [references/live-testing.md](references/live-testing.md) before listener start/connection, mutation, behavior proof, or restart. Install/reload claims require install/readiness and restoration; behavior claims require an exercised user-facing/native path. Otherwise mark behavior unverified and continue only separately requested install/reload work.
3. Request the listener at most once per retained Firefox instance; an authorized restart permits one request on its replacement. Unless Firefox logging already proves an explicit listener-open failure, follow the reference's OS/log evidence recipe and make the mandatory first real connection with [scripts/firefox-rdp.mjs](scripts/firefox-rdp.mjs), whose `connect()` ends with an effect-free `evaluateJSAsync` probe. If `tcpAccepted` remains false and every just-started task-owned readiness predicate passes, dispose that client and make at most one sequential connection retry. Once `tcpAccepted` is true, keep that socket through initial approval and capability preflight; do not reconnect during that preflight. Afterward, only the reference's explicitly scoped post-dispatch, restart, and cleanup replacements are allowed.
4. After dispatch, a timeout invalidates the socket; one authorized sequential replacement may only query task-owned authoritative state once before deciding whether task-operation replay is safe.
5. In `finally`, restore only task-owned changes; compare captured restoration invariants with the baseline; close the client; report retained Firefox listeners/processes.

An explicit listener-open failure, or an unhealthy preflight after the permitted pre-accept attempt(s), permits one pre-authorized restart with baseline, released ownership, and an independently available ordinary browser/UI quit path that does not depend on the failed RDP listener. Discard protocol state; rediscover and run one full replacement preflight cycle, including the standard eligible pre-accept retry. A second unhealthy result or explicit unsupported response stops.

## Quick reference

| Need | Gate |
|---|---|
| Target | Exact file, or fallback discovery |
| Launch | Existing listener, or proven handler gates plus an exact forwarder; cold start is normal launch followed by both proofs |
| Listener | One request per retained instance; first connection mandatory unless explicit open failure is proven; at most one eligible pre-accept retry |
| Mutation | Explicit owner or handoff |
| Readiness | Bounded predicate; authoritative check after timeout |
| Proof | Actual path plus restoration |

## Common mistakes

Never treat process presence, a profile lock, launcher PID/exit, `MainWindowHandle`, a listening port, or a visible-window-tool result as
command-forwarding proof. Also never do any of the following: require native visible-window proof before a verified forwarder; substitute port polling
for the first real RDP attempt; change visible launch merely to capture logs; invent `Services.sys.mjs`; replay timed-out mutations; restart without
approval; or use `gBrowser.adoptTab()` as drag proof.

## Boundary

Ordinary webpages use normal browser automation. Never terminate pre-existing Firefox or remove a requested add-on.

Run offline tests before live use:

```text
node scripts/firefox-rdp.test.mjs
```
