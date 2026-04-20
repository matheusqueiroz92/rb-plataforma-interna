#!/usr/bin/env bash
#
# Backup diario do PostgreSQL da Plataforma Interna RB.
# Fluxo: pg_dump | gzip | gpg (opcional) | rclone para Google Drive.
# Executado pelo cron do container rb-backup.

set -euo pipefail

TZ=${TZ:-America/Bahia}
export TZ

PG_HOST=${PG_HOST:-db}
PG_PORT=${PG_PORT:-5432}
PG_USER=${POSTGRES_USER:?defina POSTGRES_USER}
PG_DB=${POSTGRES_DB:?defina POSTGRES_DB}
PGPASSWORD=${POSTGRES_PASSWORD:?defina POSTGRES_PASSWORD}
export PGPASSWORD

REMOTE=${RCLONE_REMOTE:?defina RCLONE_REMOTE, ex: gdrive:rb-plataforma/backups}
PREFIXO=${BACKUP_PREFIXO:-rb-plataforma}
PASTA_LOCAL=${BACKUP_PASTA_LOCAL:-/backup/atual}

mkdir -p "$PASTA_LOCAL"

DATA=$(date +%Y-%m-%d)
HORA=$(date +%H%M)
ARQUIVO="${PREFIXO}-${DATA}-${HORA}.sql.gz"
CAMINHO_LOCAL="${PASTA_LOCAL}/${ARQUIVO}"

echo "[$(date +'%F %T')] Iniciando backup de ${PG_DB}@${PG_HOST}..."

pg_dump \
  --host="$PG_HOST" \
  --port="$PG_PORT" \
  --username="$PG_USER" \
  --dbname="$PG_DB" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --verbose 2>/dev/null \
  | gzip -9 > "$CAMINHO_LOCAL"

TAMANHO=$(du -h "$CAMINHO_LOCAL" | cut -f1)
echo "[$(date +'%F %T')] pg_dump concluido. Arquivo: ${ARQUIVO} (${TAMANHO})"

# Criptografia opcional com GPG (se GPG_PUBLIC_KEY_ID estiver definido)
if [ -n "${GPG_PUBLIC_KEY_ID:-}" ]; then
  echo "[$(date +'%F %T')] Criptografando com chave ${GPG_PUBLIC_KEY_ID}..."
  gpg --batch --yes --trust-model always --encrypt \
      --recipient "$GPG_PUBLIC_KEY_ID" \
      --output "${CAMINHO_LOCAL}.gpg" "$CAMINHO_LOCAL"
  rm "$CAMINHO_LOCAL"
  CAMINHO_LOCAL="${CAMINHO_LOCAL}.gpg"
  ARQUIVO="${ARQUIVO}.gpg"
fi

# Upload ao Google Drive via rclone
echo "[$(date +'%F %T')] Enviando para ${REMOTE}/diarios/..."
rclone copy --config /config/rclone.conf "$CAMINHO_LOCAL" "${REMOTE}/diarios/"

# Copia mensal (dia 1) e anual (1 de janeiro)
if [ "$(date +%d)" = "01" ]; then
  rclone copy --config /config/rclone.conf "$CAMINHO_LOCAL" "${REMOTE}/mensais/"
  echo "[$(date +'%F %T')] Copia mensal enviada."
fi
if [ "$(date +%m%d)" = "0101" ]; then
  rclone copy --config /config/rclone.conf "$CAMINHO_LOCAL" "${REMOTE}/anuais/"
  echo "[$(date +'%F %T')] Copia anual enviada."
fi

# Retencao: mantem 30 diarios, 12 mensais, 5 anuais no remoto
rclone delete --config /config/rclone.conf --min-age 30d "${REMOTE}/diarios/" >/dev/null 2>&1 || true
rclone delete --config /config/rclone.conf --min-age 365d "${REMOTE}/mensais/" >/dev/null 2>&1 || true
rclone delete --config /config/rclone.conf --min-age 1825d "${REMOTE}/anuais/" >/dev/null 2>&1 || true

# Limpeza local: mantem apenas os 7 arquivos mais recentes
find "$PASTA_LOCAL" -type f -name "${PREFIXO}-*.sql.gz*" -print0 \
  | xargs -0 -r ls -t \
  | awk 'NR > 7' \
  | xargs -I {} rm -f "{}" 2>/dev/null || true

echo "[$(date +'%F %T')] Backup concluido com sucesso."
