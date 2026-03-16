#!/bin/bash

# 🔍 BLOAT CHECK SCRIPT FOR ELECTRON/NODE APPS
# Comprehensive analysis of build size and optimization opportunities

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✔${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] ℹ${NC} $1"
}

print_header() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo ""
}

# Function to convert bytes to human readable
human_readable() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(($bytes / 1073741824))GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(($bytes / 1048576))MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(($bytes / 1024))KB"
    else
        echo "${bytes}B"
    fi
}

print_header "🔍 LLAMA WRANGLER BLOAT CHECK"

# Check if in Node.js project
if [ ! -f "package.json" ]; then
    print_error "No package.json found. Run this in your project root directory."
    exit 1
fi

PROJECT_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
print_status "Analyzing project: $PROJECT_NAME"

# 1. Node modules analysis
print_header "📦 NODE MODULES ANALYSIS"

if [ -d "node_modules" ]; then
    NODE_SIZE=$(du -sb node_modules 2>/dev/null | cut -f1)
    NODE_SIZE_HR=$(human_readable $NODE_SIZE)
    print_info "Total node_modules size: $NODE_SIZE_HR"
    
    # Size categories
    if [ $NODE_SIZE -gt 1073741824 ]; then
        print_warning "⚠️  LARGE: Node modules > 1GB - optimization recommended"
    elif [ $NODE_SIZE -gt 536870912 ]; then
        print_warning "⚠️  MEDIUM: Node modules > 500MB - consider cleanup"
    else
        print_success "✓ Node modules size acceptable"
    fi
    
    echo ""
    print_info "Top 10 largest dependencies:"
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10 | while read size dir; do
        basename_dir=$(basename "$dir")
        if [ ${#size} -gt 4 ] || [[ $size == *"M"* ]] || [[ $size == *"G"* ]]; then
            print_warning "  $size - $basename_dir"
        else
            print_info "  $size - $basename_dir"
        fi
    done
else
    print_warning "No node_modules directory found"
fi

# 2. Dependencies analysis
print_header "📋 DEPENDENCIES ANALYSIS"

if command -v npm >/dev/null 2>&1; then
    PROD_DEPS=$(npm ls --production --depth=0 2>/dev/null | grep -c "├─\|└─" || echo "0")
    DEV_DEPS=$(npm ls --development --depth=0 2>/dev/null | grep -c "├─\|└─" || echo "0")
    
    print_info "Production dependencies: $PROD_DEPS"
    print_info "Development dependencies: $DEV_DEPS"
    
    # Check for duplicates
    print_status "Checking for duplicate packages..."
    DUPES=$(npm dedupe --dry-run 2>/dev/null | grep -c "removed" || echo "0")
    if [ "$DUPES" -gt 0 ]; then
        print_warning "⚠️  Found $DUPES duplicate packages"
        print_info "  Run 'npm dedupe' to remove duplicates"
    else
        print_success "✓ No duplicate packages found"
    fi
    
    # Check for unused dependencies
    if command -v npx >/dev/null 2>&1; then
        print_status "Scanning for unused dependencies..."
        UNUSED=$(npx depcheck --json 2>/dev/null | grep -o '"dependencies":\[[^]]*\]' | grep -o '"[^"]*"' | wc -l || echo "0")
        if [ "$UNUSED" -gt 0 ]; then
            print_warning "⚠️  Found ~$UNUSED potentially unused dependencies"
            print_info "  Run 'npx depcheck' for details"
        else
            print_success "✓ No obviously unused dependencies"
        fi
    fi
fi

# 3. Build configuration analysis
print_header "⚙️  BUILD CONFIGURATION ANALYSIS"

if grep -q '"build":' package.json; then
    print_status "Checking electron-builder configuration..."
    
    # Check for common bloat patterns
    if grep -q '"node_modules/\*\*/\*"' package.json; then
        print_error "❌ CRITICAL: Including 'node_modules/**/*' in build files!"
        print_info "  This will massively bloat your builds"
    fi
    
    if grep -q '"dist/\*\*/\*"' package.json; then
        print_warning "⚠️  Including 'dist/**/*' may include unwanted files"
    fi
    
    if grep -q '"src/\*\*/\*"' package.json; then
        print_warning "⚠️  Including source files in production build"
    fi
    
    if ! grep -q '"\!\*\*\/\*.map"' package.json; then
        print_warning "⚠️  Not excluding source maps (*.map files)"
    fi
    
    print_info "Current build files configuration:"
    grep -A 10 '"files":' package.json | head -15 || echo "  No files array found"
else
    print_warning "No electron-builder configuration found"
fi

# 4. Build output analysis
print_header "📦 BUILD OUTPUT ANALYSIS"

if [ -d "dist" ]; then
    DIST_SIZE=$(du -sb dist 2>/dev/null | cut -f1)
    DIST_SIZE_HR=$(human_readable $DIST_SIZE)
    print_info "Total dist size: $DIST_SIZE_HR"
    
    echo ""
    print_info "Build outputs by type:"
    
    # Check different package types
    for ext in dmg exe msi AppImage deb rpm zip; do
        COUNT=$(find dist -name "*.$ext" 2>/dev/null | wc -l)
        if [ $COUNT -gt 0 ]; then
            find dist -name "*.$ext" -exec ls -lah {} \; | while read -r line; do
                SIZE=$(echo $line | awk '{print $5}')
                NAME=$(basename $(echo $line | awk '{print $9}'))
                
                # Convert size to MB for comparison
                if [[ $SIZE == *"G" ]]; then
                    SIZE_MB=$(echo $SIZE | sed 's/G.*//' | awk '{print $1*1024}')
                elif [[ $SIZE == *"M" ]]; then
                    SIZE_MB=$(echo $SIZE | sed 's/M.*//' | awk '{print int($1)}')
                else
                    SIZE_MB=0
                fi
                
                if [ $SIZE_MB -gt 500 ]; then
                    print_warning "  ⚠️  $NAME: $SIZE (LARGE)"
                elif [ $SIZE_MB -gt 200 ]; then
                    print_info "  📦 $NAME: $SIZE"
                else
                    print_success "  ✓ $NAME: $SIZE"
                fi
            done
        fi
    done
    
    # Check unpacked sizes
    for dir in mac mac-arm64 win-unpacked win-ia32-unpacked linux-unpacked; do
        if [ -d "dist/$dir" ]; then
            UNPACKED_SIZE=$(du -sb "dist/$dir" 2>/dev/null | cut -f1)
            UNPACKED_SIZE_HR=$(human_readable $UNPACKED_SIZE)
            print_info "  $dir: $UNPACKED_SIZE_HR"
        fi
    done
else
    print_warning "No dist directory found. Run a build first."
fi

# 5. ASAR analysis (if available)
print_header "📄 ASAR CONTENT ANALYSIS"

ASAR_FILES=$(find dist -name "app.asar" 2>/dev/null)
if [ -n "$ASAR_FILES" ] && command -v npx >/dev/null 2>&1; then
    echo "$ASAR_FILES" | head -1 | while read -r ASAR_FILE; do
        ASAR_SIZE=$(ls -la "$ASAR_FILE" | awk '{print $5}')
        ASAR_SIZE_HR=$(human_readable $ASAR_SIZE)
        print_info "ASAR file size: $ASAR_SIZE_HR"
        
        if [ $ASAR_SIZE -gt 104857600 ]; then
            print_warning "⚠️  ASAR file > 100MB - inspect contents"
        fi
        
        # Try to list ASAR contents
        if npx asar list "$ASAR_FILE" >/dev/null 2>&1; then
            print_status "ASAR contents sample:"
            npx asar list "$ASAR_FILE" | head -10 | while read -r file; do
                print_info "  $file"
            done
            
            TOTAL_FILES=$(npx asar list "$ASAR_FILE" | wc -l)
            print_info "  ... and $(($TOTAL_FILES - 10)) more files"
        fi
    done
else
    print_warning "No ASAR files found or asar tools not available"
fi

# 6. Recommendations
print_header "💡 OPTIMIZATION RECOMMENDATIONS"

# Size-based recommendations
if [ -n "$NODE_SIZE" ] && [ $NODE_SIZE -gt 536870912 ]; then
    print_warning "📦 Node modules optimization:"
    print_info "  • Run 'npm dedupe' to remove duplicates"
    print_info "  • Run 'npx depcheck' to find unused packages"
    print_info "  • Consider switching to lighter alternatives"
fi

if [ -n "$DIST_SIZE" ] && [ $DIST_SIZE -gt 209715200 ]; then
    print_warning "🏗️  Build optimization:"
    print_info "  • Review electron-builder files configuration"
    print_info "  • Exclude source maps with '!**/*.map'"
    print_info "  • Use specific dist paths instead of wildcards"
    print_info "  • Enable code minification in build tools"
fi

# Configuration recommendations
print_info "📋 Configuration improvements:"
print_info "  • Use 'asarUnpack' only for necessary native modules"
print_info "  • Exclude test files: '!**/test/**'"
print_info "  • Exclude documentation: '!**/*.md'"
print_info "  • Set up proper .gitignore and .npmignore"

# Size targets
print_header "🎯 SIZE TARGETS & BENCHMARKS"

print_info "Electron app size guidelines:"
print_success "  ✓ Excellent: < 80MB"
print_info "  📊 Good: 80-150MB"
print_warning "  ⚠️  Acceptable: 150-300MB"
print_error "  ❌ Needs optimization: > 300MB"

echo ""
print_info "Quick optimization commands:"
echo "  npm dedupe"
echo "  npx depcheck"
echo "  npm audit fix"
echo "  npx electron-builder --config.compression=maximum"

print_header "✅ BLOAT CHECK COMPLETE"

# Final summary
TOTAL_ISSUES=0
if [ -n "$NODE_SIZE" ] && [ $NODE_SIZE -gt 536870912 ]; then
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi
if [ -n "$DIST_SIZE" ] && [ $DIST_SIZE -gt 209715200 ]; then
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi

if [ $TOTAL_ISSUES -eq 0 ]; then
    print_success "🎉 No major bloat issues detected!"
elif [ $TOTAL_ISSUES -eq 1 ]; then
    print_warning "⚠️  Found 1 optimization opportunity"
else
    print_warning "⚠️  Found $TOTAL_ISSUES optimization opportunities"
fi

print_info "💾 Regular bloat checks recommended monthly"