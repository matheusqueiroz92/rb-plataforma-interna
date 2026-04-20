#!/usr/bin/env bash
set -euo pipefail

# Garante que o arquivo de log existe e que o cron encontra as variaveis de ambiente
mkdir -p /var/log /config /backup
touch /var/log/rb-backup.log

# O cron do BusyBox nao herda o ambiente do container.
# Persistimos as variaveis sensiveis num script de sourcing no crontab.
cat > /etc/profile.d/rb-backup-env.sh <<EOF
export TZ="${TZ:-America/Bahia}"
export PG_HOST="${PG_HOST:-db}"
export PG_PORT="${PG_PORT:-5432}"
export POSTGRES_USER="${POSTGRES_USER:-}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
export POSTGRES_DB="${POSTGRES_DB:-}"
export RCLONE_REMOTE="${RCLONE_REMOTE:-}"
export BACKUP_PREFIXO="${BACKUP_PREFIXO:-rb-plataforma}"
export BACKUP_PASTA_LOCAL="${BACKUP_PASTA_LOCAL:-/backup/atual}"
export GPG_PUBLIC_KEY_ID="${GPG_PUBLIC_KEY_ID:-}"
EOF
chmod +x /etc/profile.d/rb-backup-env.sh

# Garante que o crontab esteja atualizado
crontab /etc/crontabs/root

echo "[rb-backup] Iniciado. Cron ativo."
echo "[rb-backup] Variaveis:"
echo "  PG_HOST=${PG_HOST:-db}"
echo "  POSTGRES_DB=${POSTGRES_DB:-nao definido}"
echo "  RCLONE_REMOTE=${RCLONE_REMOTE:-nao definido}"

# Se chamado com "agora", roda um backup imediato e sai (util para teste manual).
if [ "${1:-}" = "agora" ]; then
  exec /usr/local/bin/rb-backup
fi

# Se chamado com um comando arbitrario, executa-o (suporta rb-restaurar).
if [ $# -gt 0 ]; then
  exec "$@"
fi

# Inicia o cron em foreground.
exec crond -f -l 2
