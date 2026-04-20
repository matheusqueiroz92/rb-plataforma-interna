import type { FastifyInstance, FastifyRequest } from 'fastify';

import { AuditoriaService } from './auditoria.service.js';
import { PrismaAuditoriaRepository } from './auditoria.repository.js';

interface FiltroQuery {
  entidade?: string;
  usuario?: string;
  de?: string;
  ate?: string;
  limite?: string;
  pagina?: string;
}

export async function auditoriaRoutes(app: FastifyInstance): Promise<void> {
  const service = new AuditoriaService(new PrismaAuditoriaRepository());

  app.get(
    '/',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')] },
    async (req: FastifyRequest<{ Querystring: FiltroQuery }>) => {
      return service.listar({
        entidade: req.query.entidade,
        usuarioId: req.query.usuario,
        de: req.query.de ? new Date(req.query.de) : undefined,
        ate: req.query.ate ? new Date(req.query.ate) : undefined,
        limite: req.query.limite ? parseInt(req.query.limite, 10) : undefined,
        pagina: req.query.pagina ? parseInt(req.query.pagina, 10) : undefined,
      });
    },
  );
}
