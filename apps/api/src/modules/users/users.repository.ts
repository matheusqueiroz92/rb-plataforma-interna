import type { Perfil, StatusUsuario, Usuario } from '@prisma/client';
import { prisma } from '../../shared/prisma/prisma.js';

export const camposPublicosUsuario = {
  id: true,
  nome: true,
  email: true,
  matricula: true,
  perfil: true,
  status: true,
  instituicaoEnsino: true,
  periodoCurso: true,
  dataAdmissao: true,
  dataDesligamento: true,
  fotoUrl: true,
  telefoneWhatsapp: true,
  aceitePopEm: true,
  aceitePopVersao: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

export type UsuarioPublico = Pick<Usuario, keyof typeof camposPublicosUsuario>;

export interface FiltroUsuarios {
  perfil?: Perfil;
  status?: StatusUsuario;
  busca?: string;
}

export interface IUsersRepository {
  listar(filtro: FiltroUsuarios): Promise<UsuarioPublico[]>;
  buscarPorId(id: string): Promise<UsuarioPublico | null>;
  buscarExistente(email: string, matricula: string): Promise<{ id: string; email: string; matricula: string } | null>;
  criar(dados: {
    nome: string;
    email: string;
    matricula: string;
    senhaHash: string;
    perfil: Perfil;
    instituicaoEnsino?: string;
    periodoCurso?: string;
    dataAdmissao?: Date;
    telefoneWhatsapp?: string;
  }): Promise<UsuarioPublico>;
  atualizar(id: string, dados: Partial<Usuario>): Promise<UsuarioPublico>;
  inativar(id: string): Promise<UsuarioPublico>;
  resetarSenha(id: string, senhaHash: string): Promise<void>;
}

export class PrismaUsersRepository implements IUsersRepository {
  async listar(filtro: FiltroUsuarios): Promise<UsuarioPublico[]> {
    return prisma.usuario.findMany({
      where: {
        perfil: filtro.perfil,
        status: filtro.status,
        ...(filtro.busca
          ? {
              OR: [
                { nome: { contains: filtro.busca, mode: 'insensitive' } },
                { email: { contains: filtro.busca, mode: 'insensitive' } },
                { matricula: { contains: filtro.busca, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: camposPublicosUsuario,
      orderBy: [{ perfil: 'asc' }, { nome: 'asc' }],
    });
  }

  async buscarPorId(id: string): Promise<UsuarioPublico | null> {
    return prisma.usuario.findUnique({ where: { id }, select: camposPublicosUsuario });
  }

  async buscarExistente(email: string, matricula: string) {
    return prisma.usuario.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { matricula }] },
      select: { id: true, email: true, matricula: true },
    });
  }

  async criar(dados: Parameters<IUsersRepository['criar']>[0]): Promise<UsuarioPublico> {
    return prisma.usuario.create({
      data: { ...dados, email: dados.email.toLowerCase() },
      select: camposPublicosUsuario,
    });
  }

  async atualizar(id: string, dados: Partial<Usuario>): Promise<UsuarioPublico> {
    return prisma.usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email?.toLowerCase(),
        matricula: dados.matricula,
        perfil: dados.perfil,
        status: dados.status,
        instituicaoEnsino: dados.instituicaoEnsino,
        periodoCurso: dados.periodoCurso,
        dataAdmissao: dados.dataAdmissao,
        dataDesligamento: dados.dataDesligamento,
        telefoneWhatsapp: dados.telefoneWhatsapp,
      },
      select: camposPublicosUsuario,
    });
  }

  async inativar(id: string): Promise<UsuarioPublico> {
    return prisma.usuario.update({
      where: { id },
      data: { status: 'INATIVO', dataDesligamento: new Date() },
      select: camposPublicosUsuario,
    });
  }

  async resetarSenha(id: string, senhaHash: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { senhaHash, senhaAtualizadaEm: new Date() },
    });
  }
}
