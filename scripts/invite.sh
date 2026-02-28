#!/usr/bin/env bash
# United — Generate an invite link
# Usage: ./scripts/invite.sh [--uses N] [--expires Xh|Xd]
#
# Defaults: single-use, expires in 48 hours.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

MATRIX_URL="http://localhost:8008"
INVITE_BASE_URL="https://join.cleardis.com"

USES=1
EXPIRY_MS=$((48 * 3600 * 1000))  # 48 hours in milliseconds

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --uses)     USES="$2";   shift 2 ;;
    --expires)
      VALUE="${2%[hd]}"
      UNIT="${2: -1}"
      if [[ "$UNIT" == "d" ]]; then
        EXPIRY_MS=$(( VALUE * 24 * 3600 * 1000 ))
      else
        EXPIRY_MS=$(( VALUE * 3600 * 1000 ))
      fi
      shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Prompt for admin credentials
read -rp "Admin username: " ADMIN_USER
read -rsp "Admin password: " ADMIN_PASS
echo

# 1. Get access token
TOKEN_RESPONSE=$(curl -fSs -X POST "$MATRIX_URL/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"m.login.password\",\"user\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Could not authenticate. Check your credentials."
  exit 1
fi

# 2. Generate registration token
EXPIRY_TIME=$(( $(date +%s%3N) + EXPIRY_MS ))

TOKEN_RESPONSE=$(curl -fSs -X POST "$MATRIX_URL/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"uses_allowed\": $USES, \"expiry_time\": $EXPIRY_TIME}")

REG_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$REG_TOKEN" ]; then
  echo "Error: Could not generate token."
  echo "$TOKEN_RESPONSE"
  exit 1
fi

# 3. Output the invite link
echo
echo "=== Invite link generated ==="
echo
echo "  ${INVITE_BASE_URL}?token=${REG_TOKEN}"
echo
echo "  Uses allowed : $USES"

if [[ "$USES" == "1" ]]; then
  echo "  Type         : Single-use"
else
  echo "  Type         : Multi-use ($USES)"
fi

EXPIRY_DATE=$(date -d "@$(( EXPIRY_TIME / 1000 ))" "+%Y-%m-%d %H:%M %Z" 2>/dev/null \
  || date -r "$(( EXPIRY_TIME / 1000 ))" "+%Y-%m-%d %H:%M %Z")
echo "  Expires      : $EXPIRY_DATE"
echo
echo "Send this link to your family member. Do not share it publicly."
