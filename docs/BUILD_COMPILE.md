# Build and Compilation Guide

## Overview

This guide covers building Llama Wrangler from source, compiling for different platforms, and creating distributable packages.

## Prerequisites

### System Requirements

- **Node.js** 18+ and npm
- **Python** 3.8+ (for model conversion scripts)
- **Git** (for cloning llama.cpp)
- **Platform-specific tools**:
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools
  - Linux: GCC/Clang and development libraries

### Dependencies Installation

```bash
# Clone repository
git clone https://github.com/llamawrangler/llama-wrangler.git
cd llama-wrangler

# Install Node.js dependencies
npm install

# Verify Python dependencies (optional, will auto-install)
python3 -c "import huggingface_hub, requests, tqdm"
```

## Development Build

### Quick Development Build

```bash
# Run in development mode with hot reload
npm run dev

# Development with DevTools
npm run devtools

# Build for current platform (development)
npm run build
```

### Development Build Options

```bash
# Build with debugging symbols
npm run build:dev

# Build with verbose output
DEBUG=llama-wrangler:* npm run build

# Build specific architecture
npm run build:mac-x64    # macOS Intel
npm run build:mac-arm64   # macOS Apple Silicon
npm run build:win-x64    # Windows 64-bit
npm run build:linux-x64  # Linux 64-bit
```

## Production Build

### Single Platform Build

```bash
# Build for current platform
npm run dist

# Platform-specific builds
npm run dist:mac        # macOS (Intel + ARM)
npm run dist:win        # Windows (x64 + ia32)
npm run dist:linux      # Linux (x64)

# Build with code signing
npm run dist:signed    # Requires certificates
```

### Maximum Build (All Platforms)

```bash
# Build for all supported platforms and architectures
npm run dist:maximum

# This creates:
# - macOS: DMG, PKG, ZIP (Intel + ARM)
# - Windows: EXE, MSI, portable (x64 + ia32)
# - Linux: AppImage, DEB, RPM, SNAP (x64)
```

### Build Configuration

#### package.json Build Scripts

```json
{
  "scripts": {
    "build": "electron-builder --publish=never",
    "dist": "electron-builder --publish=never --config.npmRebuild=false",
    "dist:maximum": "electron-builder -mwl --publish=never",
    "dist:mac": "electron-builder --mac --publish=never",
    "dist:win": "electron-builder --win --publish=never",
    "dist:linux": "electron-builder --linux --publish=never"
  }
}
```

#### electron-builder Configuration

```json
{
  "build": {
    "appId": "com.llamawrangler.app",
    "productName": "Llama Wrangler",
    "directories": {
      "output": "dist"
    },
    "files": ["src/**/*", "scripts/**/*", "resources/**/*", "package.json"],
    "extraResources": [
      {
        "from": "scripts/",
        "to": "scripts/",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "resources/icons/icon.icns",
      "hardenedRuntime": true,
      "entitlements": "resources/entitlements.mac.plist",
      "entitlementsInherit": "resources/entitlements.mas.inherit.plist"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "msi",
          "arch": ["x64"]
        }
      ],
      "icon": "resources/icons/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "DEB", "RPM", "SNAP"],
      "icon": "resources/icons/icon.png",
      "category": "Utility"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## Platform-Specific Builds

### macOS

#### Prerequisites

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p
```

#### Build Commands

```bash
# Build for current architecture
npm run dist:mac

# Build for specific architectures
npm run build:mac-x64   # Intel Macs
npm run build:mac-arm64  # Apple Silicon

# Create universal binary
lipo -create dist/mac-x64/Llama\ Wrangler.app \
               dist/mac-arm64/Llama\ Wrangler.app \
               -output dist/mac/Llama\ Wrangler.app
```

#### Code Signing (Optional)

```bash
# Install developer certificate
# Configure in keychain

# Sign with electron-builder
npm run dist:signed

# Manual signing
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  "dist/Llama Wrangler.app"

# Notarize (for distribution)
xcrun altool --notarize-app \
  --primary-bundle-id "com.llamawrangler.app" \
  --username "your@email.com" \
  --password "@keychain:AC_PASSWORD" \
  --file "dist/Llama Wrangler.dmg"
```

### Windows

#### Prerequisites

```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Install with chocolatey
choco install visualstudio2019buildtools
```

#### Build Commands

```bash
# Build for Windows
npm run dist:win

# Specific architectures
npm run build:win-x64   # 64-bit
npm run build:win-ia32  # 32-bit

# Create installer
electron-builder --win nsis --x64
```

#### Code Signing (Optional)

```bash
# Install certificate to Windows certificate store

# Configure in build
CSC_LINK="https://your-certificate-url"
CSC_KEY_PASSWORD="your-password"

# Build with signing
npm run dist:signed
```

### Linux

#### Prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential libnss3-dev libatk-bridge2.0-0 \
  libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
  libxss1 libasound2-dev libxtst6-dev

# Fedora/CentOS
sudo dnf install -y gcc-c++ nss-devel atk-devel \
  libdrm-devel libXcomposite-devel libXcursor-devel \
  libXdamage-devel libXrandr-devel libXinerama-devel \
  libXi-devel libXtst-devel alsa-lib-devel
```

#### Build Commands

```bash
# Build for Linux
npm run dist:linux

# Create AppImage
npm run build:linux-appimage

# Create DEB package
npm run build:linux-deb

# Create RPM package
npm run build:linux-rpm
```

## Build Optimization

### Reducing Bundle Size

```bash
# Analyze bundle size
npm run bloat-check

# Exclude unnecessary files
# Update electron-builder config:
"files": [
  "src/**/*",
  "!src/tests/**/*",
  "!**/*.md"
]

# Use compression
"compression": "maximum"
```

### Parallel Builds

```bash
# Build multiple architectures in parallel
npm run dist:maximum

# Or manually:
npm run dist:mac & \
npm run dist:win & \
npm run dist:linux &
wait
```

### Caching Strategies

```bash
# Enable npm cache
npm config set cache ~/.npm-cache

# Use electron-builder cache
electron-builder --publish=never --config.npmRebuild=false

# Clean cache if needed
npm cache clean --force
rm -rf ~/.cache/electron-builder
```

## Troubleshooting

### Common Build Issues

#### "Module not found" Errors

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
npm --version
```

#### Platform-Specific Errors

**macOS Codesign Error**:

```bash
# Check certificate
security find-identity -v -p codesigning

# Verify signing
codesign -dv "dist/Llama Wrangler.app"
```

**Windows MSI Errors**:

```bash
# Clean temp files
rmdir /s /q %TEMP%

# Run as administrator
```

**Linux Dependency Errors**:

```bash
# Check library dependencies
ldd "dist/linux-unpacked/Llama Wrangler"

# Install missing libraries
sudo apt install -y missing-library-name
```

### Build Verification

#### Test Build Artifacts

```bash
# macOS
hdiutil attach "dist/Llama Wrangler-*.dmg"
open "/Volumes/Llama Wrangler/Llama Wrangler.app"

# Windows
dist\win-unpacked\Llama\ Wrangler.exe

# Linux
chmod +x "dist/Llama Wrangler-*.AppImage"
"./dist/Llama Wrangler-*.AppImage"
```

#### Automated Testing

```bash
# Run basic smoke test
npm test

# Manual testing checklist
- [ ] Application launches
- [ ] Main window appears
- [ ] Model list loads
- [ ] Download functionality works
- [ ] Server starts correctly
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Build
on: [push, pull_request]
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run dist
```

### Build Scripts

#### build-universal.sh

The project includes a comprehensive build script that handles:

- Multi-platform compilation
- Dependency checking
- Code signing (if certificates available)
- Artifact organization
- Cleanup and optimization

```bash
# Usage
./scripts/build-universal.sh [options]

# Options
--clean         # Clean before building
--sign          # Code sign if possible
--all           # Build all platforms
--mac-only      # Build macOS only
--win-only      # Build Windows only
--linux-only    # Build Linux only
```

## Release Process

### Pre-Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Verify build on all platforms
- [ ] Test installers
- [ ] Check code signing

### Release Commands

```bash
# Clean build
npm run clean

# Install dependencies
npm ci

# Build all platforms
npm run dist:maximum

# Create release tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will auto-build and create release
```

---

_This guide provides comprehensive instructions for building Llama Wrangler on all supported platforms._
