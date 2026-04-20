import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  atualizarItemChecklistSchema,
  criarItemChecklistSchema,
  responderChecklistSchema,
} from '@rb/validators';

import { ChecklistController } from './checklist.controller.js';
import { ChecklistService } from './checklist.service.js';
import { PrismaChecklistRepository } from './checklist.repository.js';

export async function checklistRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaChecklistRepository();
  const service = new ChecklistService(repo);
  const controller = new ChecklistController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.get('/itens', { onRequest: [app.autenticar], handler: controller.listar });

  route.post('/itens', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: criarItemChecklistSchema },
    handler: controller.criar,
  });

  route.put('/itens/:id', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: atualizarItemChecklistSchema },
    handler: controller.atualizar,
  });

  route.delete('/itens/:id', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    handler: controller.inativar,
  });

  route.post('/responder', {
    onRequest: [app.autenticar],
    schema: { body: responderChecklistSchema },
    handler: controller.responder,
  });

  route.get('/progresso-hoje', {
    onRequest: [app.autenticar],
    handler: controller.progresso,
  });

  route.get('/equipe-hoje', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    handler: controller.equipe,
  });
}
