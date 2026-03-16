#!/bin/bash

# Llama Wrangler Installation Script
# Automated setup for all dependencies

set -e

echo "🦙 Llama Wrangler Installer"
echo "=========================="
echo

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check OS
OS=$(uname -s)
case "$OS" in
    Darwin*) OS_TYPE="macos" ;;
    Linux*)  OS_TYPE="linux" ;;
    *)       echo -e "${RED}Unsupported OS: $OS${NC}"; exit 1 ;;
esac

echo "Detected OS: $OS_TYPE"

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    echo -e "${GREEN}Found v$NODE_VERSION${NC}"
else
    echo -e "${RED}Not found${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check Python
echo -n "Checking Python... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}Found $PYTHON_VERSION${NC}"
else
    echo -e "${RED}Not found${NC}"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Install Python dependencies
echo
echo "Installing Python dependencies..."
pip3 install --user huggingface-hub requests

# Create directories
echo
echo "Creating directories..."
mkdir -p ~/.llama-wrangler/models
mkdir -p scripts

# Check for llama.cpp
echo
echo -n "Checking llama.cpp... "
LLAMA_DIR="$HOME/.llama-wrangler/llama.cpp"
if [ -d "$LLAMA_DIR" ] && [ -f "$LLAMA_DIR/build/bin/llama-server" ]; then
    echo -e "${GREEN}Found${NC}"
else
    echo -e "${YELLOW}Not found${NC}"
    echo
    read -p "Would you like to install llama.cpp now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing llama.cpp..."
        cd ~/.llama-wrangler
        git clone https://github.com/ggerganov/llama.cpp.git
        cd llama.cpp
        
        # Build based on OS
        if [ "$OS_TYPE" = "macos" ]; then
            echo "Building with Metal support..."
            make clean && make LLAMA_METAL=1 -j$(sysctl -n hw.ncpu)
        else
            if command -v nvcc &> /dev/null; then
                echo "Building with CUDA support..."
                make clean && make LLAMA_CUDA=1 -j$(nproc)
            else
                echo "Building CPU version..."
                make clean && make -j$(nproc)
            fi
        fi
        
        cd -
        echo -e "${GREEN}✓ llama.cpp installed${NC}"
    fi
fi

# Check Ollama (optional)
echo
echo -n "Checking Ollama... "
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}Found$(NC)"
else
    echo -e "${YELLOW}Not found (optional)${NC}"
    echo "Install from https://ollama.ai for Ollama model support"
fi

# Install npm dependencies
echo
echo "Installing Llama Wrangler dependencies..."
npm install

# Create desktop entry (Linux)
if [ "$OS_TYPE" = "linux" ]; then
    DESKTOP_FILE="$HOME/.local/share/applications/llama-wrangler.desktop"
    echo
    echo "Creating desktop entry..."
    mkdir -p $(dirname "$DESKTOP_FILE")
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Llama Wrangler
Comment=Universal LLM Model Manager
Exec=$(pwd)/node_modules/.bin/electron $(pwd)
Icon=$(pwd)/assets/icon.png
Terminal=false
Type=Application
Categories=Development;
EOF
    chmod +x "$DESKTOP_FILE"
    echo -e "${GREEN}✓ Desktop entry created${NC}"
fi

echo
echo -e "${GREEN}✨ Installation complete!${NC}"
echo
echo "To start Llama Wrangler:"
echo "  npm start"
echo
echo "To build for distribution:"
echo "  npm run build"
echo
echo "Happy wrangling! 🦙"