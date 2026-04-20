# @rb/mobile

App mobile da Plataforma Interna Reboucas e Bulhoes, construido com Expo SDK 52, React Native 0.76 e expo-router v4.

## Funcionalidades

- Login com JWT armazenado via `expo-secure-store` (fallback para AsyncStorage no web).
- Tela de aceite do POP-EST-001 obrigatoria no primeiro acesso.
- Tabs nativas: Inicio, Ponto, Relatorio, Checklist, Demandas.
- Registro de ponto com camera frontal, sequencia travada, antifraude espelhada do backend.
- Relatorio diario com regras de minimo de caracteres.
- Checklist 5S interativo com progresso percentual.
- Listagem de demandas atribuidas.

Compartilha os pacotes `@rb/constants`, `@rb/types`, `@rb/utils` e `@rb/validators` com api e web.

## Requisitos

- Node.js 24 LTS
- pnpm 9.12
- Expo CLI (`pnpm dlx expo` ja funciona)
- Conta Expo EAS para builds nativos (`eas login`)
- Para iOS: macOS com Xcode; para Android: Android Studio com SDK 35

## Setup local

```bash
# Na raiz do monorepo
pnpm install

# Primeiro uso: prebuild para gerar codigo nativo (opcional; so necessario fora do Expo Go)
cd apps/mobile
pnpm prebuild

# Desenvolvimento com Expo Go
pnpm start
# Escolha: A (Android), I (iOS simulador), W (web para teste rapido)
```

Configure o endereco da API antes de rodar:

```bash
# Em apps/mobile crie um arquivo .env local se necessario (EAS usa eas.json)
echo 'EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:4000/api' > .env
```

Durante o desenvolvimento use o IP da maquina (nao `localhost`), pois o dispositivo fisico precisa alcancar o backend.

## Builds nativos

Configurados em `eas.json`:

- `eas build --profile development --platform ios` (development client interno)
- `eas build --profile preview --platform android` (APK interno)
- `eas build --profile production --platform all` (ambas as stores)

Ambiente de producao aponta automaticamente para `https://plataforma.reboucasebulhoes.com.br/api` via `env` no `eas.json`.

## Estrutura

```
apps/mobile/
├── app.json            Configuracao Expo (permissoes, icones, plugins)
├── eas.json            Perfis de build
├── babel.config.js     Preset Expo + reanimated
├── metro.config.js     Monorepo hoist config
├── tsconfig.json       Estende expo/tsconfig.base
├── app/
│   ├── _layout.tsx     Layout raiz: Stack, guardas de autenticacao
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── aceite-pop.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── inicio.tsx
│       ├── ponto.tsx
│       ├── relatorio.tsx
│       ├── checklist.tsx
│       └── demandas.tsx
├── components/
│   └── CapturaFoto.tsx  Camera frontal com expo-camera
├── lib/
│   ├── api.ts           HTTP client tipado
│   ├── auth-store.ts    Zustand + SecureStore
│   ├── query-provider.tsx
│   └── theme.ts         Paleta e tokens institucionais
├── hooks/               Hooks reutilizaveis (vazio por enquanto)
└── assets/
    └── images/          Icones do app
```

## Permissoes necessarias

Ja declaradas em `app.json`:

- **iOS**: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`.
- **Android**: `CAMERA`, `INTERNET`, `READ_EXTERNAL_STORAGE`.

## Design system

O mobile reusa a paleta e a lingua visual do web (navy + dourado, tipografia serif/sans) via `lib/theme.ts`. Componentes sao construidos com `StyleSheet` nativo (sem NativeWind) para manter performance e controle fino em telas sensiveis como a camera do ponto.

## Limitacoes atuais (escopo)

- Nao ha push notifications ainda. Pode ser adicionado com expo-notifications quando desejado.
- Nao ha modo offline. Para locais sem conexao, o ponto so e registrado online.
- Nao ha telas de produtividade/certificados/cursos. Planejadas para iteracoes futuras.

## Fluxo de testes manuais recomendado

1. Login com credenciais de teste.
2. Se for primeiro acesso, ler e aceitar o POP.
3. Registrar ENTRADA na aba Ponto (conceder permissao de camera).
4. Verificar que SAIDA_ALMOCO fica habilitado e a sequencia e respeitada.
5. Tentar registrar SAIDA_FINAL sem relatorio: deve ser bloqueado.
6. Enviar relatorio do dia.
7. Marcar alguns itens do checklist.
8. Conferir lista de demandas atribuidas.

## Conformidade

Integra a mesma trilha de auditoria do backend: cada requisicao autenticada registra IP, User-Agent e timestamp do servidor. O campo `dispositivo=mobile` e enviado no registro de ponto para facilitar filtros na auditoria.
