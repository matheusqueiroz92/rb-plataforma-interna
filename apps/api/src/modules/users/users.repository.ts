import type { Perfil, Prisma, StatusUsuario, Usuario } from '@prisma/client';
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

type UsuarioPublicoDB = Prisma.UsuarioGetPayload<{ select: typeof camposPublicosUsuario }>;

export type UsuarioPublico = Omit<UsuarioPublicoDB, 'popsAceitos'> & {
  aceitePopPerfil: Perfil | null;
};

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
  private normalizar(u: UsuarioPublicoDB): UsuarioPublico {
    return {
      ...u,
      aceitePopPerfil: null,
    };
  }

  async listar(filtro: FiltroUsuarios): Promise<UsuarioPublico[]> {
    const dados = await prisma.usuario.findMany({
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
    return dados.map((d) => this.normalizar(d));
  }

  async buscarPorId(id: string): Promise<UsuarioPublico | null> {
    const dado = await prisma.usuario.findUnique({ where: { id }, select: camposPublicosUsuario });
    return dado ? this.normalizar(dado) : null;
  }

  async buscarExistente(email: string, matricula: string) {
    return prisma.usuario.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { matricula }] },
      select: { id: true, email: true, matricula: true },
    });
  }

  async criar(dados: Parameters<IUsersRepository['criar']>[0]): Promise<UsuarioPublico> {
    const criado = await prisma.usuario.create({
      data: { ...dados, email: dados.email.toLowerCase() },
      select: camposPublicosUsuario,
    });
    return this.normalizar(criado);
  }

  async atualizar(id: string, dados: Partial<Usuario>): Promise<UsuarioPublico> {
    const atualizado = await prisma.usuario.update({
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
    return this.normalizar(atualizado);
  }

  async inativar(id: string): Promise<UsuarioPublico> {
    const inativado = await prisma.usuario.update({
      where: { id },
      data: { status: 'INATIVO', dataDesligamento: new Date() },
      select: camposPublicosUsuario,
    });
    return this.normalizar(inativado);
  }

  async resetarSenha(id: string, senhaHash: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { senhaHash, senhaAtualizadaEm: new Date() },
    });
  }
}
