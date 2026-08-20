#!/usr/bin/env bash
# One-time Apache setup for ClacketyClack. Run with sudo:
#
#   sudo ./deploy/setup-apache.sh
#
# Idempotent: safe to re-run. It creates the web root, installs the vhost, adds
# the hosts entry, and reloads Apache. After this, ./build-zip.sh mirrors into
# the web root with no root at all.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "error: run me with sudo, like this: sudo ./deploy/setup-apache.sh" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBROOT=/var/www/html/clacketyclack
# The invoking user, not root: the web root is owned by you so every later
# build can mirror into it without privileges.
OWNER="${SUDO_USER:-$USER}"

echo "==> web root $WEBROOT (owner: $OWNER)"
mkdir -p "$WEBROOT"
chown "$OWNER":"$OWNER" "$WEBROOT"

echo "==> vhost"
cp "$ROOT/deploy/clacketyclack.conf" /etc/apache2/sites-available/clacketyclack.conf
a2ensite clacketyclack >/dev/null

echo "==> hosts entry"
if grep -qE '^[^#]*[[:space:]]clacketyclack([[:space:]]|$)' /etc/hosts; then
  echo "    already present, leaving /etc/hosts alone"
else
  printf '127.0.0.1 clacketyclack\n' >>/etc/hosts
  echo "    added '127.0.0.1 clacketyclack'"
fi

echo "==> checking config before reloading"
apache2ctl -t

echo "==> reloading apache"
systemctl reload apache2

echo
echo "Done. Now publish the build (no sudo needed):"
echo "    ./build-zip.sh"
echo "Then open http://clacketyclack/"
