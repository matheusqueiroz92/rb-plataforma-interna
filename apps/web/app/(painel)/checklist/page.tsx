'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { CategoriaChecklist } from '@rb/constants';
import type { ChecklistProgresso } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const TITULOS_CATEGORIA: Record<CategoriaChecklist, string> = {
  S1_SEIRI: '1S - Seiri (descarte)',
  S2_SEITON: '2S - Seiton (ordenacao)',
  S3_SEISO: '3S - Seiso (limpeza)',
  S4_SEIKETSU: '4S - Seiketsu (padronizacao)',
  S5_SHITSUKE: '5S - Shitsuke (disciplina)',
  ROTINA_INICIO: 'Rotina de inicio do expediente',
  ROTINA_JURIDICA: 'Rotina juridica',
  ROTINA_ADMIN: 'Rotina administrativa',
  ENCERRAMENTO: 'Encerramento do expediente',
};

export default function PaginaChecklist() {
  const token = useAuthStore((s) => s.accessToken);
  const [progresso, setProgresso] = useState<ChecklistProgresso | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function recarregar(): Promise<void> {
    try {
      const dado = await apiClient.get<ChecklistProgresso>('/checklist/progresso-hoje', token);
      setProgresso(dado);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token) void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function alternar(itemId: string, concluido: boolean): Promise<void> {
    setAtualizando(itemId);
    setErro(null);
    try {
      await apiClient.post(
        '/checklist/responder',
        { itemId, concluido: !concluido },
        token,
      );
      await recarregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    } finally {
      setAtualizando(null);
    }
  }

  const porCategoria = useMemo(() => {
    if (!progresso) return [];
    const mapa = new Map<CategoriaChecklist, ChecklistProgresso['itens']>();
    for (const item of progresso.itens) {
      const lista = mapa.get(item.categoria) ?? [];
      lista.push(item);
      mapa.set(item.categoria, lista);
    }
    return Array.from(mapa.entries());
  }, [progresso]);

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo">Checklist 5S + Rotinas</h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Cumprimento diario. Integra a pontuacao semanal (ate 10 pontos).
        </p>
      </section>

      {progresso && (
        <section className="cartao-institucional p-5 flex items-center gap-5">
          <div className="flex-1">
            <div className="text-sm uppercase tracking-wide text-gray-500">Progresso de hoje</div>
            <div className="font-serif text-3xl text-navy-900">
              {progresso.totalConcluido} de {progresso.totalItens}
            </div>
          </div>
          <div className="w-40">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-500 transition-all"
                style={{ width: `${progresso.percentual}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">{progresso.percentual}%</div>
          </div>
        </section>
      )}

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <div className="space-y-5">
        {porCategoria.map(([categoria, itens]) => (
          <section key={categoria} className="cartao-institucional p-6">
            <h2 className="font-serif text-lg text-navy-900 mb-3">
              {TITULOS_CATEGORIA[categoria]}
            </h2>
            <ul className="space-y-2">
              {itens.map((item) => {
                const desabilitado = atualizando === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => alternar(item.id, item.concluido)}
                      disabled={desabilitado}
                      className={`w-full flex items-start gap-3 text-left rounded-md px-4 py-3 transition-colors ${
                        item.concluido
                          ? 'bg-institucional-green/10 hover:bg-institucional-green/15'
                          : 'bg-gray-100/60 hover:bg-gray-100'
                      }`}
                    >
                      {item.concluido ? (
                        <CheckSquare className="h-5 w-5 text-institucional-green flex-shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          item.concluido ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {item.texto}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
