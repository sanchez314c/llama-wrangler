# Development Workflow

## Table of Contents

1. [Overview](#overview)
2. [Development Setup](#development-setup)
3. [Code Organization](#code-organization)
4. [Development Process](#development-process)
5. [Testing](#testing)
6. [Code Review](#code-review)
7. [Release Process](#release-process)
8. [Tools and Automation](#tools-and-automation)

---

## Overview

This document describes the standard development workflow for Llama Wrangler. It covers everything from setting up your development environment to releasing a new version.

### Key Principles

- **Feature Branch Development**: All work happens in feature branches
- **Automated Testing**: CI/CD runs on every PR
- **Code Review**: All changes require review
- **Semantic Versioning**: Follow SemVer for releases
- **Documentation First**: Update docs before code

---

## Development Setup

### Prerequisites

1. **Node.js**: Version 18.0 or later
2. **npm**: Version 8.0 or later
3. **Python**: Version 3.8 or later
4. **Git**: Latest stable version
5. **IDE**: VS Code (recommended) with extensions

### Initial Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler

# Add upstream remote
git remote add upstream https://github.com/original-owner/llama-wrangler.git

# Install dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Create development branch
git checkout -b develop
git pull upstream develop
```

### VS Code Setup

Install these extensions:

- ESLint
- Prettier
- Python
- GitLens

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

---

## Code Organization

### Directory Structure

```
llama-wrangler/
├── src/                    # Main application source
│   ├── main.js            # Electron main process
│   ├── renderer.js        # UI renderer process
│   ├── preload.js         # Security layer
│   └── webview-preload.js # Webview context
├── scripts/               # Python utility scripts
│   ├── download_hf.py     # HuggingFace downloader
│   └── download_ollama.py # Ollama downloader
├── docs/                  # Documentation
├── tests/                 # Test files
├── build_resources/       # Build assets
└── resources/            # Application resources
```

### Naming Conventions

- **Files**: kebab-case (`download-manager.js`)
- **Variables**: camelCase (`downloadManager`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CONCURRENT_DOWNLOADS`)
- **Functions**: camelCase (`handleDownload()`)
- **Classes**: PascalCase (`DownloadManager`)

### Code Style

Follow the existing patterns:

- Use async/await for async operations
- Prefer ES6+ syntax
- Add JSDoc comments for public APIs
- Use TypeScript types where applicable

---

## Development Process

### 1. Create Feature Branch

```bash
# Sync with upstream
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Development Workflow

#### Step 1: Plan the Change

- [ ] Create issue if not exists
- [ ] Design the solution
- [ ] Identify affected files
- [ ] Plan tests needed

#### Step 2: Implement

```bash
# Start development server
npm run dev

# Make changes
# Test frequently
```

#### Step 3: Test

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Manual testing
npm run devtools
```

#### Step 4: Commit

```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat: add model download progress bar"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Format

Use conventional commits:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:

```
feat(downloader): add pause/resume functionality

Implement pause and resume for model downloads with state persistence.

Closes #123
```

---

## Testing

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── main.test.js
│   └── renderer.test.js
├── integration/          # Integration tests
│   └── download.test.js
└── e2e/                # End-to-end tests
    └── app.test.js
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Writing Tests

#### Unit Tests

```javascript
// tests/unit/main.test.js
const { expect } = require('chai');
const { DownloadManager } = require('../src/main.js');

describe('DownloadManager', () => {
  it('should create download queue', () => {
    const manager = new DownloadManager();
    expect(manager.queue).to.be.an('array');
  });
});
```

#### Integration Tests

```javascript
// tests/integration/download.test.js
const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/main.js');

describe('Download API', () => {
  it('should start model download', async () => {
    const response = await request(app)
      .post('/api/download')
      .send({ url: 'https://huggingface.co/test/model' });

    expect(response.status).to.equal(200);
  });
});
```

### Test Coverage

Aim for:

- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths
- **E2E tests**: Main user flows

---

## Code Review

### Pull Request Process

1. **Create PR**:
   - Target: `develop` branch
   - Title: Follows commit message format
   - Description: Include what and why

2. **PR Template**:

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   ```

3. **Review Requirements**:
   - At least one approval
   - All CI checks pass
   - No merge conflicts

### Review Guidelines

#### For Reviewers

- Check for bugs and edge cases
- Verify code follows conventions
- Ensure tests are adequate
- Check documentation updates

#### For Authors

- Respond to all comments
- Update code based on feedback
- Keep PR up to date
- Squash commits if needed

---

## Release Process

### Version Management

Follow Semantic Versioning:

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

#### Pre-Release

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Run full test suite**
4. **Test on all platforms**
5. **Update documentation**

#### Release

```bash
# Create release branch
git checkout -b release/v1.2.3

# Update version
npm version 1.2.3

# Build for all platforms
npm run dist:maximum

# Create GitHub release
gh release create v1.2.3 --generate-notes

# Merge to main
git checkout main
git merge release/v1.2.3
git push upstream main

# Merge back to develop
git checkout develop
git merge main
git push upstream develop
```

#### Post-Release

1. **Monitor for issues**
2. **Announce release**
3. **Update website**
4. **Archive old releases**

---

## Tools and Automation

### CI/CD Pipeline

#### GitHub Actions Workflows

1. **CI** (`.github/workflows/ci.yml`):
   - Runs on every PR
   - Linting and type checking
   - Unit and integration tests
   - Security audit

2. **Release** (`.github/workflows/release.yml`):
   - Runs on tags
   - Builds for all platforms
   - Creates GitHub release
   - Uploads artifacts

3. **Quality Check** (`.github/workflows/quality-check.yml`):
   - Weekly run
   - Dependency updates
   - Code quality metrics
   - Security scan

### Local Automation

#### Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Setup hooks
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
npx husky add .husky/pre-push "npm test"
```

#### Development Scripts

```json
{
  "scripts": {
    "dev": "electron .",
    "devtools": "electron . --dev",
    "build": "electron-builder",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist/",
    "rebuild": "npm run clean && npm run build"
  }
}
```

### Debugging Tools

#### Main Process Debugging

```bash
# Debug with Node.js inspector
node --inspect-brk src/main.js

# Or with VS Code launch configuration
```

#### Renderer Process Debugging

- Open DevTools with `npm run devtools`
- Use Chrome DevTools for webview debugging

#### Python Script Debugging

```bash
# Debug Python scripts
python -m pdb scripts/download_hf.py

# Or with VS Code Python debugger
```

---

## Best Practices

### Development

1. **Small, focused commits**
2. **Test as you go**
3. **Document complex logic**
4. **Handle errors gracefully**
5. **Use TypeScript for new code**

### Security

1. **Never commit secrets**
2. **Validate all inputs**
3. **Use secure IPC patterns**
4. **Keep dependencies updated**
5. **Run security audits**

### Performance

1. **Profile before optimizing**
2. **Monitor memory usage**
3. **Optimize critical paths**
4. **Use lazy loading**
5. **Test on low-end hardware**

---

## Troubleshooting Development Issues

### Common Problems

#### Module Resolution Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Electron Issues

```bash
# Rebuild native modules
npm rebuild

# Check Electron version
npx electron --version
```

#### Python Environment Issues

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows

# Install requirements
pip install -r requirements.txt
```

### Getting Help

1. **Check existing issues**
2. **Ask in Discord**
3. **Create discussion**
4. **Pair programming session**

---

## Contributing Guidelines

### Before Contributing

1. **Read this document**
2. **Set up development environment**
3. **Familiarize with codebase**
4. **Join community discussions**

### First Contribution

1. **Find good first issue**
2. **Comment your intent**
3. **Follow development process**
4. **Ask for help if needed**

### Regular Contributions

1. **Participate in planning**
2. **Review PRs from others**
3. **Mentor new contributors**
4. **Improve documentation**

---

_Last updated: 2024-01-XX_
