'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  atualizarUsuarioSchema,
  resetarSenhaSchema,
  type AtualizarUsuarioInput,
  type ResetarSenhaInput,
} from '@rb/validators';
import {
  PERFIS,
  STATUS_USUARIO,
  HIERARQUIA_PERFIL,
  type Perfil,
  type StatusUsuario,
} from '@rb/constants';
import type { UsuarioPublico } from '@rb/types';
import { ROTULOS_PERFIL, formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const ROTULOS_STATUS: Record<StatusUsuario, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FERIAS: 'Ferias',
  AFASTADO: 'Afastado',
};

export default function PaginaEditarMembro() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const usuarioLogado = useAuthStore((s) => s.usuario);
  const [membro, setMembro] = useState<UsuarioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const podeGerenciar =
    usuarioLogado && HIERARQUIA_PERFIL[usuarioLogado.perfil] >= HIERARQUIA_PERFIL.GESTORA ? true : false;

  const formEdicao = useForm<AtualizarUsuarioInput>({
    resolver: zodResolver(atualizarUsuarioSchema),
  });

  const formResetSenha = useForm<ResetarSenhaInput>({
    resolver: zodResolver(resetarSenhaSchema),
  });

  useEffect(() => {
    async function carregar(): Promise<void> {
      setCarregando(true);
      setErro(null);
      try {
        const dado = await apiClient.get<UsuarioPublico>(`/users/${id}`, token);
        setMembro(dado);
        formEdicao.reset({
          nome: dado.nome,
          email: dado.email,
          matricula: dado.matricula,
          perfil: dado.perfil,
          status: dado.status,
          instituicaoEnsino: dado.instituicaoEnsino,
          periodoCurso: dado.periodoCurso,
          dataAdmissao: dado.dataAdmissao ? new Date(dado.dataAdmissao) : null,
          dataDesligamento: dado.dataDesligamento ? new Date(dado.dataDesligamento) : null,
          telefoneWhatsapp: dado.telefoneWhatsapp,
        });
      } catch (e) {
        setErro(e instanceof ApiError ? e.mensagem : 'Falha ao carregar dados do membro.');
      } finally {
        setCarregando(false);
      }
    }

    if (token && podeGerenciar && id) void carregar();
  }, [token, podeGerenciar, id, formEdicao]);

  async function salvar(dados: AtualizarUsuarioInput): Promise<void> {
    setSalvando(true);
    setErro(null);
    setSucesso(null);
    try {
      const atualizado = await apiClient.put<UsuarioPublico>(`/users/${id}`, dados, token);
      setMembro(atualizado);
      setSucesso('Cadastro atualizado com sucesso.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao atualizar membro.');
    } finally {
      setSalvando(false);
    }
  }

  async function resetarSenha(dados: ResetarSenhaInput): Promise<void> {
    setResetando(true);
    setErro(null);
    setSucesso(null);
    try {
      await apiClient.post<{ sucesso: boolean }>(`/users/${id}/resetar-senha`, dados, token);
      formResetSenha.reset();
      setSucesso('Senha resetada com sucesso.');
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao resetar senha.');
    } finally {
      setResetando(false);
    }
  }

  if (!podeGerenciar) {
    return (
      <div className="cartao-institucional p-8 text-center text-gray-500">
        Voce nao possui permissao para editar membros.
      </div>
    );
  }

  if (carregando) {
    return <div className="cartao-institucional p-6 text-sm text-gray-500">Carregando cadastro...</div>;
  }

  return (
    <div className="animate-rise space-y-6 max-w-4xl">
      <header>
        <h1 className="secao-titulo">Editar membro</h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          {membro?.nome} {membro?.criadoEm ? `- cadastrado em ${formatarDataBR(membro.criadoEm)}` : ''}
        </p>
      </header>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="rounded-md bg-institucional-green/10 text-institucional-green border border-institucional-green/30 px-4 py-3 text-sm">
          {sucesso}
        </div>
      )}

      <form onSubmit={formEdicao.handleSubmit(salvar)} className="cartao-institucional p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Nome</label>
            <input className="input-institucional" {...formEdicao.register('nome')} />
            {formEdicao.formState.errors.nome && (
              <p className="mt-1 text-xs text-institucional-red">{formEdicao.formState.errors.nome.message}</p>
            )}
          </div>
          <div>
            <label className="label-institucional">Matricula</label>
            <input className="input-institucional" {...formEdicao.register('matricula')} />
            {formEdicao.formState.errors.matricula && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.matricula.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Email</label>
            <input type="email" className="input-institucional" {...formEdicao.register('email')} />
            {formEdicao.formState.errors.email && (
              <p className="mt-1 text-xs text-institucional-red">{formEdicao.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label-institucional">Perfil</label>
            <select className="select-institucional" {...formEdicao.register('perfil')}>
              {PERFIS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {ROTULOS_PERFIL[perfil]}
                </option>
              ))}
            </select>
            {formEdicao.formState.errors.perfil && (
              <p className="mt-1 text-xs text-institucional-red">{formEdicao.formState.errors.perfil.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Status</label>
            <select className="select-institucional" {...formEdicao.register('status')}>
              {STATUS_USUARIO.map((status) => (
                <option key={status} value={status}>
                  {ROTULOS_STATUS[status]}
                </option>
              ))}
            </select>
            {formEdicao.formState.errors.status && (
              <p className="mt-1 text-xs text-institucional-red">{formEdicao.formState.errors.status.message}</p>
            )}
          </div>
          <div>
            <label className="label-institucional">WhatsApp</label>
            <input
              className="input-institucional"
              {...formEdicao.register('telefoneWhatsapp', {
                setValueAs: (valor) => (valor ? valor : null),
              })}
            />
            {formEdicao.formState.errors.telefoneWhatsapp && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.telefoneWhatsapp.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Instituicao de ensino</label>
            <input
              className="input-institucional"
              {...formEdicao.register('instituicaoEnsino', {
                setValueAs: (valor) => (valor ? valor : null),
              })}
            />
            {formEdicao.formState.errors.instituicaoEnsino && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.instituicaoEnsino.message}
              </p>
            )}
          </div>
          <div>
            <label className="label-institucional">Periodo do curso</label>
            <input
              className="input-institucional"
              {...formEdicao.register('periodoCurso', {
                setValueAs: (valor) => (valor ? valor : null),
              })}
            />
            {formEdicao.formState.errors.periodoCurso && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.periodoCurso.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Data de admissao</label>
            <input
              className="input-institucional"
              type="date"
              {...formEdicao.register('dataAdmissao', {
                setValueAs: (valor) => (valor ? valor : null),
              })}
            />
            {formEdicao.formState.errors.dataAdmissao && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.dataAdmissao.message}
              </p>
            )}
          </div>
          <div>
            <label className="label-institucional">Data de desligamento</label>
            <input
              className="input-institucional"
              type="date"
              {...formEdicao.register('dataDesligamento', {
                setValueAs: (valor) => (valor ? valor : null),
              })}
            />
            {formEdicao.formState.errors.dataDesligamento && (
              <p className="mt-1 text-xs text-institucional-red">
                {formEdicao.formState.errors.dataDesligamento.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/equipe')} className="btn-outline">
            Voltar
          </button>
          <button type="submit" disabled={salvando} className="btn-primario">
            {salvando ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </div>
      </form>

      <form
        onSubmit={formResetSenha.handleSubmit(resetarSenha)}
        className="cartao-institucional p-6 space-y-4 max-w-xl"
      >
        <h2 className="secao-titulo text-xl">Resetar senha</h2>
        <div>
          <label className="label-institucional">Nova senha temporaria</label>
          <input
            className="input-institucional"
            type="password"
            {...formResetSenha.register('novaSenha')}
          />
          {formResetSenha.formState.errors.novaSenha && (
            <p className="mt-1 text-xs text-institucional-red">
              {formResetSenha.formState.errors.novaSenha.message}
            </p>
          )}
        </div>
        <button type="submit" disabled={resetando} className="btn-critico">
          {resetando ? 'Resetando...' : 'Resetar senha'}
        </button>
      </form>
    </div>
  );
}
