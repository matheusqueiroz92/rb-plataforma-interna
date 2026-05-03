'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enviarNotificacaoManualSchema, type EnviarNotificacaoManualInput } from '@rb/validators';
import { HIERARQUIA_PERFIL, TIPOS_NOTIFICACAO } from '@rb/constants';
import { formatarDataHoraBR } from '@rb/utils';
import type { RespostaLista, UsuarioPublico } from '@rb/types';

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
  const usuario = useAuthStore((s) => s.usuario);
  const [dados, setDados] = useState<NotificacaoItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoManual, setEnviandoManual] = useState(false);
  const [processandoFila, setProcessandoFila] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const podeGerenciarWhatsapp =
    usuario && HIERARQUIA_PERFIL[usuario.perfil] >= HIERARQUIA_PERFIL.GESTORA ? true : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnviarNotificacaoManualInput>({
    resolver: zodResolver(enviarNotificacaoManualSchema),
    defaultValues: { tipo: 'OUTRO' },
  });

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        setErro(null);
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

  useEffect(() => {
    async function carregarUsuarios(): Promise<void> {
      if (!podeGerenciarWhatsapp) return;
      try {
        const r = await apiClient.get<RespostaLista<UsuarioPublico>>('/users?status=ATIVO', token);
        setUsuarios(r.dados);
      } catch {
        // formulario continua funcional com telefone direto
      }
    }
    if (token) void carregarUsuarios();
  }, [token, podeGerenciarWhatsapp]);

  async function onSubmitManual(dadosForm: EnviarNotificacaoManualInput): Promise<void> {
    setEnviandoManual(true);
    setErro(null);
    setSucesso(null);
    try {
      const payload: EnviarNotificacaoManualInput = {
        ...dadosForm,
        usuarioId: dadosForm.usuarioId || undefined,
        telefoneDestino: dadosForm.telefoneDestino || undefined,
        agendadaPara: dadosForm.agendadaPara ? new Date(dadosForm.agendadaPara) : undefined,
      };
      await apiClient.post('/notificacoes/whatsapp/enviar-manual', payload, token);
      setSucesso('Notificacao colocada na fila com sucesso.');
      reset({ tipo: 'OUTRO', mensagem: '' });
      const r = await apiClient.get<{ dados: NotificacaoItem[] }>('/notificacoes/minhas', token);
      setDados(r.dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao enviar notificacao manual.');
    } finally {
      setEnviandoManual(false);
    }
  }

  async function processarFilaAgora(): Promise<void> {
    setProcessandoFila(true);
    setErro(null);
    setSucesso(null);
    try {
      await apiClient.post('/notificacoes/whatsapp/processar-fila', {}, token);
      setSucesso('Fila de notificacoes processada.');
      const r = await apiClient.get<{ dados: NotificacaoItem[] }>('/notificacoes/minhas', token);
      setDados(r.dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.mensagem : 'Falha ao processar fila.');
    } finally {
      setProcessandoFila(false);
    }
  }

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
      {sucesso && (
        <div className="rounded-md bg-institucional-green/10 text-institucional-green border border-institucional-green/30 px-4 py-3 text-sm">
          {sucesso}
        </div>
      )}

      {podeGerenciarWhatsapp && (
        <section className="cartao-institucional p-6 space-y-4">
          <h2 className="secao-titulo text-xl">Disparo manual de WhatsApp</h2>
          <form onSubmit={handleSubmit(onSubmitManual)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label-institucional">Colaborador (opcional)</label>
                <select className="select-institucional" {...register('usuarioId')}>
                  <option value="">Selecionar...</option>
                  {usuarios.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-institucional">Telefone destino (opcional)</label>
                <input className="input-institucional" {...register('telefoneDestino')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label-institucional">Tipo</label>
                <select className="select-institucional" {...register('tipo')}>
                  {TIPOS_NOTIFICACAO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-institucional">Agendar para (opcional)</label>
                <input type="datetime-local" className="input-institucional" {...register('agendadaPara')} />
              </div>
            </div>
            <div>
              <label className="label-institucional">Mensagem</label>
              <textarea className="textarea-institucional" rows={4} {...register('mensagem')} />
              {errors.usuarioId && (
                <p className="mt-1 text-xs text-institucional-red">{errors.usuarioId.message}</p>
              )}
              {errors.mensagem && (
                <p className="mt-1 text-xs text-institucional-red">{errors.mensagem.message}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={enviandoManual} className="btn-primario">
                {enviandoManual ? 'Enviando...' : 'Enviar manualmente'}
              </button>
              <button
                type="button"
                onClick={() => void processarFilaAgora()}
                disabled={processandoFila}
                className="btn-outline"
              >
                {processandoFila ? 'Processando...' : 'Processar fila agora'}
              </button>
            </div>
          </form>
        </section>
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
