#!/bin/bash

# Repository Transformation Validation Script
# Validates all improvements made during the repository transformation

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

print_header() {
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════${NC}"
}

# Validation results
VALIDATION_PASSED=0
VALIDATION_FAILED=0

# Function to validate item
validate_item() {
    local description="$1"
    local test_command="$2"

    echo -n "${CYAN}Testing: $description...${NC} "

    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((VALIDATION_PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((VALIDATION_FAILED++))
        return 1
    fi
}

# Function to check file exists and has content
validate_file_content() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ] && [ -s "$file" ]; then
        echo -e "${GREEN}✓${NC} $description exists and has content"
        ((VALIDATION_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description missing or empty"
        ((VALIDATION_FAILED++))
        return 1
    fi
}

# Start validation
cd "$PROJECT_DIR"

print_header "🔍 REPOSITORY TRANSFORMATION VALIDATION"
echo "Project: Llama Wrangler"
echo "Date: $(date)"
echo "Directory: $PROJECT_DIR"
echo

print_header "📁 PROJECT STRUCTURE VALIDATION"

validate_item "Professional directory structure exists" "[ -d docs ]"
validate_item "Tests directory structure exists" "[ -d tests/unit -a -d tests/integration -a -d tests/__tests__ ]"
validate_item "Build resources directory exists" "[ -d build-resources/icons -a -d build-resources/screenshots ]"
validate_item "GitHub workflows directory exists" "[ -d .github/workflows ]"
validate_item "GitHub issue templates exist" "[ -d .github/ISSUE_TEMPLATE ]"

print_header "📚 DOCUMENTATION VALIDATION"

validate_file_content "README.md" "Main documentation"
validate_file_content "CONTRIBUTING.md" "Contribution guidelines"
validate_file_content "SECURITY.md" "Security policy"
validate_file_content "CODE_OF_CONDUCT.md" "Code of conduct"
validate_file_content "CLAUDE.md" "AI assistant guide"
validate_file_content "docs/DEVELOPMENT.md" "Development documentation"
validate_file_content "docs/SECURITY_ASSESSMENT.md" "Security assessment"
validate_file_content "docs/DOCUMENTATION_INDEX.md" "Documentation index"

print_header "🔧 CONFIGURATION FILES VALIDATION"

validate_item "Comprehensive .gitignore exists" "[ -f .gitignore ]"
validate_item "Enhanced package.json exists" "[ -f package.json ]"
validate_file_content ".github/PULL_REQUEST_TEMPLATE.md" "PR template"
validate_file_content ".github/ISSUE_TEMPLATE/bug_report.md" "Bug report template"
validate_file_content ".github/ISSUE_TEMPLATE/feature_request.md" "Feature request template"

print_header "🛡️ SECURITY VALIDATION"

validate_item "GitHub Actions workflow for security" "[ -f .github/workflows/quality-check.yml ]"
validate_item "Package.json updated with security scripts" 'grep -q "security-check" package.json'
validate_item "Dependencies updated to latest versions" 'grep -q "electron.*39.0.0" package.json'

print_header "📦 DEPENDENCY VALIDATION"

echo "Checking package.json updates..."
if grep -q '"electron": "39.0.0"' package.json; then
    echo -e "${GREEN}✓${NC} Electron updated to 39.0.0"
    ((VALIDATION_PASSED++))
else
    echo -e "${RED}✗${NC} Electron not updated to 39.0.0"
    ((VALIDATION_FAILED++))
fi

if grep -q '"electron-builder": "26.0.12"' package.json; then
    echo -e "${GREEN}✓${NC} electron-builder updated to 26.0.12"
    ((VALIDATION_PASSED++))
else
    echo -e "${RED}✗${NC} electron-builder not updated to 26.0.12"
    ((VALIDATION_FAILED++))
fi

print_header "🏗️ BUILD SYSTEM VALIDATION"

validate_item "Build scripts exist" "[ -f scripts/compile-build-dist.sh ]"
validate_item "Bloat check script exists" "[ -f scripts/bloat-check.sh ]"
validate_item "Temp cleanup script exists" "[ -f scripts/temp-cleanup.sh ]"
validate_item "Validation script exists" "[ -f scripts/validate-transformation.sh ]"
validate_item "Enhanced npm scripts available" 'grep -q "security-check" package.json'

print_header "📋 CHANGELOG VALIDATION"

validate_item "CHANGELOG updated with v1.1.0" 'grep -q "Version 1.1.0 - October 29, 2025" CHANGELOG.md'

print_header "🔍 ADVANCED VALIDATION"

# Check .gitignore comprehensiveness
echo "Checking .gitignore comprehensiveness..."
IGNORE_PATTERNS=("node_modules/" "dist/" "build/" ".DS_Store" "*.log" "coverage/" ".env")
for pattern in "${IGNORE_PATTERNS[@]}"; do
    if grep -q "$pattern" .gitignore; then
        echo -e "${GREEN}✓${NC} Found pattern: $pattern"
    else
        echo -e "${RED}✗${NC} Missing pattern: $pattern"
        ((VALIDATION_FAILED++))
    fi
done

# Check for backup files (should be cleaned up)
echo "Checking for backup files..."
BACKUP_COUNT=$(find . -name "*.backup.*" -type f | wc -l)
if [ "$BACKUP_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No backup files found (clean)"
    ((VALIDATION_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Found $BACKUP_COUNT backup files (should be cleaned up)"
fi

# Check documentation quality
echo "Checking documentation quality..."
DOC_FILES=(README.md docs/DEVELOPMENT.md docs/SECURITY_ASSESSMENT.md docs/DOCUMENTATION_INDEX.md)
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        WORD_COUNT=$(wc -w < "$doc")
        if [ "$WORD_COUNT" -gt 100 ]; then
            echo -e "${GREEN}✓${NC} $doc has substantial content ($WORD_COUNT words)"
            ((VALIDATION_PASSED++))
        else
            echo -e "${YELLOW}⚠${NC} $doc has minimal content ($WORD_COUNT words)"
        fi
    fi
done

print_header "📊 VALIDATION SUMMARY"

echo -e "${BLUE}Total Validations:${NC}"
echo -e "${GREEN}  Passed: $VALIDATION_PASSED${NC}"
echo -e "${RED}  Failed: $VALIDATION_FAILED${NC}"
echo

TOTAL_VALIDATIONS=$((VALIDATION_PASSED + VALIDATION_FAILED))
SUCCESS_RATE=$((VALIDATION_PASSED * 100 / TOTAL_VALIDATIONS))

echo -e "${CYAN}Success Rate: $SUCCESS_RATE%${NC}"

if [ "$VALIDATION_FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! Repository transformation successful!${NC}"
    exit 0
elif [ "$SUCCESS_RATE" -ge 90 ]; then
    echo -e "${YELLOW}⚠️  Transformation mostly successful with minor issues${NC}"
    exit 0
else
    echo -e "${RED}❌ Transformation has significant issues that need attention${NC}"
    exit 1
fi

print_header "🚀 NEXT STEPS"

echo "1. Review any failed validations and fix issues"
echo "2. Clean up any backup files found"
echo "3. Test the build process: npm run build"
echo "4. Run security audit: npm run security-check"
echo "5. Commit changes with descriptive commit message"
echo "6. Create release with updated version"
echo

echo -e "${GREEN}Repository transformation validation completed!${NC}"