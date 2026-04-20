import type { ConclusaoCurso, CursoTrilha } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface ICursosRepository {
  listar(ativo: boolean): Promise<CursoTrilha[]>;
  criar(dados: Omit<CursoTrilha, 'id'>): Promise<CursoTrilha>;
  atualizar(id: string, dados: Partial<CursoTrilha>): Promise<CursoTrilha>;
  buscarPorId(id: string): Promise<CursoTrilha | null>;
  concluidos(usuarioId: string): Promise<ConclusaoCurso[]>;
  marcarConcluido(usuarioId: string, cursoId: string, certificadoUrl?: string): Promise<ConclusaoCurso>;
  progressoUsuario(usuarioId: string, perfilUsuario: string): Promise<Array<{
    curso: CursoTrilha;
    concluidoEm: Date | null;
    certificadoUrl: string | null;
  }>>;
}

export class PrismaCursosRepository implements ICursosRepository {
  async listar(ativo: boolean): Promise<CursoTrilha[]> {
    return prisma.cursoTrilha.findMany({
      where: { ativo },
      orderBy: [{ obrigatorio: 'desc' }, { titulo: 'asc' }],
    });
  }

  async criar(dados: Omit<CursoTrilha, 'id'>): Promise<CursoTrilha> {
    return prisma.cursoTrilha.create({ data: dados });
  }

  async atualizar(id: string, dados: Partial<CursoTrilha>): Promise<CursoTrilha> {
    return prisma.cursoTrilha.update({ where: { id }, data: dados });
  }

  async buscarPorId(id: string): Promise<CursoTrilha | null> {
    return prisma.cursoTrilha.findUnique({ where: { id } });
  }

  async concluidos(usuarioId: string): Promise<ConclusaoCurso[]> {
    return prisma.conclusaoCurso.findMany({ where: { usuarioId } });
  }

  async marcarConcluido(
    usuarioId: string,
    cursoId: string,
    certificadoUrl?: string,
  ): Promise<ConclusaoCurso> {
    return prisma.conclusaoCurso.upsert({
      where: { usuarioId_cursoId: { usuarioId, cursoId } },
      update: { concluidoEm: new Date(), certificadoUrl: certificadoUrl ?? null },
      create: {
        usuarioId,
        cursoId,
        concluidoEm: new Date(),
        certificadoUrl: certificadoUrl ?? null,
      },
    });
  }

  async progressoUsuario(usuarioId: string, perfilUsuario: string) {
    const cursos = await prisma.cursoTrilha.findMany({
      where: {
        ativo: true,
        OR: [{ perfilAlvo: 'TODOS' }, { perfilAlvo: perfilUsuario }],
      },
      orderBy: [{ obrigatorio: 'desc' }, { titulo: 'asc' }],
    });
    const conclusoes = await prisma.conclusaoCurso.findMany({
      where: { usuarioId, cursoId: { in: cursos.map((c) => c.id) } },
    });
    const mapa = new Map(conclusoes.map((c) => [c.cursoId, c]));
    return cursos.map((c) => ({
      curso: c,
      concluidoEm: mapa.get(c.id)?.concluidoEm ?? null,
      certificadoUrl: mapa.get(c.id)?.certificadoUrl ?? null,
    }));
  }
}
