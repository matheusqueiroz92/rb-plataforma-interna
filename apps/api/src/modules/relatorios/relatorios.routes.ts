import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { enviarRelatorioSchema } from '@rb/validators';

import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosService } from './relatorios.service.js';
import { PrismaRelatoriosRepository } from './relatorios.repository.js';

export async function relatoriosRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaRelatoriosRepository();
  const service = new RelatoriosService(repo);
  const controller = new RelatoriosController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.post('/enviar', {
    onRequest: [app.autenticar],
    schema: { body: enviarRelatorioSchema },
    handler: controller.enviar,
  });

  route.get('/meus', { onRequest: [app.autenticar], handler: controller.meus });
  route.get('/hoje', { onRequest: [app.autenticar], handler: controller.hoje });

  route.get('/equipe', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    handler: controller.equipe,
  });

  route.post('/:id/marcar-lido', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    handler: controller.marcarLido,
  });

  route.post('/atestado/upload', {
    onRequest: [app.autenticar],
    handler: controller.uploadAtestado,
  });
}
