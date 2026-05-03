'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { HIERARQUIA_PERFIL } from '@rb/constants';
import { ROTULOS_PERFIL, formatarDataBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface ItemResumoEquipe {
  usuario: { id: string; nome: string; matricula: string; perfil: 'ESTAGIARIO' | 'ASSESSORA_JR' };
  diasComEntrada: number;
  relatoriosEnviados: number;
  demandasRecebidas: number;
  itensChecklistCumpridos: number;
}

interface ResumoEquipeResponse {
  de: string;
  ate: string;
  total: number;
  dados: ItemResumoEquipe[];
}

function paraDataInput(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export default function PaginaResumoEquipe() {
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const hoje = useMemo(() => new Date(), []);
  const inicioMes = useMemo(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1), [hoje]);
  const [de, setDe] = useState(paraDataInput(inicioMes));
  const [ate, setAte] = useState(paraDataInput(hoje));
  const [dados, setDados] = useState<ItemResumoEquipe[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [periodoAPI, setPeriodoAPI] = useState<{ de: string; ate: string } | null>(null);

  const podeVerResumo =
    usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.ASSESSORA_JR ? true : false;

  async function carregar(): Promise<void> {
    setCarregando(true);
    setErro(null);
    try {
      const query = new URLSearchParams({ de, ate }).toString();
      const resposta = await apiClient.get<ResumoEquipeResponse>(`/relatorios-gerenciais/resumo-equipe?${query}`, token);
      setDados(resposta.dados);
      setPeriodoAPI({ de: resposta.de, ate: resposta.ate });
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao carregar resumo da equipe.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (token && podeVerResumo) void carregar();
  }, [token, podeVerResumo]);

  if (!podeVerResumo) {
    return (
      <div className="cartao-institucional p-8 text-center text-gray-500">
        Voce nao possui permissao para visualizar este relatorio.
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-gold-500" /> Resumo da equipe
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Indicadores consolidados de ponto, relatorios, demandas e checklist por colaborador.
        </p>
      </section>

      <section className="cartao-institucional p-5">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label-institucional">Data inicial</label>
            <input type="date" className="input-institucional" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div>
            <label className="label-institucional">Data final</label>
            <input type="date" className="input-institucional" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <button type="button" onClick={() => void carregar()} disabled={carregando} className="btn-primario">
            {carregando ? 'Atualizando...' : 'Atualizar resumo'}
          </button>
        </div>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {periodoAPI && (
        <p className="text-xs text-gray-500">
          Periodo consultado: {formatarDataBR(periodoAPI.de)} ate {formatarDataBR(periodoAPI.ate)}
        </p>
      )}

      {dados?.length === 0 && (
        <div className="cartao-institucional p-8 text-center text-gray-500">Nenhum registro no periodo informado.</div>
      )}

      <ul className="space-y-3">
        {dados?.map((item) => (
          <li key={item.usuario.id} className="cartao-institucional p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-serif text-lg text-navy-900">{item.usuario.nome}</div>
                <p className="text-sm text-gray-500">
                  {ROTULOS_PERFIL[item.usuario.perfil]} - Matricula {item.usuario.matricula}
                </p>
              </div>
              <span className="badge badge-info">{item.diasComEntrada} dias com entrada</span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-md bg-cream px-3 py-2">
                <div className="text-xs text-gray-500 uppercase">Relatorios</div>
                <div className="font-semibold text-navy-900">{item.relatoriosEnviados}</div>
              </div>
              <div className="rounded-md bg-cream px-3 py-2">
                <div className="text-xs text-gray-500 uppercase">Demandas</div>
                <div className="font-semibold text-navy-900">{item.demandasRecebidas}</div>
              </div>
              <div className="rounded-md bg-cream px-3 py-2">
                <div className="text-xs text-gray-500 uppercase">Checklist</div>
                <div className="font-semibold text-navy-900">{item.itensChecklistCumpridos}</div>
              </div>
              <div className="rounded-md bg-cream px-3 py-2">
                <div className="text-xs text-gray-500 uppercase">Ponto</div>
                <div className="font-semibold text-navy-900">{item.diasComEntrada}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
