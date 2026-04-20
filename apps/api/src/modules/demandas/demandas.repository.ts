import type { Demanda, Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

const includeRelacoes = {
  criador: { select: { id: true, nome: true, perfil: true } },
  atribuido: { select: { id: true, nome: true, perfil: true } },
  delegador: { select: { id: true, nome: true, perfil: true } },
  corretor: { select: { id: true, nome: true, perfil: true } },
} as const;

export type DemandaComRelacoes = Prisma.DemandaGetPayload<{ include: typeof includeRelacoes }>;

export interface FiltroDemandas {
  atribuidaA?: string;
  status?: Demanda['status'];
  semana?: string;
  tipo?: Demanda['tipo'];
  prioridade?: Demanda['prioridade'];
}

export interface IDemandasRepository {
  criar(dados: Prisma.DemandaUncheckedCreateInput): Promise<DemandaComRelacoes>;
  buscarPorId(id: string): Promise<DemandaComRelacoes | null>;
  listar(filtro: FiltroDemandas): Promise<DemandaComRelacoes[]>;
  atualizarStatus(
    id: string,
    status: Demanda['status'],
    tempoRealMinutos?: number,
    dataEntrega?: Date,
  ): Promise<DemandaComRelacoes>;
  delegar(id: string, novoAtribuidoId: string, delegadorId: string): Promise<DemandaComRelacoes>;
  corrigir(
    id: string,
    corretorId: string,
    nota: number,
    feedback: string,
    novoStatus: Demanda['status'],
  ): Promise<DemandaComRelacoes>;
  listarDaSemana(semana: string): Promise<DemandaComRelacoes[]>;
}

export class PrismaDemandasRepository implements IDemandasRepository {
  async criar(dados: Prisma.DemandaUncheckedCreateInput): Promise<DemandaComRelacoes> {
    return prisma.demanda.create({ data: dados, include: includeRelacoes });
  }

  async buscarPorId(id: string): Promise<DemandaComRelacoes | null> {
    return prisma.demanda.findUnique({ where: { id }, include: includeRelacoes });
  }

  async listar(filtro: FiltroDemandas): Promise<DemandaComRelacoes[]> {
    return prisma.demanda.findMany({
      where: {
        atribuidaAId: filtro.atribuidaA,
        status: filtro.status,
        semanaReferencia: filtro.semana,
        tipo: filtro.tipo,
        prioridade: filtro.prioridade,
      },
      include: includeRelacoes,
      orderBy: [
        { prioridade: 'desc' },
        { prazoFatal: 'asc' },
        { criadoEm: 'desc' },
      ],
    });
  }

  async atualizarStatus(
    id: string,
    status: Demanda['status'],
    tempoRealMinutos?: number,
    dataEntrega?: Date,
  ): Promise<DemandaComRelacoes> {
    return prisma.demanda.update({
      where: { id },
      data: {
        status,
        ...(tempoRealMinutos !== undefined ? { tempoRealMinutos } : {}),
        ...(dataEntrega ? { dataEntrega } : {}),
      },
      include: includeRelacoes,
    });
  }

  async delegar(
    id: string,
    novoAtribuidoId: string,
    delegadorId: string,
  ): Promise<DemandaComRelacoes> {
    return prisma.demanda.update({
      where: { id },
      data: { atribuidaAId: novoAtribuidoId, delegadaPorId: delegadorId },
      include: includeRelacoes,
    });
  }

  async corrigir(
    id: string,
    corretorId: string,
    nota: number,
    feedback: string,
    novoStatus: Demanda['status'],
  ): Promise<DemandaComRelacoes> {
    return prisma.demanda.update({
      where: { id },
      data: {
        corrigidaPorId: corretorId,
        notaCorrecao: nota,
        feedbackCorretor: feedback,
        dataCorrecao: new Date(),
        status: novoStatus,
      },
      include: includeRelacoes,
    });
  }

  async listarDaSemana(semana: string): Promise<DemandaComRelacoes[]> {
    return prisma.demanda.findMany({
      where: { semanaReferencia: semana },
      include: includeRelacoes,
    });
  }
}
