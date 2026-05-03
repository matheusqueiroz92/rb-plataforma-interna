import type { FastifyInstance } from 'fastify';
import type { AceitarPopInput, LoginInput, TrocarSenhaInput } from '@rb/validators';
import { SENHA_HISTORICO_BLOQUEADO } from '@rb/constants';
import { validarForcaSenha } from '@rb/utils';

import { conferirSenha, gerarHashSenha } from '../../shared/hash/hash.js';
import { ErroAutenticacao, ErroValidacao } from '../../shared/errors/app-error.js';
import { assinarRefresh, verificarRefresh } from '../../plugins/auth.plugin.js';
import type { IAuthRepository } from './auth.repository.js';

export interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    matricula: string;
    perfil: string;
    aceitePopVersao: string | null;
    aceitePopPerfil: string | null;
    precisaAceitarPop: boolean;
  };
}

export class AuthService {
  constructor(
    private readonly repo: IAuthRepository,
    private readonly app: FastifyInstance,
  ) {}

  async autenticar(input: LoginInput): Promise<RespostaLogin> {
    const usuario = await this.repo.buscarPorEmail(input.email);
    if (!usuario) throw new ErroAutenticacao('Credenciais invalidas');
    if (usuario.status !== 'ATIVO') {
      throw new ErroAutenticacao('Usuario inativo. Contate a gestora.');
    }

    const senhaOk = await conferirSenha(input.senha, usuario.senhaHash);
    if (!senhaOk) throw new ErroAutenticacao('Credenciais invalidas');

    const popVigente = await this.repo.buscarPopVigentePorPerfil(usuario.perfil);
    const ultimoAceite = popVigente
      ? await this.repo.buscarUltimoAceite(usuario.id, usuario.perfil)
      : null;
    const precisaAceitarPop = popVigente ? ultimoAceite?.versao !== popVigente.versao : false;

    const payload = { sub: usuario.id, perfil: usuario.perfil, matricula: usuario.matricula };
    const accessToken = this.app.jwt.sign(payload);
    const refreshToken = assinarRefresh(payload);

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        matricula: usuario.matricula,
        perfil: usuario.perfil,
        aceitePopVersao: usuario.aceitePopVersao,
        aceitePopPerfil: ultimoAceite?.perfil ?? null,
        precisaAceitarPop,
      },
    };
  }

  renovarAcesso(refreshToken: string): { accessToken: string; refreshToken: string } {
    let payload;
    try {
      payload = verificarRefresh(refreshToken);
    } catch {
      throw new ErroAutenticacao('Refresh token invalido ou expirado');
    }
    const novo = { sub: payload.sub, perfil: payload.perfil, matricula: payload.matricula };
    return {
      accessToken: this.app.jwt.sign(novo),
      refreshToken: assinarRefresh(novo),
    };
  }

  async trocarSenha(usuarioId: string, input: TrocarSenhaInput): Promise<void> {
    const usuario = await this.repo.buscarPorId(usuarioId);
    if (!usuario) throw new ErroAutenticacao();

    const atualOk = await conferirSenha(input.senhaAtual, usuario.senhaHash);
    if (!atualOk) throw new ErroValidacao('Senha atual nao confere.');

    const validacao = validarForcaSenha(input.novaSenha, usuario.nome, usuario.matricula);
    if (!validacao.valida) {
      throw new ErroValidacao('Nova senha nao atende aos requisitos.', validacao.motivos);
    }

    const mesmaAtual = await conferirSenha(input.novaSenha, usuario.senhaHash);
    if (mesmaAtual) throw new ErroValidacao('A nova senha nao pode ser igual a atual.');

    const historico = Array.isArray(usuario.senhasAnteriores)
      ? (usuario.senhasAnteriores as string[])
      : [];
    for (const hashAntigo of historico) {
      if (await conferirSenha(input.novaSenha, hashAntigo)) {
        throw new ErroValidacao(
          `A nova senha nao pode ser igual as ultimas ${SENHA_HISTORICO_BLOQUEADO} senhas utilizadas.`,
        );
      }
    }

    const novoHash = await gerarHashSenha(input.novaSenha);
    const novoHistorico = [usuario.senhaHash, ...historico].slice(0, SENHA_HISTORICO_BLOQUEADO);
    await this.repo.atualizarSenha(usuarioId, novoHash, novoHistorico);
  }

  async aceitarPop(usuarioId: string, input: AceitarPopInput, ip: string, userAgent?: string): Promise<void> {
    const usuario = await this.repo.buscarPorId(usuarioId);
    if (!usuario) throw new ErroAutenticacao();

    const popVigente = await this.repo.buscarPopVigentePorPerfil(usuario.perfil);
    if (!popVigente || popVigente.id !== input.popId) {
      throw new ErroValidacao('POP informado nao corresponde ao vigente para seu perfil.');
    }

    await this.repo.registrarAceitePop({
      usuarioId,
      popDocumentoId: popVigente.id,
      perfil: popVigente.perfil,
      versao: popVigente.versao,
      ip,
      userAgent,
    });
  }
}
