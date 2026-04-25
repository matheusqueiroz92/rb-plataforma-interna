import type { FastifyInstance } from 'fastify';
import { semanaReferencia as semanaAtual } from '@rb/utils';

import { ProdutividadeService } from './produtividade.service.js';
import { PrismaProdutividadeRepository } from './produtividade.repository.js';
import { ErroAutenticacao } from '../../shared/errors/app-error.js';

export async function produtividadeRoutes(app: FastifyInstance): Promise<void> {
  const service = new ProdutividadeService(new PrismaProdutividadeRepository());

  app.get<{ Querystring: { semana?: string } }>(
    '/ranking-semanal',
    { onRequest: [app.autenticar] },
    async (req) => {
      const semana = req.query.semana ?? semanaAtual();
      const dados = await service.ranking(semana);
      return { semana, total: dados.length, dados };
    },
  );

  app.get<{ Querystring: { semanas?: string } }>(
    '/meu-desempenho',
    { onRequest: [app.autenticar] },
    async (req) => {
      if (!req.user) throw new ErroAutenticacao();
      const qtd = req.query.semanas ? parseInt(req.query.semanas, 10) : 12;
      const dados = await service.meuDesempenho(req.user.id, qtd);
      return { total: dados.length, dados };
    },
  );

  app.post<{ Body: { semana?: string } }>(
    '/calcular',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('GESTORA')] },
    async (req) => {
      const semana = req.body?.semana ?? semanaAtual();
      await service.calcularRankingDaSemana(semana);
      const dados = await service.ranking(semana);
      return { semana, total: dados.length, dados };
    },
  );
}
