#!/usr/bin/env bash
set -euo pipefail

HOST_PORT="${1:-18080}"
HOST_ADDR="${2:-127.0.0.1}"
BASE_URL="http://${HOST_ADDR}:${HOST_PORT}"

passed=0
failed=0

if ! curl -4sf "${BASE_URL}" > /dev/null 2>&1; then
    echo "ERROR: No container responding on port ${HOST_PORT}."
    echo "Start it first with: ./container-run.sh ${HOST_PORT}"
    exit 1
fi

check() {
    local description="$1"
    shift
    if eval "$@"; then
        echo "  PASS: ${description}"
        passed=$((passed + 1))
    else
        echo "  FAIL: ${description}"
        failed=$((failed + 1))
    fi
}

echo "=== Running smoke tests against ${BASE_URL} ==="

check "GET / returns HTTP 200" \
    'test "$(curl -4sf -o /dev/null -w "%{http_code}" "${BASE_URL}/")" = "200"'

check "Response contains root div" \
    'curl -4sf "${BASE_URL}/" | grep -q "<div id=\"root\">"'

check "Response contains page title" \
    'curl -4sf "${BASE_URL}/" | grep -q "FIRE Calculator"'

check "Static asset /fire.svg returns HTTP 200" \
    'curl -4sf -o /dev/null "${BASE_URL}/fire.svg"'

check "SPA fallback: unknown route returns index.html" \
    'curl -4sf "${BASE_URL}/nonexistent-route" | grep -q "<div id=\"root\">"'

echo ""
echo "=== Results ==="
echo "Passed: ${passed}  Failed: ${failed}"

if [ "${failed}" -gt 0 ]; then
    exit 1
fi

echo "All smoke tests passed."
