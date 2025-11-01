# Contributing to Llama Wrangler

First off, thank you for considering contributing to Llama Wrangler! It's people like you that make Llama Wrangler such a great tool. 🦙

## Code of Conduct

This project and everyone participating in it is governed by the [Llama Wrangler Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/sanchez314c/llama-wrangler/issues) as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler

# Add upstream remote
git remote add upstream https://github.com/sanchez314c/llama-wrangler.git

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Project Structure

```
llama-wrangler/
├── main.js              # Main Electron process
├── renderer.js          # Renderer process
├── preload.js           # Preload script
├── index.html           # Main UI
├── scripts/             # Helper scripts
│   └── download_hf.py   # Model download script
├── assets/              # Icons and images
└── build/               # Build configuration
```

### Coding Style

- **JavaScript**: We use ES6+ features
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line Length**: 100 characters max
- **Comments**: JSDoc for functions

Example:
```javascript
/**
 * Downloads a model from HuggingFace
 * @param {string} modelId - The HuggingFace model ID
 * @param {string} outputDir - Directory to save the model
 * @returns {Promise<string>} Path to the downloaded model
 */
async function downloadModel(modelId, outputDir) {
  // Implementation
}
```

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add model deletion functionality

- Add right-click context menu to model list
- Implement safe deletion with confirmation dialog
- Update model list after deletion
- Add error handling for deletion failures

Fixes #123
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run build:all
```

## Styleguide

### JavaScript Styleguide

- Use meaningful variable names
- Prefer `const` over `let`, avoid `var`
- Use async/await over callbacks when possible
- Handle errors appropriately
- Add comments for complex logic

### Git Commit Styleguide

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools

Example: `feat: add model search functionality`

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit changes: `git commit -am "chore: release v1.2.3"`
4. Tag the release: `git tag v1.2.3`
5. Push: `git push && git push --tags`
6. GitHub Actions will automatically build and create a release

## Community

- Join our [Discord](https://discord.gg/llamawrangler)
- Follow us on [Twitter](https://twitter.com/llamawrangler)
- Read our [Blog](https://blog.llamawrangler.com)

## Questions?

Feel free to open an issue with a question tag or reach out on Discord!

Thank you! 🦙 ❤️