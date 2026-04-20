import { z } from 'zod';
import { TIPOS_NOTIFICACAO } from '@rb/constants';

export const tipoNotificacaoSchema = z.enum(TIPOS_NOTIFICACAO);

export const enviarNotificacaoManualSchema = z.object({
  usuarioId: z.string().uuid().optional(),
  telefoneDestino: z.string().min(10).max(20).optional(),
  tipo: tipoNotificacaoSchema,
  mensagem: z.string().min(1).max(4096),
  agendadaPara: z.coerce.date().optional(),
}).refine((d) => d.usuarioId || d.telefoneDestino, {
  message: 'Informe usuarioId ou telefoneDestino.',
  path: ['usuarioId'],
});
export type EnviarNotificacaoManualInput = z.infer<typeof enviarNotificacaoManualSchema>;
