import type { NotificacaoWhatsapp, StatusNotificacao, TipoNotificacao } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface EnfileirarInput {
  usuarioId?: string | null;
  telefoneDestino: string;
  tipo: TipoNotificacao;
  mensagem: string;
  agendadaPara?: Date | null;
}

export interface INotificacoesRepository {
  enfileirar(dados: EnfileirarInput): Promise<NotificacaoWhatsapp>;
  proximasParaEnvio(limite: number): Promise<NotificacaoWhatsapp[]>;
  atualizarStatus(
    id: string,
    status: StatusNotificacao,
    tentativas: number,
    zapiResponse?: unknown,
  ): Promise<void>;
  doUsuario(usuarioId: string, limite: number): Promise<NotificacaoWhatsapp[]>;
}

export class PrismaNotificacoesRepository implements INotificacoesRepository {
  async enfileirar(dados: EnfileirarInput): Promise<NotificacaoWhatsapp> {
    return prisma.notificacaoWhatsapp.create({
      data: {
        usuarioId: dados.usuarioId ?? null,
        telefoneDestino: dados.telefoneDestino,
        tipo: dados.tipo,
        mensagem: dados.mensagem,
        agendadaPara: dados.agendadaPara ?? new Date(),
      },
    });
  }

  async proximasParaEnvio(limite: number): Promise<NotificacaoWhatsapp[]> {
    return prisma.notificacaoWhatsapp.findMany({
      where: {
        status: 'PENDENTE',
        tentativas: { lt: 3 },
        OR: [
          { agendadaPara: null },
          { agendadaPara: { lte: new Date() } },
        ],
      },
      orderBy: { agendadaPara: 'asc' },
      take: limite,
    });
  }

  async atualizarStatus(
    id: string,
    status: StatusNotificacao,
    tentativas: number,
    zapiResponse?: unknown,
  ): Promise<void> {
    await prisma.notificacaoWhatsapp.update({
      where: { id },
      data: {
        status,
        tentativas,
        zapiResponse: zapiResponse as never,
        enviadaEm: status === 'ENVIADA' ? new Date() : null,
      },
    });
  }

  async doUsuario(usuarioId: string, limite: number): Promise<NotificacaoWhatsapp[]> {
    return prisma.notificacaoWhatsapp.findMany({
      where: { usuarioId },
      orderBy: { criadaEm: 'desc' },
      take: limite,
    });
  }
}
