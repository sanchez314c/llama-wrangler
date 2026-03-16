# Development Guide

## 🚀 Development Environment Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (for model conversion scripts)
- **Git** (for version control and llama.cpp cloning)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/llamawrangler/llama-wrangler.git
cd llama-wrangler

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Development Scripts

```bash
# Development mode with hot reload
npm run dev

# Development with DevTools
npm run devtools

# Build for current platform
npm run build

# Build for all platforms
npm run dist:maximum

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Security audit
npm run security-check

# Check for outdated dependencies
npm run deps-check

# Clean build artifacts
npm run clean

# Full rebuild
npm run rebuild
```

## 🏗️ Architecture Overview

### Application Structure

```
Llama Wrangler/
├── src/                    # Source code
│   ├── main.js            # Electron main process
│   ├── preload.js         # Main preload script
│   ├── renderer.js        # Renderer process logic
│   ├── index.html         # Main UI
│   └── webview-preload.js # WebView preload
├── scripts/               # Utility scripts
│   ├── download_hf.py     # HuggingFace downloader
│   └── download_ollama.py # Ollama downloader
├── resources/             # Build resources
│   ├── icons/            # Application icons
│   └── entitlements/     # Platform entitlements
└── docs/                 # Documentation
```

### Core Components

1. **Main Process** (`main.js`)
   - Application lifecycle management
   - Window creation and management
   - IPC communication handling
   - File system operations
   - llama.cpp server management

2. **Renderer Process** (`renderer.js`)
   - UI logic and user interactions
   - Model management interface
   - Download progress tracking
   - WebView integration

3. **WebView Integration**
   - Built-in browser for HuggingFace/Ollama
   - URL extraction and model detection
   - Secure browsing with context isolation

4. **Python Scripts**
   - Model downloading from HuggingFace
   - Ollama model management
   - Format conversion to GGUF

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── __tests__/            # Additional test files
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

### Test Guidelines

- Unit tests should test individual functions in isolation
- Integration tests should test component interactions
- Mock external dependencies (API calls, file system)
- Test both happy paths and error cases

## 🐛 Debugging

### Main Process Debugging

```bash
# Start with DevTools
npm run devtools

# Or use VS Code debugging
# Attach to process via launch configuration
```

### Renderer Process Debugging

- Use Chrome DevTools (F12) in development mode
- Debug webview contexts separately
- Use `console.log` and `debugger` statements

### Common Debugging Scenarios

#### Model Loading Issues
1. Check llama.cpp installation in `~/.llama-wrangler/llama.cpp/`
2. Verify model file integrity (no .tmp files)
3. Check server logs for error messages
4. Validate GPU configuration

#### Download Failures
1. Check network connectivity
2. Verify HuggingFace/Ollama URLs
3. Check Python dependencies (`pip3 list`)
4. Review download logs in application directory

#### Performance Issues
1. Monitor system resources
2. Check model size vs available RAM
3. Verify GPU acceleration is active
4. Profile with Chrome DevTools

## 🔧 Configuration

### Environment Variables

```bash
# Custom model directory
export LLAMA_MODELS_DIR=/path/to/models

# Custom server port
export LLAMA_SERVER_PORT=8080

# Disable GPU acceleration
export LLAMA_NO_GPU=1

# Development mode
export NODE_ENV=development

# Enable verbose logging
export DEBUG=llama-wrangler:*
```

### Configuration Files

- **App Config**: `~/.llama-wrangler/config.json`
- **Server Config**: Embedded in main.js
- **Build Config**: `package.json` (build section)

## 📦 Build Process

### Development Build

```bash
# Quick build for current platform
npm run build

# Development build with debugging
npm run build:dev
```

### Production Build

```bash
# Build for current platform
npm run dist

# Build for all platforms
npm run dist:maximum

# Specific platform builds
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Build Artifacts

After building, artifacts are located in:
- **macOS**: `dist/Llama Wrangler-*.dmg`
- **Windows**: `dist/Llama Wrangler Setup *.exe`
- **Linux**: `dist/Llama Wrangler-*.AppImage`

### Build Optimization

The build process includes:
- **Compression**: Maximum compression for smaller bundles
- **Parallel builds**: Multiple architectures simultaneously
- **Bloat analysis**: Automatic dependency size monitoring
- **Temp cleanup**: Automatic cleanup of build artifacts

## 🎨 UI Development

### Styling Approach

- **CSS**: Inline styles in `index.html`
- **Dark Theme**: Built-in dark mode
- **Responsive**: Adapts to window resizing
- **Custom Components**: Minimal, functional design

### UI Components

1. **Model Sidebar**: Lists downloaded models with status
2. **Main Content**: WebView for browsing and download interface
3. **Progress Bar**: Real-time download and conversion progress
4. **Settings Panel**: Configuration options and server status

### Adding New UI Features

1. Update `index.html` for structure
2. Modify `renderer.js` for functionality
3. Add IPC handlers in `main.js` if needed
4. Update CSS styles for consistent appearance

## 🔌 Plugin System

### Python Script Integration

Python scripts are integrated via Node.js `child_process`:

```javascript
// Example from main.js
const { spawn } = require('child_process');

function runPythonScript(scriptPath, args) {
  return spawn('python3', [scriptPath, ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });
}
```

### Adding New Python Scripts

1. Place script in `scripts/` directory
2. Add error handling and logging
3. Implement progress reporting via stdout
4. Update main process to call new script

## 🔒 Security Considerations

### WebView Security

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in webviews
- **Preload Scripts**: Limited API exposure
- **Content Security Policy**: Restricts external resources

### File System Security

- **Sandboxed Access**: Limited to specific directories
- **Path Validation**: Prevents directory traversal
- **Input Sanitization**: Validates user inputs
- **Permission Checks**: Verifies file access rights

### Network Security

- **HTTPS Only**: Secure connections required
- **Certificate Validation**: Proper SSL verification
- **URL Whitelisting**: Approved domains only
- **Request Limiting**: Prevents abuse

## 📊 Performance Optimization

### Memory Management

- **Model Unloading**: Clear models when switching
- **Cache Cleanup**: Remove temporary files
- **Process Management**: Proper cleanup of child processes
- **Memory Monitoring**: Track memory usage

### CPU Optimization

- **Web Workers**: Offload heavy computations
- **Async Operations**: Non-blocking I/O operations
- **Lazy Loading**: Load components on demand
- **Debouncing**: Prevent excessive API calls

### GPU Acceleration

- **Metal Support**: macOS GPU acceleration
- **CUDA Support**: Windows/Linux NVIDIA GPUs
- **Fallback Options**: CPU-only mode available
- **Layer Optimization**: Maximize GPU layers

## 🚀 Deployment

### Pre-release Checklist

- [ ] Update version numbers in `package.json`
- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Test on all target platforms
- [ ] Verify documentation is current
- [ ] Check build artifacts

### Release Process

```bash
# Clean build
npm run clean

# Install dependencies
npm ci

# Build for all platforms
npm run dist:maximum

# Test artifacts
# (Manual testing of installers)

# Publish to GitHub releases
# (Configure via electron-builder)
```

### Distribution Channels

- **GitHub Releases**: Primary distribution
- **Direct Downloads**: Via website
- **Package Managers**: Future consideration
- **Auto-updates**: Built-in update mechanism

## 🤝 Contributing Guidelines

### Code Style

- **JavaScript**: Standard JS style
- **Python**: PEP 8 compliance
- **Comments**: JSDoc for functions
- **Naming**: Descriptive, consistent naming

### Git Workflow

1. Create feature branch from `main`
2. Make changes with atomic commits
3. Test thoroughly
4. Submit pull request
5. Code review process
6. Merge to main

### Pull Request Template

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
- [ ] No breaking changes (or documented)
```

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [llama.cpp Repository](https://github.com/ggerganov/llama.cpp)
- [HuggingFace Hub](https://huggingface.co/models)
- [Ollama Library](https://ollama.ai/library)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/llamawrangler/llama-wrangler/issues)
- **Discussions**: [GitHub Discussions](https://github.com/llamawrangler/llama-wrangler/discussions)
- **Documentation**: [Project Wiki](https://github.com/llamawrangler/llama-wrangler/wiki)

For technical questions or bug reports, please open an issue with detailed information about your environment and steps to reproduce.