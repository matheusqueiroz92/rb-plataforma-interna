import type { ChatIAMensagem, PapelChat } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface IIaRepository {
  adicionarMensagem(dados: {
    usuarioId: string;
    conversaId: string;
    papel: PapelChat;
    conteudo: string;
    tokensConsumidos?: number;
    modeloClaude?: string;
  }): Promise<ChatIAMensagem>;
  historicoDaConversa(usuarioId: string, conversaId: string, limite: number): Promise<ChatIAMensagem[]>;
  listarConversas(usuarioId: string, limite: number): Promise<Array<{
    conversaId: string;
    ultimaMensagem: Date;
    totalMensagens: number;
    resumo: string;
  }>>;
  excluirConversa(usuarioId: string, conversaId: string): Promise<void>;
  consumoDoMes(usuarioId: string, inicioMes: Date): Promise<number>;
}

export class PrismaIaRepository implements IIaRepository {
  async adicionarMensagem(dados: Parameters<IIaRepository['adicionarMensagem']>[0]): Promise<ChatIAMensagem> {
    return prisma.chatIAMensagem.create({
      data: {
        usuarioId: dados.usuarioId,
        conversaId: dados.conversaId,
        papel: dados.papel,
        conteudo: dados.conteudo,
        tokensConsumidos: dados.tokensConsumidos ?? null,
        modeloClaude: dados.modeloClaude ?? null,
      },
    });
  }

  async historicoDaConversa(usuarioId: string, conversaId: string, limite: number): Promise<ChatIAMensagem[]> {
    return prisma.chatIAMensagem.findMany({
      where: { usuarioId, conversaId },
      orderBy: { timestamp: 'asc' },
      take: limite,
    });
  }

  async listarConversas(usuarioId: string, limite: number) {
    const grupos = await prisma.chatIAMensagem.groupBy({
      by: ['conversaId'],
      where: { usuarioId },
      _count: { _all: true },
      _max: { timestamp: true },
      orderBy: { _max: { timestamp: 'desc' } },
      take: limite,
    });

    const resultado = await Promise.all(
      grupos.map(async (g) => {
        const primeira = await prisma.chatIAMensagem.findFirst({
          where: { usuarioId, conversaId: g.conversaId, papel: 'USER' },
          orderBy: { timestamp: 'asc' },
        });
        return {
          conversaId: g.conversaId,
          ultimaMensagem: g._max.timestamp ?? new Date(),
          totalMensagens: g._count._all,
          resumo: primeira?.conteudo.slice(0, 100) ?? '',
        };
      }),
    );
    return resultado;
  }

  async excluirConversa(usuarioId: string, conversaId: string): Promise<void> {
    await prisma.chatIAMensagem.deleteMany({ where: { usuarioId, conversaId } });
  }

  async consumoDoMes(usuarioId: string, inicioMes: Date): Promise<number> {
    const agregado = await prisma.chatIAMensagem.aggregate({
      where: { usuarioId, timestamp: { gte: inicioMes } },
      _sum: { tokensConsumidos: true },
    });
    return agregado._sum.tokensConsumidos ?? 0;
  }
}
