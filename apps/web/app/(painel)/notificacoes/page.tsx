'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatarDataHoraBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface NotificacaoItem {
  id: string;
  tipo: string;
  mensagem: string;
  status: 'PENDENTE' | 'ENVIADA' | 'FALHA';
  tentativas: number;
  criadaEm: string;
  enviadaEm: string | null;
}

const icones = {
  PENDENTE: <Clock className="h-5 w-5 text-institucional-amber" />,
  ENVIADA: <CheckCircle2 className="h-5 w-5 text-institucional-green" />,
  FALHA: <XCircle className="h-5 w-5 text-institucional-red" />,
};

export default function PaginaNotificacoes() {
  const token = useAuthStore((s) => s.accessToken);
  const [dados, setDados] = useState<NotificacaoItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const r = await apiClient.get<{ dados: NotificacaoItem[] }>(
          '/notificacoes/minhas',
          token,
        );
        setDados(r.dados);
      } catch (e) {
        if (e instanceof ApiError) setErro(e.mensagem);
      }
    }
    if (token) void carregar();
  }, [token]);

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <Bell className="h-6 w-6 text-gold-500" /> Minhas notificacoes
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Mensagens enviadas ou agendadas via WhatsApp.
        </p>
      </section>

      {erro && (
        <div className="rounded-md bg-institucional-red/10 text-institucional-red border border-institucional-red/30 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {dados?.length === 0 && (
        <div className="cartao-institucional p-8 text-center text-gray-500">
          Nenhuma notificacao registrada.
        </div>
      )}

      <ul className="space-y-2">
        {dados?.map((n) => (
          <li key={n.id} className="cartao-institucional p-5 flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">{icones[n.status]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-info">{n.tipo}</span>
                <span className="text-xs text-gray-500">
                  {n.enviadaEm
                    ? `Enviada em ${formatarDataHoraBR(n.enviadaEm)}`
                    : `Criada em ${formatarDataHoraBR(n.criadaEm)}`}
                </span>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{n.mensagem}</p>
              {n.status === 'FALHA' && (
                <p className="text-xs text-institucional-red mt-1">
                  Falha apos {n.tentativas} tentativa(s).
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
