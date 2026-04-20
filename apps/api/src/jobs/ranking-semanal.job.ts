import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import { semanaReferencia } from '@rb/utils';

import { logger } from '../shared/logger/logger.js';
import { ProdutividadeService } from '../modules/produtividade/produtividade.service.js';
import { PrismaProdutividadeRepository } from '../modules/produtividade/produtividade.repository.js';
import { novoCertificadosService } from '../modules/certificados/certificados.routes.js';
import { novoNotificacoesService } from '../modules/notificacoes/notificacoes.routes.js';
import { prisma } from '../shared/prisma/prisma.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export async function rankingSemanal(): Promise<void> {
  const ontem = dayjs().tz('America/Bahia').subtract(1, 'day').toDate();
  const semana = semanaReferencia(ontem);

  const servicoProdutividade = new ProdutividadeService(new PrismaProdutividadeRepository());
  await servicoProdutividade.calcularRankingDaSemana(semana);

  const certificados = novoCertificadosService();
  const emitidos = await certificados.emitirSemanalPodium(semana);

  const notificacoes = novoNotificacoesService();
  for (const c of emitidos) {
    const usuario = await prisma.usuario.findUnique({ where: { id: c.usuarioId } });
    if (usuario?.telefoneWhatsapp) {
      await notificacoes.enfileirarTemplate('CERTIFICADO', 'CERTIFICADO', {
        usuarioId: c.usuarioId,
        nome: usuario.nome,
        tipoCertificado: c.tipo,
        semana: c.periodoReferencia,
        posicao: c.posicaoFinal,
        pontos: c.pontuacaoObtida,
      });
    }
  }

  logger.info('Job rankingSemanal concluido', { semana, certificadosEmitidos: emitidos.length });
}
