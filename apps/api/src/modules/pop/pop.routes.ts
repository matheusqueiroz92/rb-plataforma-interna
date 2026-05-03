import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { criarPopSchema, atualizarPopSchema, filtroPopSchema } from '@rb/validators';

import { PopController } from './pop.controller.js';
import { PopService } from './pop.service.js';
import { PrismaPopRepository } from './pop.repository.js';

export async function popRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaPopRepository();
  const service = new PopService(repo);
  const controller = new PopController(service);
  const route = app.withTypeProvider<ZodTypeProvider>();

  route.get('/', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { querystring: filtroPopSchema },
    handler: controller.listar,
  });
  route.get('/vigente/atual', {
    onRequest: [app.autenticar],
    handler: controller.vigentePorPerfil,
  });
  route.get('/:id', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    handler: controller.obter,
  });
  route.post('/', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: criarPopSchema },
    handler: controller.criar,
  });
  route.put('/:id', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: atualizarPopSchema },
    handler: controller.atualizar,
  });
  route.post('/:id/aprovar', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    handler: controller.aprovar,
  });
  route.post('/:id/publicar', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    handler: controller.publicar,
  });
}
