# Plataforma Interna | Rebouças & Bulhões Advogados Associados

Sistema web interno completo: gestao de equipe, ponto digital, relatorio diario, checklist 5S, demandas com delegacao em cascata, correcao, ranking semanal, notificacoes WhatsApp via Z-API, chat com Claude, certificados em PDF, cron jobs automatizados, cursos, espelho mensal de ponto e trilha de auditoria.

**Versao:** 1.3 (Fases 1 a 5 entregues | Turborepo + Fastify + Next.js 16 + Expo 52 + backup automatizado)
**Uso:** exclusivamente interno
**Fuso:** America/Bahia

## Arquitetura

Monorepo Turborepo com Clean Architecture / DDD no backend.

```
rb-plataforma/
├── apps/
│   ├── api/            Fastify 5 + Prisma 5 + TypeScript
│   │   └── src/
│   │       ├── config/         env validado com Zod
│   │       ├── plugins/        auth, auditoria, zod type provider, error handler
│   │       ├── shared/         errors, logger (Winston), hash (bcrypt), prisma, ip
│   │       └── modules/        uma pasta por contexto
│   │           └── <modulo>/
│   │               ├── <modulo>.repository.ts   Interface + Prisma
│   │               ├── <modulo>.service.ts      Use cases / business logic
│   │               ├── <modulo>.controller.ts   HTTP layer (Fastify handlers)
│   │               ├── <modulo>.routes.ts       Fastify plugin
│   │               ├── <modulo>.domain.ts       Entidades/regras (onde aplicavel)
│   │               └── <modulo>.test.ts         Vitest
│   ├── web/            Next.js 16 App Router + Tailwind 3 + Zustand + TanStack Query
│   └── mobile/         Expo 52 + expo-router v4 + React Native 0.76
├── packages/
│   ├── constants/      Enums, hierarquia, constantes
│   ├── types/          DTOs compartilhados
│   ├── utils/          dayjs, formatters, validacao de senha
│   ├── validators/     Schemas Zod compartilhados
│   ├── ui/             Componentes UI reutilizaveis (fase futura)
│   ├── eslint-config/  ESLint 9 (flat config)
│   └── typescript-config/  tsconfig base/node/nextjs/library
├── traefik/            Proxy reverso com ACME/Let's Encrypt
├── scripts/
│   └── backup/         Servico Docker de backup (pg_dump + rclone Google Drive)
├── docs/               POP-EST-001 e documentacao funcional
├── turbo.json          Pipeline de build/test/lint
├── pnpm-workspace.yaml
└── docker-compose.yml  db + api + web + traefik
```

### Principios aplicados

- Clean Architecture: dependencias apontam para dentro (controllers -> services -> repositories, domain isolado).
- DDD leve: entidades e regras de negocio (ex.: `RegrasDelegacao`, `proximoTipoEsperado`, `calcularPontuacaoSemana`) isoladas em arquivos `*.domain.ts` com testes unitarios.
- DRY: schemas Zod, tipos, enums e utilitarios compartilhados via packages `@rb/*`.
- SOLID: interfaces de repositorio (`IAuthRepository`, `IUsersRepository`, etc.) desacopladas da implementacao Prisma, permitindo mock em testes.
- API stateless, JWT + refresh token, bcrypt custo 12.
- Injecao de dependencias via construtor nos services e controllers.

## Stack

### Runtime

- Node.js 24 LTS
- pnpm 9.12.0
- PostgreSQL 16
- Docker + Docker Compose
- Traefik v3.2 (proxy reverso com TLS automatico via Let's Encrypt)

### Backend (apps/api)

- Fastify 5 (com `fastify-type-provider-zod`)
- Prisma 5 (ORM)
- Zod (validacao)
- @fastify/jwt, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/multipart, @fastify/static
- Winston (logs com rotacao diaria)
- Vitest (TDD, unitarios e de dominio)

### Frontend (apps/web)

- Next.js 16 com App Router
- React 19
- Tailwind CSS 3
- Zustand 5 (estado)
- TanStack Query 5 (requisicoes)
- React Hook Form + @hookform/resolvers
- Recharts (graficos)
- Lucide React (icones)

## Estado atual

### Fase 1 (entregue)

- Autenticacao JWT com refresh, troca de senha com validacao de forca e historico das ultimas cinco senhas.
- Cadastro, edicao, inativacao e reset de senha de usuarios (perfis SOCIO/GESTORA).
- Ponto digital antifraude: sequencia travada, foto obrigatoria (MediaDevices), IP/User-Agent, timestamp do servidor, edicao restrita a gestora/socio com justificativa, bloqueio da saida final sem relatorio.
- Relatorio diario obrigatorio com tres perguntas, justificativa condicional e upload de atestado (PDF/JPG/PNG).
- Aceite do POP no primeiro acesso com registro de versao, data, IP e User-Agent.
- Trilha de auditoria automatica para todas as acoes sensiveis.
- Design system institucional navy/dourado.

### Fase 2 (entregue)

- Checklist 5S interativo diario com progresso percentual, agrupamento por categoria (Seiri, Seiton, Seiso, Seiketsu, Shitsuke, rotinas).
- Demandas com CRUD completo, delegacao em cascata respeitando hierarquia (sócio > gestora > assessora jr > estagiario), atualizacao de status (PENDENTE -> ANDAMENTO -> ENTREGUE -> CONCLUIDA/EM_CORRECAO).
- Correcao com notas 0/8/10 e feedback obrigatorio.
- Calculo semanal de pontuacao (pontualidade 25 + qualidade 40 + extras 15 + checklist 10 + relatorios 10 = 100), ranking persistido.
- Grafico de meu desempenho das ultimas oito semanas.

### Fase 3 (entregue)

- **Integracao Z-API**: cliente HTTP, templates de mensagens editaveis (`apps/api/src/integrations/zapi/templates.ts`), fila persistida em banco com retry automatico ate tres tentativas, processamento continuo via cron a cada minuto.
- **Chat com Claude (Anthropic)**: system prompt treinado como Auxiliar Juridico Interno (`system-prompt.ts`), conversas persistidas com ate 20 mensagens de historico, controle de tokens por usuario e rate limit dedicado.
- **Certificados em PDF**: geracao via Puppeteer com template institucional (moldura dourada, monograma), numero sequencial anual, emissao automatica para os tres primeiros colocados no ranking semanal, download autenticado.
- **Cron jobs agendados**:
  - `lembrete-ponto` (seg-sex 08:30): alerta estagiarios sem entrada registrada
  - `alerta-prazo` (seg-sex 07:00): notifica demandas D-3, D-2, D-1
  - `ranking-semanal` (seg 07:00): calcula pontuacao + ranking + emite certificados do podium
  - `lembrete-relatorio` (seg-sex 19:00): avisa gestora sobre relatorios faltantes
  - `fila-whatsapp` (a cada minuto): processa notificacoes pendentes

### Fase 4 (entregue)

- **Trilha de auditoria consultavel**: pagina com filtros por entidade, usuario, intervalo de datas, paginacao de 50 em 50, visualizacao de IP e User-Agent (restrita a gestora e socio).
- **Espelho mensal de ponto em PDF**: geracao via Puppeteer com tabela completa dos registros, calculo de horas trabalhadas por dia, destaque visual para registros editados, total mensal.
- **Cursos e trilhas**: modulo completo com CRUD (gestora), marcacao de conclusao pelo colaborador, integracao com plataforma educacional via `urlExterna`, pagina de progresso individual.
- **Relatorios gerenciais**: endpoint `/api/relatorios-gerenciais/resumo-equipe` para indicadores por colaborador no intervalo escolhido.

### Fase 5 (entregue)

- **App mobile Expo 52**: projeto completo em `apps/mobile/` com expo-router v4, React Native 0.76 e React 18. Reusa os pacotes `@rb/*` do monorepo. Telas: Login, Aceite do POP, Inicio, Ponto com camera frontal, Relatorio, Checklist, Demandas. Documentacao detalhada em [apps/mobile/README.md](apps/mobile/README.md).
- **Backup automatizado**: servico Docker `rb-backup` com `pg_dump` + gzip + GPG (opcional) + `rclone` para Google Drive. Cron diario 02:00 Bahia, retencao 30 diarios / 12 mensais / 5 anuais. Script `rb-restaurar` para restauracao assistida. Documentacao em [scripts/backup/README.md](scripts/backup/README.md).

## Instalacao e execucao

### Requisitos no VPS Hostinger

- Linux (Ubuntu LTS recomendado)
- Docker 24+ com Compose v2
- Dominio apontando para o VPS (registro A)
- Porta 80 e 443 liberadas

### Primeiro deploy

```bash
git clone <repo> /opt/rb-plataforma
cd /opt/rb-plataforma
cp .env.example .env
# Editar .env: substituir TODOS os campos marcados com SUBSTITUIR e placeholder

# Preparar Traefik
touch traefik/acme.json && chmod 600 traefik/acme.json

# Subir servicos
docker compose up -d --build

# Migracoes e seed
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm seed
```

O seed cria:
- Socio titular (Dr. Ricardo Bulhoes).
- Gestora juridica (Larissa).
- Itens do checklist 5S.
- Cursos obrigatorios (LGPD, Codigo de Etica, POP-EST-001).

Senhas iniciais definidas em `SEED_SOCIO_SENHA` e `SEED_GESTORA_SENHA` no `.env`. **Trocar imediatamente no primeiro acesso.**

### Desenvolvimento local

```bash
pnpm install
cp .env.example .env
# Ajustar DATABASE_URL para postgres local ou docker

pnpm --filter @rb/api prisma generate
pnpm --filter @rb/api prisma migrate dev
pnpm --filter @rb/api seed

pnpm dev  # roda turbo em paralelo (api + web)
```

### Testes

```bash
pnpm test                          # roda em todos os workspaces
pnpm --filter @rb/api test         # somente backend
pnpm --filter @rb/utils test       # somente utils
```

Testes de dominio cobrem:
- Sequencia e antifraude de ponto (`ponto.domain.test.ts`)
- Hierarquia de delegacao e status apos correcao (`demandas.domain.test.ts`)
- Calculo de pontuacao semanal (`produtividade.domain.test.ts`)
- Validacao de forca de senha (`packages/utils/src/senha.test.ts`)

## Endpoints principais

### Publicos
| Metodo | Rota |
|---|---|
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| GET  | `/api/health` |

### Autenticado (qualquer perfil)
| Metodo | Rota |
|---|---|
| POST | `/api/auth/logout` |
| POST | `/api/auth/trocar-senha` |
| POST | `/api/auth/aceitar-pop` |
| GET  | `/api/eu` |
| POST | `/api/ponto/registrar` |
| GET  | `/api/ponto/hoje` |
| GET  | `/api/ponto/historico` |
| POST | `/api/relatorios/enviar` |
| GET  | `/api/relatorios/meus` |
| GET  | `/api/relatorios/hoje` |
| POST | `/api/relatorios/atestado/upload` |
| GET  | `/api/checklist/itens` |
| POST | `/api/checklist/responder` |
| GET  | `/api/checklist/progresso-hoje` |
| GET  | `/api/demandas/minhas` |
| GET  | `/api/demandas/:id` |
| PUT  | `/api/demandas/:id/status` |
| GET  | `/api/produtividade/ranking-semanal` |
| GET  | `/api/produtividade/meu-desempenho` |
| GET  | `/api/pop/texto` |
| POST | `/api/ia/chat` |
| GET  | `/api/ia/conversas` |
| GET  | `/api/ia/conversas/:id` |
| DELETE | `/api/ia/conversas/:id` |
| GET  | `/api/ia/consumo` |
| GET  | `/api/certificados/meus` |
| GET  | `/api/certificados/:id/download` |
| GET  | `/api/cursos` |
| GET  | `/api/cursos/meu-progresso` |
| POST | `/api/cursos/concluir` |
| GET  | `/api/notificacoes/minhas` |
| GET  | `/api/relatorios-gerenciais/espelho-ponto` |

### Assessora junior ou superior
| Metodo | Rota |
|---|---|
| GET  | `/api/relatorios/equipe` |
| POST | `/api/relatorios/:id/marcar-lido` |
| GET  | `/api/demandas/equipe` |
| POST | `/api/demandas` |
| POST | `/api/demandas/:id/delegar` |
| POST | `/api/demandas/:id/corrigir` |
| GET  | `/api/checklist/equipe-hoje` |
| GET  | `/api/relatorios-gerenciais/resumo-equipe` |

### Gestora ou superior
| Metodo | Rota |
|---|---|
| GET/POST/PUT/DELETE | `/api/users/...` |
| POST | `/api/users/:id/resetar-senha` |
| PUT  | `/api/ponto/:id/editar` |
| POST/PUT/DELETE | `/api/checklist/itens/...` |
| POST | `/api/produtividade/calcular` |
| GET  | `/api/auditoria` |
| POST | `/api/certificados/emitir` |
| POST | `/api/certificados/emitir-semanais` |
| GET  | `/api/certificados/usuario/:usuarioId` |
| POST/PUT | `/api/cursos/...` |
| POST | `/api/notificacoes/whatsapp/enviar-manual` |
| POST | `/api/notificacoes/whatsapp/processar-fila` |

## Conformidade legal

- **Lei 11.788/2008** (Estagio): jornada, supervisao, atividades compativeis, recesso.
- **LGPD (Lei 13.709/2018)**: aceite com IP/User-Agent, foto com finalidade especifica, trilha de auditoria, DPO indicado (Dr. Ricardo Bulhoes).
- **Estatuto da OAB e Res. CFOAB 5/2010**: sigilo profissional, atividades vedadas, controle de acesso.

## Convencoes de desenvolvimento

- Commits seguem Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Antes de merge: `pnpm lint && pnpm typecheck && pnpm test` verdes.
- TDD para toda regra de dominio: escrever teste primeiro nos arquivos `*.domain.test.ts`.
- Nomes descritivos em portugues para funcoes de dominio; ingles apenas para termos tecnicos (repository, service, controller).

## Contato tecnico

Duvidas ou incidentes: gestora Larissa, que articula com o fornecedor de infraestrutura.
