'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  ROTULOS_PERFIL,
  ROTULOS_PRIORIDADE,
  ROTULOS_STATUS_DEMANDA,
  formatarDataBR,
} from '@rb/utils';
import { HIERARQUIA_PERFIL, NOTAS_CORRECAO, STATUS_DEMANDA, type NotaCorrecao } from '@rb/constants';
import type { DemandaDTO } from '@rb/types';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export default function PaginaDetalheDemanda() {
  const params = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.accessToken);
  const usuario = useAuthStore((s) => s.usuario);
  const [demanda, setDemanda] = useState<DemandaDTO | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const podeCorrigir = usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.ASSESSORA_JR;
  const podeDelegar = usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.ASSESSORA_JR;
  const ehAtribuido = usuario && demanda && usuario.id === demanda.atribuido.id;

  async function recarregar(): Promise<void> {
    setErro(null);
    try {
      const d = await apiClient.get<DemandaDTO>(`/demandas/${params.id}`, token);
      setDemanda(d);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  useEffect(() => {
    if (token && params.id) void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, params.id]);

  async function mudarStatus(novo: string): Promise<void> {
    try {
      await apiClient.put(`/demandas/${params.id}/status`, { status: novo }, token);
      setMensagem(`Status atualizado para ${ROTULOS_STATUS_DEMANDA[novo as never]}.`);
      await recarregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  async function aplicarCorrecao(nota: NotaCorrecao, feedback: string): Promise<void> {
    if (feedback.length < 10) {
      setErro('Feedback deve ter ao menos 10 caracteres.');
      return;
    }
    try {
      await apiClient.post(`/demandas/${params.id}/corrigir`, { nota, feedback }, token);
      setMensagem(`Correcao registrada com nota ${nota}.`);
      await recarregar();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  if (!demanda) {
    return (
      <div className="animate-rise">
        {erro ? (
          <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
            {erro}
          </div>
        ) : (
          <p className="text-gray-500">Carregando...</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <Link href="/demandas" className="text-sm text-gray-500 hover:text-navy-900 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header className="cartao-institucional p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="badge badge-info">{ROTULOS_STATUS_DEMANDA[demanda.status]}</span>
          <span className="badge badge-pendente">{ROTULOS_PRIORIDADE[demanda.prioridade]}</span>
          <span className="badge badge-pendente">{demanda.tipo}</span>
        </div>
        <h1 className="font-serif text-2xl text-navy-900">{demanda.titulo}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Criada por {demanda.criador.nome} ({ROTULOS_PERFIL[demanda.criador.perfil]}) &middot; Atribuida a{' '}
          {demanda.atribuido.nome}
          {demanda.delegador && ` (delegada por ${demanda.delegador.nome})`}
        </p>
        {demanda.prazoFatal && (
          <p className="text-sm text-institucional-amber mt-2">
            Prazo fatal: {formatarDataBR(demanda.prazoFatal)}
          </p>
        )}
      </header>

      {mensagem && (
        <div className="rounded-md bg-institucional-green/10 text-institucional-green border border-institucional-green/30 px-4 py-3 text-sm">
          {mensagem}
        </div>
      )}
      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      <section className="cartao-institucional p-6">
        <h2 className="secao-titulo text-lg">Descricao</h2>
        <p className="mt-3 text-gray-900 whitespace-pre-wrap">{demanda.descricao}</p>
      </section>

      {demanda.feedbackCorretor && (
        <section className="cartao-institucional p-6">
          <h2 className="secao-titulo text-lg">Feedback da correcao (nota {demanda.notaCorrecao})</h2>
          <p className="mt-3 text-gray-900 whitespace-pre-wrap">{demanda.feedbackCorretor}</p>
        </section>
      )}

      {ehAtribuido && demanda.status !== 'CONCLUIDA' && (
        <section className="cartao-institucional p-6 space-y-3">
          <h2 className="secao-titulo text-lg">Atualizar status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_DEMANDA.filter((s) => ['ANDAMENTO', 'ENTREGUE'].includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => mudarStatus(s)}
                className="btn-outline"
              >
                Marcar como {ROTULOS_STATUS_DEMANDA[s]}
              </button>
            ))}
          </div>
        </section>
      )}

      {podeCorrigir && (demanda.status === 'ENTREGUE' || demanda.status === 'EM_CORRECAO') && (
        <FormularioCorrecao onCorrigir={aplicarCorrecao} />
      )}

      {podeDelegar && <FormularioDelegacao demandaId={demanda.id} onSucesso={recarregar} token={token ?? undefined} />}
    </div>
  );
}

function FormularioCorrecao({
  onCorrigir,
}: {
  onCorrigir: (nota: NotaCorrecao, feedback: string) => Promise<void>;
}) {
  const [nota, setNota] = useState<NotaCorrecao>(10);
  const [feedback, setFeedback] = useState('');
  return (
    <section className="cartao-institucional p-6 space-y-4">
      <h2 className="secao-titulo text-lg">Corrigir e avaliar</h2>
      <div className="flex gap-2">
        {NOTAS_CORRECAO.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setNota(n)}
            className={`flex-1 rounded-md border px-4 py-3 text-sm transition-all ${
              nota === n
                ? 'border-gold-500 bg-gold-300/40 text-navy-900 font-semibold'
                : 'border-gray-100 text-gray-500 hover:border-gold-400'
            }`}
          >
            <div className="font-serif text-2xl">{n}</div>
            <div className="text-xs uppercase mt-1">
              {n === 10 ? 'Sem correcao' : n === 8 ? 'Correcao pequena' : 'Correcao grande'}
            </div>
          </button>
        ))}
      </div>

      <textarea
        className="textarea-institucional"
        rows={4}
        placeholder="Feedback da correcao (minimo 10 caracteres, maximo 2000)."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />

      <button
        type="button"
        onClick={() => void onCorrigir(nota, feedback)}
        className="btn-primario w-full"
      >
        Registrar correcao
      </button>
    </section>
  );
}

function FormularioDelegacao({
  demandaId,
  onSucesso,
  token,
}: {
  demandaId: string;
  onSucesso: () => Promise<void>;
  token?: string;
}) {
  const [candidatos, setCandidatos] = useState<{ id: string; nome: string; perfil: string }[]>([]);
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const resp = await apiClient.get<{ dados: { id: string; nome: string; perfil: string }[] }>(
          '/users?status=ATIVO',
          token,
        );
        setCandidatos(resp.dados);
      } catch {
        // ok
      }
    }
    if (token) void carregar();
  }, [token]);

  async function delegar(): Promise<void> {
    setErro(null);
    try {
      await apiClient.post(
        `/demandas/${demandaId}/delegar`,
        { novoAtribuidoId: destino, motivoDelegacao: motivo || undefined },
        token,
      );
      setDestino('');
      setMotivo('');
      await onSucesso();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  return (
    <section className="cartao-institucional p-6 space-y-3">
      <h2 className="secao-titulo text-lg">Delegar em cascata</h2>
      {erro && <p className="text-sm text-institucional-red">{erro}</p>}
      <select
        className="select-institucional"
        value={destino}
        onChange={(e) => setDestino(e.target.value)}
      >
        <option value="">Selecione novo atribuido...</option>
        {candidatos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome} ({ROTULOS_PERFIL[c.perfil as never]})
          </option>
        ))}
      </select>
      <textarea
        className="textarea-institucional"
        rows={3}
        placeholder="Motivo da delegacao (opcional)."
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />
      <button
        type="button"
        disabled={!destino}
        onClick={() => void delegar()}
        className="btn-outline"
      >
        Delegar
      </button>
    </section>
  );
}
