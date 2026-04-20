import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  editarPontoSchema,
  filtroHistoricoSchema,
  registrarPontoSchema,
} from '@rb/validators';

import { PontoController } from './ponto.controller.js';
import { PontoService } from './ponto.service.js';
import { PrismaPontoRepository } from './ponto.repository.js';

export async function pontoRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaPontoRepository();
  const service = new PontoService(repo);
  const controller = new PontoController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.post('/registrar', {
    onRequest: [app.autenticar],
    schema: { body: registrarPontoSchema },
    handler: controller.registrar,
  });

  route.get('/hoje', {
    onRequest: [app.autenticar],
    handler: controller.hoje,
  });

  route.get('/historico', {
    onRequest: [app.autenticar],
    schema: { querystring: filtroHistoricoSchema },
    handler: controller.historico,
  });

  route.put('/:id/editar', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')],
    schema: { body: editarPontoSchema },
    handler: controller.editar,
  });
}
