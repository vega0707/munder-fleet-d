#!/usr/bin/env bash
# Wrapper: P2 second-daemon isolation check.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/p2-second-daemon.py" "$@"
