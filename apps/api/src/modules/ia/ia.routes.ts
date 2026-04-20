import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { enviarMensagemIaSchema } from '@rb/validators';

import { env } from '../../config/env.js';
import { IaController } from './ia.controller.js';
import { IaService } from './ia.service.js';
import { PrismaIaRepository } from './ia.repository.js';

export async function iaRoutes(app: FastifyInstance): Promise<void> {
  const service = new IaService(new PrismaIaRepository());
  const controller = new IaController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.post('/chat', {
    onRequest: [app.autenticar],
    schema: { body: enviarMensagemIaSchema },
    config: {
      rateLimit: {
        max: env.RATE_LIMIT_IA_MAX,
        timeWindow: `${env.RATE_LIMIT_IA_WINDOW_MIN} minutes`,
      },
    },
    handler: controller.enviar,
  });

  route.get('/conversas', { onRequest: [app.autenticar], handler: controller.conversas });
  route.get('/conversas/:id', { onRequest: [app.autenticar], handler: controller.historico });
  route.delete('/conversas/:id', { onRequest: [app.autenticar], handler: controller.excluir });
  route.get('/consumo', { onRequest: [app.autenticar], handler: controller.consumo });
}
