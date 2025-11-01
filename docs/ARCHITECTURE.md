# Llama Wrangler Architecture

## Overview
Llama Wrangler is built as a multi-process Electron application with Python integration for model management and llama.cpp for model serving.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Electron App                      │
├─────────────────────────────────────────────────────┤
│                 Renderer Process                     │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │   Main UI       │  │     Embedded Browser     │  │
│  │   - Model List  │  │  - HuggingFace Browser   │  │
│  │   - Controls    │  │  - Ollama Browser        │  │
│  │   - Settings    │  │  - Model Preview         │  │
│  └─────────────────┘  └──────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                 Main Process                         │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │   IPC Handlers  │  │    Process Management    │  │
│  │   - Downloads   │  │  - Python Scripts       │  │
│  │   - Server      │  │  - llama.cpp Server      │  │
│  │   - Models      │  │  - Child Processes       │  │
│  └─────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
            ┌───────────┴────────────┐
            │                        │
    ┌───────▼────────┐    ┌─────────▼────────┐
    │ Python Scripts │    │  llama.cpp       │
    │ ──────────────│    │  Server          │
    │ - download_hf  │    │ ──────────────   │
    │ - download_ol  │    │ - Model Loading  │
    │ - Conversion   │    │ - API Endpoints  │
    └────────────────┘    │ - Hot Swapping   │
                          └──────────────────┘
```

## Process Communication

### IPC Channels
- `download-model`: Trigger model download from URL
- `get-models`: Retrieve list of installed models  
- `refresh-models`: Scan directory for new models
- `start-server`: Start llama.cpp server with model
- `stop-server`: Gracefully shutdown server
- `check-llama-cpp`: Verify llama.cpp installation

### Security Model
- Context isolation enabled for renderer processes
- Preload scripts provide secure API surface
- No direct Node.js access in renderer
- Sandboxed webviews for external content

## Data Flow

### Model Download Process
1. User clicks download from browser view
2. Renderer captures URL via webview preload
3. IPC message sent to main process
4. Main process spawns Python download script
5. Progress events forwarded to renderer
6. Model automatically converted to GGUF
7. Model registry updated

### Model Serving Process
1. User selects model from list
2. Current server gracefully stopped
3. New llama.cpp server started with selected model
4. Health check performed
5. UI updated with server status

## File System Organization

```
~/.llama-wrangler/
├── models/                 # GGUF model files
│   ├── model1.gguf
│   └── model2.gguf
├── llama.cpp/             # llama.cpp installation
│   ├── main
│   ├── server  
│   └── build/
└── cache/                 # Temporary downloads
    └── downloads/
```

## Configuration Management
- Settings stored via electron-store
- Model metadata in JSON registry
- Server configuration persisted
- User preferences cached locally

## Error Handling Strategy
- Graceful degradation for missing dependencies
- Retry logic for network operations
- User-friendly error messages
- Automatic fallback mechanisms
- Comprehensive logging system