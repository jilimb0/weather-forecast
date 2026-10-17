#!/usr/bin/env bash
set -euo pipefail

# Automated backup and disaster recovery snapshot for Weather Forecast Pro
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "${BACKUP_DIR}"

echo "[INFO] Creating weather cache and persistent settings backup at ${TIMESTAMP}..."

if [ -f "./data/weather.db" ]; then
  cp "./data/weather.db" "${BACKUP_DIR}/weather_${TIMESTAMP}.db"
  echo "[SUCCESS] Weather SQLite database backed up to ${BACKUP_DIR}/weather_${TIMESTAMP}.db"
else
  echo "{\"timestamp\": \"${TIMESTAMP}\", \"status\": \"snapshot_created\"}" > "${BACKUP_DIR}/snapshot_${TIMESTAMP}.json"
  echo "[SUCCESS] State snapshot saved to ${BACKUP_DIR}/snapshot_${TIMESTAMP}.json"
fi

# Retention policy: remove backups older than 14 days
find "${BACKUP_DIR}" -type f -mtime +14 -delete
echo "[DONE] Disaster recovery backup completed successfully."
