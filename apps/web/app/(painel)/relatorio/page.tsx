'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, CheckCircle2 } from 'lucide-react';
import { RELATORIO_MIN_CARACTERES } from '@rb/constants';
import { formatarDataHoraBR } from '@rb/utils';

import { apiClient, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const schema = z
  .object({
    pergunta1Atividades: z.string().min(
      RELATORIO_MIN_CARACTERES.atividades,
      `Descreva com ao menos ${RELATORIO_MIN_CARACTERES.atividades} caracteres.`,
    ),
    pergunta2Dificuldades: z.string().min(
      RELATORIO_MIN_CARACTERES.dificuldades,
      `Descreva com ao menos ${RELATORIO_MIN_CARACTERES.dificuldades} caracteres.`,
    ),
    pergunta3DemandaConcluida: z.enum(['sim', 'nao']),
    pergunta3Justificativa: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (
      d.pergunta3DemandaConcluida === 'nao' &&
      (!d.pergunta3Justificativa || d.pergunta3Justificativa.length < RELATORIO_MIN_CARACTERES.justificativa)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pergunta3Justificativa'],
        message: `Justifique com ao menos ${RELATORIO_MIN_CARACTERES.justificativa} caracteres.`,
      });
    }
  });

type Form = z.infer<typeof schema>;

interface RelatorioExistente {
  id: string;
  data: string;
  enviadoEm: string;
  pergunta1Atividades: string;
  pergunta2Dificuldades: string;
  pergunta3DemandaConcluida: boolean;
  pergunta3Justificativa: string | null;
}

export default function PaginaRelatorio() {
  const token = useAuthStore((s) => s.accessToken);
  const [existente, setExistente] = useState<RelatorioExistente | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { pergunta3DemandaConcluida: 'sim' },
  });

  const concluida = watch('pergunta3DemandaConcluida');

  useEffect(() => {
    async function carregar(): Promise<void> {
      try {
        const dado = await apiClient.get<RelatorioExistente | null>('/relatorios/hoje', token);
        setExistente(dado);
      } catch {
        // sem relatorio hoje
      }
    }
    if (token) void carregar();
  }, [token]);

  async function onSubmit(dados: Form): Promise<void> {
    setEnviando(true);
    setMensagem(null);
    try {
      await apiClient.post(
        '/relatorios/enviar',
        {
          pergunta1Atividades: dados.pergunta1Atividades,
          pergunta2Dificuldades: dados.pergunta2Dificuldades,
          pergunta3DemandaConcluida: dados.pergunta3DemandaConcluida === 'sim',
          pergunta3Justificativa:
            dados.pergunta3DemandaConcluida === 'nao' ? dados.pergunta3Justificativa : undefined,
        },
        token,
      );
      setMensagem({ tipo: 'ok', texto: 'Relatorio enviado. Voce ja pode registrar a saida final.' });
      const recarregado = await apiClient.get<RelatorioExistente | null>('/relatorios/hoje', token);
      setExistente(recarregado);
    } catch (e) {
      if (e instanceof ApiError) setMensagem({ tipo: 'erro', texto: e.mensagem });
    } finally {
      setEnviando(false);
    }
  }

  if (existente) {
    return (
      <div className="animate-rise space-y-6">
        <h1 className="secao-titulo">Relatorio Diario</h1>
        <section className="cartao-institucional p-6">
          <div className="flex items-center gap-2 text-institucional-green">
            <CheckCircle2 className="h-5 w-5" />
            <span className="badge badge-ok">Enviado</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Relatorio do dia registrado em {formatarDataHoraBR(existente.enviadoEm)}.
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <div className="label-institucional">Atividades do dia</div>
              <p className="text-gray-900 whitespace-pre-wrap">{existente.pergunta1Atividades}</p>
            </div>
            <div>
              <div className="label-institucional">Dificuldades</div>
              <p className="text-gray-900 whitespace-pre-wrap">{existente.pergunta2Dificuldades}</p>
            </div>
            <div>
              <div className="label-institucional">Demanda concluida</div>
              <p className="text-gray-900">
                {existente.pergunta3DemandaConcluida ? 'Sim' : 'Nao'}
                {existente.pergunta3Justificativa && ` | ${existente.pergunta3Justificativa}`}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <section>
        <h1 className="secao-titulo flex items-center gap-2">
          <FileText className="h-6 w-6 text-gold-500" /> Relatorio Diario
        </h1>
        <p className="text-sm text-gray-500 mt-2 pl-4">
          Envio obrigatorio antes do registro da saida final.
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

      <form onSubmit={handleSubmit(onSubmit)} className="cartao-institucional p-6 space-y-6">
        <div>
          <label className="label-institucional">O que voce fez hoje?</label>
          <textarea
            className="textarea-institucional"
            placeholder={`Descreva as atividades realizadas (minimo ${RELATORIO_MIN_CARACTERES.atividades} caracteres).`}
            rows={5}
            {...register('pergunta1Atividades')}
          />
          {errors.pergunta1Atividades && (
            <p className="mt-1 text-xs text-institucional-red">{errors.pergunta1Atividades.message}</p>
          )}
        </div>

        <div>
          <label className="label-institucional">Onde sentiu mais dificuldade?</label>
          <textarea
            className="textarea-institucional"
            rows={4}
            placeholder={`Pontos em que precisou de apoio (minimo ${RELATORIO_MIN_CARACTERES.dificuldades} caracteres).`}
            {...register('pergunta2Dificuldades')}
          />
          {errors.pergunta2Dificuldades && (
            <p className="mt-1 text-xs text-institucional-red">{errors.pergunta2Dificuldades.message}</p>
          )}
        </div>

        <div>
          <label className="label-institucional">Terminou a demanda atribuida?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="sim" {...register('pergunta3DemandaConcluida')} /> Sim
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="nao" {...register('pergunta3DemandaConcluida')} /> Nao
            </label>
          </div>
        </div>

        {concluida === 'nao' && (
          <div>
            <label className="label-institucional">Justificativa</label>
            <textarea
              className="textarea-institucional"
              rows={3}
              placeholder={`Explique o motivo (minimo ${RELATORIO_MIN_CARACTERES.justificativa} caracteres).`}
              {...register('pergunta3Justificativa')}
            />
            {errors.pergunta3Justificativa && (
              <p className="mt-1 text-xs text-institucional-red">{errors.pergunta3Justificativa.message}</p>
            )}
          </div>
        )}

        <button type="submit" disabled={enviando} className="btn-primario w-full">
          {enviando ? 'Enviando...' : 'Enviar relatorio diario'}
        </button>
      </form>
    </div>
  );
}
