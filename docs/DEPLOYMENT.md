# Deployment Guide

## Overview

This guide covers deploying Llama Wrangler in various environments, from local installations to enterprise deployments.

## Deployment Types

### 1. Standalone Desktop Application

#### Pre-built Binaries (Recommended)

**Download Locations**:

- [GitHub Releases](https://github.com/llamawrangler/llama-wrangler/releases)
- Direct download links for each platform

**Installation by Platform**:

**macOS**:

```bash
# Download DMG
curl -L -o Llama-Wrangler.dmg "https://github.com/llamawrangler/llama-wrangler/releases/latest/download/Llama-Wrangler.dmg"

# Mount and install
hdiutil attach Llama-Wrangler.dmg
cp -R "/Volumes/Llama Wrangler/Llama Wrangler.app" /Applications/
hdiutil detach "/Volumes/Llama Wrangler"
```

**Windows**:

```powershell
# Download installer
Invoke-WebRequest -Uri "https://github.com/llamawrangler/llama-wrangler/releases/latest/download/Llama-Wrangler-Setup.exe" -OutFile "Llama-Wrangler-Setup.exe"

# Run installer
.\Llama-Wrangler-Setup.exe
```

**Linux**:

```bash
# Download AppImage
wget -O Llama-Wrangler.AppImage "https://github.com/llamawrangler/llama-wrangler/releases/latest/download/Llama-Wrangler.AppImage"

# Make executable and run
chmod +x Llama-Wrangler.AppImage
./Llama-Wrangler.AppImage
```

#### Package Manager Installation

**Homebrew (macOS)**:

```bash
# Install via Homebrew (if available)
brew install --cask llama-wrangler
```

**Snap (Linux)**:

```bash
# Install via Snap
sudo snap install llama-wrangler
```

**APT (Debian/Ubuntu)**:

```bash
# Add repository (if available)
sudo add-apt-repository ppa:llamawrangler/ppa
sudo apt update
sudo apt install llama-wrangler
```

### 2. Portable Deployment

#### USB/External Drive Deployment

```bash
# Create portable directory
mkdir /Volumes/USB/LlamaWrangler
cd /Volumes/USB/LlamaWrangler

# Extract portable version
unzip Llama-Wrangler-portable.zip

# Create configuration
mkdir -p config models logs

# Run with custom config
./Llama\ Wrangler.exe --config-dir ./config
```

#### Network Share Deployment

```bash
# Share on network (macOS)
sudo sharing -a -e "Llama Wrangler" /path/to/Llama\ Wrangler.app

# Access from other machines
# Connect to: smb://hostname/Llama Wrangler
```

### 3. Enterprise Deployment

#### Silent Installation

**Windows (MSI)**:

```bash
# Silent install
msiexec /i "Llama Wrangler.msi" /quiet /norestart

# Custom install directory
msiexec /i "Llama Wrangler.msi" /quiet INSTALLDIR="C:\CompanyApps\Llama Wrangler"

# Log installation
msiexec /i "Llama Wrangler.msi" /quiet /l*v "C:\Logs\LlamaWrangler.log"
```

**macOS (PKG)**:

```bash
# Silent install
sudo installer -pkg "Llama Wrangler.pkg" -target / -applyChoiceChangesXML choices.xml

# Custom install location
sudo installer -pkg "Llama Wrangler.pkg" -target /Volumes/CompanyDrive
```

**Linux (DEB/RPM)**:

```bash
# Debian/Ubuntu
sudo dpkg -i llama-wrangler.deb --force-depends

# RedHat/CentOS
sudo rpm -i llama-wrangler.rpm

# Silent with preseed
echo "llama-wrangler llama-wrangler/select" | sudo debconf-set-selections
sudo DEBIAN_FRONTEND=noninteractive dpkg -i llama-wrangler.deb
```

#### Mass Deployment Tools

**PDQ Deploy** (Windows):

```powershell
# Deploy to multiple machines
$computers = @("PC1", "PC2", "PC3")
foreach ($pc in $computers) {
    Copy-Item "Llama Wrangler.msi" "\\$pc\C$\Temp\"
    Invoke-Command -ComputerName $pc -ScriptBlock {
        Start-Process "msiexec.exe" -ArgumentList "/i C:\Temp\Llama Wrangler.msi /quiet"
    }
}
```

**Ansible** (Linux):

```yaml
# playbook.yml
- hosts: all
  become: yes
  tasks:
    - name: Copy AppImage
      copy:
        src: files/Llama-Wrangler.AppImage
        dest: /opt/llama-wrangler/
        mode: '0755'

    - name: Create desktop entry
      copy:
        src: files/llama-wrangler.desktop
        dest: /usr/share/applications/
```

### 4. Container Deployment

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    build-essential

# Install app
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create user
RUN useradd -m -u 1000 appuser
USER appuser

# Expose server port
EXPOSE 7070

# Run application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  llama-wrangler:
    build: .
    ports:
      - '7070:7070'
    volumes:
      - ./models:/home/appuser/.llama-wrangler/models
      - ./config:/home/appuser/.llama-wrangler/config
    environment:
      - NODE_ENV=production
```

#### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llama-wrangler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: llama-wrangler
  template:
    metadata:
      labels:
        app: llama-wrangler
    spec:
      containers:
        - name: llama-wrangler
          image: llamawrangler/llama-wrangler:latest
          ports:
            - containerPort: 7070
          volumeMounts:
            - name: models
              mountPath: /home/user/.llama-wrangler/models
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: llama-models
```

## Configuration Management

### Environment Variables

```bash
# Production configuration
export NODE_ENV=production
export LLAMA_MODELS_DIR=/shared/models
export LLAMA_SERVER_PORT=7070
export LLAMA_CONFIG_FILE=/etc/llama-wrangler/config.json

# Security settings
export LLAMA_NO_GPU=0
export LLAMA_DISABLE_TELEMETRY=1
```

### Configuration Files

#### System-wide Config (Linux)

```json
// /etc/llama-wrangler/config.json
{
  "modelsDirectory": "/opt/llama-wrangler/models",
  "serverPort": 7070,
  "gpuLayers": 999,
  "autoUpdate": false,
  "telemetry": false
}
```

#### User Config Override

```json
// ~/.llama-wrangler/config.json
{
  "modelsDirectory": "/home/user/models",
  "serverPort": 8080,
  "theme": "dark"
}
```

## Security Considerations

### Code Signing

```bash
# Verify signature (macOS)
codesign -dv --verbose=4 /Applications/Llama\ Wrangler.app

# Verify signature (Windows)
signtool verify /v /C/Llama\ Wrangler/Llama\ Wrangler.exe

# GPG verification (Linux)
gpg --verify llama-wrangler.deb.asc llama-wrangler.deb
```

### Sandboxing

#### macOS App Sandbox

```xml
<!-- entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

#### Windows AppLocker

```xml
<!-- AppLocker rule -->
<AppLockerPolicy Version="1">
    <RuleCollection Type="Publisher">
        <FilePathRule Name="Llama Wrangler" Id="GUID" Description="Allow Llama Wrangler" UserOrGroupSid="S-1-1-0" Action="Allow">
            <Conditions>
                <FilePathCondition Path="%PROGRAMFILES%\Llama Wrangler\*" />
            </Conditions>
        </FilePathRule>
    </RuleCollection>
</AppLockerPolicy>
```

## Monitoring and Updates

### Update Configuration

```json
{
  "autoUpdate": {
    "enabled": true,
    "channel": "stable",
    "checkInterval": 86400,
    "allowPrerelease": false
  },
  "updateServer": "https://api.llamawrangler.com/updates"
}
```

### Telemetry

```json
{
  "telemetry": {
    "enabled": false,
    "endpoint": "https://telemetry.llamawrangler.com",
    "data": {
      "version": true,
      "platform": true,
      "usage": false,
      "errors": true
    }
  }
}
```

### Logging Configuration

```json
{
  "logging": {
    "level": "info",
    "file": "/var/log/llama-wrangler/app.log",
    "maxSize": "10MB",
    "rotate": true,
    "remote": {
      "enabled": false,
      "endpoint": "https://logs.llamawrangler.com"
    }
  }
}
```

## Performance Optimization

### Resource Limits

```json
{
  "resources": {
    "maxMemory": "4GB",
    "maxCPU": "80%",
    "maxConcurrentDownloads": 2,
    "cacheSize": "1GB"
  }
}
```

### Network Configuration

```json
{
  "network": {
    "timeout": 30000,
    "retries": 3,
    "proxy": {
      "enabled": false,
      "host": "",
      "port": 0
    },
    "bandwidthLimit": "0"
  }
}
```

## Backup and Recovery

### Data Backup Strategy

```bash
# Backup user data
tar -czf llama-wrangler-backup-$(date +%Y%m%d).tar.gz \
  ~/.llama-wrangler/models \
  ~/.llama-wrangler/config.json

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/llama-wrangler"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
  ~/.llama-wrangler

# Keep only last 7 backups
ls -t "$BACKUP_DIR" | tail -n +8 | xargs -I {} rm "$BACKUP_DIR/{}"
```

### Disaster Recovery

```bash
# Recovery script
#!/bin/bash
# Restore from backup

BACKUP_FILE=$1
RESTORE_DIR=$2

if [ -z "$BACKUP_FILE" ] || [ -z "$RESTORE_DIR" ]; then
    echo "Usage: $0 <backup_file> <restore_directory>"
    exit 1
fi

mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

echo "Restored Llama Wrangler data to $RESTORE_DIR"
```

## Troubleshooting Deployment

### Common Issues

#### Permission Errors

```bash
# macOS
sudo chown -R $(whoami) /Applications/Llama\ Wrangler.app

# Linux
sudo chown -R $USER:$USER /opt/llama-wrangler
sudo chmod +x /opt/llama-wrangler/Llama\ Wrangler
```

#### Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :7070
lsof -i :7070

# Change port
export LLAMA_SERVER_PORT=7071
```

#### Dependency Issues

```bash
# Check system libraries
ldd /opt/llama-wrangler/Llama\ Wrangler
otool -L /Applications/Llama\ Wrangler.app/Contents/MacOS/Llama\ Wrangler

# Install missing dependencies
sudo apt-get install -y missing-library-name
```

### Health Checks

#### Application Health

```bash
# Check if running
pgrep -f "Llama Wrangler" > /dev/null
echo $?

# Check server status
curl -s http://localhost:7070/health

# Check logs
tail -f ~/.llama-wrangler/logs/app.log
```

---

_This deployment guide covers various scenarios from individual user installations to enterprise-wide deployments._
