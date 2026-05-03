import type { Perfil, PopDocumento, StatusPopDocumento } from '@prisma/client';
import type { CriarPopInput, AtualizarPopInput } from '@rb/validators';

import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../../shared/errors/app-error.js';
import type { IPopRepository } from './pop.repository.js';

function incrementarVersao(versaoAtual: string | null): string {
  if (!versaoAtual) return '1.0';
  const [majorTexto, minorTexto] = versaoAtual.split('.');
  const major = Number(majorTexto);
  const minor = Number(minorTexto ?? '0');
  if (Number.isNaN(major) || Number.isNaN(minor)) return '1.0';
  return `${major}.${minor + 1}`;
}

export class PopService {
  constructor(private readonly repo: IPopRepository) {}

  listar(filtro: { perfil?: Perfil; status?: StatusPopDocumento }): Promise<PopDocumento[]> {
    return this.repo.listar(filtro);
  }

  async obter(id: string): Promise<PopDocumento> {
    const pop = await this.repo.buscarPorId(id);
    if (!pop) throw new ErroNaoEncontrado('POP');
    return pop;
  }

  async criar(input: CriarPopInput, criadoPorId?: string): Promise<PopDocumento> {
    const ultima = await this.repo.buscarUltimaVersaoPorPerfil(input.perfil);
    const versao = incrementarVersao(ultima?.versao ?? null);
    return this.repo.criar({
      perfil: input.perfil,
      titulo: input.titulo,
      conteudoMarkdown: input.conteudoMarkdown,
      versao,
      criadoPorId,
    });
  }

  async atualizar(id: string, input: AtualizarPopInput): Promise<PopDocumento> {
    const pop = await this.obter(id);
    if (pop.status === 'PUBLICADO') {
      throw new ErroConflito('Nao e permitido editar um POP publicado. Crie nova versao.');
    }
    return this.repo.atualizar(id, input);
  }

  async aprovar(id: string, usuarioId: string): Promise<PopDocumento> {
    const pop = await this.obter(id);
    if (!pop.conteudoMarkdown?.trim()) {
      throw new ErroValidacao('Conteudo do POP nao pode estar vazio.');
    }
    if (pop.status === 'PUBLICADO') {
      throw new ErroConflito('POP ja publicado.');
    }
    return this.repo.aprovar(id, usuarioId);
  }

  async publicar(id: string, usuarioId: string): Promise<PopDocumento> {
    const pop = await this.obter(id);
    if (pop.status !== 'APROVADO') {
      throw new ErroValidacao('Somente POP aprovado pode ser publicado.');
    }
    return this.repo.publicar(id, usuarioId);
  }

  async obterVigente(perfil: Perfil): Promise<PopDocumento> {
    const pop = await this.repo.buscarVigentePorPerfil(perfil);
    if (!pop) throw new ErroNaoEncontrado(`POP vigente para perfil ${perfil}`);
    return pop;
  }
}
