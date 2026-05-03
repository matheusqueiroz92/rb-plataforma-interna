import type { Perfil, PopDocumento, StatusPopDocumento } from '@prisma/client';

import { prisma } from '../../shared/prisma/prisma.js';

export interface FiltroPop {
  perfil?: Perfil;
  status?: StatusPopDocumento;
}

export interface IPopRepository {
  listar(filtro: FiltroPop): Promise<PopDocumento[]>;
  buscarPorId(id: string): Promise<PopDocumento | null>;
  buscarVigentePorPerfil(perfil: Perfil): Promise<PopDocumento | null>;
  buscarUltimaVersaoPorPerfil(perfil: Perfil): Promise<PopDocumento | null>;
  criar(dados: {
    perfil: Perfil;
    titulo: string;
    conteudoMarkdown: string;
    versao: string;
    criadoPorId?: string;
  }): Promise<PopDocumento>;
  atualizar(id: string, dados: { titulo?: string; conteudoMarkdown?: string }): Promise<PopDocumento>;
  aprovar(id: string, usuarioId: string): Promise<PopDocumento>;
  publicar(id: string, usuarioId: string): Promise<PopDocumento>;
}

export class PrismaPopRepository implements IPopRepository {
  listar(filtro: FiltroPop): Promise<PopDocumento[]> {
    return prisma.popDocumento.findMany({
      where: {
        perfil: filtro.perfil,
        status: filtro.status,
      },
      orderBy: [{ criadoEm: 'desc' }],
    });
  }

  buscarPorId(id: string): Promise<PopDocumento | null> {
    return prisma.popDocumento.findUnique({ where: { id } });
  }

  buscarVigentePorPerfil(perfil: Perfil): Promise<PopDocumento | null> {
    return prisma.popDocumento.findFirst({
      where: { perfil, vigente: true, status: 'PUBLICADO' },
      orderBy: { publicadoEm: 'desc' },
    });
  }

  buscarUltimaVersaoPorPerfil(perfil: Perfil): Promise<PopDocumento | null> {
    return prisma.popDocumento.findFirst({
      where: { perfil },
      orderBy: [{ criadoEm: 'desc' }],
    });
  }

  criar(dados: {
    perfil: Perfil;
    titulo: string;
    conteudoMarkdown: string;
    versao: string;
    criadoPorId?: string;
  }): Promise<PopDocumento> {
    return prisma.popDocumento.create({ data: dados });
  }

  atualizar(id: string, dados: { titulo?: string; conteudoMarkdown?: string }): Promise<PopDocumento> {
    return prisma.popDocumento.update({
      where: { id },
      data: {
        ...dados,
        status: 'RASCUNHO',
        aprovadoEm: null,
        aprovadoPorId: null,
        publicadoEm: null,
        publicadoPorId: null,
        vigente: false,
      },
    });
  }

  aprovar(id: string, usuarioId: string): Promise<PopDocumento> {
    return prisma.popDocumento.update({
      where: { id },
      data: {
        status: 'APROVADO',
        aprovadoPorId: usuarioId,
        aprovadoEm: new Date(),
      },
    });
  }

  publicar(id: string, usuarioId: string): Promise<PopDocumento> {
    return prisma.$transaction(async (tx) => {
      const alvo = await tx.popDocumento.findUnique({ where: { id } });
      if (!alvo) {
        throw new Error('POP nao encontrado');
      }

      await tx.popDocumento.updateMany({
        where: { perfil: alvo.perfil, vigente: true },
        data: { vigente: false },
      });

      return tx.popDocumento.update({
        where: { id },
        data: {
          status: 'PUBLICADO',
          vigente: true,
          publicadoPorId: usuarioId,
          publicadoEm: new Date(),
        },
      });
    });
  }
}
