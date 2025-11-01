# Troubleshooting Guide

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Server Problems](#server-problems)
3. [Model Download Issues](#model-download-issues)
4. [Performance Problems](#performance-problems)
5. [GPU Acceleration](#gpu-acceleration)
6. [Platform-Specific Issues](#platform-specific-issues)
7. [Getting Help](#getting-help)

---

## Installation Issues

### Application Won't Start

#### macOS

**Error**: "Llama Wrangler" can't be opened because Apple cannot check it for malicious software.

**Solution**:

```bash
# Allow the app to run
sudo xattr -rd com.apple.quarantine "/Applications/Llama Wrangler.app"
```

**Error**: The application is damaged and can't be opened.

**Solution**:

1. Delete the app
2. Re-download from the official releases page
3. Verify the checksum if provided

#### Windows

**Error**: "Windows protected your PC"

**Solution**:

1. Click "More info"
2. Click "Run anyway"
3. Or add exception in Windows Security

**Error**: Missing DLL files

**Solution**:

1. Install Microsoft Visual C++ Redistributable
2. Install the latest Windows updates
3. Run Windows System File Checker:
   ```powershell
   sfc /scannow
   ```

#### Linux

**Error**: Permission denied

**Solution**:

```bash
# Make AppImage executable
chmod +x Llama-Wrangler-*.AppImage

# Or install with sudo
sudo dpkg -i llama-wrangler-*.deb
```

**Error**: Missing dependencies

**Solution**:

```bash
# Ubuntu/Debian
sudo apt-get install -f

# Fedora
sudo dnf install $(rpm -qpR llama-wrangler-*.rpm)

# Arch
sudo pacman -Syu
```

---

## Server Problems

### Server Won't Start

#### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::7070`

**Diagnosis**:

```bash
# macOS/Linux
lsof -i :7070

# Windows
netstat -ano | findstr :7070
```

**Solutions**:

1. **Kill the process**:

   ```bash
   # macOS/Linux
   sudo kill -9 $(lsof -t -i:7070)

   # Windows
   taskkill /PID <PID> /F
   ```

2. **Change the port** in settings:
   - Open Settings
   - Change Server Port from 7070 to another port (e.g., 8080)

3. **Restart your computer** to clear all processes

#### Server Crashes on Startup

**Check logs**:

```bash
# macOS/Linux
tail -f ~/.llama-wrangler/logs/server.log

# Windows
type "%APPDATA%\llama-wrangler\logs\server.log"
```

**Common causes and fixes**:

1. **Corrupted llama.cpp installation**:

   ```bash
   # Delete and reinstall
   rm -rf ~/.llama-wrangler/llama.cpp/
   # Restart the app to trigger reinstallation
   ```

2. **Insufficient permissions**:
   - Run as administrator/root
   - Check write permissions to model directory

3. **Missing system libraries**:
   - macOS: Install Xcode Command Line Tools
   - Linux: Install `build-essential` package

### Server Stops Unexpectedly

**Symptoms**:

- Server starts but stops after a few seconds
- Model loading fails

**Troubleshooting steps**:

1. **Check system resources**:

   ```bash
   # Check memory usage
   free -h  # Linux
   vm_stat  # macOS

   # Check disk space
   df -h ~/.llama-wrangler/
   ```

2. **Reduce model size**:
   - Try a smaller model (e.g., TinyLlama)
   - Reduce context size in settings

3. **Disable GPU acceleration** temporarily:
   ```json
   {
     "server": {
       "gpu_layers": 0
     }
   }
   ```

---

## Model Download Issues

### Download Fails to Start

**Check**:

1. **Internet connection**:

   ```bash
   ping huggingface.co
   ping ollama.ai
   ```

2. **URL format**:
   - HuggingFace: Must be full URL
   - Ollama: Just model name

3. **Disk space**:
   ```bash
   df -h ~/.llama-wrangler/models/
   ```

### Download Stops Midway

**Symptoms**:

- Progress bar stops
- Network timeout errors

**Solutions**:

1. **Resume the download**:
   - Click the download again
   - The app supports resume functionality

2. **Check network stability**:
   - Use a wired connection
   - Avoid VPNs that might block large downloads

3. **Download manually**:

   ```bash
   # Download directly with wget/curl
   wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf

   # Move to models directory
   mv llama-2-7b-chat.Q4_K_M.gguf ~/.llama-wrangler/models/
   ```

### Model Conversion Fails

**Error**: "Failed to convert model to GGUF"

**Causes and solutions**:

1. **Unsupported model format**:
   - Check if model is already GGUF
   - Some models cannot be converted

2. **Insufficient RAM**:
   - Close other applications
   - Try with a smaller model

3. **Python dependencies missing**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Performance Problems

### Slow Model Loading

**Symptoms**:

- Model takes minutes to load
- UI freezes during loading

**Optimizations**:

1. **Enable GPU acceleration**:
   - Go to Settings
   - Set GPU layers to -1 (maximum)

2. **Use SSD storage**:
   - Move models to SSD if on HDD
   - Models on HDD load significantly slower

3. **Reduce model size**:
   - Use Q4_K_M quantization (default)
   - Try Q3_K for faster loading

### High Memory Usage

**Symptoms**:

- System becomes sluggish
- Out of memory errors

**Solutions**:

1. **Reduce context size**:

   ```json
   {
     "server": {
       "context_size": 1024
     }
   }
   ```

2. **Use smaller models**:
   - 7B models use ~8GB RAM
   - 13B models use ~16GB RAM

3. **Enable memory mapping**:
   ```json
   {
     "server": {
       "memory_map": true
     }
   }
   ```

### Slow Generation Speed

**Symptoms**:

- Text generates slowly (tokens/second)
- Long delays between responses

**Improvements**:

1. **Increase GPU layers**:
   - Start with 35 layers for 7B models
   - Increase until stable

2. **Batch processing**:

   ```json
   {
     "server": {
       "batch_size": 512
     }
   }
   ```

3. **Reduce context**:
   - Smaller context = faster generation

---

## GPU Acceleration

### GPU Not Detected

**Check GPU support**:

**macOS**:

```bash
# Check Metal support
system_profiler SPDisplaysDataType
```

**Windows (NVIDIA)**:

```powershell
# Check CUDA
nvidia-smi
```

**Linux**:

```bash
# Check NVIDIA
nvidia-smi

# Check AMD
rocm-smi
```

### GPU Errors

**Common errors**:

1. **"CUDA out of memory"**:
   - Reduce GPU layers
   - Use smaller model
   - Reduce batch size

2. **"Metal buffer failed"** (macOS):
   - Update to latest macOS
   - Check if GPU supports Metal
   - Try reducing GPU layers

3. **"ROCm not found"** (AMD Linux):

   ```bash
   # Install ROCm
   sudo apt install rocm-dkms

   # Add to PATH
   echo 'export PATH=$PATH:/opt/rocm/bin' >> ~/.bashrc
   ```

---

## Platform-Specific Issues

### macOS

#### Gatekeeper Blocks App

```bash
# Allow app from unidentified developer
sudo xattr -rd com.apple.quarantine "/Applications/Llama Wrangler.app"
```

#### App Notarization Issues

- Download from official releases only
- Verify checksum if provided

#### Memory Pressure

- Use Activity Monitor to monitor memory
- Close other memory-intensive apps
- Consider using smaller models

### Windows

#### Firewall Blocks Downloads

1. Open Windows Security
2. Go to "Firewall & network protection"
3. Add "Llama Wrangler" to allowed apps

#### Antivirus False Positives

1. Add Llama Wrangler to exclusion list
2. Report false positive to antivirus vendor

#### Path Length Issues

- Enable long path support:
  ```powershell
  Enable-WindowsOptionalFeature -Online -FeatureName LongPathsEnabled
  ```

### Linux

#### Permission Denied Errors

```bash
# Fix permissions
sudo chown -R $USER:$USER ~/.llama-wrangler/
chmod -R 755 ~/.llama-wrangler/
```

#### Missing System Libraries

```bash
# Ubuntu/Debian
sudo apt install build-essential cmake git

# Fedora
sudo dnf groupinstall "Development Tools"
sudo dnf install cmake git

# Arch
sudo pacman -S base-devel cmake git
```

#### Wayland Compatibility

- Use XWayland if issues persist
- Report Wayland-specific bugs

---

## Getting Help

### Before Asking for Help

1. **Check the logs**:

   ```bash
   # Location varies by platform
   ~/.llama-wrangler/logs/
   ```

2. **Gather system information**:

   ```bash
   # Create system report
   uname -a
   python3 --version
   node --version
   ```

3. **Try these steps**:
   - Restart the application
   - Try with a small model (TinyLlama)
   - Check for updates

### Creating a Bug Report

Include this information:

1. **System Details**:
   - OS and version
   - Hardware specs (RAM, GPU)
   - Llama Wrangler version

2. **Problem Description**:
   - What you were trying to do
   - What happened instead
   - Error messages (full text)

3. **Steps to Reproduce**:
   - Detailed steps
   - Model being used
   - Settings configuration

4. **Logs**:
   - Application logs
   - Server logs
   - System logs if relevant

### Community Resources

- **GitHub Issues**: [Create an issue](https://github.com/your-username/llama-wrangler/issues)
- **Discord**: [Join our server](https://discord.gg/your-invite)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/llama-wrangler/discussions)

### Emergency Recovery

If the app won't start:

1. **Backup your models**:

   ```bash
   cp -r ~/.llama-wrangler/models/ ~/llama-wrangler-backup/
   ```

2. **Reset configuration**:

   ```bash
   rm ~/.llama-wrangler/config.json
   ```

3. **Reinstall the app**:
   - Delete the app
   - Download fresh copy
   - Restore models from backup

---

## Quick Fixes Checklist

### Server Issues

- [ ] Check if port 7070 is free
- [ ] Restart as administrator
- [ ] Delete and reinstall llama.cpp
- [ ] Check system resources

### Download Issues

- [ ] Verify internet connection
- [ ] Check URL format
- [ ] Ensure sufficient disk space
- [ ] Try downloading manually

### Performance Issues

- [ ] Enable GPU acceleration
- [ ] Reduce model size
- [ ] Lower context size
- [ ] Close other applications

### Platform Issues

- [ ] macOS: Remove quarantine attribute
- [ ] Windows: Add firewall exception
- [ ] Linux: Fix permissions

---

_Last updated: 2024-01-XX_
