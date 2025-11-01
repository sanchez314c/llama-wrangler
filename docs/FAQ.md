# FAQ

## Table of Contents

1. [General Questions](#general-questions)
2. [Installation & Setup](#installation--setup)
3. [Model Management](#model-management)
4. [Technical Issues](#technical-issues)
5. [Development](#development)

---

## General Questions

### What is Llama Wrangler?

Llama Wrangler is a desktop application that simplifies managing Large Language Models (LLMs). It provides a graphical interface for downloading models from HuggingFace and Ollama, automatically converting them to GGUF format, and hot-swapping between models instantly using a local llama.cpp server.

### What platforms are supported?

Llama Wrangler supports:

- **macOS** (Intel and Apple Silicon)
- **Windows** (x64)
- **Linux** (x64, ARM64)

### What model formats are supported?

- **Input**: HuggingFace models, Ollama models
- **Output**: GGUF format (optimized for llama.cpp)
- **Quantization**: Q4_K_M (default, balanced quality/size)

### Is Llama Wrangler free?

Yes, Llama Wrangler is open-source and free to use. It's licensed under the MIT License.

---

## Installation & Setup

### How do I install Llama Wrangler?

#### Option 1: Download Release

1. Go to the [Releases page](https://github.com/your-username/llama-wrangler/releases)
2. Download the appropriate version for your platform
3. Run the installer

#### Option 2: Build from Source

```bash
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler
npm install
npm run build
```

### What are the system requirements?

**Minimum Requirements:**

- **RAM**: 8GB (16GB+ recommended for large models)
- **Storage**: 10GB free space (models can be 1-20GB each)
- **GPU**: Optional but recommended for acceleration
- **OS**: macOS 10.15+, Windows 10+, or modern Linux

**Recommended:**

- **RAM**: 32GB+
- **Storage**: SSD with 50GB+ free space
- **GPU**: Metal (macOS), CUDA (Windows/Linux), or ROCm (AMD)

### Why does the app need admin/root privileges?

Llama Wrangler needs elevated permissions to:

- Install and manage the llama.cpp server as a system service
- Access system-level GPU acceleration
- Manage files in protected directories

---

## Model Management

### Where are models stored?

Models are stored in:

- **macOS**: `~/.llama-wrangler/models/`
- **Windows**: `%APPDATA%\llama-wrangler\models\`
- **Linux**: `~/.llama-wrangler/models/`

### How do I download a model?

1. **From HuggingFace**:
   - Copy the model URL (e.g., `https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF`)
   - Paste it in the app's download field
   - Click "Download"

2. **From Ollama**:
   - Enter the model name (e.g., `llama2`)
   - Click "Download from Ollama"

### Can I use my own models?

Yes! You can:

1. Copy GGUF models to the models directory
2. Use the "Add Local Model" feature
3. The app will detect and make them available

### How do I delete a model?

1. Go to the "Model Library" tab
2. Right-click on the model
3. Select "Delete"
4. Confirm the deletion

### What is quantization?

Quantization reduces model size and memory usage by:

- Converting weights from 16-bit to 4-bit
- Maintaining most of the model's quality
- Enabling faster inference on consumer hardware

---

## Technical Issues

### The server won't start. What should I do?

1. **Check port availability**:

   ```bash
   # macOS/Linux
   lsof -i :7070

   # Windows
   netstat -ano | findstr :7070
   ```

2. **Check logs**:
   - macOS/Linux: `~/.llama-wrangler/logs/`
   - Windows: `%APPDATA%\llama-wrangler\logs\`

3. **Restart the service**:
   - Use the "Restart Server" button in the app
   - Or restart the entire application

### Models are downloading slowly. How can I speed this up?

1. **Check your internet connection**
2. **Use a VPN** if HuggingFace is slow in your region
3. **Download one model at a time**
4. **Close other bandwidth-intensive applications**

### The app crashes when downloading large models. Why?

This is usually due to:

- **Insufficient RAM**: Close other applications
- **Disk space**: Ensure you have enough free space
- **Memory leaks**: Restart the app periodically

### GPU acceleration isn't working. How to fix?

1. **Verify GPU support**:
   - macOS: Check Metal support
   - Windows: Install CUDA drivers
   - Linux: Install appropriate drivers

2. **Check server logs** for GPU-related errors

3. **Force GPU usage** in settings:
   ```json
   {
     "gpu_layers": -1
   }
   ```

---

## Development

### How do I set up a development environment?

```bash
# Clone the repository
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run with DevTools
npm run devtools
```

### How do I add a new model source?

1. **Create a new Python script** in `scripts/`
2. **Implement the required interface**:

   ```python
   def download_model(model_id, output_dir, progress_callback):
       # Implementation here
       pass
   ```

3. **Add IPC handler** in `src/main.js`
4. **Update the UI** in `src/renderer.js`
5. **Test thoroughly**

### How do I debug issues?

1. **Enable DevTools**:

   ```bash
   npm run devtools
   ```

2. **Check console logs** in DevTools
3. **Monitor main process logs**:

   ```bash
   tail -f ~/.llama-wrangler/logs/main.log
   ```

4. **Use the Node.js debugger**:
   ```bash
   node --inspect-brk src/main.js
   ```

### Where can I get help?

- **GitHub Issues**: [Create an issue](https://github.com/your-username/llama-wrangler/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/your-invite)
- **Documentation**: [Read the docs](https://your-username.github.io/llama-wrangler)

---

## Common Error Messages

### "Port 7070 is already in use"

Another application is using the required port. Either:

- Close the other application
- Change the port in settings
- Restart your computer

### "Failed to quantize model"

The quantization process failed. Try:

- Checking available disk space
- Ensuring the model downloaded completely
- Restarting the application

### "GPU layers not supported"

Your system doesn't support GPU acceleration. This is normal for:

- Older GPUs
- Certain integrated graphics
- Virtual machines

### "Model format not supported"

The model isn't in a compatible format. Ensure:

- It's a GGUF model
- Or it can be converted to GGUF
- Check the model documentation

---

## Tips & Tricks

### Performance Optimization

1. **Use SSD storage** for models
2. **Allocate more RAM** if possible
3. **Enable GPU acceleration**
4. **Use appropriate quantization**

### Model Selection

- **7B models**: Good for general use, fast
- **13B models**: Better quality, more resources
- **34B+ models**: High quality, requires powerful hardware

### Best Practices

1. **Download models one at a time**
2. **Keep models organized** with clear names
3. **Regularly clean up** unused models
4. **Monitor system resources** during use

---

## Still Have Questions?

If your question isn't answered here:

1. **Check the documentation**: [docs/](./)
2. **Search existing issues**: [GitHub Issues](https://github.com/your-username/llama-wrangler/issues)
3. **Create a new issue**: Provide detailed information
4. **Join the community**: Get help from other users

---

_Last updated: 2024-01-XX_
