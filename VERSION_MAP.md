# Version Map — Llama Wrangler

## Active Version

| Version | Status | Location | Date |
|---------|--------|----------|------|
| **v1.2.0** | **ACTIVE** | `/` (project root) | February 7, 2026 |

## Version History

| Version | Status | Description | Date |
|---------|--------|-------------|------|
| v1.2.0 | Active | Neo-Noir Glass Monitor Theme + Dashboard Layout + Floating Window | Feb 7, 2026 |
| v1.1.0 | Superseded | Major Repository Transformation — standardization, multi-platform build | Oct 29, 2025 |
| v1.0.0 | Superseded | Initial release — Electron app with HuggingFace/Ollama model management | 2024 |

## Architecture

```
llama-wrangler/              ← v1.2.0 (ACTIVE)
├── src/                     ← Application source
│   ├── main.js              ← Electron main process (Chromium flags injected)
│   ├── renderer.js          ← Frontend UI logic
│   ├── preload.js           ← Secure IPC bridge
│   ├── webview-preload.js   ← WebView security
│   └── index.html           ← Dashboard UI
├── scripts/                 ← Python backend + build scripts
├── resources/               ← Icons, screenshots, plist files
├── docs/                    ← Documentation files
├── dev/                     ← Development notes and breadcrumbs
├── tests/                   ← Test suite (placeholder)
├── legacy/                  ← Legacy/deprecated code
├── 00_githubb/              ← GitHub assets staging
├── archive/                 ← Timestamped backups (gitignored)
└── run-source-*.sh/bat      ← Platform-specific launchers
```

## Compliance Audit Log

| Date | Action |
|------|--------|
| Mar 14, 2026 | Full compliance audit: Chromium flags injected, .nvmrc→24, .python-version→3.11, AGENTS.md synced, tests/ + legacy/ + 00_githubb/ dirs created with .gitkeep, all .sh chmod+x, backup created |

## Versioning Strategy

- **Semantic Versioning**: `MAJOR.MINOR.PATCH`
- **Version Source of Truth**: `package.json` → `version` field
- **Change History**: `CHANGELOG.md`
- **No version folders**: Git tags and branches handle version control
- **Backups**: Timestamped zips in `/archive/` (gitignored)

## Notes

- All legacy versions are tracked via git history (no version folders exist)
- The `archive/` directory contains operational backups, not version snapshots
- Version bumps should update both `package.json` and `CHANGELOG.md` simultaneously
