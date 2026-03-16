# Quick Start Guide

## Get Up and Running in 5 Minutes

This guide will help you install Llama Wrangler and download your first AI model.

---

## Step 1: Install Llama Wrangler

### Option A: Download Pre-built App (Easiest)

1. **Go to the [Releases page](https://github.com/your-username/llama-wrangler/releases)**
2. **Download for your platform**:
   - macOS: `Llama-Wrangler-*.dmg`
   - Windows: `Llama-Wrangler-Setup-*.exe`
   - Linux: `Llama-Wrangler-*.AppImage`

3. **Install**:
   - macOS: Open DMG, drag to Applications
   - Windows: Run installer as Administrator
   - Linux: Make AppImage executable, run it

### Option B: Build from Source

```bash
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler
npm install
npm run build
npm run start
```

---

## Step 2: Launch the Application

1. **Open Llama Wrangler** from your applications menu
2. **Grant permissions** when prompted (required for model management)
3. **Wait for initialization** - first launch takes a minute

The main window will show:

- **Server Status** (should start automatically)
- **Model Library** (empty initially)
- **Download Controls**

---

## Step 3: Download Your First Model

### Recommended First Model: TinyLlama

TinyLlama is small (500MB), fast, and perfect for testing:

1. **Click the "Download" tab**
2. **Enter model URL**:
   ```
   https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0-GGUF
   ```
3. **Click "Download"**
4. **Wait for download** - progress bar shows status

### Alternative: Download from Ollama

1. **Switch to "Ollama" tab**
2. **Enter model name**: `tinyllama`
3. **Click "Download from Ollama"**

---

## Step 4: Start Using the Model

1. **Wait for download to complete**
2. **Model appears in "Model Library"**
3. **Click "Load Model"**
4. **Server automatically restarts** with new model
5. **Open the embedded browser** to chat with your model

The chat interface opens at `http://localhost:7070`

---

## Step 5: Try a Larger Model (Optional)

Once you've confirmed everything works:

### Llama 2 7B Chat

1. **Download URL**:
   ```
   https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF
   ```
2. **Select file**: `llama-2-7b-chat.Q4_K_M.gguf`
3. **Download** (about 4GB)

### Mistral 7B

1. **Download URL**:
   ```
   https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF
   ```
2. **Select file**: `mistral-7b-instruct-v0.2.Q4_K_M.gguf`
3. **Download** (about 4.1GB)

---

## What's Happening Behind the Scenes?

When you download a model:

1. **Download**: Model files are downloaded to `~/.llama-wrangler/models/`
2. **Conversion**: If needed, models are converted to GGUF format
3. **Quantization**: Models are optimized to Q4_K_M format
4. **Registration**: Model appears in your library
5. **Server Update**: Llama.cpp server loads the new model

---

## Basic Usage Tips

### Switching Between Models

1. **Go to "Model Library"**
2. **Click on any downloaded model**
3. **Click "Load Model"**
4. **Server restarts** automatically (takes ~10 seconds)

### Monitoring Resources

- **CPU Usage**: Shown in server status
- **Memory Usage**: Displayed for each model
- **GPU Acceleration**: Automatically enabled if available

### Managing Storage

1. **Right-click any model** → "Delete" to remove
2. **Check storage usage** in settings
3. **Models are stored** in `~/.llama-wrangler/models/`

---

## Common First-Time Questions

### Why does the first download take so long?

The app needs to:

- Download llama.cpp server (first time only)
- Download the model
- Convert/quantize if needed

Subsequent downloads are faster.

### Can I use the models offline?

Yes! Once downloaded, models work completely offline.

### What's the difference between model sources?

- **HuggingFace**: Largest collection, more options
- **Ollama**: Curated, easier names, automatic conversion

### How do I know which model to choose?

- **< 1B**: Testing, minimal resources
- **7B**: Good balance of quality/speed
- **13B+**: High quality, needs more RAM

---

## Next Steps

### Explore More Features

1. **Try different models** from HuggingFace
2. **Adjust server settings** (GPU layers, context size)
3. **Use the API** for your own applications
4. **Check out the documentation** for advanced features

### Recommended Reading

- [User Guide](./USER_GUIDE.md) - Complete feature overview
- [Model Guide](./MODEL_GUIDE.md) - Understanding different models
- [API Documentation](./API.md) - Integration guide
- [FAQ](./FAQ.md) - Common questions

### Join the Community

- **Discord**: Real-time chat with other users
- **GitHub**: Report issues, request features
- **Discussions**: Share tips and models

---

## Troubleshooting

### Server Won't Start

1. **Check if port 7070 is free**:

   ```bash
   # macOS/Linux
   lsof -i :7070

   # Windows
   netstat -ano | findstr :7070
   ```

2. **Restart the app** as administrator

### Download Fails

1. **Check internet connection**
2. **Verify the URL** is correct
3. **Try a different model**

### Model Loads Slowly

1. **Enable GPU acceleration** in settings
2. **Reduce context size** if memory is low
3. **Try a smaller model**

---

## Quick Reference

### Essential Commands

| Action         | How to Do It                |
| -------------- | --------------------------- |
| Start server   | Click "Start Server" button |
| Download model | Paste URL, click "Download" |
| Switch models  | Click model → "Load Model"  |
| Delete model   | Right-click → "Delete"      |
| Open chat      | Click "Open Chat Interface" |

### Default Locations

| Platform | Model Directory                    | Config File                                                |
| -------- | ---------------------------------- | ---------------------------------------------------------- |
| macOS    | `~/.llama-wrangler/models/`        | `~/Library/Application Support/llama-wrangler/config.json` |
| Windows  | `%APPDATA%\llama-wrangler\models\` | `%APPDATA%\llama-wrangler\config.json`                     |
| Linux    | `~/.llama-wrangler/models/`        | `~/.config/llama-wrangler/config.json`                     |

### Keyboard Shortcuts

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Cmd/Ctrl + N` | New download       |
| `Cmd/Ctrl + ,` | Settings           |
| `Cmd/Ctrl + R` | Restart server     |
| `F5`           | Refresh model list |

---

## You're All Set! 🎉

You now have:

- ✅ Llama Wrangler installed
- ✅ A working AI model
- ✅ Knowledge of basic operations
- ✅ Resources for learning more

Enjoy exploring the world of local AI models!

---

_Need help? Check our [FAQ](./FAQ.md) or [open an issue](https://github.com/your-username/llama-wrangler/issues)_

_Last updated: 2024-01-XX_
