import { dataHojeBahia } from '@rb/utils';
import { prisma } from '../shared/prisma/prisma.js';
import { logger } from '../shared/logger/logger.js';
import { novoNotificacoesService } from '../modules/notificacoes/notificacoes.routes.js';

export async function lembretePonto(): Promise<void> {
  const hoje = dataHojeBahia();
  const servicoNotificacoes = novoNotificacoesService();

  const estagiarios = await prisma.usuario.findMany({
    where: { perfil: 'ESTAGIARIO', status: 'ATIVO' },
    select: { id: true, nome: true, telefoneWhatsapp: true },
  });

  for (const e of estagiarios) {
    const entradaRegistrada = await prisma.ponto.count({
      where: { usuarioId: e.id, data: hoje, tipo: 'ENTRADA' },
    });
    if (entradaRegistrada === 0 && e.telefoneWhatsapp) {
      await servicoNotificacoes.enfileirarTemplate('LEMBRETE_PONTO', 'LEMBRETE_PONTO', {
        usuarioId: e.id,
        nome: e.nome,
      });
    }
  }

  logger.info('Job lembretePonto concluido', { total: estagiarios.length });
}
