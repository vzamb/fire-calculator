#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="fire-calculator"

if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo "ERROR: Neither podman nor docker found. Install one and try again."
    exit 1
fi

if ! "${RUNTIME}" image inspect "${IMAGE_NAME}" &>/dev/null; then
    echo "No '${IMAGE_NAME}' image found. Nothing to delete."
    exit 0
fi

running=$("${RUNTIME}" ps -q --filter "ancestor=${IMAGE_NAME}" 2>/dev/null || true)
if [ -n "${running}" ]; then
    echo "Stopping running container(s)..."
    "${RUNTIME}" stop ${running}
    "${RUNTIME}" rm ${running} 2>/dev/null || true
fi

echo "Removing image '${IMAGE_NAME}' using ${RUNTIME}..."
"${RUNTIME}" rmi "${IMAGE_NAME}"
echo "Done."
