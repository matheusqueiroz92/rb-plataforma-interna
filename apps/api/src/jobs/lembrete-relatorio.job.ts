import { dataHojeBahia } from '@rb/utils';
import { prisma } from '../shared/prisma/prisma.js';
import { logger } from '../shared/logger/logger.js';
import { novoNotificacoesService } from '../modules/notificacoes/notificacoes.routes.js';

export async function lembreteRelatorio(): Promise<void> {
  const hoje = dataHojeBahia();
  const servico = novoNotificacoesService();

  const estagiarios = await prisma.usuario.findMany({
    where: { perfil: 'ESTAGIARIO', status: 'ATIVO' },
    select: { id: true, nome: true, telefoneWhatsapp: true },
  });

  const gestoras = await prisma.usuario.findMany({
    where: { perfil: { in: ['GESTORA', 'SOCIO'] }, status: 'ATIVO' },
    select: { id: true, nome: true, telefoneWhatsapp: true },
  });

  for (const e of estagiarios) {
    const temRelatorio = await prisma.relatorioDiario.count({
      where: { usuarioId: e.id, data: hoje },
    });
    if (temRelatorio === 0) {
      for (const g of gestoras) {
        if (!g.telefoneWhatsapp) continue;
        await servico.enfileirarTemplate('AUSENCIA_RELATORIO', 'AUSENCIA_RELATORIO', {
          usuarioId: g.id,
          nome: e.nome,
        });
      }
    }
  }

  logger.info('Job lembreteRelatorio concluido');
}
