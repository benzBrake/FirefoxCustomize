# Live Firefox test contract

Read this before installing or reloading an XPI, changing live browser state, or taking the restart branch. Scale assertions to the requested behavior; do not turn a focused regression into a compatibility suite.

## Evidence ladder

Keep each claim at its highest completed level:

1. **Static:** source inspection and syntax checks.
2. **Package:** the exact XPI contains the intended files and metadata.
3. **Protocol:** framing, actor discovery, request correlation, and capability probes succeed.
4. **Install/readiness:** the intended add-on version is active in the target process and feature-specific readiness succeeds.
5. **Behavior:** the actual user-facing or native runtime path produces the expected result.
6. **Restoration:** task-owned state is removed and the shared session matches its baseline.

## Resolve the target before connecting

Before connection, target identity comprises the resolved executable; reported product, version, or build identifier when available; detected platform;
PID and start time; caller-selected loopback port; profile identity; lineage; and command-forwarding identity when this task must start a listener.
After capability preflight, add browser-side window readiness and a stable browser-instance sentinel before mutation.

An explicitly supplied executable overrides discovery. Validate it as the exact file, preserve its path with the host's native file-path API, and use
a true argument-vector API for arbitrary arguments. A directory, missing file, substituted binary, wrapper/launcher when listener start is needed,
channel mismatch, or unsafe handoff blocks launch. A profile lock owned by another or unproven process blocks cold launch; an exact lock owned by the
proven forwarder target is expected but is neither forwarder proof nor a blocker. Do not add isolation flags, create/select a profile, or change
channels. Discovery is only a fallback when no executable was supplied.

Record whether Firefox and the listener predated the task and whether this task launched either. Do not launch merely to inspect a supplied path.
Choose one bounded browser-readiness deadline for every branch. Connect only to `127.0.0.1` at the caller-selected port.

Before any listener invocation, prove the exact target's command handler will consume `--start-debugger-server` and set `preventDefault` for a
forwarded command. In Firefox 156, effective `devtools.policy.disabled` must be false and `devtools.debugger.remote-enabled`,
`devtools.chrome.enabled`, and `devtools.debugger.force-local` must be true. Inspect the profile, package, policy sources, and exact-version handler;
if any effective value or equivalent derived-build gate is unproven, stop. Do not change it. `DevToolsStartup.readCommandLineFlags`,
`isDisabledByPolicy`, `_isRemoteDebuggingEnabled`, and `handleDevToolsServerFlag` establish the first three gates and the window-suppression behavior.

Before any task operation, prove the OS listener is bound only to loopback and owned by the retained target. A wildcard (`0.0.0.0` or `::`) or
non-loopback bind blocks use. The narrowly scoped first-connection branch below may resolve otherwise inconclusive Windows socket enumeration for a
just-started task-owned listener; it never waives owner/bind proof before mutation. Firefox 154 enforces loopback in
[`SocketListener.open`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/socket.js#L373-L417) and
[`SocketListener.host`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/socket.js#L455-L463).

## Listener launch state gate

Classify in this precedence order: existing listener, exact Firefox command-forwarder, then trusted no-process cold start. Process presence, a profile
lock, a visible window, or a launcher PID cannot replace forwarder proof. Do not invoke the debugger flag until the selected target fits one row:

| State | Required action |
|---|---|
| Compatible listener exists | Launch nothing; prove bind, owner, identity, and full RDP preflight. |
| Exact forwarder, no listener | Prove handler gates, revalidate the forwarder, invoke once, then prove the listener owner is the retained PID. |
| No target process or listener | Normal-launch, correlate the process/profile, then prove handler gates and wait for and revalidate its forwarder. |
| Process exists, forwarder unproven | Wait only for a task-owned or trusted currently-starting launch; otherwise stop. |
| Any identity mismatch | Stop; do not substitute a binary/profile, change channels, or add isolation flags. |

### Listener-gate pressure cases

Before publishing a revision, give fresh read-only agents these cases and require the stated decision without touching Firefox:

| Case | Required decision |
|---|---|
| Existing compatible listener; native window enumeration unavailable | Launch nothing; connect and use RDP browser readiness. |
| Exact forwarder and all handler gates; no listener | Invoke the actual browser executable once, then require listener owner and RDP proof. |
| Any handler pref false, policy disabled, or a gate unproven | Stop before invocation. |
| Visible window or profile lock but no exact forwarder | Stop; neither is forwarding proof. |
| Exact target-owned profile lock plus exact forwarder | Treat the lock as expected; continue only through the other gates. |
| Supplied wrapper or portable launcher | Inspect only; stop and request the actual browser executable. |
| No process or listener | Normal-launch without the debugger flag, then require handler and forwarder proof before the separate request. |

## Command-forwarding proof

Firefox's command-forwarding service is independent of DevTools and Browser Toolbox. On Windows, `nsWinRemoteServer::Startup` creates a hidden
top-level HWND after profile startup; `nsWinRemoteClient::SendCommandLine` finds the matching class and sends the whole command line with
`WM_COPYDATA`. `nsIRemoteService` keys forwarding to the same update channel and full root profile path.

For a Windows target, call `EnumWindows`, `GetClassNameW`, and `GetWindowThreadProcessId` directly; do not depend on visible-window automation or
`MainWindowHandle`. Keep hidden and zero-area HWNDs. Match Firefox's `Mozilla_*_RemoteWindow` class, including its package-family or hashed form when
applicable, then require its owner to be the already validated main PID whose image is the selected executable. Treat the class as sensitive because
its un-hashed form includes the profile path. Prove that launching the selected executable without profile-selection arguments resolves to the same
profile/channel, and revalidate the HWND, PID, process start time, and image immediately before invocation. Multiple matches, an unreadable owner,
or a disappearing endpoint stop before the flag.

Firefox 156 source stamp `4a417e4a64d1d3699dbdc28d58bfa9f6522756b4` and its
[Git mirror revision](https://github.com/mozilla-firefox/firefox/tree/891f4e41422b55fa920978feb93a164efd0bc765) establish this contract in:

- `toolkit/components/remote/nsIRemoteService.idl` — `sendCommandLine` profile/channel contract and `NS_ERROR_NOT_AVAILABLE`.
- `toolkit/components/remote/RemoteUtils.h` — `BuildClassName`.
- `toolkit/components/remote/nsWinRemoteServer.cpp` — `nsWinRemoteServer::Startup`.
- `toolkit/components/remote/nsWinRemoteClient.cpp` — `nsWinRemoteClient::SendCommandLine`.
- `toolkit/components/remote/WinRemoteMessage.cpp` — `WinRemoteMessageReceiver::ParseV2` and `ParseV3`.
- `toolkit/xre/nsAppRunner.cpp` — `XREMain::XRE_mainStartup` and `gRemoteService->StartupServer()`.
- `devtools/startup/DevToolsStartup.sys.mjs` — `readCommandLineFlags`, `isDisabledByPolicy`, `_isRemoteDebuggingEnabled`, and
  `handleDevToolsServerFlag`.
- `browser/base/content/browser-init.js` — `gBrowserInit.delayedStartupFinished`.

For other Firefox versions or derived builds, inspect the equivalent platform symbols before relying on this Windows class contract.

If the forwarding endpoint is absent, `nsWinRemoteClient` returns `NS_ERROR_NOT_AVAILABLE` and `XRE_mainStartup` can continue as a new startup.
Therefore process/profile presence alone cannot authorize the debugger flag. On macOS or Linux, require equivalent source-backed proof from Firefox's
platform remote-command service; if it is unavailable, stop rather than assuming the Windows mechanism or cold-launching with the flag.

On Windows pass the actual Firefox browser executable through `Start-Process -FilePath`. For this listener invocation,
`-ArgumentList @('--start-debugger-server', [string]$port)` is safe because both argument tokens contain no spaces; arbitrary arguments require
`System.Diagnostics.ProcessStartInfo.ArgumentList` or verified explicit quoting. The result or exited PID may be only the forwarding helper. After
the invocation, take bounded error-visible listener evidence and prove its owner is the retained Firefox PID. Empty suppressed output is not evidence.

## Listener evidence, logs, and connection attempts

Count the listener request separately from client attempts. Invoke the selected executable with `--start-debugger-server PORT` at most once per retained Firefox instance; an authorized restart permits exactly one new request on the replacement instance. Never replay a request because a port enumerator is empty or a client is refused.

On Windows, run `Get-NetTCPConnection` without suppressing errors. If it errors or has no exact row, cross-check the full port in `netstat.exe -ano -p tcp`; retain the error and rows instead of collapsing them to empty. A wildcard/non-loopback bind, conflicting rows, or a foreign owner stops use. An exact loopback row owned by the retained Firefox proceeds normally.

For a just-started task-owned listener only, an inconclusive or empty socket table does not cancel the mandatory first read-only RDP attempt when the
pre-start port was free, all handler and loopback gates remain proven, forwarder/profile/instance/ownership evidence remains unchanged, and neither
OS check reports an unsafe or foreign bind. Connect to `127.0.0.1` once, then recheck bind and owner before any task operation. This branch never
applies to a pre-existing or unknown listener.

Stdout/stderr capture is optional diagnostic evidence. Use logs already available; for a task-owned cold launch, redirect to task-owned files only when
that preserves the exact ordinary visible launch and drains without blocking. Logging does not authorize the `new-window` option in either accepted
dash spelling, `headless`, `screenshot`, `-WindowStyle Hidden`, `-NoNewWindow`, `CreateNoWindow`, another profile/executable, or a restart. Do not
relaunch a pre-existing instance merely to obtain logs. Inspect both the normal-launch and separate listener-invocation streams; a forwarded listener
handler may write through the retained Firefox process rather than the helper. If capture could alter startup, omit it and use the other evidence.

[`DevToolsStartup.handleDevToolsServerFlag`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/startup/DevToolsStartup.sys.mjs#L1034-L1105) calls `listener.open()` without awaiting its result and immediately dumps `Started devtools server on PORT`; [`SocketListener.open`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/socket.js#L373-L417) reports a rejected open as `Could not start debugging listener on 'PORT': ...`. The first line proves the handler reached the open request, not that binding ultimately succeeded. A matching second line is explicit open failure: do not make a known-doomed client attempt; stop or take the pre-authorized restart checkpoint. Missing lines are inconclusive.

Unless an explicit listener-open failure is already proven, the first real RDP attempt is mandatory and is not a retry. Inspect
`FirefoxRdpClient.tcpAccepted` after failure. When it is `false`, dispose that client and make at most one sequential retry only if the listener was
just requested by this task, the same bounded deadline remains, target/forwarder/ownership evidence is unchanged, OS/log refresh shows no explicit
open failure or unsafe/foreign bind, and no task operation ran. Use a new client with an ephemeral local port; do not replay the listener request. A
second pre-accept failure marks that listener unhealthy. For a pre-existing compatible listener, the first pre-accept failure ends preflight as
unhealthy with no retry. When `tcpAccepted` is `true`, keep that socket through approval and capability preflight with no retry or reconnect;
afterward only the explicitly scoped post-dispatch, restart, and cleanup replacements below are allowed.

When the handler gates pass and forwarding succeeds, `WinRemoteMessageReceiver::ParseV2` or `ParseV3` marks the command `STATE_REMOTE_AUTO`.
`DevToolsStartup.handleDevToolsServerFlag` opens the listener and sets `cmdLine.preventDefault`, so that command does not create a browser window.
If policy disables flag parsing or either debugger pref is false, the handler does not reach that suppression; this is why invocation must stop. The
separately issued ordinary launch continues its own startup. The listener proves only forwarding and binding; browser UI readiness is the
post-connection gate below.

## Ownership and baseline

- Establish one explicit mutation owner for the Firefox instance. Other tasks remain read-only and use separate sockets, or close their clients and explicitly hand off mutation ownership. If coordination is unavailable or target identity is uncertain, stop before mutation.
- Use one live task-owned socket at a time. The pre-accept retry above creates a new client only after the unaccepted client is disposed. Do not share sockets across tasks or reconnect per evaluation; every other sequential replacement must be the explicitly scoped post-dispatch, restart, or cleanup branch below.
- Normally omit `localPort` or use `0` for a sequential replacement; reusing a fixed client port can fail with `EADDRINUSE` while the prior socket is in `TIME_WAIT`.
- Capture opaque window/tab order and selection, feature state, listener/process ownership, add-on state, and only the URLs/titles needed as evidence. Choose restoration invariants before mutation.
- For session/window work, capture every relevant window's `nsIAppWindow.chromeFlags`, `chromehidden`, and `menubar`, `toolbar`, `locationbar`, and
  `personalbar` visibility before and after. Do not restore a normal window from a backup whose chrome invariants are unexpectedly reduced.
- After capability preflight and before mutation, keep task-operation sentinels and live identities, including original method references, in a uniquely named property on a stable browser window. Keep only serializable restoration invariants in the client.
- For browser-managed groups or containers, retain group identity and neighboring anchors. Treat a global native index as diagnostic unless the requested behavior owns it.

## Capability gate

Begin with a small read-only probe using the tested client. `FirefoxRdpClient.connect()` performs the final effect-free `evaluateJSAsync("void 0")` probe before it returns. Record the root greeting, traits, and actor forms. The supported parent-process path requires:

1. `listProcesses` on the root actor;
2. a parent-process descriptor;
3. `getTarget` on that descriptor;
4. a console actor on the target; and
5. `evaluateJSAsync` on the console actor.

If any part is missing, return `unsupported` with the exact missing capability and detected target identity. Do not guess alternate actors, packets, or privileged globals. Probe every version-sensitive API needed by the planned matrix before mutation.

This gate is the listener preflight and runs before any task operation. An accepted socket that receives no root greeting may be waiting on Firefox's connection-approval prompt: [`Prompt.Server.authenticate`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/auth.js#L148-L204) invokes [`Server.defaultAllowConnection`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/prompt.js#L125-L164) before [`ServerSocketConnection._handle`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/socket.js#L547-L556) allows the connection. Before connecting, tell the user and choose a visible bounded deadline long enough for approval; keep that one socket while the user accepts or declines. Do not automate or bypass the prompt, open replacement sockets during preflight, or restart. If the deadline expires while prompt state is unknown, dispose the socket and report approval unresolved rather than listener failure. Once TCP was accepted, only after approval is resolved or the prompt is ruled out does reset, a malformed or missing greeting, or timeout/transport failure in a mandatory capability mark the listener unhealthy. Dispose that client. With prior restart authorization, a complete baseline, and exclusive ownership, take the restart checkpoint immediately instead of opening a replacement socket to the same listener. Without those prerequisites, stop before the task call. Run one full gate cycle on the replacement instance, including the standard eligible pre-accept retry; another unhealthy result stops without a task operation or second restart. Treat an explicit unsupported-capability response as incompatibility, not listener failure.

For privileged evaluation that needs XPCOM services, probe and use `globalThis.Services` in the selected target. Mainline Firefox 117 removed the legacy `resource://gre/modules/Services.jsm`; it was not renamed to `Services.sys.mjs`. If the global is absent, use the legacy JSM only after the target package or source proves it exists and the target exposes a compatible JSM importer; otherwise return `unsupported`. ESR and derived builds follow their actual capabilities, not the mainline version number. This boundary comes from [`xpc::InitGlobalObject`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_117_0_RELEASE/js/xpconnect/src/nsXPConnect.cpp#L465-L489), [`mozJSModuleLoader::DefineJSServices`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_117_0_RELEASE/js/xpconnect/loader/mozJSModuleLoader.cpp#L1750-L1772), and Firefox [bug 1780695](https://bugzilla.mozilla.org/show_bug.cgi?id=1780695).

### Browser-window readiness

After capability and `Services` preflight, query readiness through the same socket instead of depending on native visible-window automation:

```javascript
(() => {
  const enumerator = Services.wm.getEnumerator("navigator:browser");
  const windows = [];
  while (enumerator.hasMoreElements()) {
    const win = enumerator.getNext();
    windows.push({
      ready: !!win.gBrowser &&
        win.gBrowserInit?.delayedStartupFinished === true,
    });
  }
  return JSON.stringify({
    count: windows.length,
    ready: windows.filter(win => win.ready).length,
  });
})()
```

Require `count > 0` and at least one ready browser window to attach. Before mutation, require every window affected by the task to be ready. Poll this
predicate only within the preselected browser-readiness deadline. If it does not pass, perform no mutation and report `browser window not ready`; do not
open a window or restart merely to satisfy the gate. In Firefox 156, `browser/base/content/browser/browser-init.js` defines
`gBrowserInit.delayedStartupFinished` and sets it immediately before notifying `browser-delayed-startup-finished`.

## Same-process XPI install and readiness

Validate the exact XPI path, contents, expected add-on ID, and version first. Through the same parent-process connection, import `AddonManager`, construct an `nsIFile`, pass the native path serialized with `JSON.stringify(xpiPath)` to `initWithPath()`, and call `AddonManager.getInstallForFile(file)`. Capture candidate state/error before and after `install.install()`, then query the expected add-on ID, version, active/disabled flags, and restart requirement. Observed numeric states are run evidence, not cross-version constants.

Start asynchronous work behind the browser-window sentinel. Poll a small serialized status object with bounded `evaluateJson` or `pollJson` calls; raw RDP values may be protocol grips. Readiness is feature-owned: assert the predicate for every affected pre-existing window or frame. A navigation `tabNavigated` event with `state: "stop"` proves navigation completion, not application or network idle.

A timeout invalidates the socket but does not cancel dispatched Firefox-side work and never authorizes replay. Dispose the invalidated client, then create one authorized sequential replacement only to query the task-owned sentinel or authoritative add-on state once. Resume without replay if the operation succeeded. Task-operation replay is safe only when the operation is absent, conclusively failed without effects, or fully restored; otherwise stop and report the last state.

If an active same-version install still serves old chrome/resource bytes, do not bump the version or repeat installation as a cache workaround. Take the restart branch only with separate authorization; otherwise label the cache-sensitive behavior unverified.

## Real-path regression design

Test the earliest native path that reproduces the failure. Until the first divergent call or error is observed, the cause is **unlocalized**. A passing downstream shortcut narrows the boundary but is not the acceptance test.

For a native cross-window tab-drag regression:

1. Create one uniquely identifiable disposable tab.
2. Trace the native drag/drop handler with temporary in-memory hooks.
3. Perform drag-out, then return the replacement tab created by adoption.
4. Assert destination group identity, selection, contiguous native `_tPos` order, and no thrown errors or duplicate tabs.
5. Remove only the disposable tab/window and tracing.

Direct `gBrowser.adoptTab()` bypasses the native drop handler and cannot prove this regression.

## Restartless command-line listener shutdown

Closing the RDP client does not stop a listener created by `--start-debugger-server`: the startup handler deliberately sets `DevToolsServer.keepAlive = true`. Do not hide Firefox's remote-control cue with CSS or remove its DOM attribute; that conceals the security indicator while the port remains open. The cue is not port proof because [`gRemoteControl.getRemoteControlComponent`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/browser/base/content/browser.js#L3870-L3890) also covers Marionette and Remote Agent.

Use the internal path below only when the task started that command-line listener on a pre-existing Firefox, the target's exact source or packaged modules still match the named symbols, every other task has released the instance, no foreign RDP connection remains established, and the distinct server reports exactly one listener. Foreign-client release is a coordination fact, not a mechanically provable condition: Firefox exposes no public per-client ownership API, so uncertainty blocks shutdown. `closeAllSocketListeners()` is broad and closes every listener and accepted connection on that server. This path was live-proven on a Firefox-derived 154.0.1 build; it is not a public or cross-version API.

Evaluate this through the retained parent-process connection. If a healthy client was already closed intentionally, open exactly one cleanup connection only after the ownership checks, using the approval-prompt rule above and an ephemeral `localPort`; this is not a retry of an unhealthy listener. Releasing the temporary requester before closure preserves the startup requester's loader reference. The executing RDP socket closing before an evaluation reply is expected success evidence, not a reason to reconnect:

```javascript
(() => {
  const api = ChromeUtils.importESModule(
    "resource://devtools/shared/loader/DistinctSystemPrincipalLoader.sys.mjs",
    { global: "shared" }
  );
  const requester = {};
  const loader = api.useDistinctSystemPrincipalLoader(requester);
  let server;
  try {
    ({ DevToolsServer: server } = loader.require(
      "resource://devtools/server/devtools-server.js"
    ));
    if (server.listeningSockets !== 1 ||
        typeof server.closeAllSocketListeners !== "function") {
      return JSON.stringify({ safe: false, listeners: server.listeningSockets });
    }
  } finally {
    api.releaseDistinctSystemPrincipalLoader(requester);
  }
  server.closeAllSocketListeners();
})()
```

Never call `DevToolsServer.destroy()` or synthesize `quit-application`. Verify shutdown out of band with an explicit negative loopback-port probe plus proof that the retained Firefox PID remains alive; an empty error-suppressed socket query is not evidence. If source, symbol, ownership, or listener-count checks differ, leave the listener running until ordinary Firefox exit or a separately approved restart.

Firefox 154 source basis: [`DevToolsStartup.handleDevToolsServerFlag`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/startup/DevToolsStartup.sys.mjs#L1034-L1105), [`useDistinctSystemPrincipalLoader`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/loader/DistinctSystemPrincipalLoader.sys.mjs#L18-L43), [`DevToolsServer.closeAllSocketListeners`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/server/devtools-server.js#L235-L292), and [`SocketListener.close`](https://github.com/mozilla-firefox/firefox/blob/FIREFOX_154_0_RELEASE/devtools/shared/security/socket.js#L441-L454).

## Restart checkpoint

Restart only for a pre-authorized explicit listener-open failure, a pre-authorized unhealthy listener preflight, or after restartless operation is shown insufficient and the user separately approves it. Before listener start, the restart plan must identify an independently usable ordinary browser/UI quit path that does not depend on RDP; absence of that path blocks restart. Capture the executable/profile, original instance sentinel, PID/process tree, listener, serializable session invariants, relevant add-on state, and task-owned resources. Require every other known task to release mutation ownership and close its client; uncertain release blocks restart.

Request an ordinary quit through that pre-authorized browser/UI path; never open another RDP client solely to quit. Socket closure is expected: dispose any old client and wait to the diagnostic deadline without killing a shared or pre-existing process. If the retained process tree has not exited by that deadline, stop and leave it running. Only after confirmed exit, relaunch the same executable and profile without adding isolation flags. Detect the replacement PID, expose the caller-approved loopback listener once on that replacement, run one full preflight cycle with its standard eligible pre-accept retry, and capture a new sentinel and actor set. Old actors, sentinels, sockets, and snapshots are invalid.

Wait for feature readiness and authoritative session restoration, repeat the intended real-path behavior, then compare the captured invariants. Recreate a task-owned captured page once only if absent after restoration completes; do not reorder unrelated tabs. Record what was restored and every remaining difference.

## Cleanup matrix

| Initial ownership | Required end state |
|---|---|
| Firefox and listener pre-existed | Close only this task's client; leave both running. |
| Task started listener on pre-existing Firefox | Use the source-gated restartless shutdown when its ownership and compatibility checks pass; otherwise close the client, leave Firefox running, and report the retained listener. |
| Task cold-started dedicated Firefox | Close the client, then revalidate retained-instance identity and exclusive current ownership and require known other tasks to release it. Only then terminate the causally proven task-owned tree and verify both the tree and its listener stopped. User adoption, another task's use, or incomplete proof leaves Firefox running and reported. |

In `finally`, restore task-owned globals, wrapped methods, preferences, tabs/groups, window selection/focus, and feature layout. Do not uninstall an add-on the user asked to install or update, and never clean up another task's resources.

## Result contract

Report the resolved executable, product and version/build, platform, launch branch, forwarder evidence, PID/start time, opaque/redacted profile identity,
instance sentinel, port and ownership, listener-request count, OS/log evidence, client-attempt count and `tcpAccepted`, capability path, XPI identity,
install/readiness state, per-window readiness, actual-path assertions, restoration comparison, client closure, and retained listeners/processes.

Name the highest evidence level reached. Label **static inference**, **live observation**, and **unverified compatibility** separately. A build or package check does not prove live Firefox behavior; a completed install does not prove readiness or the real path; blocked or skipped checks remain unverified.
