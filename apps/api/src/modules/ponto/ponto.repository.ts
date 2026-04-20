import type { Ponto, TipoPonto } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface IPontoRepository {
  pontosDoDia(usuarioId: string, data: Date): Promise<Ponto[]>;
  existeNoDia(usuarioId: string, data: Date, tipo: TipoPonto): Promise<boolean>;
  criar(dados: Omit<Ponto, 'id' | 'editado' | 'editadoPorId' | 'editadoEm' | 'justificativaEdicao'>): Promise<Ponto>;
  historico(usuarioId: string, de?: Date, ate?: Date): Promise<Ponto[]>;
  buscarPorId(id: string): Promise<Ponto | null>;
  editar(
    id: string,
    editorId: string,
    dados: Partial<Pick<Ponto, 'tipo' | 'regime' | 'timestampServidor'>> & {
      justificativaEdicao: string;
    },
  ): Promise<Ponto>;
  existeRelatorioDoDia(usuarioId: string, data: Date): Promise<boolean>;
}

export class PrismaPontoRepository implements IPontoRepository {
  async pontosDoDia(usuarioId: string, data: Date): Promise<Ponto[]> {
    return prisma.ponto.findMany({
      where: { usuarioId, data },
      orderBy: { timestampServidor: 'asc' },
    });
  }

  async existeNoDia(usuarioId: string, data: Date, tipo: TipoPonto): Promise<boolean> {
    const count = await prisma.ponto.count({ where: { usuarioId, data, tipo } });
    return count > 0;
  }

  async criar(dados: Parameters<IPontoRepository['criar']>[0]): Promise<Ponto> {
    return prisma.ponto.create({ data: dados });
  }

  async historico(usuarioId: string, de?: Date, ate?: Date): Promise<Ponto[]> {
    return prisma.ponto.findMany({
      where: { usuarioId, data: { gte: de, lte: ate } },
      orderBy: [{ data: 'desc' }, { timestampServidor: 'asc' }],
    });
  }

  async buscarPorId(id: string): Promise<Ponto | null> {
    return prisma.ponto.findUnique({ where: { id } });
  }

  async editar(
    id: string,
    editorId: string,
    dados: Parameters<IPontoRepository['editar']>[2],
  ): Promise<Ponto> {
    return prisma.ponto.update({
      where: { id },
      data: {
        ...dados,
        editado: true,
        editadoPorId: editorId,
        editadoEm: new Date(),
      },
    });
  }

  async existeRelatorioDoDia(usuarioId: string, data: Date): Promise<boolean> {
    const count = await prisma.relatorioDiario.count({ where: { usuarioId, data } });
    return count > 0;
  }
}
