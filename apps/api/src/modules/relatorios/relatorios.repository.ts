import type { RelatorioDiario } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface IRelatoriosRepository {
  buscarDoDia(usuarioId: string, data: Date): Promise<RelatorioDiario | null>;
  criar(dados: Omit<RelatorioDiario, 'id' | 'enviadoEm' | 'lidoPorId' | 'lidoEm'>): Promise<RelatorioDiario>;
  listarDoUsuario(usuarioId: string, limite: number): Promise<RelatorioDiario[]>;
  listarDoDia(data: Date): Promise<Array<RelatorioDiario & { usuario: { id: string; nome: string; matricula: string; perfil: string } }>>;
  marcarComoLido(id: string, leitorId: string): Promise<RelatorioDiario>;
  buscarPorId(id: string): Promise<RelatorioDiario | null>;
}

export class PrismaRelatoriosRepository implements IRelatoriosRepository {
  async buscarDoDia(usuarioId: string, data: Date): Promise<RelatorioDiario | null> {
    return prisma.relatorioDiario.findUnique({
      where: { usuarioId_data: { usuarioId, data } },
    });
  }

  async criar(dados: Parameters<IRelatoriosRepository['criar']>[0]): Promise<RelatorioDiario> {
    return prisma.relatorioDiario.create({ data: dados });
  }

  async listarDoUsuario(usuarioId: string, limite: number): Promise<RelatorioDiario[]> {
    return prisma.relatorioDiario.findMany({
      where: { usuarioId },
      orderBy: { data: 'desc' },
      take: limite,
    });
  }

  async listarDoDia(data: Date) {
    return prisma.relatorioDiario.findMany({
      where: { data },
      include: {
        usuario: { select: { id: true, nome: true, matricula: true, perfil: true } },
      },
      orderBy: { enviadoEm: 'desc' },
    }) as never;
  }

  async marcarComoLido(id: string, leitorId: string): Promise<RelatorioDiario> {
    return prisma.relatorioDiario.update({
      where: { id },
      data: { lidoPorId: leitorId, lidoEm: new Date() },
    });
  }

  async buscarPorId(id: string): Promise<RelatorioDiario | null> {
    return prisma.relatorioDiario.findUnique({ where: { id } });
  }
}
