import type { FastifyInstance } from 'fastify';

import { CertificadosController } from './certificados.controller.js';
import { CertificadosService } from './certificados.service.js';
import { PrismaCertificadosRepository } from './certificados.repository.js';

export async function certificadosRoutes(app: FastifyInstance): Promise<void> {
  const service = new CertificadosService(new PrismaCertificadosRepository());
  const controller = new CertificadosController(service);

  app.get('/meus', { onRequest: [app.autenticar] }, controller.meus);
  app.get<{ Params: { id: string } }>('/:id/download', { onRequest: [app.autenticar] }, controller.download);

  app.get<{ Params: { usuarioId: string } }>(
    '/usuario/:usuarioId',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')] },
    controller.doUsuario,
  );

  app.post<{ Body: { semana: string } }>(
    '/emitir-semanais',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')] },
    controller.emitirSemanais,
  );

  app.post<{
    Body: {
      usuarioId: string;
      tipo: import('@rb/constants').TipoCertificado;
      periodoReferencia: string;
      pontuacaoObtida: number;
      posicaoFinal: number;
    };
  }>(
    '/emitir',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')] },
    controller.emitirManual,
  );
}

export function novoCertificadosService(): CertificadosService {
  return new CertificadosService(new PrismaCertificadosRepository());
}
