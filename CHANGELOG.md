# Changelog

All notable changes to Llama Wrangler are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [1.2.2] — 2026-03-14 17:43

### Changed — Neo-Noir Glass Monitor Restyle
- Applied full Neo-Noir Glass Monitor design system to all UI
- Added frameless floating window with transparent background and 16px body padding float gap
- Added canonical title bar: app icon, name (teal), tagline, flat About/Settings icons, circular window controls (28px)
- Added About modal: app icon (64px), version (teal), description, MIT license, GitHub badge, email
- Added status bar footer: status dot + status text + pipe + model count (left), version only in teal (right)
- Applied glass card system: gradient-card bg, glass-border (rgba white shimmer), ::before inner highlight, hover translateY(-2px) + layered shadow escalation
- Applied ambient radial-gradient mesh on welcome hero card with dot-pattern overlay
- Applied complete design token system (:root) with updated layered shadow tokens
- Removed sidebar logo section — nav items now start directly at top (margin-top: 4px)
- Styled model list items as mini glass-cards (glass-border + glass-bg + ::before highlight)
- Added invisible-at-rest scrollbars (reveal on parent hover)
- Added window IPC handlers (window-minimize, window-maximize, window-close) to main.js
- Added window controls to preload.js contextBridge
- Removed experimentalFeatures: true from webPreferences (broke IPC on Linux)
- Added Linux platform flags: enable-transparent-visuals, disable-gpu-compositing
- Added resizable: true, sandbox: false, corrected titleBarStyle to mac-only conditional
- Copied icon-titlebar.png to src/ for packaged build compatibility

---

## [1.2.1] — 2026-03-14

### Security
- Removed always-active remote-debugging-port Chromium flag (exposed DevTools to all local processes)
- Added path allowlist validation to `delete-model`, `switch-model`, and `quantize-model` IPC handlers (prevented arbitrary file deletion/execution)
- Replaced `exec()` shell string in `install-llamacpp` with `spawn()` args array (eliminated shell injection via user-controlled install path)
- Added URL protocol/hostname validation to `open-external` and `download-huggingface` IPC handlers
- Added regex allowlist for Ollama model names in `download-ollama` handler
- Added `VALID_QUANT_TYPES` allowlist for quantization parameter in IPC handler and both Python scripts
- Added `ps -p <pid>` replacement for `ps aux | grep <pid>` in `get-current-model` (more reliable, no grep on user data)
- Added path traversal protection in both Python download scripts (resolve and assert under home dir)

### Fixed
- Fixed XSS: replaced all `innerHTML` template strings containing model paths/names/URLs with DOM element creation + `textContent`
- Fixed XSS: model list sidebar items now use data-index + `modelDataStore` Map instead of embedding raw paths in `onclick` attributes
- Fixed XSS: showModelActions, showQuantizeDialog, updateUrlDisplay, showNotification all use DOM + addEventListener closures
- Fixed IPC listener accumulation: preload.js `on*` methods now return cleanup functions; renderer.js tracks and calls them on `beforeunload`
- Fixed error log path for packaged builds (was writing to read-only ASAR __dirname, now uses userData path)
- Fixed null-check before `.value` access on radio button in `startQuantization`

### Dependencies
- Ran `npm audit fix` — reduced vulnerabilities from 22 (2 low, 6 moderate, 14 high) to 3 moderate (unfixable without breaking Electron downgrade)

---

## [1.2.0] — 2026-02-07

### Added
- Neo-Noir Glass Monitor theme: transparent frameless window with glassmorphism dashboard
- 4-column dashboard grid with Welcome card, llama.cpp status, model count, and storage gauges
- 220px sidebar with scrollable model list (glass card items showing dot, name, size)
- Model action dialog on sidebar click: Load / Quantize / Delete
- Download bar with unified URL/model-name input and "Download & Convert" button
- Embedded HuggingFace GGUF and Ollama Library browser tabs with URL auto-capture
- Quantization dialog with all Q-levels (Q2_K through Q8_0) and size estimates
- Glass card notifications for success, error, info, warning with gradient backgrounds
- 95+ CSS custom properties design token system (colors, shadows, radii, spacing, blur)
- Transparent floating window with 16px body padding for desktop gap effect
- Close button (top-right) that turns red on hover
- `icon-cropped.png` (48px) sidebar logo

### Changed
- BrowserWindow: `transparent: true`, `frame: false`, `backgroundColor: '#00000000'`, `experimentalFeatures: true`
- Window size: 1300x1250
- Model list now uses glass card items with teal dot indicator for active model
- All dialogs use var() design tokens and backdrop blur
- `src/index.html` — complete layout and CSS rewrite
- `src/main.js` — frameless transparent window config
- `src/renderer.js` — glass model cards, action dialogs, updateStats(), storage calculation

### Fixed
- `package.json`: copyright holder, publish owner, appx publisherDisplayName corrected to J. Michaels
- `package.json`: version synced to 1.2.0, author name corrected, repository URL updated to sanchez314c
- LICENSE: copyright holder updated to J. Michaels

---

## [1.1.0] — 2025-10-29

### Added
- Comprehensive docs suite: `docs/DEVELOPMENT.md`, `docs/SECURITY_ASSESSMENT.md`, `docs/DOCUMENTATION_INDEX.md`
- `CLAUDE.md` AI assistant context file
- GitHub Actions CI workflow and quality-check workflow
- Automated security audit (`npm run security-check`) and dependency analysis
- Enhanced `.gitignore` with patterns for all common file types

### Changed
- Electron upgraded 27.0.0 → 39.0.0
- electron-builder upgraded to 26.0.12
- electron-context-menu upgraded to 4.1.1
- electron-store upgraded to 11.0.2

---

## [1.0.0] — 2025-07-27

### Added
- Initial Electron desktop application
- Model management: list, switch, and delete local GGUF models
- HuggingFace model download via `scripts/download_hf.py`
  - Smart GGUF detection: downloads pre-quantized files first
  - Base model fallback: downloads and converts via llama.cpp
  - Architecture detection (Llama, Mistral, Qwen, Gemma, Falcon, etc.)
- Ollama model download via `scripts/download_ollama.py`
  - Pulls directly from Ollama registry without requiring Ollama CLI
  - SHA256 verification of downloaded blobs
- llama.cpp server management: start, stop, hot-swap
  - Automatic Metal detection (macOS) and CUDA detection (Linux)
  - LaunchAgent support for macOS MPS server setups
- In-app quantization using llama-quantize (Q2_K through Q8_0)
- Embedded webview browser (HuggingFace GGUF filter, Ollama Library)
  - URL auto-capture when navigating to model pages
  - White-mode CSS injection for Ollama dark theme compatibility
- Dependency checker: llama.cpp, Python, Ollama presence
- Auto-install llama.cpp from source if not found
- `electron-store` persistent config: port, llama.cpp path, default quantization
- Cross-platform build configuration: macOS (DMG/PKG/ZIP), Windows (NSIS/MSI/portable/APPX), Linux (AppImage/DEB/RPM/Snap/tar.xz)
- `run-source-linux.sh`, `run-source-macos.sh`, `run-source-windows.bat` convenience scripts
- MIT License

---

## [Documentation Standardization] — 2026-03-14

### Added
- 27-file standard documentation suite covering all root, .github, and docs/ locations
- `docs/README.md` — documentation index
- `docs/TECHSTACK.md` — full tech stack with versions
- `docs/ARCHITECTURE.md` — system architecture and IPC channels
- `docs/INSTALLATION.md` — installation for all platforms
- `docs/DEVELOPMENT.md` — dev environment and build workflow
- `docs/API.md` — IPC channels, Python script CLI, llama.cpp REST endpoints
- `docs/BUILD_COMPILE.md` — build system and packaging
- `docs/DEPLOYMENT.md` — release and deploy procedures
- `docs/FAQ.md` — common questions with code-derived answers
- `docs/TROUBLESHOOTING.md` — issues, errors, solutions
- `docs/WORKFLOW.md` — branching and CI/CD
- `docs/QUICK_START.md` — fastest clone-to-running path
- `docs/LEARNINGS.md` — gotchas and discoveries
- `docs/PRD.md` — product requirements
- `docs/TODO.md` — known issues, planned features, tech debt
- `VERSION_MAP.md` updated
- `CLAUDE.md` refreshed with current architecture
- `AGENTS.md` refreshed
- `SECURITY.md` updated with specific guidance
- `CODE_OF_CONDUCT.md` updated to Contributor Covenant v2.1
- `CONTRIBUTING.md` updated with correct repo URLs
- `.github/ISSUE_TEMPLATE/bug_report.md` updated
- `.github/ISSUE_TEMPLATE/feature_request.md` updated
- `.github/PULL_REQUEST_TEMPLATE.md` updated

### Moved to archive
- `docs/DOCUMENTATION_INDEX.md` (content merged into `docs/README.md`)
- `docs/SETUP.md` (content merged into `docs/INSTALLATION.md`)
- `docs/SECURITY_ASSESSMENT.md`
- `docs/CODE_OF_CONDUCT.md`, `docs/CONTRIBUTING.md`, `docs/AGENTS.md` (duplicates of root files)
