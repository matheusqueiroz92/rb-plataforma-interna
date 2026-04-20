import type { AtualizarUsuarioInput, CriarUsuarioInput } from '@rb/validators';
import { validarForcaSenha } from '@rb/utils';

import { ErroConflito, ErroNaoEncontrado, ErroValidacao } from '../../shared/errors/app-error.js';
import { gerarHashSenha } from '../../shared/hash/hash.js';
import type { FiltroUsuarios, IUsersRepository, UsuarioPublico } from './users.repository.js';

export class UsersService {
  constructor(private readonly repo: IUsersRepository) {}

  listar(filtro: FiltroUsuarios = {}): Promise<UsuarioPublico[]> {
    return this.repo.listar(filtro);
  }

  async obter(id: string): Promise<UsuarioPublico> {
    const u = await this.repo.buscarPorId(id);
    if (!u) throw new ErroNaoEncontrado('Usuario');
    return u;
  }

  async criar(input: CriarUsuarioInput): Promise<UsuarioPublico> {
    const jaExiste = await this.repo.buscarExistente(input.email, input.matricula);
    if (jaExiste) {
      throw new ErroConflito(
        jaExiste.email === input.email.toLowerCase()
          ? 'Ja existe usuario com este e-mail.'
          : 'Ja existe usuario com esta matricula.',
      );
    }

    const validacao = validarForcaSenha(input.senhaInicial, input.nome, input.matricula);
    if (!validacao.valida) {
      throw new ErroValidacao('Senha inicial nao atende aos requisitos.', validacao.motivos);
    }

    const senhaHash = await gerarHashSenha(input.senhaInicial);
    return this.repo.criar({
      nome: input.nome,
      email: input.email,
      matricula: input.matricula,
      senhaHash,
      perfil: input.perfil,
      instituicaoEnsino: input.instituicaoEnsino,
      periodoCurso: input.periodoCurso,
      dataAdmissao: input.dataAdmissao,
      telefoneWhatsapp: input.telefoneWhatsapp,
    });
  }

  async atualizar(id: string, input: AtualizarUsuarioInput): Promise<UsuarioPublico> {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new ErroNaoEncontrado('Usuario');
    return this.repo.atualizar(id, input as never);
  }

  async inativar(id: string): Promise<UsuarioPublico> {
    const existente = await this.repo.buscarPorId(id);
    if (!existente) throw new ErroNaoEncontrado('Usuario');
    return this.repo.inativar(id);
  }

  async resetarSenha(id: string, novaSenha: string): Promise<void> {
    const usuario = await this.repo.buscarPorId(id);
    if (!usuario) throw new ErroNaoEncontrado('Usuario');
    const validacao = validarForcaSenha(novaSenha, usuario.nome, usuario.matricula);
    if (!validacao.valida) {
      throw new ErroValidacao('Nova senha nao atende aos requisitos.', validacao.motivos);
    }
    const hash = await gerarHashSenha(novaSenha);
    await this.repo.resetarSenha(id, hash);
  }
}
