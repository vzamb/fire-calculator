#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="fire-calculator"
HOST_PORT="${1:-18080}"

if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo "ERROR: Neither podman nor docker found. Install one and try again."
    exit 1
fi

if ! "${RUNTIME}" image inspect "${IMAGE_NAME}" &>/dev/null; then
    echo "ERROR: Image '${IMAGE_NAME}' not found. Run ./container-build.sh first."
    exit 1
fi

app_title=$("${RUNTIME}" inspect "${IMAGE_NAME}" --format '{{index .Labels "org.opencontainers.image.title"}}' 2>/dev/null || echo "unknown")
app_version=$("${RUNTIME}" inspect "${IMAGE_NAME}" --format '{{index .Labels "org.opencontainers.image.version"}}' 2>/dev/null || echo "unknown")
base_image=$("${RUNTIME}" inspect "${IMAGE_NAME}" --format '{{index .Labels "org.opencontainers.image.base.name"}}' 2>/dev/null || echo "unknown")

echo "======================================"
echo "  ${app_title} v${app_version}"
echo "  Base image: ${base_image}"
echo "  Runtime:    ${RUNTIME}"
echo "  Port:       ${HOST_PORT}"
echo "  URL:        http://127.0.0.1:${HOST_PORT}"
echo "======================================"
echo ""
"${RUNTIME}" run --rm -p "${HOST_PORT}:8080" --name "${IMAGE_NAME}" "${IMAGE_NAME}"
