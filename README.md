# Plataforma Interna | Rebouças & Bulhões Advogados Associados

Sistema web interno para gestão de equipe: ponto digital antifraude, relatório diário, checklist 5S, demandas com delegação em cascata e correção, ranking semanal de produtividade, notificações WhatsApp (Z-API), chat com Claude (Anthropic), certificados e espelho de ponto em PDF, cursos, auditoria, cron jobs e app mobile (Expo).

**Uso:** exclusivamente interno.  
**Fuso horário padrão:** `America/Bahia` (incluindo agendamentos de jobs na API).  
**Versão documentada:** alinhada ao monorepo (Turborepo + Fastify 5 + Next.js 16 + Prisma 5 + Expo 52).

## Guia para usuarios finais (nao tecnico)

Para um material em linguagem simples, focado no uso do dia a dia da plataforma por pessoas leigas em tecnologia, acesse:

- [Guia do Usuario da Plataforma](docs/GUIA-USUARIO-PLATAFORMA.md)

---

## Sumário

1. [Arquitetura do repositório](#arquitetura-do-repositório)
2. [Stack e tecnologias](#stack-e-tecnologias)
3. [Modelo de dados (Prisma)](#modelo-de-dados-prisma)
4. [Perfis, hierarquia e autorização](#perfis-hierarquia-e-autorização)
5. [API REST – rotas completas](#api-rest--rotas-completas)
6. [Frontend web (Next.js) – páginas e comportamento](#frontend-web-nextjs--páginas-e-comportamento)
7. [App mobile (Expo)](#app-mobile-expo)
8. [Fluxos de negócio principais](#fluxos-de-negócio-principais)
9. [Jobs agendados (cron)](#jobs-agendados-cron)
10. [Integrações externas](#integrações-externas)
11. [Pacotes compartilhados `@rb/*`](#pacotes-compartilhados-rb)
12. [Variáveis de ambiente](#variáveis-de-ambiente)
13. [Instalação e execução](#instalação-e-execução)
14. [Testes e qualidade](#testes-e-qualidade)
15. [Infraestrutura (Docker, Traefik, backup)](#infraestrutura-docker-traefik-backup)
16. [Conformidade e governança](#conformidade-e-governança)
17. [Convenções de desenvolvimento](#convenções-de-desenvolvimento)

---

## Arquitetura do repositório

Monorepo **pnpm** + **Turborepo**, com **Clean Architecture** / **DDD leve** no backend (módulos por contexto: `*.routes` → `*.controller` → `*.service` → `*.repository`, regras em `*.domain.ts` com testes Vitest).

```
rb-plataforma/
├── apps/
│   ├── api/                 Fastify 5 + Prisma 5 + TypeScript (ESM)
│   │   ├── prisma/          schema, migrations, seed
│   │   └── src/
│   │       ├── config/       env (Zod)
│   │       ├── jobs/         cron (node-cron), timezone America/Bahia
│   │       ├── plugins/     auth JWT, auditoria, zod, error handler
│   │       ├── integrations/ z-api, anthropic, PDF (Puppeteer)
│   │       ├── shared/      prisma, logger (Winston), erros, hash
│   │       └── modules/     auth, users, ponto, relatorios, checklist, demandas, ...
│   ├── web/                 Next.js 16 (App Router) + React 19 + Tailwind 3
│   └── mobile/              Expo 52 + expo-router v4 + React Native 0.76
├── packages/
│   ├── constants/           Enums, hierarquia de perfis, limites de negócio
│   ├── types/               DTOs compartilhados
│   ├── utils/               dayjs, formatadores, regras auxiliares
│   ├── validators/          Schemas Zod compartilhados com a API
│   ├── eslint-config/       ESLint 9 (flat)
│   └── typescript-config/   tsconfig base (node, next, library)
├── traefik/                 Proxy reverso + TLS (Let’s Encrypt)
├── scripts/backup/          Backup PostgreSQL (pg_dump, rclone, opcional GPG)
├── docs/                    POP-EST-001 e documentação funcional
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.yml
```

**Princípios:** dependências apontam para dentro; repositórios com interface; API stateless com **JWT** (access) + **refresh token** (assinado com segredo separado); **bcrypt** (custo configurável, padrão 12); validação com **Zod** (`fastify-type-provider-zod`).

---

## Stack e tecnologias

| Camada           | Tecnologias                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**      | Node.js ≥ 24, pnpm 9.12, PostgreSQL 16                                                                                                                                                                                                            |
| **Backend**      | Fastify 5, Prisma 5, Zod, @fastify/jwt, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/multipart, @fastify/static, bcrypt, jsonwebtoken (refresh), Winston + rotação diária, Vitest, node-cron, Puppeteer (PDF), @anthropic-ai/sdk |
| **Frontend web** | Next.js 16, React 19, Tailwind CSS 3, Zustand 5 (sessão + persist), TanStack Query 5, React Hook Form + resolvers Zod, Recharts, Lucide React, `clsx` + `tailwind-merge`                                                                          |
| **Mobile**       | Expo 52, expo-router v4, React Native 0.76; ver [apps/mobile/README.md](apps/mobile/README.md)                                                                                                                                                    |
| **Infra**        | Docker Compose, Traefik v3.2, volumes para uploads e backup                                                                                                                                                                                       |

**Arquivos estáticos / uploads:** a API expõe `GET /uploads/...` via `@fastify/static` a partir do diretório `uploads/` (ex.: anexos gerados no servidor).

---

## Modelo de dados (Prisma)

### Tabelas (mapeamento `@@map`)

| Tabela Prisma / DB                              | Descrição resumida                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `Usuario` → `usuarios`                          | Colaborador: email, matrícula, perfil, status, dados cadastrais, aceite POP, histórico de senhas (JSON), etc.          |
| `Ponto` → `pontos`                              | Registros de ponto por dia/tipo; foto, IP, UA; edição e justificativa (gestão). **Unique:** `(usuarioId, data, tipo)`. |
| `Demanda` → `demandas`                          | Tarefa com prioridade, tipo, prazo, status, delegação, correção, nota, anexos (JSON), semana de referência.            |
| `ChecklistItem` → `checklist_itens`             | Itens 5S / rotinas; categorias, perfil alvo, remoto/presencial.                                                        |
| `ChecklistResposta` → `checklist_respostas`     | Respostas diárias por item. **Unique:** `(usuarioId, itemId, data)`.                                                   |
| `RelatorioDiario` → `relatorios_diarios`        | Três perguntas + atestado opcional; leitura por assessora+. **Unique:** `(usuarioId, data)`.                           |
| `PontuacaoSemanal` → `pontuacoes_semanais`      | Breakdown e total da semana; posição no ranking. **Unique:** `(usuarioId, semanaReferencia)`.                          |
| `Certificado` → `certificados`                  | PDF gerado, número sequencial único, tipo, período, emissor.                                                           |
| `AuditoriaLog` → `auditoria_log`                | Trilha: ação, entidade, JSON antes/depois, IP, UA. ID autoincremento `BigInt`.                                         |
| `NotificacaoWhatsapp` → `notificacoes_whatsapp` | Fila: destino, tipo, status, tentativas, resposta Z-API.                                                               |
| `ChatIAMensagem` → `chat_ia_mensagens`          | Mensagens por `conversaId` + usuário.                                                                                  |
| `CursoTrilha` → `cursos_trilhas`                | Curso com `urlExterna`, obrigatoriedade, prazo de conclusão.                                                           |
| `ConclusaoCurso` → `conclusoes_cursos`          | Conclusão por usuário. **Unique:** `(usuarioId, cursoId)`.                                                             |

### Enums principais (domínio)

- **Perfil:** `SOCIO`, `GESTORA`, `ASSESSORA_JR`, `ESTAGIARIO`
- **StatusUsuario:** `ATIVO`, `INATIVO`, `FERIAS`, `AFASTADO`
- **TipoPonto / sequência:** `ENTRADA` → `SAIDA_ALMOCO` → `RETORNO_ALMOCO` → `SAIDA_FINAL`
- **RegimePonto:** `PRESENCIAL`, `HOME_OFFICE`
- **Demanda:** status (`PENDENTE`, `ANDAMENTO`, `ENTREGUE`, `EM_CORRECAO`, `CONCLUIDA`, `VENCIDA`), prioridade, tipo
- **Checklist:** `CategoriaChecklist`, `PerfilChecklist`
- **Notificações / certificados / chat:** conforme `schema.prisma` (tipos alinhados a `@rb/constants` onde aplicável)

---

## Perfis, hierarquia e autorização

Hierarquia numérica (maior = mais privilégio), usada em `exigirNivelMinimo` no `auth.plugin`:

| Perfil       | Nível |
| ------------ | ----- |
| ESTAGIARIO   | 1     |
| ASSESSORA_JR | 2     |
| GESTORA      | 3     |
| SOCIO        | 4     |

- `exigirNivelMinimo('ASSESSORA_JR')`: permite **ASSESSORA_JR, GESTORA e SOCIO**.
- `exigirNivelMinimo('GESTORA')`: permite **GESTORA e SOCIO**.
- Toda requisição autenticada recarrega o usuário no banco e exige `status === ATIVO`.

**Delegação de demandas:** só para perfil de nível **estritamente maior** que o destino (regra `podeDelegarPara` em `@rb/constants`).

---

## API REST – rotas completas

Prefixo global das rotas de módulo conforme [apps/api/src/app.ts](apps/api/src/app.ts). A menos que indicado, o cliente deve enviar `Authorization: Bearer <accessToken>`.

### Saúde e sessão (sem autenticação)

| Método | Rota                | Descrição                                                  |
| ------ | ------------------- | ---------------------------------------------------------- |
| GET    | `/api/health`       | Status do serviço                                          |
| POST   | `/api/auth/login`   | Login; **rate limit** dedicado (env: `RATE_LIMIT_*_LOGIN`) |
| POST   | `/api/auth/refresh` | Novo access token a partir do refresh token                |

### Autenticação (token obrigatório)

| Método | Rota                     | Descrição                                                                                                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/eu`                | Dados básicos do token + usuário (rota solta no `app.ts`)                                                                                        |
| POST   | `/api/auth/logout`       | Registra **LOGOUT** na auditoria e responde `{ sucesso: true }`; a invalidação do token é feita no **cliente** (remover storage) — API stateless |
| POST   | `/api/auth/trocar-senha` | Troca com validação de força e histórico                                                                                                         |
| POST   | `/api/auth/aceitar-pop`  | Body `{ popId }` (UUID do POP vigente do perfil); registra aceite na tabela `pops_aceites` e atualiza campos legados no usuário                                                                                                                           |

### Usuários — prefixo `/api/users` (mínimo **GESTORA**)

| Método | Rota                           | Descrição                                    |
| ------ | ------------------------------ | -------------------------------------------- |
| GET    | `/api/users`                   | Listar                                       |
| POST   | `/api/users`                   | Criar (body validado)                        |
| GET    | `/api/users/:id`               | Obter                                        |
| PUT    | `/api/users/:id`               | Atualizar                                    |
| DELETE | `/api/users/:id`               | Remover/inativar (conforme regra de negócio) |
| POST   | `/api/users/:id/resetar-senha` | Reset de senha                               |

### Ponto — `/api/ponto`

| Método | Rota                    | Auth / nível | Descrição                                |
| ------ | ----------------------- | ------------ | ---------------------------------------- |
| POST   | `/api/ponto/registrar`  | Autenticado  | Registro com sequência, foto, antifraude |
| GET    | `/api/ponto/hoje`       | Autenticado  | Batidas do dia                           |
| GET    | `/api/ponto/historico`  | Autenticado  | Query validada (`filtroHistoricoSchema`) |
| PUT    | `/api/ponto/:id/editar` | **GESTORA+** | Edição com justificativa                 |

### Relatórios diários — `/api/relatorios`

| Método | Rota                              | Nível mínimo      | Descrição                                     |
| ------ | --------------------------------- | ----------------- | --------------------------------------------- |
| POST   | `/api/relatorios/enviar`          | Autenticado       | Envio do relatório                            |
| GET    | `/api/relatorios/meus`            | Autenticado       | Listagem do usuário                           |
| GET    | `/api/relatorios/hoje`            | Autenticado       | Relatório do dia                              |
| GET    | `/api/relatorios/equipe`          | **ASSESSORA_JR+** | Visão equipe                                  |
| POST   | `/api/relatorios/:id/marcar-lido` | **ASSESSORA_JR+** | Marca como lido                               |
| POST   | `/api/relatorios/atestado/upload` | Autenticado       | Upload multipart (limites `UPLOAD_MAX_BYTES`) |

### Checklist — `/api/checklist`

| Método | Rota                            | Nível             | Descrição           |
| ------ | ------------------------------- | ----------------- | ------------------- |
| GET    | `/api/checklist/itens`          | Autenticado       | Itens aplicáveis    |
| POST   | `/api/checklist/itens`          | **GESTORA+**      | Criar item          |
| PUT    | `/api/checklist/itens/:id`      | **GESTORA+**      | Atualizar item      |
| DELETE | `/api/checklist/itens/:id`      | **GESTORA+**      | Inativar item       |
| POST   | `/api/checklist/responder`      | Autenticado       | Resposta diária     |
| GET    | `/api/checklist/progresso-hoje` | Autenticado       | Progresso           |
| GET    | `/api/checklist/equipe-hoje`    | **ASSESSORA_JR+** | Visão equipe no dia |

### Demandas — `/api/demandas`

| Método | Rota                           | Nível / observação  | Descrição                                 |
| ------ | ------------------------------ | ------------------- | ----------------------------------------- |
| POST   | `/api/demandas`                | **ASSESSORA_JR+**   | Criar                                     |
| GET    | `/api/demandas/minhas`         | Autenticado + query | Minhas demandas                           |
| GET    | `/api/demandas/equipe`         | **ASSESSORA_JR+**   | Filtros de equipe                         |
| GET    | `/api/demandas/semana/:semana` | **ASSESSORA_JR+**   | Por semana (rota estática antes de `:id`) |
| GET    | `/api/demandas/:id`            | Autenticado         | Detalhe                                   |
| PUT    | `/api/demandas/:id/status`     | Autenticado         | Atualizar status (máquina de estados)     |
| POST   | `/api/demandas/:id/delegar`    | **ASSESSORA_JR+**   | Delegar (hierarquia)                      |
| POST   | `/api/demandas/:id/corrigir`   | **ASSESSORA_JR+**   | Correção (notas 0/8/10, feedback)         |

### Produtividade — `/api/produtividade`

| Método | Rota                                 | Nível        | Descrição                                               |
| ------ | ------------------------------------ | ------------ | ------------------------------------------------------- |
| GET    | `/api/produtividade/ranking-semanal` | Autenticado  | Query `?semana=` opcional; padrão = semana atual        |
| GET    | `/api/produtividade/meu-desempenho`  | Autenticado  | Query `?semanas=` (padrão 12)                           |
| POST   | `/api/produtividade/calcular`        | **GESTORA+** | Body opcional `{ semana }`; recalcula e retorna ranking |

### POP — `/api/pop`

Os POPs são **versionados por perfil** (`SOCIO`, `GESTORA`, `ASSESSORA_JR`, `ESTAGIARIO`), persistidos em `pops_documentos`, com fluxo **rascunho → aprovado → publicado**. Apenas uma versão **vigente** por perfil (`vigente = true`, `status = PUBLICADO`).

| Método | Rota                         | Nível / observação                         | Descrição                                                                 |
| ------ | ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| GET    | `/api/pop/vigente/atual`     | Autenticado                                | POP vigente do perfil do usuário (query opcional `?perfil=` para gestão). |
| GET    | `/api/pop`                   | **GESTORA+**                               | Lista para gestão; query opcional `perfil`, `status` (`RASCUNHO`, `APROVADO`, `PUBLICADO`). |
| GET    | `/api/pop/:id`               | **GESTORA+**                               | Detalhe de um documento.                                                  |
| POST   | `/api/pop`                   | **GESTORA+**                               | Cria **rascunho** (nova versão incremental por perfil).                   |
| PUT    | `/api/pop/:id`               | **GESTORA+**                               | Edita apenas rascunho/aprovado (POP já **publicado** não pode ser editado). |
| POST   | `/api/pop/:id/aprovar`       | **GESTORA+**                               | Marca como aprovado.                                                      |
| POST   | `/api/pop/:id/publicar`      | **GESTORA+**                               | Publica e define como vigente (desativa vigência anterior do mesmo perfil). |

**Login:** `precisaAceitarPop` fica `true` apenas quando existe POP vigente para o perfil atual **e** o usuário ainda não aceitou essa versão. Se não houver POP publicado para o perfil, o acesso ao painel não exige aceite.

**Legado:** `POP_EST_VERSAO_ATUAL` permanece no validator de env da API por compatibilidade, mas **não** governa mais o fluxo de POP (conteúdo vem do banco).

### IA (Claude) — `/api/ia`

Rate limit dedicado: `RATE_LIMIT_IA_MAX` / `RATE_LIMIT_IA_WINDOW_MIN`.

| Método | Rota                    | Descrição                                          |
| ------ | ----------------------- | -------------------------------------------------- |
| POST   | `/api/ia/chat`          | Enviar mensagem (stream/conversa conforme serviço) |
| GET    | `/api/ia/conversas`     | Listar conversas                                   |
| GET    | `/api/ia/conversas/:id` | Histórico                                          |
| DELETE | `/api/ia/conversas/:id` | Excluir conversa                                   |
| GET    | `/api/ia/consumo`       | Uso de tokens / limites do usuário                 |

### Certificados — `/api/certificados`

Ordem das rotas: `meus` e `download` antes de parâmetros genéricos.

| Método | Rota                                   | Nível        | Descrição                              |
| ------ | -------------------------------------- | ------------ | -------------------------------------- |
| GET    | `/api/certificados/meus`               | Autenticado  | Meus certificados                      |
| GET    | `/api/certificados/:id/download`       | Autenticado  | Download autenticado do PDF            |
| GET    | `/api/certificados/usuario/:usuarioId` | **GESTORA+** | Certificados de outro usuário          |
| POST   | `/api/certificados/emitir`             | **GESTORA+** | Emissão manual                         |
| POST   | `/api/certificados/emitir-semanais`    | **GESTORA+** | Emissão em lote (pódium semanal, etc.) |

### Cursos — `/api/cursos`

| Método | Rota                        | Nível        | Descrição                         |
| ------ | --------------------------- | ------------ | --------------------------------- |
| GET    | `/api/cursos`               | Autenticado  | Listar cursos ativos / aplicáveis |
| GET    | `/api/cursos/meu-progresso` | Autenticado  | Progresso individual              |
| POST   | `/api/cursos`               | **GESTORA+** | Criar curso                       |
| PUT    | `/api/cursos/:id`           | **GESTORA+** | Atualizar                         |
| POST   | `/api/cursos/concluir`      | Autenticado  | Marcar conclusão                  |

### Notificações — `/api/notificacoes`

| Método | Rota                                        | Nível        | Descrição                            |
| ------ | ------------------------------------------- | ------------ | ------------------------------------ |
| GET    | `/api/notificacoes/minhas`                  | Autenticado  | Caixa de notificações internas       |
| POST   | `/api/notificacoes/whatsapp/enviar-manual`  | **GESTORA+** | Disparo manual (fila)                |
| POST   | `/api/notificacoes/whatsapp/processar-fila` | **GESTORA+** | Processar fila (também roda no cron) |

### Auditoria — `/api/auditoria` (**GESTORA+**)

| Método | Rota             | Query comuns                                                                             | Descrição                |
| ------ | ---------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| GET    | `/api/auditoria` | `entidade`, `usuario`, `de`, `ate`, `limite` (padrão 100, máx. 500), `pagina` (padrão 1) | Lista paginada com total |

### Relatórios gerenciais — `/api/relatorios-gerenciais`

| Método | Rota                                       | Regras                                                                            | Descrição                |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------ |
| GET    | `/api/relatorios-gerenciais/espelho-ponto` | Autenticado; `ESTAGIARIO` só `usuarioId` próprio; query `mes`, `ano`, `usuarioId` | PDF `application/pdf`    |
| GET    | `/api/relatorios-gerenciais/resumo-equipe` | **ASSESSORA_JR+**; `de`, `ate`                                                    | Indicadores no intervalo |

**Rate limit global (rotas com rate limit habilitado no plugin):** `RATE_LIMIT_API_MAX` requisições por `RATE_LIMIT_API_WINDOW_MIN` minutos por usuário (ou IP se não autenticado), exceto onde há config específica (login, IA).

---

## Frontend web (Next.js) – páginas e comportamento

- **URL base da API:** `NEXT_PUBLIC_API_URL` (em produção costuma ser `https://<domínio>/api`). Se não definido, o client usa `'/api` relativo (adequado se o browser já estiver no mesmo host que a API). Em desenvolvimento local, defina por exemplo `http://localhost:4000/api` em `apps/web/.env.local`. Ver [apps/web/lib/api.ts](apps/web/lib/api.ts).

### Rotas App Router

| Rota             | Função                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| `/`              | Login (`react-hook-form` + Zod; redireciona para `/aceite-pop` ou `/dashboard`) |
| `/aceite-pop`    | Aceite obrigatório do POP (primeiro acesso)                                     |
| `/dashboard`     | Painel principal                                                                |
| `/ponto`         | Ponto digital                                                                   |
| `/checklist`     | Checklist 5S                                                                    |
| `/demandas`      | Lista; `/demandas/nova` cria; `/demandas/[id]` detalhe                          |
| `/relatorio`     | Relatório diário                                                                |
| `/produtividade` | Ranking e desempenho (ex.: gráfico 8 semanas)                                   |
| `/chat-ia`       | Chat Claude                                                                     |
| `/certificados`  | Meus certificados                                                               |
| `/cursos`        | Cursos e progresso                                                              |
| `/espelho-ponto` | Geração/visualização do espelho (PDF via API)                                   |
| `/notificacoes`  | Notificações                                                                    |
| `/pop`           | Gestão de POPs por perfil (**GESTORA+**)                                       |
| `/auditoria`     | Consulta (apenas **GESTORA+** no menu)                                          |

O layout `(painel)` exige `accessToken` e `usuario` no Zustand; redireciona para `/` se inválido e força `/aceite-pop` quando `precisaAceitarPop`. Ver [apps/web/app/(painel)/layout.tsx](<apps/web/app/(painel)/layout.tsx>) e [apps/web/components/shared/cabecalho.tsx](apps/web/components/shared/cabecalho.tsx).

**Design:** Tailwind com identidade navy/dourado (`globals.css` + classes utilitárias institucionais).

---

## App mobile (Expo)

Resumo: login, aceite POP, abas (Início, Ponto, Relatório, Checklist, Demandas), armazenamento seguro de token, `EXPO_PUBLIC_API_URL` para apontar a API (em dispositivo físico use IP da máquina, não `localhost`).

Documentação detalhada: [apps/mobile/README.md](apps/mobile/README.md).

---

## Fluxos de negócio principais

### 1) Autenticação e sessão

Login retorna access + refresh + dados do usuário (incl. `precisaAceitarPop`, `aceitePopVersao`, `aceitePopPerfil`). Refresh em `/api/auth/refresh`. Senha: política mínima e **histórico das últimas 5 senhas** (constante `SENHA_HISTORICO_BLOQUEADO` em `@rb/constants`).

### 2) Aceite do POP

A tela de aceite carrega o texto via `GET /api/pop/vigente/atual`. O aceite é enviado em `POST /api/auth/aceitar-pop` com body `{ popId }`, referindo o POP vigente do perfil do usuário. O histórico fica em `pops_aceites` (versão, perfil, IP, User-Agent); os campos `aceite_pop_*` em `usuarios` são mantidos como espelho para compatibilidade.

### 3) Ponto digital

Sequência fixa de tipos; **foto obrigatória** (limite de bytes em `PONTO_FOTO_MAX_BYTES`); IP e User-Agent; **SAIDA_FINAL** condicionada ao relatório (regra no domínio/serviço). **Edição** apenas **GESTORA+** com justificativa mínima (`PONTO_JUSTIFICATIVA_MIN`).

### 4) Relatório diário

Três campos de texto com mínimos (`RELATORIO_MIN_CARACTERES`); se “demanda concluída” = não, justificativa obrigatória; atestado opcional com tipos e MIME (`UPLOAD_MIMES_ATESTADO`).

### 5) Checklist 5S

Itens filtrados por categoria, perfil, presencial/remoto; respostas idempotentes por `(usuário, item, data)`; progresso agregado no dia.

### 6) Demandas

Criação por **ASSESSORA_JR+**; transições de status; **delegação** só “para baixo” na hierarquia; **correção** com notas **0, 8 ou 10** e feedback; prazo e alertas via job/WhatsApp.

### 7) Produtividade e ranking

Pontuação semanal com teto 100 pontos, componentes: pontualidade (25), qualidade (40), extras (15), checklist (10), relatórios (10) — ver `PONTOS_MAXIMOS_SEMANA` em `@rb/constants`. **Cálculo automático** na segunda 07:00; emissão de certificados do pódio integrada ao job (conforme `ranking-semanal.job`).

### 8) WhatsApp (Z-API)

Mensagens enfileiradas em `notificacoes_whatsapp` com retentativas; processamento **a cada minuto** + jobs de negócio (lembretes, prazos).

### 9) IA

Conversas em `chat_ia_mensagens` por `conversaId`; limite de histórico e consumo de tokens controlados no serviço; system prompt jurídico interno (arquivos em `modules/ia` / integração Anthropic).

### 10) PDFs

Certificados e espelho de ponto via **Puppeteer**; browser encerrado no shutdown da API (`encerrarBrowserPdf`).

### 11) Auditoria

Gravação automática via plugin de auditoria nas ações sensíveis; listagem com filtros para **GESTORA+**.

---

## Jobs agendados (cron)

Definidos em [apps/api/src/jobs/index.ts](apps/api/src/jobs/index.ts), timezone **`America/Bahia`**.  
**Importante:** os crons **só são iniciados quando `NODE_ENV === 'production'`** em [apps/api/src/server.ts](apps/api/src/server.ts). Em `development` os jobs **não** rodam.

| Schedule       | Job                | Função resumida                                   |
| -------------- | ------------------ | ------------------------------------------------- |
| `30 8 * * 1-5` | lembrete-ponto     | Lembretes de ponto (ex.: estagiários sem entrada) |
| `0 7 * * 1-5`  | alerta-prazo       | Demandas a D-3, D-2, D-1                          |
| `0 7 * * 1`    | ranking-semanal    | Cálculo de ranking / certificados semanais        |
| `0 19 * * 1-5` | lembrete-relatorio | Relatórios faltantes                              |
| `* * * * *`    | fila-whatsapp      | Processa fila de mensagens                        |

---

## Integrações externas

| Sistema               | Uso             | Configuração                                                           |
| --------------------- | --------------- | ---------------------------------------------------------------------- |
| **Z-API**             | WhatsApp        | `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_BASE_URL` |
| **Anthropic**         | Chat IA         | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS`         |
| **Let’s Encrypt**     | TLS no Traefik  | `TRAEFIK_ACME_EMAIL` + `traefik/acme.json`                             |
| **rclone** (opcional) | Backup em nuvem | `RCLONE_REMOTE`, `BACKUP_PREFIXO`, `GPG_PUBLIC_KEY_ID`                 |

Templates de mensagem WhatsApp e cliente HTTP: `apps/api/src/integrations/zapi/`.

---

## Pacotes compartilhados `@rb/*`

- **`@rb/constants`:** perfis, hierarquia, tipos de ponto, status de demanda, notas de correção, limites de senha, categorias de checklist, status de documento POP, ações de auditoria (incl. POP), somatório máximo de pontos.
- **`@rb/validators`:** schemas Zod usados na API (e espelhados no web com react-hook-form), incluindo POP (`criarPopSchema`, `atualizarPopSchema`, etc.).
- **`@rb/types`:** DTOs (ex.: `RespostaLogin`, `UsuarioSessao`, `PopDocumentoDTO`).
- **`@rb/utils`:** `dayjs` com fuso, `semanaReferencia`, rótulos de perfil, regras auxiliares.

O `apps/web` configura `transpilePackages` para estes pacotes no Next.js.

---

## Variáveis de ambiente

Referência: [.env.example](.env.example) na raiz. Campos críticos:

- Banco: `DATABASE_URL` (em Docker: host `db`; no host Windows com só Postgres no Docker: `127.0.0.1` e porta mapeada, ex. `5433`).
- JWT: `JWT_SECRET`, `JWT_REFRESH_SECRET` (mín. 32 caracteres no validator da API), expirações.
- `NEXT_PUBLIC_API_URL` para o browser alcançar a API.
- Limites: upload, rate limits, bcrypt.
- Seed: `SEED_SOCIO_*`, `SEED_GESTORA_*`.
- `POP_EST_VERSAO_ATUAL`: legado no `.env`; não controla mais o POP vigente (ver seção POP acima).

A API carrega `.env` da **raiz do monorepo** e, em seguida, `apps/api/.env` (override). Ver [apps/api/src/config/env.ts](apps/api/src/config/env.ts).

---

## Instalação e execução

### Requisitos

- Node.js **≥ 24**
- **pnpm** 9.x (recomendado 9.12)
- PostgreSQL **16** (local ou via Docker)

### Monorepo (desenvolvimento)

```bash
pnpm install
cp .env.example .env
# Ajuste DATABASE_URL, segredos JWT e NEXT_PUBLIC_API_URL (ex.: http://localhost:4000/api para o web em dev)
```

**Prisma (na ordem):**

```bash
pnpm --filter @rb/api prisma generate
pnpm --filter @rb/api prisma migrate dev
pnpm --filter @rb/api seed
```

**Subir tudo em modo dev (API + web via Turbo):**

```bash
pnpm dev
```

- API: porta **4000** (padrão `API_PORT`).
- Web: porta **3000**.

### Docker Compose (produção / homologação)

1. `cp .env.example .env` e preencha todos os placeholders.
2. `touch traefik/acme.json && chmod 600 traefik/acme.json` (em Linux; no Windows adapte permissões conforme o ambiente).
3. `docker compose up -d --build`
4. `docker compose exec api pnpm prisma migrate deploy`
5. `docker compose exec api pnpm seed`

Serviços: `db` (Postgres, porta publicada `127.0.0.1:5433:5432`), `api`, `web`, `traefik`, `backup`. Uploads: volume `rb_uploads`. Opcional: `./docs` montado em somente leitura no container da API (usado pelo seed para importar o markdown inicial do POP de estagiário, quando existir).

### O que o seed cria

- Sócio titular e gestora (emails/senhas via env).
- Itens de checklist 5S (idempotente por categoria+texto).
- Cursos obrigatórios (LGPD, ética, POP para estagiário, etc.).
- POPs iniciais em `pops_documentos`: versão publicada/vigente para **ESTAGIARIO** (conteúdo a partir de `docs/POP-EST-001.md` quando disponível); para **SOCIO**, **GESTORA** e **ASSESSORA_JR**, garante documento vigente ou promove existente para publicado.

**Trocar as senhas seed no primeiro acesso.**

---

## Testes e qualidade

```bash
pnpm test                    # all workspaces
pnpm --filter @rb/api test  # backend (Vitest)
pnpm lint
pnpm typecheck
```

Cobertura de domínio (exemplos): ponto, demandas, produtividade, força de senha (`packages/utils`).

---

## Infraestrutura (Docker, Traefik, backup)

- **Traefik:** regras em [docker-compose.yml](docker-compose.yml) — `Host(APP_DOMAIN) && PathPrefix(/api)` → API; `Host(APP_DOMAIN)` com prioridade para o frontend.
- **Backup:** serviço `rb-backup`, cron interno, `pg_dump` + upload; ver [scripts/backup/README.md](scripts/backup/README.md).

---

## Conformidade e governança

- **Lei 11.788/2008** (estágio), **LGPD 13.709/2018**, **Estatuto da OAB / Res. CF OAB 5/2010** (sigilo e limites) — conforme políticas descritas na documentação interna e rastreabilidade (POP, fotos, auditoria).
- DPO e bases legais conforme processos do escritório (referência geral no README histórico).

---

## Convenções de desenvolvimento

- Commits: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Antes de integrar: `pnpm lint && pnpm typecheck && pnpm test`.
- Regras de domínio novas: preferir TDD em `*.domain.test.ts`.
- Nomes de regra de negócio em **português** nos domínios; termos técnicos de código em **inglês** quando convencionado (controller, service).

---

## Contato técnico (interno)

Dúvidas operacionais ou de infraestrutura: canal definido internamente (ex.: gestão + fornecedor de TI).

---

_Este guia descreve o estado atual do código no repositório. Em caso de divergência, prevalecem os arquivos de implementação (`apps/api`, `apps/web`, `prisma/schema.prisma`) e o `.env.example`._
