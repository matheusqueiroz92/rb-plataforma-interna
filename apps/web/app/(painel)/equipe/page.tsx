'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Plus, PencilLine, Search } from 'lucide-react';
import type { RespostaLista, UsuarioPublico } from '@rb/types';
import { PERFIS, STATUS_USUARIO, HIERARQUIA_PERFIL, type Perfil, type StatusUsuario } from '@rb/constants';
import { ROTULOS_PERFIL, formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const ROTULOS_STATUS: Record<StatusUsuario, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  FERIAS: 'Ferias',
  AFASTADO: 'Afastado',
};

export default function PaginaEquipe() {
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [membros, setMembros] = useState<UsuarioPublico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState<Perfil | ''>('');
  const [status, setStatus] = useState<StatusUsuario | ''>('ATIVO');

  const podeGerenciar =
    usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.GESTORA ? true : false;

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (busca.trim()) params.set('q', busca.trim());
    if (perfil) params.set('perfil', perfil);
    if (status) params.set('status', status);
    const texto = params.toString();
    return texto ? `?${texto}` : '';
  }, [busca, perfil, status]);

  useEffect(() => {
    async function carregar(): Promise<void> {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await apiClient.get<RespostaLista<UsuarioPublico>>(`/users${query}`, token);
        setMembros(resposta.dados);
      } catch (e) {
        setErro(e instanceof ApiError ? e.mensagem : 'Falha ao carregar membros da equipe.');
      } finally {
        setCarregando(false);
      }
    }

    if (token && podeGerenciar) void carregar();
  }, [token, query, podeGerenciar]);

  if (!podeGerenciar) {
    return (
      <div className="cartao-institucional p-8 text-center text-gray-500">
        Voce nao possui permissao para gerenciar membros da equipe.
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="secao-titulo flex items-center gap-2">
            <Users className="h-6 w-6 text-gold-500" /> Membros da equipe
          </h1>
          <p className="text-sm text-gray-500 mt-2 pl-4">
            Cadastro, edicao e acompanhamento de status dos membros internos.
          </p>
        </div>
        <Link href="/equipe/novo" className="btn-dourado">
          <Plus className="h-4 w-4" /> Novo membro
        </Link>
      </header>

      <section className="cartao-institucional p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="label-institucional">Busca</span>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-institucional pl-9"
                placeholder="Nome, email ou matricula"
              />
            </div>
          </label>

          <label>
            <span className="label-institucional">Perfil</span>
            <select
              value={perfil}
              onChange={(e) => setPerfil((e.target.value as Perfil | '') || '')}
              className="select-institucional"
            >
              <option value="">Todos</option>
              {PERFIS.map((item) => (
                <option key={item} value={item}>
                  {ROTULOS_PERFIL[item]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label-institucional">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus((e.target.value as StatusUsuario | '') || '')}
              className="select-institucional"
            >
              <option value="">Todos</option>
              {STATUS_USUARIO.map((item) => (
                <option key={item} value={item}>
                  {ROTULOS_STATUS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {carregando && <div className="cartao-institucional p-6 text-sm text-gray-500">Carregando equipe...</div>}

      {!carregando && membros?.length === 0 && (
        <div className="cartao-institucional p-8 text-center text-gray-500">
          Nenhum membro encontrado com os filtros aplicados.
        </div>
      )}

      <ul className="space-y-3">
        {membros?.map((membro) => (
          <li key={membro.id} className="cartao-institucional p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="font-serif text-xl text-navy-900">{membro.nome}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-info">{ROTULOS_PERFIL[membro.perfil]}</span>
                  <span className="badge badge-pendente">{ROTULOS_STATUS[membro.status]}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Email: {membro.email}</div>
                  <div>Matricula: {membro.matricula}</div>
                  <div>Admissao: {membro.dataAdmissao ? formatarDataBR(membro.dataAdmissao) : '-'}</div>
                </div>
              </div>

              <Link href={`/equipe/${membro.id}`} className="btn-outline">
                <PencilLine className="h-4 w-4" /> Editar
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
