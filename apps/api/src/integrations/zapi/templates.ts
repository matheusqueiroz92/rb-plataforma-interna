// Templates de mensagens WhatsApp da Plataforma Interna.
// Editaveis sem alterar logica de codigo. Use {{variavel}} como placeholder.

export interface TemplateContexto {
  nome?: string;
  titulo?: string;
  prazo?: string;
  nota?: number;
  posicao?: number;
  semana?: string;
  feedbackCorretor?: string;
  [chave: string]: unknown;
}

export const TEMPLATES_WHATSAPP = {
  LEMBRETE_PONTO: `Bom dia, {{nome}}! Lembrete do escritorio Reboucas e Bulhoes: voce ainda nao registrou o ponto de entrada hoje. Acesse a plataforma interna para registrar.`,
  ALERTA_PRAZO: `Atencao, {{nome}}. A demanda "{{titulo}}" vence em {{prazo}}. Acesse a plataforma para consultar os detalhes.`,
  DEMANDA_ATRIBUIDA: `{{nome}}, uma nova demanda foi atribuida a voce: "{{titulo}}". Prioridade: {{prioridade}}. Acesse a plataforma.`,
  DEMANDA_CORRIGIDA: `{{nome}}, sua demanda "{{titulo}}" foi corrigida (nota {{nota}}). Feedback: {{feedbackCorretor}}`,
  AUSENCIA_PONTO: `Gestora, o(a) estagiario(a) {{nome}} nao bateu o ponto de entrada ate as 09:00.`,
  CERTIFICADO: `Parabens, {{nome}}! Voce recebeu um certificado {{tipoCertificado}} da semana {{semana}} (posicao {{posicao}}, {{pontos}} pontos). Baixe na plataforma.`,
  RELATORIO_RECEBIDO: `Gestora, {{nome}} enviou o relatorio diario.`,
  AUSENCIA_RELATORIO: `Gestora, {{nome}} ainda nao enviou o relatorio diario de hoje.`,
} as const;

export type ChaveTemplate = keyof typeof TEMPLATES_WHATSAPP;

export function renderizarTemplate(chave: ChaveTemplate, ctx: TemplateContexto): string {
  let texto: string = TEMPLATES_WHATSAPP[chave];
  for (const [k, v] of Object.entries(ctx)) {
    const valor = v === null || v === undefined ? '' : String(v);
    texto = texto.replaceAll(`{{${k}}}`, valor);
  }
  texto = texto.replace(/\{\{[^}]+\}\}/g, '');
  return texto.trim();
}
