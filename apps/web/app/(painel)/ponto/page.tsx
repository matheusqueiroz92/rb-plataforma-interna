'use client';

import { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Info } from 'lucide-react';
import { ROTULOS_TIPO_PONTO, formatarHoraBR } from '@rb/utils';
import type { EstadoPontoHoje } from '@rb/types';
import type { RegimePonto, TipoPonto } from '@rb/constants';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { CapturaFoto } from '@/components/ponto/captura-foto';

const TIPOS_ORDEM: TipoPonto[] = ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL'];

export default function PaginaPonto() {
  const token = useAuthStore((s) => s.accessToken);
  const [estado, setEstado] = useState<EstadoPontoHoje | null>(null);
  const [regime, setRegime] = useState<RegimePonto>('PRESENCIAL');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function recarregar(): Promise<void> {
    try {
      const dados = await apiClient.get<EstadoPontoHoje>('/ponto/hoje', token);
      setEstado(dados);
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    }
  }

  useEffect(() => {
    if (token) void recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function registrar(): Promise<void> {
    if (!foto || !estado?.proximoEsperado) return;
    setEnviando(true);
    setMensagem(null);
    try {
      await apiClient.post(
        '/ponto/registrar',
        {
          tipo: estado.proximoEsperado,
          regime,
          fotoBase64: foto,
          timestampCliente: new Date().toISOString(),
          dispositivo: navigator.userAgent.slice(0, 50),
        },
        token,
      );
      setFoto(null);
      await recarregar();
      setMensagem({ tipo: 'ok', texto: 'Ponto registrado com sucesso.' });
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="animate-rise space-y-8">
      <section>
        <h1 className="secao-titulo">Ponto Digital</h1>
        <p className="text-gray-500 mt-2 pl-4 flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-institucional-green" />
          Registros com fotografia, IP e horario do servidor. Edicao restrita a gestora.
        </p>
      </section>

      {mensagem && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            mensagem.tipo === 'ok'
              ? 'bg-institucional-green/10 text-institucional-green border border-institucional-green/30'
              : 'bg-institucional-red/10 text-institucional-red border border-institucional-red/30'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <section className="cartao-institucional p-6">
        <h2 className="font-serif text-xl text-navy-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold-500" /> Registros de hoje
        </h2>
        <ul className="divide-y divide-gray-100">
          {TIPOS_ORDEM.map((tipo) => {
            const registro = estado?.pontos.find((p) => p.tipo === tipo);
            return (
              <li key={tipo} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-navy-900">{ROTULOS_TIPO_PONTO[tipo]}</div>
                  {registro ? (
                    <div className="text-xs text-gray-500">
                      Regime: {registro.regime === 'PRESENCIAL' ? 'Presencial' : 'Home office'}
                      {registro.editado && ' | Editado pela gestora'}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Aguardando registro</div>
                  )}
                </div>
                <div>
                  {registro ? (
                    <span className="badge badge-ok font-mono">
                      {formatarHoraBR(registro.timestampServidor)}
                    </span>
                  ) : estado?.proximoEsperado === tipo ? (
                    <span className="badge badge-alerta">Proximo</span>
                  ) : (
                    <span className="badge badge-pendente">Pendente</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {estado?.concluido ? (
        <section className="cartao-institucional p-6 text-center">
          <ShieldCheck className="h-10 w-10 text-institucional-green mx-auto" />
          <p className="mt-3 font-serif text-xl text-navy-900">Jornada concluida</p>
          <p className="text-sm text-gray-500 mt-1">Todos os pontos do dia foram registrados.</p>
        </section>
      ) : estado?.proximoEsperado ? (
        <section className="cartao-institucional p-6 space-y-5">
          <h2 className="font-serif text-xl text-navy-900">
            Registrar: {ROTULOS_TIPO_PONTO[estado.proximoEsperado]}
          </h2>
          {estado.proximoEsperado === 'SAIDA_FINAL' && (
            <div className="rounded-md bg-institucional-amber/10 border border-institucional-amber/30 px-4 py-3 text-sm text-institucional-amber flex gap-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Para a saida final, envie antes o relatorio diario obrigatorio.</span>
            </div>
          )}

          <div>
            <label className="label-institucional">Regime</label>
            <div className="flex gap-3">
              {(['PRESENCIAL', 'HOME_OFFICE'] as RegimePonto[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegime(r)}
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm transition-all ${
                    regime === r
                      ? 'border-gold-500 bg-gold-300/40 text-navy-900 font-semibold'
                      : 'border-gray-100 text-gray-500 hover:border-gold-400'
                  }`}
                >
                  {r === 'PRESENCIAL' ? 'Presencial' : 'Home office'}
                </button>
              ))}
            </div>
          </div>

          <CapturaFoto onCaptura={(d) => setFoto(d || null)} fotoAtual={foto} />

          <button onClick={registrar} disabled={!foto || enviando} className="btn-primario w-full">
            {enviando ? 'Registrando...' : 'Confirmar registro'}
          </button>
        </section>
      ) : (
        <section className="cartao-institucional p-6 text-center text-gray-500">
          Carregando estado do ponto...
        </section>
      )}
    </div>
  );
}
