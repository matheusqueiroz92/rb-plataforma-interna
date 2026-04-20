'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { PontuacaoSemanalDTO } from '@rb/types';
import { HIERARQUIA_PERFIL } from '@rb/constants';
import { ROTULOS_PERFIL } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

interface RespostaRanking {
  semana: string;
  total: number;
  dados: Array<{
    usuarioId: string;
    nome: string;
    perfil: string;
    pontualidadePontos: number;
    qualidadeDemandaMedia: number;
    demandasExtrasPontos: number;
    checklist5sPontos: number;
    relatoriosEntreguePontos: number;
    totalPontos: number;
    posicaoRanking: number | null;
  }>;
}

interface MeuDesempenho {
  total: number;
  dados: Array<{ semanaReferencia: string; totalPontos: number; posicaoRanking: number | null }>;
}

export default function PaginaProdutividade() {
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [ranking, setRanking] = useState<RespostaRanking | null>(null);
  const [meu, setMeu] = useState<MeuDesempenho | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const podeCalcular = usuario ? HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.GESTORA : false;

  async function carregar(): Promise<void> {
    setErro(null);
    try {
      const [r, m] = await Promise.all([
        apiClient.get<RespostaRanking>('/produtividade/ranking-semanal', token),
        apiClient.get<MeuDesempenho>('/produtividade/meu-desempenho?semanas=8', token),
      ]);
      setRanking(r);
      setMeu(m);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function calcular(): Promise<void> {
    try {
      await apiClient.post('/produtividade/calcular', {}, token);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  const dadosGrafico = useMemo(
    () =>
      (meu?.dados ?? []).slice().reverse().map((d) => ({ semana: d.semanaReferencia, pontos: d.totalPontos })),
    [meu],
  );

  return (
    <div className="animate-rise space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="secao-titulo flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-gold-500" /> Produtividade
          </h1>
          <p className="text-sm text-gray-500 mt-2 pl-4">
            Ranking semanal + meu desempenho (ate 100 pontos/semana).
          </p>
        </div>
        {podeCalcular && (
          <button type="button" onClick={calcular} className="btn-dourado">
            Recalcular semana
          </button>
        )}
      </header>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <section className="cartao-institucional p-6">
        <h2 className="font-serif text-xl text-navy-900 mb-2">
          Ranking {ranking ? `(${ranking.semana})` : ''}
        </h2>
        {ranking?.dados.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ranking ainda nao calculado. {podeCalcular ? 'Clique em Recalcular para gerar.' : ''}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ranking?.dados.map((p, idx) => (
              <li
                key={p.usuarioId}
                className={cn(
                  'flex items-center justify-between py-3',
                  idx === 0 && 'bg-gold-300/20 -mx-6 px-6 rounded-md',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-serif text-lg text-navy-900">
                    {p.posicaoRanking ?? '-'}
                  </div>
                  {idx < 3 && <Trophy className="h-5 w-5 text-gold-500" />}
                  <div>
                    <div className="font-semibold text-navy-900">{p.nome}</div>
                    <div className="text-xs text-gray-500">
                      {ROTULOS_PERFIL[p.perfil as never]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl text-navy-900">{p.totalPontos}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">pontos</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao-institucional p-6">
        <h2 className="font-serif text-xl text-navy-900 mb-4">Meu desempenho (ultimas 8 semanas)</h2>
        {dadosGrafico.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dados historicos ainda.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D8" />
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="pontos" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
