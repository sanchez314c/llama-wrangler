# API Documentation

## Overview

Llama Wrangler provides a comprehensive API for model management, server control, and application operations through IPC channels and external interfaces.

## Main Process API

### Application Lifecycle

#### `app-ready`

- **Type**: Event
- **Description**: Emitted when application is fully initialized
- **Payload**: None

#### `app-quit`

- **Type**: Event
- **Description**: Emitted before application quits
- **Payload**: None

### Model Management

#### `get-models`

- **Type**: IPC Request
- **Description**: Retrieve list of installed models
- **Parameters**: None
- **Returns**: Array of model objects
  ```javascript
  [
    {
      name: 'Model Name',
      path: '/path/to/model.gguf',
      size: 4210000000,
      type: 'GGUF',
      quantization: 'Q4_K_M',
      active: true,
    },
  ];
  ```

#### `refresh-models`

- **Type**: IPC Request
- **Description**: Scan model directories and refresh model list
- **Parameters**: None
- **Returns**: Updated model array

#### `delete-model`

- **Type**: IPC Request
- **Description**: Delete a model from storage
- **Parameters**:
  - `modelPath` (string): Path to model file
- **Returns**: Success status

#### `load-model`

- **Type**: IPC Request
- **Description**: Load and activate a model
- **Parameters**:
  - `modelPath` (string): Path to model file
- **Returns**: Loading status and server response

### Server Management

#### `start-server`

- **Type**: IPC Request
- **Description**: Start llama.cpp server with specified model
- **Parameters**:
  - `modelPath` (string): Path to model file
  - `port` (number, optional): Server port (default: 7070)
  - `gpuLayers` (number, optional): GPU layers (default: 999)
- **Returns**: Server status

#### `stop-server`

- **Type**: IPC Request
- **Description**: Stop running llama.cpp server
- **Parameters**: None
- **Returns**: Success status

#### `check-server`

- **Type**: IPC Request
- **Description**: Check server health and status
- **Parameters**: None
- **Returns**: Server status object
  ```javascript
  {
    running: true,
    port: 7070,
    model: "Current Model",
    pid: 12345,
    uptime: 3600
  }
  ```

### Download Management

#### `download-model`

- **Type**: IPC Request
- **Description**: Download model from URL
- **Parameters**:
  - `url` (string): Model URL (HuggingFace or Ollama)
  - `quantization` (string, optional): Target quantization (default: Q4_K_M)
- **Returns**: Download ID for progress tracking

#### `download-progress`

- **Type**: Event
- **Description**: Emitted during download progress
- **Payload**: Progress object
  ```javascript
  {
    id: "download-123",
    stage: "downloading|converting|quantizing",
    progress: 0.75,
    message: "Downloading model files...",
    speed: "2.5 MB/s"
  }
  ```

#### `download-complete`

- **Type**: Event
- **Description**: Emitted when download completes
- **Payload**: Completion object
  ```javascript
  {
    id: "download-123",
    success: true,
    modelPath: "/path/to/downloaded/model.gguf",
    message: "Model downloaded successfully"
  }
  ```

### llama.cpp Integration

#### `check-llama-cpp`

- **Type**: IPC Request
- **Description**: Verify llama.cpp installation
- **Parameters**: None
- **Returns**: Installation status
  ```javascript
  {
    installed: true,
    path: "/path/to/llama.cpp",
    version: "latest",
    gpuSupport: "metal|cuda|cpu"
  }
  ```

#### `install-llama-cpp`

- **Type**: IPC Request
- **Description**: Install and compile llama.cpp
- **Parameters**: None
- **Returns**: Installation progress and status

## Renderer Process API

### UI Components

#### ModelLibrary

- **Description**: Manages model list display and interactions
- **Methods**:
  - `renderModels(models)`: Update model list UI
  - `setActiveModel(modelPath)`: Highlight active model
  - `showModelContextMenu(model)`: Display context menu

#### DownloadInterface

- **Description**: Handles download UI and progress
- **Methods**:
  - `startDownload(url, options)`: Initiate download
  - `updateProgress(id, progress)`: Update progress bar
  - `showDownloadComplete(model)`: Display completion message

#### WebViewManager

- **Description**: Controls embedded browser views
- **Methods**:
  - `loadUrl(url)`: Navigate to URL
  - `getCurrentUrl()`: Get current page URL
  - `extractModelUrl()`: Extract model URL from current page

### Event Handling

#### Model Events

- `model-selected`: User clicked on model
- `model-delete-requested`: User requested model deletion
- `model-load-requested`: User requested model loading

#### Download Events

- `download-started`: Download initiated
- `download-cancelled`: User cancelled download
- `download-error`: Download failed

## Python Scripts API

### HuggingFace Downloader

#### download_hf.py

```bash
python3 download_hf.py <model_id> <output_dir> [quantization]
```

**Parameters**:

- `model_id`: HuggingFace model identifier (e.g., "mistralai/Mistral-7B-Instruct-v0.3")
- `output_dir`: Directory to save downloaded model
- `quantization`: Target quantization level (Q2_K, Q3_K, Q4_K_M, Q5_K, Q6_K, Q8_0)

**Returns**: Exit code and progress via stdout

**Progress Format**:

```
{"stage": "downloading", "progress": 0.25, "message": "Downloading config.json"}
{"stage": "converting", "progress": 0.50, "message": "Converting to GGUF"}
{"stage": "quantizing", "progress": 0.75, "message": "Quantizing to Q4_K_M"}
{"stage": "complete", "progress": 1.0, "message": "Model ready", "path": "/path/to/model.gguf"}
```

### Ollama Manager

#### download_ollama.py

```bash
python3 download_ollama.py <model_name> <output_dir>
```

**Parameters**:

- `model_name`: Ollama model name (e.g., "llama3.2", "mistral")
- `output_dir`: Directory to save downloaded model

**Returns**: Exit code and model path

## REST API Endpoints (llama.cpp Server)

### Model Loading

#### POST `/completion`

- **Description**: Generate text completion
- **Request Body**:
  ```json
  {
    "prompt": "Your prompt here",
    "max_tokens": 512,
    "temperature": 0.7,
    "stop": ["\n", "Human:", "AI:"]
  }
  ```
- **Response**:
  ```json
  {
    "content": "Generated text",
    "stop_reason": "max_tokens",
    "tokens_generated": 512
  }
  ```

#### POST `/chat/completions`

- **Description**: OpenAI-compatible chat completion
- **Request Body**:
  ```json
  {
    "model": "model-name",
    "messages": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hi there!" }
    ],
    "max_tokens": 1024,
    "stream": false
  }
  ```

#### GET `/models`

- **Description**: List loaded models
- **Response**:
  ```json
  {
    "models": [
      {
        "id": "model-name",
        "object": "model",
        "created": 1234567890,
        "owned_by": "local"
      }
    ]
  }
  ```

### Health Check

#### GET `/health`

- **Description**: Check server health
- **Response**:
  ```json
  {
    "status": "ok",
    "model": "current-model",
    "uptime": 3600,
    "slots_used": 1,
    "slots_total": 1
  }
  ```

## Error Handling

### Error Codes

| Code | Description            | Resolution                          |
| ---- | ---------------------- | ----------------------------------- |
| 1001 | Model not found        | Check model path and file existence |
| 1002 | Server already running | Stop existing server first          |
| 1003 | Download failed        | Check URL and network connection    |
| 1004 | Conversion failed      | Check disk space and permissions    |
| 1005 | Quantization failed    | Verify llama.cpp installation       |
| 1006 | Invalid model format   | Use supported model formats only    |

### Error Response Format

```javascript
{
  success: false,
  error: {
    code: 1003,
    message: "Download failed: Network timeout",
    details: "Connection to huggingface.co timed out"
  }
}
```

## Security Considerations

### IPC Security

- All IPC communications use context isolation
- No direct Node.js API exposure to renderer
- Input validation on all parameters
- Path traversal protection for file operations

### API Security

- Server runs on localhost only by default
- No external network access required
- Model files validated before loading
- Temporary files secured with proper permissions

## Usage Examples

### JavaScript (Renderer Process)

```javascript
// Get list of models
const models = await window.electronAPI.invoke('get-models');

// Load a model
await window.electronAPI.invoke('load-model', {
  modelPath: '/path/to/model.gguf',
});

// Listen for download progress
window.electronAPI.on('download-progress', (event, progress) => {
  console.log(`Download progress: ${progress.progress * 100}%`);
});
```

### Python Script

```python
# Direct script execution
result = subprocess.run(['python3', 'download_hf.py', 'mistralai/Mistral-7B', '/models', 'Q4_K_M'])
if result.returncode == 0:
    print("Model downloaded successfully")
```

### REST API (External Applications)

```bash
# Check server health
curl http://localhost:7070/health

# Generate completion
curl -X POST http://localhost:7070/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!", "max_tokens": 100}'
```

---

_This API documentation covers all major interfaces provided by Llama Wrangler for integration and automation._
