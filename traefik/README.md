# Traefik

Configuracao do proxy reverso da plataforma.

## Preparacao inicial no VPS

1. Criar o arquivo `acme.json` com permissao 600 (necessario para o Let's Encrypt):

```bash
touch traefik/acme.json
chmod 600 traefik/acme.json
```

2. Ajustar `TRAEFIK_ACME_EMAIL` no `.env` para o endereco responsavel pelos certificados.

3. O Traefik detecta os servicos `api` e `web` via labels no `docker-compose.yml`, publicando em:
   - `https://${APP_DOMAIN}/` -> apps/web (Next.js)
   - `https://${APP_DOMAIN}/api/*` -> apps/api (Fastify)

4. Redirecionamento automatico de HTTP -> HTTPS ja configurado via entrypoint `web`.

## Headers de seguranca

Definidos em `dynamic.yml` (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
