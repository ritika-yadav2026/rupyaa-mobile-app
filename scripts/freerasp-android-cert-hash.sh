#!/usr/bin/env bash
# Convert Android signing SHA-256 fingerprint (hex) to freeRASP Base64 certificateHashes value.
#
# Usage:
#   ./scripts/freerasp-android-cert-hash.sh "88:8c:7f:02:d6:2e:ed:3a:53:bb:9c:a6:6b:82:5c:0d:78:a8:e5:b6:b2:11:28:bc:f5:ac:67:c8:e0:a3:7c:5a"
#
# Google Play App Signing: Play Console → Test and release → App integrity → Play app signing
# Manual signing: keytool -printcert -jarfile app-release.apk

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <SHA-256-fingerprint-with-or-without-colons>" >&2
  exit 1
fi

FINGERPRINT="$1"
HEX="$(echo "$FINGERPRINT" | tr -d ':' | tr '[:upper:]' '[:lower:]')"

if ! [[ "$HEX" =~ ^[0-9a-f]{64}$ ]]; then
  echo "Error: expected 64 hex characters after removing colons." >&2
  exit 1
fi

echo "$HEX" | xxd -r -p | base64
