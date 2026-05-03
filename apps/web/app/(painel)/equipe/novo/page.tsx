'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { criarUsuarioSchema, type CriarUsuarioInput } from '@rb/validators';
import { PERFIS, HIERARQUIA_PERFIL } from '@rb/constants';
import { ROTULOS_PERFIL } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaNovoMembro() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const podeGerenciar =
    usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.GESTORA ? true : false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CriarUsuarioInput>({
    resolver: zodResolver(criarUsuarioSchema),
  });

  async function onSubmit(dados: CriarUsuarioInput): Promise<void> {
    setEnviando(true);
    setErro(null);
    try {
      const membro = await apiClient.post<{ id: string }>('/users', dados, token);
      router.push(`/equipe/${membro.id}`);
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao cadastrar membro.');
    } finally {
      setEnviando(false);
    }
  }

  if (!podeGerenciar) {
    return (
      <div className="cartao-institucional p-8 text-center text-gray-500">
        Voce nao possui permissao para cadastrar membros.
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6 max-w-4xl">
      <header>
        <h1 className="secao-titulo">Novo membro da equipe</h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Cadastre os dados iniciais, perfil de acesso e credencial temporaria.
        </p>
      </header>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="cartao-institucional p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Nome</label>
            <input className="input-institucional" {...register('nome')} />
            {errors.nome && <p className="mt-1 text-xs text-institucional-red">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="label-institucional">Matricula</label>
            <input className="input-institucional" {...register('matricula')} />
            {errors.matricula && (
              <p className="mt-1 text-xs text-institucional-red">{errors.matricula.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Email</label>
            <input className="input-institucional" type="email" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-institucional-red">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label-institucional">Perfil</label>
            <select className="select-institucional" {...register('perfil')}>
              {PERFIS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {ROTULOS_PERFIL[perfil]}
                </option>
              ))}
            </select>
            {errors.perfil && <p className="mt-1 text-xs text-institucional-red">{errors.perfil.message}</p>}
          </div>
        </div>

        <div>
          <label className="label-institucional">Senha inicial</label>
          <input className="input-institucional" type="password" {...register('senhaInicial')} />
          {errors.senhaInicial && (
            <p className="mt-1 text-xs text-institucional-red">{errors.senhaInicial.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Instituicao de ensino (opcional)</label>
            <input className="input-institucional" {...register('instituicaoEnsino')} />
            {errors.instituicaoEnsino && (
              <p className="mt-1 text-xs text-institucional-red">{errors.instituicaoEnsino.message}</p>
            )}
          </div>
          <div>
            <label className="label-institucional">Periodo do curso (opcional)</label>
            <input className="input-institucional" {...register('periodoCurso')} />
            {errors.periodoCurso && (
              <p className="mt-1 text-xs text-institucional-red">{errors.periodoCurso.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label-institucional">Data de admissao (opcional)</label>
            <input
              className="input-institucional"
              type="date"
              {...register('dataAdmissao', {
                setValueAs: (valor) => (valor ? valor : undefined),
              })}
            />
            {errors.dataAdmissao && (
              <p className="mt-1 text-xs text-institucional-red">{errors.dataAdmissao.message}</p>
            )}
          </div>
          <div>
            <label className="label-institucional">WhatsApp (opcional)</label>
            <input className="input-institucional" {...register('telefoneWhatsapp')} />
            {errors.telefoneWhatsapp && (
              <p className="mt-1 text-xs text-institucional-red">{errors.telefoneWhatsapp.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/equipe')} className="btn-outline">
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className="btn-primario">
            {enviando ? 'Cadastrando...' : 'Cadastrar membro'}
          </button>
        </div>
      </form>
    </div>
  );
}
