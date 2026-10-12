#!/usr/bin/env bash

# ==============================================================================
# Definition of Done (DoD) Automated Verification Gate
# Runs static checks, linters, type checkers, test suites, and documentation audits.
# Returns exit code 0 if all checks pass; non-zero if any check fails.
# ==============================================================================

set -o pipefail

# ANSI color codes
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
BOLD="\033[1m"
NC="\033[0m" # No Color

FAILED_CHECKS=0
TOTAL_CHECKS=0

log_header() {
    echo -e "\n${BLUE}${BOLD}=== $1 ===${NC}"
}

record_result() {
    local check_name="$1"
    local status_code="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status_code" -eq 0 ]; then
        echo -e "${GREEN}✔ [PASS]${NC} ${check_name}"
    else
        echo -e "${RED}✖ [FAIL]${NC} ${check_name}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# ------------------------------------------------------------------------------
# 1. Hygiene & Forbidden Placeholders Check
# ------------------------------------------------------------------------------
log_header "1. Code Hygiene & Incomplete Code Audit"

# Search for unfinished placeholder patterns in Python source files
FORBIDDEN_PATTERNS="(#\s*TODO|#\s*TBD|#\s*FIXME|#\s*\.\.\.\s*rest|raise\s+NotImplementedError)"
OFFENDING_FILES=$(git grep -EIin "${FORBIDDEN_PATTERNS}" -- "src/" || true)

if [ -n "$OFFENDING_FILES" ]; then
    echo -e "${RED}Found incomplete placeholder markers in src/:${NC}"
    echo "$OFFENDING_FILES"
    record_result "Placeholder check (No TODOs/unimplemented blocks)" 1
else
    record_result "Placeholder check (Zero TODOs found)" 0
fi

# ------------------------------------------------------------------------------
# 2. Linter & Code Formatting
# ------------------------------------------------------------------------------
log_header "2. Static Analysis & Formatting"

if command -v ruff &> /dev/null; then
    ruff check .
    record_result "Ruff linting" $?

    ruff format --check .
    record_result "Ruff formatting" $?
elif command -v black &> /dev/null && command -v flake8 &> /dev/null; then
    flake8 src tests
    record_result "Flake8 linting" $?

    black --check src tests
    record_result "Black format check" $?
else
    echo -e "${YELLOW}Warning: Neither ruff nor black/flake8 found in PATH.${NC}"
    record_result "Linter availability" 1
fi

# ------------------------------------------------------------------------------
# 3. Static Type Analysis
# ------------------------------------------------------------------------------
log_header "3. Type Safety (mypy)"

if command -v mypy &> /dev/null; then
    mypy --strict src
    record_result "mypy strict type checking" $?
else
    echo -e "${YELLOW}Warning: mypy not found in PATH.${NC}"
    record_result "Type checker availability" 1
fi

# ------------------------------------------------------------------------------
# 4. Test Suite Execution
# ------------------------------------------------------------------------------
log_header "4. Test Suite & Coverage"

if command -v pytest &> /dev/null; then
    pytest -q --disable-warnings
    record_result "pytest test suite execution" $?
else
    echo -e "${YELLOW}Warning: pytest not found in PATH.${NC}"
    record_result "Test runner availability" 1
fi

# ------------------------------------------------------------------------------
# 5. Documentation & Handoff State Audit
# ------------------------------------------------------------------------------
log_header "5. Documentation & Task Log Verification"

DOC_FAILURES=0

# Verify mandatory documentation files exist
if [ ! -f ".gemini/docs/architecture.md" ]; then
    echo -e "${RED}Missing required file: .gemini/docs/architecture.md${NC}"
    DOC_FAILURES=$((DOC_FAILURES + 1))
fi

if [ ! -f ".gemini/docs/task_log.md" ]; then
    echo -e "${RED}Missing required file: .gemini/docs/task_log.md${NC}"
    DOC_FAILURES=$((DOC_FAILURES + 1))
else
    # Check if task_log.md has been modified in git working tree compared to HEAD
    LOG_MODIFIED=$(git status --porcelain ".gemini/docs/task_log.md" || true)
    
    # If there are modified code files in src/, task_log.md MUST also be touched
    CODE_MODIFIED=$(git status --porcelain "src/" || true)
    
    if [ -n "$CODE_MODIFIED" ] && [ -z "$LOG_MODIFIED" ]; then
        echo -e "${RED}Error: Code changes detected in src/, but .gemini/docs/task_log.md was not updated!${NC}"
        DOC_FAILURES=$((DOC_FAILURES + 1))
    fi
fi

record_result "Documentation sync (.gemini/docs state)" "$DOC_FAILURES"

# ------------------------------------------------------------------------------
# Summary & Exit
# ------------------------------------------------------------------------------
echo -e "\n========================================================"
if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✔ DEFINITION OF DONE PASSED (${TOTAL_CHECKS}/${TOTAL_CHECKS} checks successful)${NC}"
    echo -e "========================================================"
    exit 0
else
    echo -e "${RED}${BOLD}✖ DEFINITION OF DONE FAILED (${FAILED_CHECKS}/${TOTAL_CHECKS} checks failed)${NC}"
    echo -e "========================================================"
    exit 1
fi