# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Running the Application

**Development Mode:**
```bash
# Run from source with hot reload
npm start
# or
npm run dev
# or
./run-macos-source.sh  # macOS only, handles dependencies
```

**Production Build & Run:**
```bash
# One-command build and run
./compile-build-dist.sh

# Build only (without launching)
./compile-build-dist.sh --no-clean

# Run compiled app (macOS)
./run-macos.sh
```

### Building for Distribution

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac    # macOS (Intel + ARM)
npm run build:win    # Windows
npm run build:linux  # Linux
npm run build:all    # All platforms

# Clean build
npm run clean && npm install && npm run build
```

### Development Tasks

```bash
# Install dependencies
npm install

# Clean everything
npm run clean

# Rebuild from scratch
npm run rebuild
```

Note: There are no test or lint scripts configured in package.json currently.

## Architecture Overview

### Core Application Structure

This is an **Electron** application that manages Large Language Models (LLMs) with automatic GGUF conversion capabilities.

**Main Components:**
- **Main Process** (`src/main.js`): Electron main process handling window management, IPC communications, and subprocess management for llama.cpp server and model downloads
- **Renderer Process** (`src/renderer.js`): Frontend logic for model management UI and browser integration
- **Preload Scripts** (`src/preload.js`, `src/webview-preload.js`): Bridge secure communication between renderer and main processes
- **UI** (`src/index.html`): Dark-themed interface with model sidebar and embedded browser tabs

### Key Architectural Patterns

1. **Process Management**: The app manages multiple child processes:
   - llama.cpp server (switches models via hot-swapping)
   - Python download/conversion scripts
   - Maintains process lifecycle and cleanup

2. **Model Storage**: Models stored in `~/.llama-wrangler/models/` as GGUF files with automatic Q4_K_M quantization

3. **IPC Communication**: Uses Electron's IPC for:
   - Model downloads (`download-model`)
   - Server management (`start-server`, `stop-server`)
   - Model listing (`get-models`, `refresh-models`)
   - llama.cpp installation (`check-llama-cpp`, `install-llama-cpp`)

4. **External Dependencies**:
   - **llama.cpp**: Cloned and compiled locally at `~/.llama-wrangler/llama.cpp/`
   - **Python scripts**: Handle HuggingFace and Ollama model downloads (`scripts/download_hf.py`, `scripts/download_ollama.py`)

### Critical Files

- `src/main.js`: Core application logic, server management, IPC handlers
- `scripts/download_hf.py`: HuggingFace model download and GGUF conversion
- `scripts/download_ollama.py`: Ollama model download handler
- `package.json`: Electron Builder configuration for multi-platform builds

### Data Flow

1. User browses models via embedded WebView (HuggingFace/Ollama)
2. URL captured and sent to main process
3. Python script downloads and converts model to GGUF
4. Model appears in sidebar, can be activated
5. llama.cpp server hot-swaps to new model on activation

### Configuration

- Uses `electron-store` for persistent settings
- Default server port: 7070
- Default quantization: Q4_K_M
- GPU layers: 999 (maximum for auto-detection)

## Important Considerations

- The app requires llama.cpp to be compiled locally with appropriate GPU support (Metal for macOS, CUDA for Linux/Windows)
- Python dependencies needed: `huggingface-hub`, `requests`, `tqdm`
- Models are automatically converted to GGUF format if not already in that format
- The app manages its own llama.cpp installation in user's home directory