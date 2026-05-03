import type { Perfil, PopAceite, PopDocumento, Usuario } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface IAuthRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPopVigentePorPerfil(perfil: Perfil): Promise<PopDocumento | null>;
  buscarUltimoAceite(usuarioId: string, perfil: Perfil): Promise<PopAceite | null>;
  atualizarSenha(id: string, senhaHash: string, historico: string[]): Promise<void>;
  registrarAceitePop(dados: {
    usuarioId: string;
    popDocumentoId: string;
    perfil: Perfil;
    versao: string;
    ip: string;
    userAgent?: string;
  }): Promise<void>;
}

export class PrismaAuthRepository implements IAuthRepository {
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  async atualizarSenha(id: string, senhaHash: string, historico: string[]): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: {
        senhaHash,
        senhasAnteriores: historico,
        senhaAtualizadaEm: new Date(),
      },
    });
  }

  buscarPopVigentePorPerfil(perfil: Perfil): Promise<PopDocumento | null> {
    return prisma.popDocumento.findFirst({
      where: { perfil, status: 'PUBLICADO', vigente: true },
      orderBy: { publicadoEm: 'desc' },
    });
  }

  buscarUltimoAceite(usuarioId: string, perfil: Perfil): Promise<PopAceite | null> {
    return prisma.popAceite.findFirst({
      where: { usuarioId, perfil },
      orderBy: { aceitoEm: 'desc' },
    });
  }

  async registrarAceitePop(dados: {
    usuarioId: string;
    popDocumentoId: string;
    perfil: Perfil;
    versao: string;
    ip: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.popAceite.create({
      data: {
        usuarioId: dados.usuarioId,
        popDocumentoId: dados.popDocumentoId,
        perfil: dados.perfil,
        versao: dados.versao,
        ip: dados.ip,
        userAgent: dados.userAgent,
      },
    });

    await prisma.usuario.update({
      where: { id: dados.usuarioId },
      data: {
        aceitePopEm: new Date(),
        aceitePopVersao: dados.versao,
        aceitePopIp: dados.ip,
      },
    });
  }
}
