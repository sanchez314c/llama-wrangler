#!/bin/bash
#
# Llama Wrangler - Linux Source Runner
# Clean start script with port management
#

set -e

# ============================================
# PORT CONFIGURATION (Random High Ports)
# ============================================
ELECTRON_DEBUG_PORT=58731
ELECTRON_INSPECT_PORT=61843
DEV_SERVER_PORT=57294

# ============================================
# COLORS
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           LLAMA WRANGLER - Linux Source Runner            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_and_kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :$port 2>/dev/null || true)

    if [ -n "$pid" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing process on port $port ($name) - PID: $pid"
        kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi
}

kill_zombie_electrons() {
    echo -e "${BLUE}[CLEANUP]${NC} Checking for orphaned Electron processes..."

    # Kill any existing llama-wrangler electron processes
    local pids=$(pgrep -f "electron.*llama-wrangler" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing orphaned Electron processes: $pids"
        echo "$pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi

    # Also check for generic electron processes in this directory
    local dir_pids=$(pgrep -f "electron $(pwd)" 2>/dev/null || true)
    if [ -n "$dir_pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing Electron processes in project dir: $dir_pids"
        echo "$dir_pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi
}

check_dependencies() {
    echo -e "${BLUE}[CHECK]${NC} Verifying dependencies..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Node.js is not installed!"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Node.js $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} npm is not installed!"
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} npm $(npm --version)"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[SETUP]${NC} Installing dependencies..."
        npm install --ignore-scripts
    fi
}

fix_linux_sandbox() {
    # Fix Electron sandbox issue on Linux
    echo -e "${BLUE}[FIX]${NC} Checking Linux sandbox configuration..."

    local current=$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo "1")
    if [ "$current" = "0" ]; then
        echo -e "${YELLOW}[FIX]${NC} Enabling unprivileged user namespaces for Electron..."
        sudo sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true
    fi
    echo -e "${GREEN}[OK]${NC} Sandbox configuration ready"
}

# ============================================
# MAIN EXECUTION
# ============================================

cd "$(dirname "$0")"

print_header

echo -e "${BLUE}[INFO]${NC} Working directory: $(pwd)"
echo -e "${BLUE}[INFO]${NC} Configured ports:"
echo "  - Electron Debug:   $ELECTRON_DEBUG_PORT"
echo "  - Electron Inspect: $ELECTRON_INSPECT_PORT"
echo "  - Dev Server:       $DEV_SERVER_PORT"
echo ""

# Cleanup phase
echo -e "${CYAN}━━━ CLEANUP PHASE ━━━${NC}"
kill_zombie_electrons
check_and_kill_port $ELECTRON_DEBUG_PORT "Electron Debug"
check_and_kill_port $ELECTRON_INSPECT_PORT "Electron Inspect"
check_and_kill_port $DEV_SERVER_PORT "Dev Server"
echo ""

# Verification phase
echo -e "${CYAN}━━━ VERIFICATION PHASE ━━━${NC}"
check_dependencies
fix_linux_sandbox
echo ""

# Launch phase
echo -e "${CYAN}━━━ LAUNCH PHASE ━━━${NC}"
echo -e "${GREEN}[START]${NC} Launching Llama Wrangler..."
echo ""

# Export ports as environment variables
export ELECTRON_DEBUG_PORT=$ELECTRON_DEBUG_PORT
export ELECTRON_INSPECT_PORT=$ELECTRON_INSPECT_PORT
export DEV_SERVER_PORT=$DEV_SERVER_PORT

# Set Electron flags for Linux
export ELECTRON_FORCE_WINDOW_MENU_BAR=1
export ELECTRON_TRASH=gio

# Check for --dev flag
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
    echo -e "${YELLOW}[MODE]${NC} Development mode with DevTools"
    NODE_ENV=development npx electron . --no-sandbox --remote-debugging-port=$ELECTRON_DEBUG_PORT --inspect=$ELECTRON_INSPECT_PORT
else
    echo -e "${GREEN}[MODE]${NC} Production mode"
    npx electron . --no-sandbox
fi
