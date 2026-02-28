#!/usr/bin/env bash
# United — First-run setup script
# Run once on the VPS after cloning the repo.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== United — Setup ==="
echo

# 1. Generate .env if missing
if [ ! -f "$ROOT_DIR/.env" ]; then
  POSTGRES_PASSWORD=$(openssl rand -hex 32)
  cat > "$ROOT_DIR/.env" <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
EOF
  echo "[✓] Generated .env with a random database password."
else
  echo "[·] .env already exists, skipping."
fi

# 2. Generate Synapse config + signing key
if [ ! -f "$ROOT_DIR/synapse/matrix.cleardis.com.signing.key" ]; then
  echo "[·] Generating Synapse signing key…"
  docker run --rm \
    -v "$ROOT_DIR/synapse:/data" \
    -e SYNAPSE_SERVER_NAME=matrix.cleardis.com \
    -e SYNAPSE_REPORT_STATS=no \
    matrixdotorg/synapse:latest generate
  echo "[✓] Synapse signing key generated."
else
  echo "[·] Synapse signing key already exists, skipping."
fi

# 3. Start services
echo "[·] Starting services…"
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

# 4. Wait for Synapse to be healthy
echo "[·] Waiting for Synapse to be ready…"
until docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T synapse \
  curl -fSs http://localhost:8008/_matrix/client/versions > /dev/null 2>&1; do
  sleep 3
done
echo "[✓] Synapse is up."

# 5. Create admin account
echo
echo "Create your admin account:"
read -rp "  Admin username: " ADMIN_USER
docker compose -f "$ROOT_DIR/docker-compose.yml" exec synapse \
  register_new_matrix_user \
  -u "$ADMIN_USER" \
  -a \
  -c /data/homeserver.yaml \
  http://localhost:8008

echo
echo "=== Setup complete ==="
echo
echo "  Matrix homeserver : https://matrix.cleardis.com"
echo "  Element Web       : https://app.cleardis.com"
echo "  Invite portal     : https://join.cleardis.com"
echo
echo "Generate your first invite link:"
echo "  ./scripts/invite.sh"
