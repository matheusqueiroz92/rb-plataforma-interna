import { z } from 'zod';
import { RELATORIO_MIN_CARACTERES, TIPOS_ATESTADO } from '@rb/constants';

export const tipoAtestadoSchema = z.enum(TIPOS_ATESTADO);

export const enviarRelatorioSchema = z
  .object({
    pergunta1Atividades: z.string().min(
      RELATORIO_MIN_CARACTERES.atividades,
      `Descreva as atividades com ao menos ${RELATORIO_MIN_CARACTERES.atividades} caracteres.`,
    ),
    pergunta2Dificuldades: z.string().min(
      RELATORIO_MIN_CARACTERES.dificuldades,
      `Descreva as dificuldades com ao menos ${RELATORIO_MIN_CARACTERES.dificuldades} caracteres.`,
    ),
    pergunta3DemandaConcluida: z.boolean(),
    pergunta3Justificativa: z.string().optional(),
    atestadoAnexoUrl: z.string().url().max(500).optional(),
    atestadoTipo: tipoAtestadoSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      !data.pergunta3DemandaConcluida &&
      (!data.pergunta3Justificativa ||
        data.pergunta3Justificativa.length < RELATORIO_MIN_CARACTERES.justificativa)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pergunta3Justificativa'],
        message: `Justifique com ao menos ${RELATORIO_MIN_CARACTERES.justificativa} caracteres.`,
      });
    }
    if (data.atestadoAnexoUrl && !data.atestadoTipo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['atestadoTipo'],
        message: 'Informe o tipo do atestado anexado.',
      });
    }
  });
export type EnviarRelatorioInput = z.infer<typeof enviarRelatorioSchema>;
