# Backup automatizado com rclone + Google Drive

Servico Docker dedicado ao backup diario do PostgreSQL da Plataforma Interna. Usa `pg_dump`, compacta com gzip, opcionalmente criptografa com GPG e envia a copia para o Google Drive via `rclone`.

## Componentes

| Arquivo | Funcao |
|---|---|
| `Dockerfile` | Imagem Alpine com `postgresql-client`, `rclone`, `gnupg`, `dcron` |
| `backup.sh` | Gera dump, comprime, criptografa (opcional), envia e aplica retencao |
| `restaurar.sh` | Baixa um arquivo do remoto e restaura no banco |
| `crontab` | Agendamento diario `0 2 * * *` (02:00 America/Bahia) |
| `entrypoint.sh` | Prepara ambiente e inicia `crond -f` |
| `rclone.conf.example` | Modelo da configuracao OAuth do Google Drive |

## Retencao (servidor remoto)

| Tipo | Mantido |
|---|---|
| Diarios | 30 arquivos (por `min-age 30d`) |
| Mensais | 12 arquivos (`min-age 365d`) |
| Anuais | 5 arquivos (`min-age 1825d`) |

## Preparacao no VPS

1. **Criar credenciais do Google Drive**
   - Siga https://rclone.org/drive/#making-your-own-client-id para gerar `client_id` e `client_secret` (evita rate limit global).
   - Crie no Drive uma pasta chamada, por exemplo, `rb-plataforma/backups` e copie o ID da URL.

2. **Gerar o token OAuth**
   ```bash
   docker compose run --rm backup rclone config
   ```
   Siga o assistente: remote name `gdrive`, tipo `drive`, scope `drive.file`, cole client_id/secret e conclua o fluxo OAuth (um navegador abrira no seu computador local via `rclone authorize`).

3. **Copiar `rclone.conf` para o volume montado**
   O arquivo gerado ficara em `/root/.config/rclone/rclone.conf` dentro do container. Copie-o para `./scripts/backup/rclone.conf` no host:
   ```bash
   docker compose run --rm backup cat /root/.config/rclone/rclone.conf > scripts/backup/rclone.conf
   chmod 600 scripts/backup/rclone.conf
   ```

4. **Definir variaveis no `.env` raiz**
   ```
   RCLONE_REMOTE=gdrive:rb-plataforma/backups
   BACKUP_PREFIXO=rb-plataforma
   GPG_PUBLIC_KEY_ID=           # opcional; se preenchido, ativa criptografia
   ```

5. **Importar chave GPG publica (se quiser criptografia)**
   Deixe a chave publica em `scripts/backup/gpg-public.key` e adicione ao Dockerfile uma linha de `gpg --import` antes do `ENTRYPOINT`, ou monte o diretorio `~/.gnupg` como volume.

## Execucao manual

```bash
# Forca um backup agora (sem esperar o cron)
docker compose exec backup rb-backup

# Ou, em um container descartavel, rodar e sair:
docker compose run --rm backup agora
```

## Restauracao

```bash
docker compose exec backup rb-restaurar gdrive:rb-plataforma/backups/diarios/rb-plataforma-2026-04-18-0200.sql.gz
```

O script pedira confirmacao digitada (`SIM`) antes de sobrescrever o banco.

## Teste trimestral obrigatorio

Para cumprir a boa pratica de DR, crie uma tarefa recorrente (ex.: no Linear/Notion) para restaurar em um banco de teste a cada tres meses e validar a integridade dos dados.

## Monitoramento

O cron grava em `/var/log/rb-backup.log` dentro do container. Consulte com:
```bash
docker compose exec backup tail -f /var/log/rb-backup.log
```

Para alertas, integre com seu sistema de monitoramento (ex.: Uptime Kuma chamando um endpoint `/api/health` antes e depois).
