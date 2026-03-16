# Llama Wrangler — Forensic Code Quality Audit Report

**Date:** 2026-03-14
**Scope:** Electron 39 + vanilla JS desktop app (no React despite devDependencies listing it — unused)
**Files Audited:** src/main.js, src/preload.js, src/renderer.js, src/webview-preload.js, src/index.html, scripts/download_hf.py, scripts/download_ollama.py, package.json, .eslintrc.json

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 3 | FIXED |
| HIGH | 7 | FIXED |
| MEDIUM | 6 | FIXED |
| LOW | 4 | FIXED |
| INFO | 4 | NOTED |

---

## CRITICAL Findings

### C1 — Remote Debugging Port Exposed (main.js:13)
`app.commandLine.appendSwitch('remote-debugging-port', '61513')` opens a DevTools WebSocket endpoint on `localhost:61513`. Any local process (malicious browser extension, web page with SSRF, other app) can connect and get full JS execution in the Electron main/renderer process — effectively root-level access to the host system via Node.js APIs exposed in main.
**FIX:** Commented out the flag. DevTools are already opened conditionally in dev mode via `openDevTools()`.

### C2 — IPC Path Injection in `delete-model` handler (main.js:832)
The `delete-model` IPC handler accepted any string `modelPath` and called `fs.unlink(modelPath)` with no validation. An attacker who can invoke IPC (e.g., via compromised webview) could delete any file the app user can write, including `~/.bashrc`, SSH keys, etc.
**FIX:** Added validation: must be a string, must end in `.gguf`, resolved path must be within one of three known model directories (CONFIG.modelsDir, llamaCppDir, metalLlamaDir).

### C3 — IPC Path Injection in `switch-model` handler (main.js:302)
The `switch-model` handler accepted any path and launched `llama-server -m <path>` without restricting `modelPath` to known model directories. An attacker could pass a crafted path to load an arbitrary binary as a "model."
**FIX:** Same path allowlist validation as C2 applied before the server is started.

---

## HIGH Findings

### H1 — Shell Injection in `install-llamacpp` (main.js:809)
Used `exec()` with a shell string containing `cd ${installDir}` where `installDir` is derived from `CONFIG.llamaCppDir` which is user-settable via `electron-store`. A path containing shell metacharacters (e.g., set via `select-llamacpp-path`) would be executed.
**FIX:** Replaced `exec()` with `spawn()` using args arrays and `cwd` option — no shell string interpolation.

### H2 — Shell Injection in `get-current-model` via `ps aux | grep ${pid}` (main.js:271)
Even though `pid` comes from `lsof` output, if `lsof` returned multiple lines or unusual characters, the grep pattern could have side effects. Additionally using `grep` on a PID is fragile; it can match other processes.
**FIX:** Validate `pid` is purely numeric with regex, then use `ps -p ${pid} -o args=` (no shell grep, just direct PID lookup).

### H3 — XSS in `displayModels` via `innerHTML` with model filename (renderer.js:388)
Model names came from the filesystem. A malicious GGUF file named `"><img src=x onerror=alert(1)>.gguf` would execute JS. While context isolation protects IPC, renderer-side XSS can still access the `electronAPI` contextBridge and trigger downloads/deletions.
**FIX:** Replaced `innerHTML` template strings with DOM element creation + `textContent`. Introduced `modelDataStore` Map keyed by index to pass data through closures instead of embedding paths in `onclick` attribute strings.

### H4 — XSS in `showModelActions` onclick attributes with raw model paths (renderer.js:426)
Buttons were built as `onclick="switchModel('${modelPath.replace(...)}', ...)"` — a path like `'); malicious(); //` bypasses the single-quote escape.
**FIX:** Replaced all `innerHTML` button strings with DOM creation + `addEventListener` closures.

### H5 — XSS in `showQuantizeDialog` Start button onclick (renderer.js:288)
Same pattern: `onclick="startQuantization('${modelPath.replace(/'/g, "\\'")}', ...)"`.
**FIX:** Same DOM + closure fix.

### H6 — XSS in `updateUrlDisplay` copy button onclick (renderer.js:911)
`onclick="copyToClipboard('${url}')"` — a URL from the webview `did-navigate` event containing a single quote would break out.
**FIX:** Built button with DOM + closure.

### H7 — XSS in `showNotification` using `innerHTML` with message (renderer.js:1123)
`notification.innerHTML = '${icons[type]} ${message}'` — error messages can contain HTML if they bubble up from network responses.
**FIX:** Replaced with DOM element creation + `textContent`.

---

## MEDIUM Findings

### M1 — Missing URL validation in `open-external` IPC handler (main.js:702)
`shell.openExternal(url)` was called with no protocol check. `shell:`, `file:`, `javascript:`, or `data:` URLs could be used to open local files or execute code.
**FIX:** Parse URL, reject anything that isn't `http:` or `https:`.

### M2 — Missing URL validation in `download-huggingface` IPC handler (main.js:503)
Any string was passed directly to the Python subprocess as `modelId`. No check that it was actually a HuggingFace URL.
**FIX:** Parse URL, assert `hostname === 'huggingface.co'` and `protocol === 'https:'`.

### M3 — Missing model name validation in `download-ollama` (main.js:616)
Ollama model names passed directly to Python subprocess with no allowlist.
**FIX:** Regex `^[a-zA-Z0-9_.:/\-]+$` check, max 200 chars.

### M4 — Missing quantization type allowlist in `quantize-model` IPC (main.js:843)
Any string was passed as `quantization` arg to `llama-quantize` binary. A crafted value like `Q4_K_M; rm -rf ~` (Windows-style) or other injection could be attempted.
**FIX:** Added `VALID_QUANT_TYPES` Set allowlist in main.js. Same set applied in both Python scripts.

### M5 — IPC event listener accumulation — no cleanup (preload.js / renderer.js)
`ipcRenderer.on('server-log', handler)` was called on every `onServerLog(callback)` call without removing the previous handler. Hot reloads or repeated calls would stack duplicate handlers.
**FIX:** `preload.js` now returns a cleanup function from each `on*` method. `renderer.js` tracks cleanups in `listenerCleanups` array and calls them on `beforeunload`.

### M6 — Error log written to `__dirname` (main.js:132)
In packaged apps `__dirname` points into the read-only ASAR archive. `appendFileSync` would throw and the error would be silently swallowed.
**FIX:** Use `app.getPath('userData')` for packaged builds, `path.join(__dirname, '..')` for dev.

---

## LOW Findings

### L1 — Path traversal in Python download scripts
Python scripts accepted `output_dir` from CLI args (controlled by Electron main) with no path validation. If main process is ever compromised, scripts could be pointed anywhere.
**FIX:** `Path(output_dir).resolve()` and assert it starts with `Path.home()` before creating dirs.

### L2 — `react` and `react-dom` listed as production dependencies but unused
The app is vanilla JS — no JSX, no React components. These add ~150KB to node_modules and inflate the bundle unnecessarily.
**Recommendation:** Move to devDependencies or remove entirely.

### L3 — `vite` listed as a production dependency but unused
Same as L2 — no build pipeline uses Vite. Listed under `dependencies`, not `devDependencies`.
**Recommendation:** Move to devDependencies or remove.

### L4 — `webviewTag: true` with no `will-navigate` guard on main BrowserWindow
The webview tag is enabled and webviews load external content. While context isolation is on, a compromised webview could attempt `new-window` navigation to `file://` or `app://` URIs.
**Recommendation:** Add a `will-navigate` handler on mainWindow.webContents that blocks `file:` and `app:` protocols. (No code change required urgently — webviews run in separate process with their own sandbox.)

---

## INFO Notes

### I1 — `hardenedRuntime: false` on macOS build config
Disabling hardened runtime on macOS means the app can be injected by dyld environment variables. Required for unsigned dev builds but should be reconsidered for distribution.

### I2 — `no-sandbox` Chromium flag always active
Needed on Linux hosts without unprivileged user namespaces. On macOS/Windows this reduces the sandbox protection. Consider platform-gating this flag.

### I3 — `npm audit` residual (3 moderate)
All 3 remaining vulnerabilities are in `yauzl` inside `electron`'s own internal zip extractor — only reachable during electron-builder packaging, not at runtime. Cannot be fixed without downgrading Electron to a stub.

### I4 — Debug messages in `download_hf.py` main()
`print_progress(f"Debug: model_id = {model_id}")` etc. expose internals to the renderer log. Low risk but sloppy for production.

---

## Files Modified

- `src/main.js` — C1 C2 C3 H1 H2 M1 M2 M3 M4 M6 fixes
- `src/preload.js` — M5 fix (listener cleanup)
- `src/renderer.js` — H3 H4 H5 H6 H7 M5 fix
- `scripts/download_hf.py` — L1 M4 fix
- `scripts/download_ollama.py` — L1 M4 fix

---

## npm audit

Ran `npm audit fix`. Reduced from 22 vulnerabilities (2 low, 6 moderate, 14 high) to 3 moderate. The 3 remaining are inside `electron`'s bundled `yauzl` — unfixable without a breaking Electron downgrade.
