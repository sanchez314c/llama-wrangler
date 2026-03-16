# Installation Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Platform-Specific Instructions](#platform-specific-instructions)
4. [Post-Installation Setup](#post-installation-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **Operating System**:
  - macOS 10.15 (Catalina) or later
  - Windows 10 (version 1903) or later
  - Ubuntu 20.04 or equivalent Linux distribution
- **Processor**: 64-bit CPU (x86-64 or ARM64)
- **Memory**: 8 GB RAM
- **Storage**: 10 GB free disk space
- **Network**: Internet connection for model downloads

### Recommended Requirements

- **Operating System**: Latest version of your OS
- **Processor**: Multi-core CPU with 64-bit support
- **Memory**: 16 GB RAM or more
- **Storage**: 50 GB free SSD space
- **Graphics**: GPU with Metal/CUDA/ROCm support
- **Network**: Broadband connection (10 Mbps+)

### Hardware Acceleration Support

- **macOS**: Metal-compatible GPU (Apple Silicon or AMD)
- **Windows**: NVIDIA GPU with CUDA 11.0+ or AMD GPU with ROCm
- **Linux**: NVIDIA GPU with CUDA 11.0+ or AMD GPU with ROCm

---

## Installation Methods

### Method 1: Pre-built Binary (Recommended)

#### Downloading Releases

1. Navigate to the [Releases page](https://github.com/your-username/llama-wrangler/releases)
2. Download the appropriate file for your platform:
   - **macOS**: `Llama-Wrangler-*.dmg` or `Llama-Wrangler-*.pkg`
   - **Windows**: `Llama-Wrangler-Setup-*.exe`
   - **Linux**: `Llama-Wrangler-*.AppImage` or `llama-wrangler-*.deb`

#### Installation Steps

**macOS**:

```bash
# Using DMG
open Llama-Wrangler-*.dmg
# Drag app to Applications folder

# Using PKG
sudo installer -pkg Llama-Wrangler-*.pkg -target /
```

**Windows**:

```powershell
# Run installer as Administrator
.\Llama-Wrangler-Setup-*.exe
# Follow installation wizard
```

**Linux**:

```bash
# AppImage (universal)
chmod +x Llama-Wrangler-*.AppImage
./Llama-Wrangler-*.AppImage

# Debian/Ubuntu
sudo dpkg -i llama-wrangler-*.deb
sudo apt-get install -f  # Fix dependencies if needed
```

### Method 2: Package Manager

#### Homebrew (macOS)

```bash
brew tap your-username/llama-wrangler
brew install llama-wrangler
```

#### Chocolatey (Windows)

```powershell
choco install llama-wrangler
```

#### Snap (Linux)

```bash
sudo snap install llama-wrangler
```

### Method 3: Build from Source

#### Prerequisites

- **Node.js**: Version 18.0 or later
- **npm**: Version 8.0 or later
- **Python**: Version 3.8 or later (for model conversion)
- **Git**: For cloning the repository

#### Build Steps

```bash
# Clone the repository
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Build the application
npm run build

# Run in development mode (optional)
npm run dev
```

---

## Platform-Specific Instructions

### macOS Installation

#### Using DMG (Recommended)

1. Download `Llama-Wrangler-*.dmg`
2. Double-click to mount the disk image
3. Drag "Llama Wrangler.app" to Applications folder
4. Launch from Applications or Launchpad

#### Using PKG

1. Download `Llama-Wrangler-*.pkg`
2. Double-click the package file
3. Follow the installation wizard
4. Enter admin password when prompted

#### Granting Permissions

macOS may require additional permissions:

**Gatekeeper**:

```bash
# If app is blocked
sudo xattr -rd com.apple.quarantine "/Applications/Llama Wrangler.app"
```

**Accessibility** (for hotkeys):

1. Open System Preferences > Security & Privacy > Privacy
2. Click "Accessibility" in the left sidebar
3. Click the lock and enter password
4. Add "Llama Wrangler" to the list

**Full Disk Access** (for model management):

1. Open System Preferences > Security & Privacy > Privacy
2. Click "Full Disk Access"
3. Add "Llama Wrangler" to the list

### Windows Installation

#### Standard Installation

1. Download `Llama-Wrangler-Setup-*.exe`
2. Right-click and "Run as administrator"
3. Follow the installation wizard
4. Choose installation directory (default: `C:\Program Files\Llama Wrangler`)
5. Create desktop shortcut (optional)

#### Windows Defender Exclusion

To prevent false positives:

1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Add "Llama Wrangler" to exclusion list

#### Firewall Configuration

1. When prompted, allow "Llama Wrangler" through firewall
2. Select both "Private" and "Public" networks
3. This enables model downloads and server communication

### Linux Installation

#### Ubuntu/Debian

```bash
# Download .deb package
wget https://github.com/your-username/llama-wrangler/releases/latest/download/llama-wrangler-*.deb

# Install
sudo dpkg -i llama-wrangler-*.deb
sudo apt-get install -f  # Fix dependencies

# Launch
llama-wrangler
```

#### AppImage (Universal)

```bash
# Download
wget https://github.com/your-username/llama-wrangler/releases/latest/download/Llama-Wrangler-*.AppImage

# Make executable
chmod +x Llama-Wrangler-*.AppImage

# Run
./Llama-Wrangler-*.AppImage
```

#### From Source

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip git

# Clone and build
git clone https://github.com/your-username/llama-wrangler.git
cd llama-wrangler
npm install
npm run build
npm run start
```

---

## Post-Installation Setup

### First Launch

1. **Launch the application** from your applications menu or desktop
2. **Grant permissions** when prompted (varies by platform)
3. **Wait for initialization** - the app will:
   - Create configuration directory
   - Install llama.cpp server
   - Set up default settings

### Configuration

#### Default Settings

The app creates a configuration file at:

- **macOS**: `~/Library/Application Support/llama-wrangler/config.json`
- **Windows**: `%APPDATA%\llama-wrangler\config.json`
- **Linux**: `~/.config/llama-wrangler/config.json`

#### Custom Settings

You can customize:

- **Server port**: Default is 7070
- **Model directory**: Default is `~/.llama-wrangler/models/`
- **GPU layers**: Auto-detected, can be manually set
- **Download location**: Can be changed in settings

#### Example Configuration

```json
{
  "server": {
    "port": 7070,
    "host": "127.0.0.1",
    "gpu_layers": -1,
    "context_size": 2048
  },
  "models": {
    "directory": "~/.llama-wrangler/models/",
    "auto_convert": true,
    "quantization": "Q4_K_M"
  },
  "ui": {
    "theme": "dark",
    "language": "en"
  }
}
```

### Model Directory Setup

The app will automatically create the model directory:

```bash
# Default location
~/.llama-wrangler/
├── models/          # Downloaded models
├── llama.cpp/       # Server installation
├── config.json      # Configuration
└── logs/           # Application logs
```

---

## Verification

### Verify Installation

#### Check Application Version

1. Open Llama Wrangler
2. Go to Help > About
3. Verify version matches the latest release

#### Test Server

1. Click "Start Server" in the app
2. Check if server starts successfully
3. Verify status shows "Running"

#### Test Model Download

1. Find a small model (e.g., `tinyllama`)
2. Attempt to download
3. Verify download completes successfully

### Command Line Verification

#### Check Server Status

```bash
# macOS/Linux
lsof -i :7070

# Windows
netstat -ano | findstr :7070
```

#### Check Logs

```bash
# macOS/Linux
tail -f ~/.llama-wrangler/logs/server.log

# Windows
type "%APPDATA%\llama-wrangler\logs\server.log"
```

---

## Troubleshooting

### Common Issues

#### Application Won't Start

**macOS**:

```bash
# Check quarantine status
xattr -l "/Applications/Llama Wrangler.app"

# Remove if blocked
sudo xattr -rd com.apple.quarantine "/Applications/Llama Wrangler.app"
```

**Windows**:

- Check Windows Event Viewer for errors
- Run as administrator
- Install Visual C++ Redistributable

**Linux**:

```bash
# Check dependencies
ldd /opt/llama-wrangler/llama-wrangler

# Install missing libraries
sudo apt install -f
```

#### Server Fails to Start

1. **Check port availability**:

   ```bash
   # Kill process using port 7070
   sudo kill -9 $(lsof -t -i:7070)
   ```

2. **Check permissions**:
   - Ensure app has write permissions to model directory
   - Run as administrator if needed

3. **Reinstall server**:
   - Delete `~/.llama-wrangler/llama.cpp/`
   - Restart app to trigger reinstallation

#### Model Downloads Fail

1. **Check internet connection**
2. **Verify URL format**:
   - HuggingFace: `https://huggingface.co/user/model-name`
   - Ollama: `model-name`
3. **Check disk space**:
   ```bash
   df -h ~/.llama-wrangler/
   ```

#### GPU Acceleration Not Working

1. **Verify GPU drivers**:
   - macOS: Check Metal support
   - Windows: Update NVIDIA/AMD drivers
   - Linux: Install CUDA/ROCm

2. **Check server logs** for GPU-related errors

3. **Force GPU usage** in configuration:
   ```json
   {
     "server": {
       "gpu_layers": -1
     }
   }
   ```

### Getting Help

If you encounter issues:

1. **Check the logs**:
   - Application logs in `~/.llama-wrangler/logs/`
   - Console output in DevTools (F12)

2. **Search existing issues**:
   - [GitHub Issues](https://github.com/your-username/llama-wrangler/issues)

3. **Create a new issue** with:
   - Operating system and version
   - Application version
   - Error messages
   - Steps to reproduce

4. **Join the community**:
   - Discord server for real-time help
   - Discussion forums for general questions

---

## Next Steps

After successful installation:

1. **Read the [Quick Start Guide](./QUICK_START.md)**
2. **Download your first model**
3. **Explore the [User Guide](./USER_GUIDE.md)**
4. **Join the community** for tips and support

---

_Last updated: 2024-01-XX_
