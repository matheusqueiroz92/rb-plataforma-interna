import type { AtualizarCursoInput, ConcluirCursoInput, CriarCursoInput } from '@rb/validators';

import { ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import type { ICursosRepository } from './cursos.repository.js';

export class CursosService {
  constructor(private readonly repo: ICursosRepository) {}

  listar(ativo = true) {
    return this.repo.listar(ativo);
  }

  criar(input: CriarCursoInput) {
    return this.repo.criar({
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      obrigatorio: input.obrigatorio,
      perfilAlvo: input.perfilAlvo,
      conclusaoObrigatoriaDias: input.conclusaoObrigatoriaDias ?? null,
      urlExterna: input.urlExterna ?? null,
      ativo: true,
    });
  }

  async atualizar(id: string, input: AtualizarCursoInput) {
    const existe = await this.repo.buscarPorId(id);
    if (!existe) throw new ErroNaoEncontrado('Curso');
    return this.repo.atualizar(id, input as never);
  }

  marcarConcluido(usuarioId: string, input: ConcluirCursoInput) {
    return this.repo.marcarConcluido(usuarioId, input.cursoId, input.certificadoUrl);
  }

  progresso(usuarioId: string, perfilUsuario: string) {
    return this.repo.progressoUsuario(usuarioId, perfilUsuario);
  }
}
