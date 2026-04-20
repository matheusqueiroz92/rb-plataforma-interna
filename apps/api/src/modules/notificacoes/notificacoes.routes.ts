import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { enviarNotificacaoManualSchema } from '@rb/validators';

import { NotificacoesController } from './notificacoes.controller.js';
import { NotificacoesService } from './notificacoes.service.js';
import { PrismaNotificacoesRepository } from './notificacoes.repository.js';

export async function notificacoesRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaNotificacoesRepository();
  const service = new NotificacoesService(repo);
  const controller = new NotificacoesController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.get('/minhas', { onRequest: [app.autenticar], handler: controller.minhas });

  route.post('/whatsapp/enviar-manual', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: enviarNotificacaoManualSchema },
    handler: controller.enviarManual,
  });

  route.post('/whatsapp/processar-fila', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    handler: controller.processarFila,
  });
}

export function novoNotificacoesService(): NotificacoesService {
  return new NotificacoesService(new PrismaNotificacoesRepository());
}
