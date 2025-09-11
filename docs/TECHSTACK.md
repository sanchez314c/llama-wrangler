# Llama Wrangler Tech Stack

## Project Overview
**Llama Wrangler** is a Universal LLM Model Manager built as a cross-platform desktop application for downloading, converting, and managing Large Language Models with ease.

## Core Architecture

### Desktop Application Framework
- **[Electron](https://electronjs.org/) v39.0.0** - Cross-platform desktop app framework
  - Enables web technologies (HTML, CSS, JavaScript) for native desktop applications
  - Provides access to native OS APIs and file system operations
  - Supports macOS, Windows, and Linux deployment

### Frontend Technologies

#### User Interface
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with:
  - CSS Custom Properties (variables) for theming
  - Flexbox layout system
  - Dark theme with modern color palette
  - System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)

#### JavaScript Runtime
- **Vanilla JavaScript** - No frontend frameworks, pure DOM manipulation
- **Node.js Integration** - Via Electron's main and renderer processes
- **IPC Communication** - Inter-process communication between main and renderer

### Backend/System Integration

#### Core Runtime
- **Node.js v22** - JavaScript runtime for system operations
- **Electron Main Process** - Application lifecycle and system API access
- **Electron Renderer Process** - UI rendering and user interactions

#### Key Node.js Modules
- `electron-store` - Persistent configuration storage
- `electron-context-menu` - Native context menu integration
- `child_process` - Spawning external processes (Python scripts, llama.cpp)
- `fs` - File system operations
- `os` - Operating system utilities
- `path` - Cross-platform file path handling

### Python Integration

#### Model Management Scripts
- **Python 3.x** - Backend processing for model operations
- **HuggingFace Hub Integration**:
  - `huggingface-hub` - Official HuggingFace client library
  - `tqdm` - Progress bar displays for downloads
  - `requests` - HTTP client for API calls

#### External Dependencies
- **Ollama Integration** - Model management via Ollama API
- **llama.cpp** - High-performance LLM inference engine
- **GGUF Format Support** - Quantized model format conversion

## Development & Build Tools

### Package Management
- **npm** - Node.js package manager
- **package-lock.json** - Dependency version locking

### Build System
- **[Electron Builder](https://www.electron.build/) v26.0.12** - Application packaging and distribution
  - Cross-platform builds (macOS, Windows, Linux)
  - Multiple package formats (DMG, MSI, NSIS, AppImage, DEB, RPM, Snap)
  - Code signing and notarization support

### Code Quality Tools
- **TypeScript** v5.9.3 - Type checking
- **ESLint** v8.57.1 - Code linting
- **Prettier** v3.6.2 - Code formatting
- **EditorConfig** - Code formatting standards

## Distribution & Packaging

### Target Platforms

#### macOS
- **Architecture**: Intel (x64), Apple Silicon (arm64), Universal
- **Formats**: DMG, ZIP, PKG
- **Features**: Category classification, hardened runtime optional

#### Windows
- **Architecture**: 64-bit (x64), 32-bit (ia32), ARM64
- **Formats**: NSIS installer, MSI, ZIP, Portable, APPX
- **Features**: Desktop shortcuts, Start Menu integration

#### Linux
- **Architecture**: 64-bit (x64), ARM64, ARMv7l
- **Formats**: AppImage, DEB, RPM, Snap, tar.xz, tar.gz
- **Dependencies**: GTK3, libnotify, system libraries

## Project Structure

```
llama-wrangler/
├── src/                 # Application source code
│   ├── main.js         # Electron main process
│   ├── renderer.js     # Frontend JavaScript
│   ├── preload.js      # Secure IPC bridge
│   ├── webview-preload.js # WebView security
│   └── index.html      # Main application UI
├── scripts/            # Python backend scripts
│   ├── download_hf.py  # HuggingFace model downloader
│   ├── download_ollama.py # Ollama integration
│   └── platform runners # Cross-platform execution scripts
├── resources/          # Application assets
│   ├── icons/          # Platform-specific icons
│   └── screenshots/    # Documentation images
├── docs/              # Project documentation
├── dev/               # Development notes
├── archive/           # Timestamped backups
└── dist/              # Build output directory
```

## Security Model

### Electron Security
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer process
- **Preload Scripts**: Secure API exposure to renderer
- **WebView Tag**: Enabled for embedded web content

### Process Isolation
- **Main Process**: System API access and file operations
- **Renderer Process**: UI rendering with limited privileges
- **IPC Communication**: Secure message passing between processes

## External Integrations

### AI/ML Platforms
- **HuggingFace Hub** - Model repository and download APIs
- **Ollama** - Local LLM server management
- **llama.cpp** - Optimized LLM inference engine

### Model Formats
- **GGUF** - Primary quantized model format
- **Safetensors** - HuggingFace model format
- **Automatic Conversion** - HF to GGUF conversion pipeline

## Configuration Management

### Application Settings
- **electron-store** - Persistent user preferences
- **User Directory**: `~/.llama-wrangler/`
- **Model Storage**: Configurable model directory
- **Port Configuration**: Customizable server port (default: 7070)

### Cross-Platform Paths
- **macOS**: Native macOS integration
- **Windows**: Windows-specific paths and shortcuts
- **Linux**: XDG compliance and system integration

## Performance Characteristics

### Resource Management
- **Memory Efficient**: Electron with optimized renderer processes
- **Background Processing**: Python scripts for heavy model operations
- **Parallel Downloads**: Concurrent model downloading
- **Progress Tracking**: Real-time download and conversion progress

### Scalability
- **Multiple Model Support**: Concurrent model management
- **Large File Handling**: Efficient streaming for GB-sized models
- **Process Isolation**: Stable operation with external tool integration

## Development Workflow

### Scripts Available
- `npm start` - Development mode with debugging
- `npm run dev` - Development with dev tools
- `npm run build` - Production build for current platform
- `npm run build:all` - Cross-platform builds
- `npm run clean` - Clean build artifacts
- `npm run lint` - ESLint code quality check
- `npm run format` - Prettier code formatting

### Code Quality
- **EditorConfig** - Consistent code formatting
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Automatic code formatting
- **MIT License** - Open source licensing
- **GitHub Integration** - Version control and collaboration

---

*This tech stack provides a robust foundation for a cross-platform LLM model management application with modern web technologies, secure native integration, and comprehensive platform support.*
