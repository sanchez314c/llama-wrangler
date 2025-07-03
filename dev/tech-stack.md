# Technology Stack

## Core Technologies
- **Language**: JavaScript (Node.js)
- **Framework**: Electron v27.0.0
- **Runtime**: Node.js (embedded with Electron)
- **Package Manager**: npm

## Key Dependencies

### Production Dependencies
- **electron-context-menu**: v3.6.1 - Context menu integration for Electron
- **electron-store**: v8.1.0 - Simple data persistence for Electron apps

### Development Dependencies
- **electron**: v27.0.0 - Framework for cross-platform desktop applications
- **electron-builder**: v24.6.4 - Complete solution for packaging and building distributable apps
- **electron-icon-builder**: v2.0.1 - Icon generation for multiple platforms

## Development Tools
- **Build Tool**: electron-builder for multi-platform builds
- **Package System**: npm with package-lock.json
- **Icon Management**: electron-icon-builder for platform-specific icons

## Platform Support
- **macOS**: Intel (x64) and ARM64 (Apple Silicon) with DMG and ZIP distributions
- **Windows**: x64 and x86 with NSIS installer, MSI, and ZIP distributions  
- **Linux**: AppImage distribution format

## Project Type
**Desktop Application** - Universal LLM Model Manager for switching, downloading, and converting AI models

## Architecture
- **Main Process**: `src/main.js` - Electron main process handling IPC and system integration
- **Renderer Process**: `src/renderer.js` - Frontend logic and UI management
- **Preload Scripts**: `src/preload.js`, `src/webview-preload.js` - Secure IPC bridge
- **Python Scripts**: `scripts/download_hf.py`, `scripts/download_ollama.py` - Model download automation

## Key Features
- LLM Model management and switching
- HuggingFace and Ollama model downloads
- GGUF model format conversion
- llama.cpp server integration
- Embedded browser for model browsing

## Build Configuration
- Multi-platform builds configured via electron-builder
- Icon resources in `assets/` folder (.icns, .ico, .png formats)
- Distribution outputs to `dist/` directory
- Python scripts packaged as extra resources