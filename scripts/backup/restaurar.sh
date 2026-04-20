#!/usr/bin/env bash
#
# Restauracao do PostgreSQL a partir de um backup.
# Uso dentro do container rb-backup:
#   docker compose exec backup rb-restaurar gdrive:rb-plataforma/backups/diarios/rb-plataforma-2026-04-18-0200.sql.gz

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: rb-restaurar <caminho-no-remoto>"
  echo "Exemplo: rb-restaurar gdrive:rb-plataforma/backups/diarios/rb-plataforma-2026-04-18-0200.sql.gz"
  exit 1
fi

ORIGEM_REMOTA="$1"

PG_HOST=${PG_HOST:-db}
PG_PORT=${PG_PORT:-5432}
PG_USER=${POSTGRES_USER:?defina POSTGRES_USER}
PG_DB=${POSTGRES_DB:?defina POSTGRES_DB}
PGPASSWORD=${POSTGRES_PASSWORD:?defina POSTGRES_PASSWORD}
export PGPASSWORD

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

echo "[$(date +'%F %T')] Baixando ${ORIGEM_REMOTA}..."
rclone copy --config /config/rclone.conf "$ORIGEM_REMOTA" "$TEMP_DIR/"

ARQUIVO=$(find "$TEMP_DIR" -type f | head -1)

if [[ "$ARQUIVO" == *.gpg ]]; then
  echo "[$(date +'%F %T')] Descriptografando..."
  gpg --batch --yes --decrypt --output "${ARQUIVO%.gpg}" "$ARQUIVO"
  ARQUIVO="${ARQUIVO%.gpg}"
fi

echo "[$(date +'%F %T')] Restaurando ${PG_DB}@${PG_HOST}..."
echo "ATENCAO: todas as tabelas existentes serao sobrescritas. Tem certeza? (digite SIM)"
read -r CONFIRMACAO
if [ "$CONFIRMACAO" != "SIM" ]; then
  echo "Cancelado pelo usuario."
  exit 1
fi

gunzip -c "$ARQUIVO" | psql --host="$PG_HOST" --port="$PG_PORT" --username="$PG_USER" --dbname="$PG_DB"

echo "[$(date +'%F %T')] Restauracao concluida."
