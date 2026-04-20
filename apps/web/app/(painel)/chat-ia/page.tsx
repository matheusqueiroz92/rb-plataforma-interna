'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Trash2 } from 'lucide-react';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface Mensagem {
  papel: 'USER' | 'ASSISTANT';
  conteudo: string;
  timestamp?: string;
}

interface RespostaEnvio {
  conversaId: string;
  resposta: string;
  tokensEntrada: number;
  tokensSaida: number;
}

interface Conversa {
  conversaId: string;
  ultimaMensagem: string;
  totalMensagens: number;
  resumo: string;
}

export default function PaginaChatIa() {
  const token = useAuthStore((s) => s.accessToken);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtual, setConversaAtual] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tokensMes, setTokensMes] = useState<number | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  async function carregarConversas(): Promise<void> {
    try {
      const r = await apiClient.get<{ dados: Conversa[] }>('/ia/conversas', token);
      setConversas(r.dados);
      const consumo = await apiClient.get<{ tokensNoMes: number }>('/ia/consumo', token);
      setTokensMes(consumo.tokensNoMes);
    } catch {
      // sem historico
    }
  }

  useEffect(() => {
    if (token) void carregarConversas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  async function abrirConversa(id: string): Promise<void> {
    try {
      const r = await apiClient.get<{ dados: Mensagem[] }>(`/ia/conversas/${id}`, token);
      setConversaAtual(id);
      setMensagens(r.dados);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  function novaConversa(): void {
    setConversaAtual(null);
    setMensagens([]);
  }

  async function excluirConversa(id: string): Promise<void> {
    try {
      await apiClient.delete(`/ia/conversas/${id}`, token);
      if (conversaAtual === id) novaConversa();
      await carregarConversas();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
    }
  }

  async function enviar(): Promise<void> {
    if (!entrada.trim() || enviando) return;
    setEnviando(true);
    setErro(null);
    const mensagemEnviada = entrada;
    setMensagens((m) => [...m, { papel: 'USER', conteudo: mensagemEnviada }]);
    setEntrada('');

    try {
      const resp = await apiClient.post<RespostaEnvio>(
        '/ia/chat',
        { conversaId: conversaAtual ?? undefined, mensagem: mensagemEnviada },
        token,
      );
      setConversaAtual(resp.conversaId);
      setMensagens((m) => [...m, { papel: 'ASSISTANT', conteudo: resp.resposta }]);
      await carregarConversas();
    } catch (e) {
      if (e instanceof ApiError) setErro(e.mensagem);
      setMensagens((m) => m.slice(0, -1));
      setEntrada(mensagemEnviada);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="animate-rise grid md:grid-cols-[280px_1fr] gap-6 h-[calc(100vh-180px)]">
      <aside className="cartao-institucional p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-navy-900">Conversas</h2>
          <button onClick={novaConversa} className="text-xs uppercase text-gold-500">
            Nova
          </button>
        </div>
        {tokensMes !== null && (
          <p className="text-xs text-gray-500 mb-3">
            Consumo no mes: <strong>{tokensMes.toLocaleString('pt-BR')}</strong> tokens
          </p>
        )}
        <ul className="space-y-1">
          {conversas.map((c) => (
            <li key={c.conversaId}>
              <div
                className={`group flex items-start justify-between gap-2 rounded-md px-3 py-2 transition-colors ${
                  conversaAtual === c.conversaId
                    ? 'bg-gold-300/40'
                    : 'hover:bg-gray-100/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => abrirConversa(c.conversaId)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm text-navy-900 line-clamp-2">{c.resumo}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{c.totalMensagens} mensagens</div>
                </button>
                <button
                  type="button"
                  onClick={() => excluirConversa(c.conversaId)}
                  className="opacity-0 group-hover:opacity-100 text-institucional-red"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {conversas.length === 0 && (
            <li className="text-xs text-gray-500 px-3 py-2">Nenhuma conversa ainda.</li>
          )}
        </ul>
      </aside>

      <section className="cartao-institucional flex flex-col overflow-hidden">
        <header className="p-5 border-b border-gray-100">
          <h1 className="font-serif text-xl text-navy-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold-500" /> Auxiliar Juridico Interno
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Claude Opus. Nunca insira dados identificaveis de clientes.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mensagens.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-20">
              Inicie uma nova pesquisa ou selecione uma conversa anterior.
            </div>
          )}
          {mensagens.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-md px-4 py-3 text-sm whitespace-pre-wrap ${
                m.papel === 'USER'
                  ? 'ml-auto bg-navy-900 text-white'
                  : 'mr-auto bg-gray-100/60 text-gray-900 border border-gold-500/20'
              }`}
            >
              {m.conteudo}
            </div>
          ))}
          <div ref={fimRef} />
        </div>

        {erro && (
          <div className="mx-5 mb-2 rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-3 py-2 text-xs">
            {erro}
          </div>
        )}

        <footer className="p-4 border-t border-gray-100 flex gap-3">
          <textarea
            className="textarea-institucional flex-1 min-h-0 h-16"
            placeholder="Descreva sua consulta juridica..."
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void enviar();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={enviando || !entrada.trim()}
            className="btn-primario self-stretch"
          >
            <Send className="h-4 w-4" />
            {enviando ? 'Consultando...' : 'Enviar'}
          </button>
        </footer>
      </section>
    </div>
  );
}
