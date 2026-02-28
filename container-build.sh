#!/usr/bin/env bash
set -euo pipefail

if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo "ERROR: Neither podman nor docker found. Install one and try again."
    exit 1
fi

IMAGE_NAME="fire-calculator"
APP_VERSION=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")

echo "=== Building container image: ${IMAGE_NAME} v${APP_VERSION} (using ${RUNTIME}) ==="
"${RUNTIME}" build \
    --build-arg APP_NAME="${IMAGE_NAME}" \
    --build-arg APP_VERSION="${APP_VERSION}" \
    -t "${IMAGE_NAME}" .
echo ""
echo "Build complete. Run the container with:"
echo "  ./container-run.sh"
echo ""
echo "Or run the smoke tests with:"
echo "  ./container-smoke-test.sh"
