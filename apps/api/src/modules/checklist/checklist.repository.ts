import type { ChecklistItem, ChecklistResposta, Perfil, PerfilChecklist } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

function perfisAplicaveis(perfilUsuario: Perfil): PerfilChecklist[] {
  if (perfilUsuario === 'ESTAGIARIO') return ['TODOS', 'ESTAGIARIO'];
  if (perfilUsuario === 'ASSESSORA_JR') return ['TODOS', 'ASSESSORA_JR'];
  return ['TODOS', 'ESTAGIARIO', 'ASSESSORA_JR'];
}

export interface IChecklistRepository {
  listarItens(perfil?: Perfil): Promise<ChecklistItem[]>;
  criarItem(dados: Omit<ChecklistItem, 'id' | 'atualizadoEm'>): Promise<ChecklistItem>;
  buscarItem(id: string): Promise<ChecklistItem | null>;
  atualizarItem(id: string, dados: Partial<ChecklistItem>): Promise<ChecklistItem>;
  inativarItem(id: string): Promise<ChecklistItem>;
  upsertResposta(
    usuarioId: string,
    itemId: string,
    data: Date,
    concluido: boolean,
    melhoriaSugerida?: string,
  ): Promise<ChecklistResposta>;
  respostasDoDia(usuarioId: string, data: Date): Promise<ChecklistResposta[]>;
  listarUsuariosAtivos(): Promise<Array<{ id: string; nome: string; matricula: string; perfil: Perfil }>>;
  respostasPorData(data: Date, usuariosIds: string[]): Promise<ChecklistResposta[]>;
  listarItensAtivos(): Promise<ChecklistItem[]>;
}

export class PrismaChecklistRepository implements IChecklistRepository {
  async listarItens(perfil?: Perfil): Promise<ChecklistItem[]> {
    return prisma.checklistItem.findMany({
      where: {
        ativo: true,
        ...(perfil ? { perfilAlvo: { in: perfisAplicaveis(perfil) } } : {}),
      },
      orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }],
    });
  }

  async criarItem(dados: Parameters<IChecklistRepository['criarItem']>[0]): Promise<ChecklistItem> {
    return prisma.checklistItem.create({ data: dados });
  }

  async buscarItem(id: string): Promise<ChecklistItem | null> {
    return prisma.checklistItem.findUnique({ where: { id } });
  }

  async atualizarItem(id: string, dados: Partial<ChecklistItem>): Promise<ChecklistItem> {
    return prisma.checklistItem.update({ where: { id }, data: dados });
  }

  async inativarItem(id: string): Promise<ChecklistItem> {
    return prisma.checklistItem.update({ where: { id }, data: { ativo: false } });
  }

  async upsertResposta(
    usuarioId: string,
    itemId: string,
    data: Date,
    concluido: boolean,
    melhoriaSugerida?: string,
  ): Promise<ChecklistResposta> {
    return prisma.checklistResposta.upsert({
      where: { usuarioId_itemId_data: { usuarioId, itemId, data } },
      update: {
        concluido,
        concluidoEm: concluido ? new Date() : null,
        melhoriaSugerida: melhoriaSugerida ?? null,
      },
      create: {
        usuarioId,
        itemId,
        data,
        concluido,
        concluidoEm: concluido ? new Date() : null,
        melhoriaSugerida: melhoriaSugerida ?? null,
      },
    });
  }

  async respostasDoDia(usuarioId: string, data: Date): Promise<ChecklistResposta[]> {
    return prisma.checklistResposta.findMany({ where: { usuarioId, data } });
  }

  async listarUsuariosAtivos() {
    return prisma.usuario.findMany({
      where: { status: 'ATIVO', perfil: { in: ['ESTAGIARIO', 'ASSESSORA_JR'] } },
      select: { id: true, nome: true, matricula: true, perfil: true },
    });
  }

  async respostasPorData(data: Date, usuariosIds: string[]): Promise<ChecklistResposta[]> {
    return prisma.checklistResposta.findMany({
      where: { data, usuarioId: { in: usuariosIds } },
    });
  }

  async listarItensAtivos(): Promise<ChecklistItem[]> {
    return prisma.checklistItem.findMany({ where: { ativo: true } });
  }
}
