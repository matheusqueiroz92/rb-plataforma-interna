import { z } from 'zod';
import { TIPOS_PONTO, REGIMES_PONTO, PONTO_JUSTIFICATIVA_MIN } from '@rb/constants';

export const tipoPontoSchema = z.enum(TIPOS_PONTO);
export const regimePontoSchema = z.enum(REGIMES_PONTO);

export const registrarPontoSchema = z.object({
  tipo: tipoPontoSchema,
  regime: regimePontoSchema,
  timestampCliente: z.coerce.date().optional(),
  fotoBase64: z
    .string()
    .min(100, 'Fotografia obrigatoria para registro do ponto.')
    .refine((v) => v.startsWith('data:image/'), 'Formato de foto invalido.'),
  dispositivo: z.string().max(50).optional(),
  observacao: z.string().max(500).optional(),
});
export type RegistrarPontoInput = z.infer<typeof registrarPontoSchema>;

export const editarPontoSchema = z.object({
  timestampServidor: z.coerce.date().optional(),
  tipo: tipoPontoSchema.optional(),
  regime: regimePontoSchema.optional(),
  justificativaEdicao: z
    .string()
    .min(PONTO_JUSTIFICATIVA_MIN, `Justificativa deve ter ao menos ${PONTO_JUSTIFICATIVA_MIN} caracteres.`),
});
export type EditarPontoInput = z.infer<typeof editarPontoSchema>;

export const filtroHistoricoSchema = z.object({
  de: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
});
export type FiltroHistoricoInput = z.infer<typeof filtroHistoricoSchema>;
