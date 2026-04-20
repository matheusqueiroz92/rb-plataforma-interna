import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import staticPlugin from '@fastify/static';
import path from 'node:path';

import { env } from './config/env.js';
import { logger } from './shared/logger/logger.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { auditoriaPlugin } from './plugins/auditoria.plugin.js';
import { errorHandlerPlugin } from './plugins/error-handler.plugin.js';
import { zodPlugin } from './plugins/zod.plugin.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { pontoRoutes } from './modules/ponto/ponto.routes.js';
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes.js';
import { auditoriaRoutes } from './modules/auditoria/auditoria.routes.js';
import { popRoutes } from './modules/pop/pop.routes.js';
import { checklistRoutes } from './modules/checklist/checklist.routes.js';
import { demandasRoutes } from './modules/demandas/demandas.routes.js';
import { produtividadeRoutes } from './modules/produtividade/produtividade.routes.js';
import { notificacoesRoutes } from './modules/notificacoes/notificacoes.routes.js';
import { iaRoutes } from './modules/ia/ia.routes.js';
import { certificadosRoutes } from './modules/certificados/certificados.routes.js';
import { cursosRoutes } from './modules/cursos/cursos.routes.js';
import { relatoriosGerenciaisRoutes } from './modules/relatorios-gerenciais/relatorios-gerenciais.routes.js';

export async function criarApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024,
    ajv: { customOptions: { removeAdditional: 'all' } },
  });

  await app.register(zodPlugin);
  await app.register(sensible);
  await app.register(helmet, { crossOriginResourcePolicy: false });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, {
    global: false,
    max: env.RATE_LIMIT_API_MAX,
    timeWindow: `${env.RATE_LIMIT_API_WINDOW_MIN} minute`,
    keyGenerator: (req) => req.user?.id ?? req.ip,
  });
  await app.register(multipart, {
    limits: { fileSize: env.UPLOAD_MAX_BYTES },
  });
  await app.register(staticPlugin, {
    root: path.resolve(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  await app.register(authPlugin);
  await app.register(auditoriaPlugin);
  await app.register(errorHandlerPlugin);

  app.get('/api/health', async () => ({ status: 'ok', servico: 'rb-api' }));

  app.get('/api/eu', { onRequest: [async (req) => app.autenticar(req)] }, async (req) => ({
    usuario: req.user,
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(pontoRoutes, { prefix: '/api/ponto' });
  await app.register(relatoriosRoutes, { prefix: '/api/relatorios' });
  await app.register(auditoriaRoutes, { prefix: '/api/auditoria' });
  await app.register(popRoutes, { prefix: '/api/pop' });
  await app.register(checklistRoutes, { prefix: '/api/checklist' });
  await app.register(demandasRoutes, { prefix: '/api/demandas' });
  await app.register(produtividadeRoutes, { prefix: '/api/produtividade' });
  await app.register(notificacoesRoutes, { prefix: '/api/notificacoes' });
  await app.register(iaRoutes, { prefix: '/api/ia' });
  await app.register(certificadosRoutes, { prefix: '/api/certificados' });
  await app.register(cursosRoutes, { prefix: '/api/cursos' });
  await app.register(relatoriosGerenciaisRoutes, { prefix: '/api/relatorios-gerenciais' });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ codigo: 'NAO_ENCONTRADO', mensagem: 'Rota nao encontrada.' });
  });

  app.addHook('onReady', async () => {
    logger.info(`API pronta em ${env.NODE_ENV}`);
  });

  return app;
}
