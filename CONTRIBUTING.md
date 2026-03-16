# Contributing to Llama Wrangler

Thanks for your interest in contributing. This document covers how to get set up, what the code standards are, and how pull requests work.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

## Getting Started

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/llama-wrangler.git
cd llama-wrangler
git remote add upstream https://github.com/sanchez314c/llama-wrangler.git
npm install
```

Run in dev mode:

```bash
npm run dev           # start Electron with DevTools
./run-source-linux.sh # or the platform script for your OS
```

## What to Work On

- Open issues labeled `good first issue` or `help wanted`
- Bug reports with clear reproduction steps
- Documentation improvements
- Performance improvements with measurable impact

If you want to add a significant feature, open an issue first to discuss the approach before writing code.

## Code Standards

### JavaScript

- ES6+ syntax, async/await over callbacks
- 2-space indentation, single quotes, semicolons required
- 100-character line limit
- JSDoc comments on public IPC handlers and utility functions
- Avoid mutating objects in place — return new copies

### Python

- PEP 8 compliance
- Type hints where practical
- Print progress messages via `print_progress()` (already defined in both scripts) so the Electron app can parse them

### File length

- Target 200-400 lines per file, hard limit 800
- Split large functions into helpers rather than growing monolith handlers in `main.js`

### Commit format

```
<type>: <short description>

[optional body]

[optional footer — Fixes #123]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Examples:
```
feat: add pause/resume for model downloads
fix: correct DYLD_LIBRARY_PATH for quantization on macOS
docs: update INSTALLATION.md with Node 22 requirement
```

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes. Run quality checks locally:
   ```bash
   npm run lint
   npm run type-check
   npm run security-check
   npm test
   ```

3. Push and open a PR against `main` using the pull request template.

4. Address all review comments. CI must pass before merge.

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:

- OS and version
- Node.js and Python versions
- The exact error message or behavior
- Steps to reproduce
- Any relevant logs from `~/.llama-wrangler/` or DevTools console

## Suggesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Describe the problem you are trying to solve, not just the solution you want.

## Security Issues

Do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for the private disclosure process.

## Questions?

Open a [GitHub Discussion](https://github.com/sanchez314c/llama-wrangler/discussions) or comment on an existing issue.
