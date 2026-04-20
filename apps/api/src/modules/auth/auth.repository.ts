import type { Usuario } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export interface IAuthRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  atualizarSenha(id: string, senhaHash: string, historico: string[]): Promise<void>;
  registrarAceitePop(id: string, versao: string, ip: string): Promise<void>;
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

  async registrarAceitePop(id: string, versao: string, ip: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: {
        aceitePopEm: new Date(),
        aceitePopVersao: versao,
        aceitePopIp: ip,
      },
    });
  }
}
