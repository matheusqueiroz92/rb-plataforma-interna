'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase } from 'lucide-react';
import type { DemandaDTO, RespostaLista } from '@rb/types';
import { ROTULOS_STATUS_DEMANDA, ROTULOS_PRIORIDADE, formatarDataBR } from '@rb/utils';
import { HIERARQUIA_PERFIL } from '@rb/constants';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export default function PaginaDemandas() {
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const podeCriar = usuario ? HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.ASSESSORA_JR : false;
  const [visao, setVisao] = useState<'minhas' | 'equipe'>('minhas');
  const [dados, setDados] = useState<DemandaDTO[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar(): Promise<void> {
      setErro(null);
      try {
        const endpoint = visao === 'minhas' ? '/demandas/minhas' : '/demandas/equipe';
        const resp = await apiClient.get<RespostaLista<DemandaDTO>>(endpoint, token);
        setDados(resp.dados);
      } catch (e) {
        if (e instanceof ApiError) setErro(e.mensagem);
      }
    }
    if (token) void carregar();
  }, [token, visao]);

  const agrupadas = useMemo(() => {
    if (!dados) return [];
    const mapa = new Map<string, DemandaDTO[]>();
    for (const d of dados) {
      const lista = mapa.get(d.status) ?? [];
      lista.push(d);
      mapa.set(d.status, lista);
    }
    return Array.from(mapa.entries());
  }, [dados]);

  return (
    <div className="animate-rise space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="secao-titulo flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-gold-500" /> Demandas
          </h1>
          <p className="text-sm text-gray-500 mt-2 pl-4">
            Atribuicoes, entregas, correcoes e delegacoes.
          </p>
        </div>
        {podeCriar && (
          <Link href="/demandas/nova" className="btn-dourado">
            <Plus className="h-4 w-4" /> Nova demanda
          </Link>
        )}
      </header>

      <div className="flex gap-2">
        {(['minhas', 'equipe'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisao(v)}
            disabled={v === 'equipe' && !podeCriar}
            className={cn(
              'px-4 py-2 rounded-md text-sm uppercase tracking-wide transition-all',
              visao === v
                ? 'bg-navy-900 text-white'
                : 'bg-white border border-gray-100 text-navy-900 hover:border-gold-400',
              v === 'equipe' && !podeCriar && 'opacity-50 cursor-not-allowed',
            )}
          >
            {v === 'minhas' ? 'Minhas' : 'Da equipe'}
          </button>
        ))}
      </div>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {dados?.length === 0 && (
        <div className="cartao-institucional p-8 text-center text-gray-500">
          Nenhuma demanda nesta visao.
        </div>
      )}

      <div className="space-y-5">
        {agrupadas.map(([status, lista]) => (
          <section key={status} className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 px-2">
              {ROTULOS_STATUS_DEMANDA[status as keyof typeof ROTULOS_STATUS_DEMANDA]} ({lista.length})
            </h2>
            <ul className="space-y-2">
              {lista.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/demandas/${d.id}`}
                    className="cartao-institucional block p-5 hover:shadow-elevated transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-serif text-lg text-navy-900">{d.titulo}</div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.descricao}</p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                          <span>
                            Atribuido a: <strong>{d.atribuido.nome}</strong>
                          </span>
                          {d.prazoFatal && (
                            <span>
                              Prazo: <strong>{formatarDataBR(d.prazoFatal)}</strong>
                            </span>
                          )}
                          {d.clienteVinculado && (
                            <span>
                              Cliente: <strong>{d.clienteVinculado}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            'badge',
                            d.prioridade === 'URGENTE' && 'badge-critico',
                            d.prioridade === 'ALTA' && 'badge-alerta',
                            d.prioridade === 'MEDIA' && 'badge-info',
                            d.prioridade === 'BAIXA' && 'badge-pendente',
                          )}
                        >
                          {ROTULOS_PRIORIDADE[d.prioridade]}
                        </span>
                        {d.notaCorrecao !== null && (
                          <span className="badge badge-ok">Nota {d.notaCorrecao}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
