import { formatarDataBR } from '@rb/utils';

import { prisma } from '../shared/prisma/prisma.js';
import { logger } from '../shared/logger/logger.js';
import { novoNotificacoesService } from '../modules/notificacoes/notificacoes.routes.js';

export async function alertaPrazo(): Promise<void> {
  const servico = novoNotificacoesService();

  const agora = new Date();
  const limite = new Date(agora);
  limite.setDate(agora.getDate() + 3);

  const demandas = await prisma.demanda.findMany({
    where: {
      status: { in: ['PENDENTE', 'ANDAMENTO'] },
      prazoFatal: { gte: agora, lte: limite },
    },
    include: {
      atribuido: { select: { id: true, nome: true, telefoneWhatsapp: true } },
    },
  });

  for (const d of demandas) {
    if (!d.atribuido.telefoneWhatsapp) continue;
    await servico.enfileirarTemplate('ALERTA_PRAZO', 'ALERTA_PRAZO', {
      usuarioId: d.atribuido.id,
      nome: d.atribuido.nome,
      titulo: d.titulo,
      prazo: d.prazoFatal ? formatarDataBR(d.prazoFatal) : 'sem prazo',
    });
  }

  logger.info('Job alertaPrazo concluido', { total: demandas.length });
}
