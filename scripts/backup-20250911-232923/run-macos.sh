#!/bin/bash

# Run Llama Wrangler from Compiled Binary
# Launches the compiled macOS app from dist folder

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

print_status "🚀 Launching Llama Wrangler from compiled binary..."

# Check if we're on macOS
if [ "$(uname)" != "Darwin" ]; then
    print_error "This script is designed for macOS only"
    print_status "For other platforms, check the dist/ folder for your executable:"
    print_status "  Windows: Run the .exe installer or portable version"
    print_status "  Linux: Make the .AppImage executable and run it"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "No dist/ directory found. Please run ./compile-build-dist.sh first."
    exit 1
fi

# Find the macOS app binary
APP_PATH=""

# Look for Intel version first
if [ -d "dist/mac" ]; then
    APP_PATH=$(find dist/mac -name "*.app" -type d | head -n 1)
    if [ -n "$APP_PATH" ]; then
        print_status "Found Intel macOS app: $APP_PATH"
    fi
fi

# If no Intel version found, look for ARM version
if [ -z "$APP_PATH" ] && [ -d "dist/mac-arm64" ]; then
    APP_PATH=$(find dist/mac-arm64 -name "*.app" -type d | head -n 1)
    if [ -n "$APP_PATH" ]; then
        print_status "Found ARM64 macOS app: $APP_PATH"
    fi
fi

# If still no app found, look anywhere in dist
if [ -z "$APP_PATH" ]; then
    APP_PATH=$(find dist -name "*.app" -type d | head -n 1)
    if [ -n "$APP_PATH" ]; then
        print_status "Found macOS app: $APP_PATH"
    fi
fi

# Launch the app if found
if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
    print_success "Launching Llama Wrangler..."
    
    # Launch the app
    open "$APP_PATH"
    
    print_success "Llama Wrangler launched successfully!"
    print_status "The app is now running in the background"
    print_status "Check your dock or applications folder to interact with it"
else
    print_error "Could not find Llama Wrangler.app in dist/ directory"
    print_warning "Available files in dist/:"
    
    if [ -d "dist" ]; then
        ls -la dist/
    fi
    
    print_status ""
    print_status "To build the app first, run:"
    print_status "  ./compile-build-dist.sh"
    
    exit 1
fi