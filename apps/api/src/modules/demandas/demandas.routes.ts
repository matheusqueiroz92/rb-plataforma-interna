import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  atualizarStatusSchema,
  corrigirDemandaSchema,
  criarDemandaSchema,
  delegarDemandaSchema,
  filtroDemandasSchema,
} from '@rb/validators';

import { DemandasController } from './demandas.controller.js';
import { DemandasService } from './demandas.service.js';
import { PrismaDemandasRepository } from './demandas.repository.js';

export async function demandasRoutes(app: FastifyInstance): Promise<void> {
  const repo = new PrismaDemandasRepository();
  const service = new DemandasService(repo);
  const controller = new DemandasController(service);

  const route = app.withTypeProvider<ZodTypeProvider>();

  route.post('/', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    schema: { body: criarDemandaSchema },
    handler: controller.criar,
  });

  route.get('/minhas', {
    onRequest: [app.autenticar],
    schema: { querystring: filtroDemandasSchema },
    handler: controller.minhas,
  });

  route.get('/equipe', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    schema: { querystring: filtroDemandasSchema },
    handler: controller.equipe,
  });

  route.get('/semana/:semana', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    handler: controller.semana,
  });

  route.get('/:id', { onRequest: [app.autenticar], handler: controller.obter });

  route.put('/:id/status', {
    onRequest: [app.autenticar],
    schema: { body: atualizarStatusSchema },
    handler: controller.atualizarStatus,
  });

  route.post('/:id/delegar', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    schema: { body: delegarDemandaSchema },
    handler: controller.delegar,
  });

  route.post('/:id/corrigir', {
    onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')],
    schema: { body: corrigirDemandaSchema },
    handler: controller.corrigir,
  });
}
