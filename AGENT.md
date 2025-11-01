# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Llama Wrangler** is a desktop application built with Electron that simplifies managing Large Language Models (LLMs). It provides a graphical interface for downloading models from HuggingFace and Ollama, automatically converting them to GGUF format, and hot-swapping between models instantly using a local llama.cpp server.

## Core Commands

### Development
```bash
# Run in development mode with hot reload
npm run dev

# Run with DevTools for debugging
npm run devtools

# Install dependencies
npm install
```

### Building
```bash
# Build for current platform
npm run build

# Build for all platforms (takes significant time)
npm run dist:maximum

# Platform-specific builds
npm run dist:mac        # macOS builds
npm run dist:win        # Windows builds
npm run dist:linux      # Linux builds
```

### Code Quality
```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Security audit
npm run security-check

# Check for outdated dependencies
npm run deps-check
```

### Maintenance
```bash
# Clean build artifacts
npm run clean

# Full rebuild
npm run rebuild

# Analyze package sizes
npm run bloat-check

# Clean temporary files
npm run temp-clean
```

## Architecture Overview

### Main Components
- **`src/main.js`** (~27KB): Electron main process handling server lifecycle, IPC communication, and file operations
- **`src/renderer.js`** (~38KB): UI renderer process managing user interactions, model library display, and download progress
- **`src/index.html`** (~13KB): Dark-themed UI interface with embedded browser webview
- **`src/preload.js`**: Security layer between main and renderer processes
- **`src/webview-preload.js`**: Context-isolated preload for embedded browser

### Key Python Scripts
- **`scripts/download_hf.py`** (~18KB): HuggingFace model downloader with automatic GGUF conversion
- **`scripts/download_ollama.py`** (~10KB): Ollama model manager
- **`scripts/build-universal.sh`** (~26KB): Comprehensive build script for multi-platform distribution

### Application Structure
```
~/.llama-wrangler/
├── models/              # Downloaded GGUF models
├── llama.cpp/           # Local llama.cpp installation
├── config.json          # App configuration
└── logs/                # Application logs
```

### Critical Architecture Patterns

**IPC Communication**:
- Main process exposes safe APIs via preload script
- Renderer uses `window.electronAPI` for all operations
- Async/await pattern for all cross-process operations

**Server Management**:
- Uses macOS LaunchAgent for persistent llama.cpp server
- Server runs on port 7070 with maximum GPU layers
- Health checks and automatic restart on model switches

**Model Downloads**:
- Python scripts executed as child processes
- Progress tracking via IPC messages
- Automatic conversion to GGUF Q4_K_M format
- Concurrent download management with cleanup

**Security Model**:
- Context isolation enabled for all webviews
- Node integration disabled in renderer
- Path traversal protection
- Input sanitization for all file operations

## Known Issues & Solutions

### Quantization on macOS
**Issue**: llama-quantize fails with library path errors
**Solution**: Set `DYLD_LIBRARY_PATH` environment variable before executing quantize commands
**Location**: main.js lines 824-901

### App Stability
**Issue**: console.log statements cause crashes
**Solution**: All console.log statements removed from production code
**Best Practice**: Use proper logging via IPC to main process

### Variable Naming Conflicts
**Issue**: `process` variable shadows Node.js global
**Solution**: Use descriptive names like `downloadProcess`, `quantizeProcess`
**Pattern**: Avoid shadowing Node.js globals in child process handlers

### Memory Management
**Issue**: Large model downloads cause memory issues
**Solution**: Limit concurrent downloads, exclude unnecessary file types, implement cleanup
**Location**: download_hf.py with file filtering logic

## Development Guidelines

### When Making Changes
1. Read the entire file before editing - context is critical
2. Follow existing async/await patterns
3. Add proper error handling with try/catch
4. Use IPC for all cross-process communication
5. Test on target platform before committing

### Code Style
- Modern ES6+ syntax
- Prefer async/await over callbacks
- Use descriptive variable names
- Add comments for complex business logic
- Never use console.log in production code

### Security Considerations
- Always validate user inputs
- Use path.join() for cross-platform paths
- Sanitize file operations
- Never expose Node.js APIs directly to renderer
- Keep context isolation enabled

## Build System

### Electron Builder Configuration
- Multi-platform support: macOS (DMG, PKG, ZIP), Windows (EXE, MSI, portable), Linux (AppImage, DEB, RPM, SNAP)
- Maximum compression enabled
- Architecture support: x64, ARM64, IA32, ARMv7l
- Auto-updater configured for production

### Build Outputs
- **macOS**: `dist/Llama Wrangler-*.dmg` and `dist/mac*/Llama Wrangler.app`
- **Windows**: `dist/Llama Wrangler Setup *.exe`
- **Linux**: `dist/Llama Wrangler-*.AppImage` and `dist/*.deb`

## Testing Strategy

### Manual Testing Checklist
- [ ] Model download from HuggingFace
- [ ] Model download from Ollama
- [ ] Automatic conversion to GGUF
- [ ] Model switching without server restart
- [ ] Error handling for invalid URLs
- [ ] Memory usage during large downloads
- [ ] GPU acceleration detection

### Debugging
```bash
# Enable debugging
npm run devtools

# Check logs
tail -f ~/.llama-wrangler/logs/*.log

# Test Python scripts directly
python3 scripts/download_hf.py <model-url>
python3 scripts/download_ollama.py <model-name>
```

## Common Workflows

### Adding New Model Sources
1. Create new Python script in `scripts/`
2. Add IPC handler in `main.js`
3. Add UI controls in `renderer.js`
4. Update preload script to expose new APIs
5. Test with various model types

### Modifying Build Process
1. Update `package.json` build section
2. Modify `scripts/build-universal.sh` if needed
3. Test on target platforms
4. Verify code signing (if applicable)

### Debugging Server Issues
1. Check LaunchAgent status: `launchctl list | grep llama`
2. Test llama.cpp directly: `~/.llama-wrangler/llama.cpp/main -m <model>`
3. Check port availability: `lsof -i :7070`
4. Review logs in `~/.llama-wrangler/logs/`