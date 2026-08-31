#!/usr/bin/env bash
# Start Munder local bridge (Web Command Center on loopback).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/shell"
export MUNDER_BRIDGE_HOST="${MUNDER_BRIDGE_HOST:-127.0.0.1}"
export MUNDER_BRIDGE_PORT="${MUNDER_BRIDGE_PORT:-3927}"
exec node bridge.mjs
