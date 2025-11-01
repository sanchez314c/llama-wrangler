# Llama Wrangler Setup Guide

## Prerequisites

### System Requirements
- **Operating System**: macOS 10.14+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Memory**: 8GB RAM minimum (16GB+ recommended for large models)
- **Storage**: 50GB+ free space (varies by model collection)
- **Internet**: Broadband connection for model downloads

### Software Dependencies
- **Node.js**: Version 16.x or higher
- **npm**: Comes with Node.js
- **Python**: Version 3.7+ with pip
- **Git**: For development builds only

## Installation Methods

### Method 1: Download Pre-built Binary (Recommended)
1. Visit the [Releases Page](https://github.com/llamawrangler/llama-wrangler/releases)
2. Download the appropriate installer for your platform:
   - **macOS**: `Llama-Wrangler-1.0.0.dmg` or `Llama-Wrangler-1.0.0-arm64.dmg`
   - **Windows**: `Llama Wrangler Setup 1.0.0.exe`
   - **Linux**: `Llama-Wrangler-1.0.0.AppImage`
3. Run the installer and follow the setup wizard

### Method 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/llamawrangler/llama-wrangler.git
cd llama-wrangler

# Install dependencies
npm install

# Run from source
npm start

# Or build distributable
npm run dist
```

## First-Time Setup

### 1. Python Dependencies
The application will attempt to install required Python packages automatically. If this fails:

```bash
# Install manually
pip install huggingface-hub requests tqdm
```

### 2. llama.cpp Installation
On first run, the application will:
1. Download and compile llama.cpp
2. Configure GPU support if available
3. Test the installation

This process may take 5-15 minutes depending on your system.

### 3. Storage Configuration
- Default model storage: `~/.llama-wrangler/models/`
- Change location in Settings → Storage
- Ensure sufficient disk space (models range from 2GB to 100GB+)

## GPU Acceleration Setup

### macOS (Metal)
- Automatic detection on Apple Silicon Macs
- M1/M2/M3 chips supported out of the box
- Intel Macs use CPU only

### Windows (CUDA)
1. Install [CUDA Toolkit 11.8+](https://developer.nvidia.com/cuda-toolkit)
2. Install [cuDNN](https://developer.nvidia.com/cudnn)
3. Restart the application for GPU detection

### Linux (CUDA/OpenCL)
```bash
# For NVIDIA GPUs (CUDA)
sudo apt install nvidia-cuda-toolkit nvidia-cuda-dev

# For AMD GPUs (OpenCL)
sudo apt install ocl-icd-opencl-dev opencl-headers

# Restart application after installation
```

## Troubleshooting

### Common Issues

#### "Python not found" Error
**Solution**: Install Python from [python.org](https://python.org) or use package manager:
```bash
# macOS
brew install python3

# Ubuntu/Debian
sudo apt install python3 python3-pip

# Windows
# Download from python.org
```

#### "Permission denied" on macOS
**Solution**: Right-click the app and select "Open", then click "Open" in the security dialog.

#### Models not downloading
**Causes**: 
- Network connectivity issues
- Insufficient disk space
- Antivirus blocking downloads

**Solutions**:
1. Check internet connection
2. Free up disk space
3. Add exception to antivirus software
4. Try downloading smaller models first

#### Server won't start
**Causes**:
- Port 7070 already in use
- Missing GPU drivers
- Corrupted model files

**Solutions**:
1. Change server port in Settings
2. Update GPU drivers
3. Re-download affected models

### Getting Help
- Check the [Wiki](https://github.com/llamawrangler/llama-wrangler/wiki) for detailed guides
- Search [Issues](https://github.com/llamawrangler/llama-wrangler/issues) for similar problems
- Join our [Discord Community](https://discord.gg/llamawrangler) for real-time help
- Create a [New Issue](https://github.com/llamawrangler/llama-wrangler/issues/new) with:
  - Operating system and version
  - Error messages or logs
  - Steps to reproduce the problem

## Performance Tips

### For Better Performance
1. **Use GPU acceleration** when available
2. **Choose appropriate model sizes** for your hardware:
   - 4GB RAM: 3B parameter models or smaller
   - 8GB RAM: 7B parameter models
   - 16GB+ RAM: 13B+ parameter models
3. **Close unnecessary applications** when running large models
4. **Use SSD storage** for faster model loading

### Model Recommendations by Hardware

| RAM | GPU | Recommended Models |
|-----|-----|--------------------|
| 8GB | None | Llama2-7B-Q4_K_M |
| 16GB | RTX 3060 | Llama2-13B-Q4_K_M |
| 32GB | RTX 4080 | Llama2-70B-Q4_K_M |
| 64GB+ | RTX 4090 | Any model |

## Advanced Configuration

### Custom Model Sources
Add custom repositories in `~/.llama-wrangler/config.json`:
```json
{
  "modelSources": [
    {
      "name": "Custom Repository",
      "url": "https://your-repo.com/models",
      "type": "huggingface"
    }
  ]
}
```

### Server Configuration
Modify server settings for advanced users:
```json
{
  "server": {
    "port": 7070,
    "host": "localhost",
    "gpuLayers": 999,
    "contextSize": 4096,
    "threads": -1
  }
}
```