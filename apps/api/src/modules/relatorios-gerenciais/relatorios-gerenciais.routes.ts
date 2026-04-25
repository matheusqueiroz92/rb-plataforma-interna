import type { FastifyInstance } from 'fastify';

import { RelatoriosGerenciaisService } from './relatorios-gerenciais.service.js';
import { ErroAutenticacao, ErroValidacao } from '../../shared/errors/app-error.js';

export async function relatoriosGerenciaisRoutes(app: FastifyInstance): Promise<void> {
  const service = new RelatoriosGerenciaisService();

  app.get<{ Querystring: { mes?: string; ano?: string; usuarioId?: string } }>(
    '/espelho-ponto',
    { onRequest: [app.autenticar] },
    async (req, reply) => {
      if (!req.user) throw new ErroAutenticacao();
      const mes = req.query.mes ? parseInt(req.query.mes, 10) : new Date().getMonth() + 1;
      const ano = req.query.ano ? parseInt(req.query.ano, 10) : new Date().getFullYear();
      if (mes < 1 || mes > 12 || ano < 2020) {
        throw new ErroValidacao('Mes ou ano invalidos.');
      }

      // Estagiario so pode ver o proprio. Niveis maiores podem consultar outros.
      const alvo = req.query.usuarioId ?? req.user.id;
      if (alvo !== req.user.id && req.user.perfil === 'ESTAGIARIO') {
        throw new ErroValidacao('Voce so pode consultar o proprio espelho.');
      }

      const pdf = await service.espelhoPontoMensal(alvo, mes, ano);
      reply
        .header('Content-Type', 'application/pdf')
        .header(
          'Content-Disposition',
          `inline; filename="espelho-ponto-${ano}-${String(mes).padStart(2, '0')}.pdf"`,
        )
        .send(pdf);
    },
  );

  app.get<{ Querystring: { de?: string; ate?: string } }>(
    '/resumo-equipe',
    { onRequest: [app.autenticar, app.exigirNivelMinimo('ASSESSORA_JR')] },
    async (req) => {
      const hoje = new Date();
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const de = req.query.de ? new Date(req.query.de) : primeiroDia;
      const ate = req.query.ate ? new Date(req.query.ate) : hoje;
      const dados = await service.resumoEquipe(de, ate);
      return { de, ate, total: dados.length, dados };
    },
  );
}
