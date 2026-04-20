'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { criarDemandaSchema, type CriarDemandaInput } from '@rb/validators';
import { PRIORIDADES_DEMANDA, TIPOS_DEMANDA, HIERARQUIA_PERFIL } from '@rb/constants';
import { ROTULOS_PERFIL, ROTULOS_PRIORIDADE } from '@rb/utils';
import type { UsuarioPublico, RespostaLista } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaNovaDemanda() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [candidatos, setCandidatos] = useState<UsuarioPublico[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CriarDemandaInput>({
    resolver: zodResolver(criarDemandaSchema),
    defaultValues: { prioridade: 'MEDIA', tipo: 'JURIDICA' },
  });

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const resp = await apiClient.get<RespostaLista<UsuarioPublico>>('/users?status=ATIVO', token);
        if (!usuario) return;
        const nivel = HIERARQUIA_PERFIL[usuario.perfil];
        setCandidatos(resp.dados.filter((u) => HIERARQUIA_PERFIL[u.perfil] < nivel));
      } catch {
        // deixa vazio
      }
    }
    if (token) void carregar();
  }, [token, usuario]);

  async function onSubmit(dados: CriarDemandaInput): Promise<void> {
    setEnviando(true);
    setErro(null);
    try {
      const criada = await apiClient.post<{ id: string }>('/demandas', dados, token);
      router.push(`/demandas/${criada.id}`);
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao criar demanda.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="animate-rise space-y-6 max-w-3xl">
      <h1 className="secao-titulo">Nova demanda</h1>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="cartao-institucional p-6 space-y-5">
        <div>
          <label className="label-institucional">Titulo</label>
          <input className="input-institucional" {...register('titulo')} />
          {errors.titulo && <p className="mt-1 text-xs text-institucional-red">{errors.titulo.message}</p>}
        </div>

        <div>
          <label className="label-institucional">Descricao detalhada</label>
          <textarea className="textarea-institucional" rows={5} {...register('descricao')} />
          {errors.descricao && (
            <p className="mt-1 text-xs text-institucional-red">{errors.descricao.message}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label-institucional">Atribuir para</label>
            <select className="select-institucional" {...register('atribuidaAId')}>
              <option value="">Selecione...</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({ROTULOS_PERFIL[c.perfil]})
                </option>
              ))}
            </select>
            {errors.atribuidaAId && (
              <p className="mt-1 text-xs text-institucional-red">{errors.atribuidaAId.message}</p>
            )}
          </div>

          <div>
            <label className="label-institucional">Tipo</label>
            <select className="select-institucional" {...register('tipo')}>
              {TIPOS_DEMANDA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label-institucional">Prioridade</label>
            <select className="select-institucional" {...register('prioridade')}>
              {PRIORIDADES_DEMANDA.map((p) => (
                <option key={p} value={p}>
                  {ROTULOS_PRIORIDADE[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-institucional">Prazo fatal</label>
            <input
              type="datetime-local"
              className="input-institucional"
              {...register('prazoFatal')}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label-institucional">Numero CNJ (opcional)</label>
            <input className="input-institucional" {...register('processoCnj')} />
          </div>

          <div>
            <label className="label-institucional">Cliente vinculado (opcional)</label>
            <input className="input-institucional" {...register('clienteVinculado')} />
          </div>
        </div>

        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? 'Criando...' : 'Criar demanda'}
        </button>
      </form>
    </div>
  );
}
