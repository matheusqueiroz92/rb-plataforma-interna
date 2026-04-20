import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginSchema, refreshSchema, trocarSenhaSchema } from '@rb/validators';

import { env } from '../../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaAuthRepository } from './auth.repository.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaAuthRepository();
  const service = new AuthService(repo, app);
  const controller = new AuthController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.post('/login', {
    schema: { body: loginSchema },
    config: {
      rateLimit: {
        max: env.RATE_LIMIT_LOGIN_MAX,
        timeWindow: `${env.RATE_LIMIT_LOGIN_WINDOW_MIN} minutes`,
      },
    },
    handler: controller.login,
  });

  route.post('/refresh', {
    schema: { body: refreshSchema },
    handler: controller.refresh,
  });

  route.post('/logout', {
    onRequest: [app.autenticar],
    handler: controller.logout,
  });

  route.post('/trocar-senha', {
    schema: { body: trocarSenhaSchema },
    onRequest: [app.autenticar],
    handler: controller.trocarSenha,
  });

  route.post('/aceitar-pop', {
    onRequest: [app.autenticar],
    handler: controller.aceitarPop,
  });
}
