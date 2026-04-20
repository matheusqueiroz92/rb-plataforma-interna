export const FUSO_HORARIO = 'America/Bahia' as const;

// ============================================================================
// Perfis e hierarquia
// ============================================================================
export const PERFIS = ['SOCIO', 'GESTORA', 'ASSESSORA_JR', 'ESTAGIARIO'] as const;
export type Perfil = (typeof PERFIS)[number];

export const HIERARQUIA_PERFIL: Record<Perfil, number> = {
  SOCIO: 4,
  GESTORA: 3,
  ASSESSORA_JR: 2,
  ESTAGIARIO: 1,
};

export const STATUS_USUARIO = ['ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO'] as const;
export type StatusUsuario = (typeof STATUS_USUARIO)[number];

// ============================================================================
// Ponto digital
// ============================================================================
export const TIPOS_PONTO = [
  'ENTRADA',
  'SAIDA_ALMOCO',
  'RETORNO_ALMOCO',
  'SAIDA_FINAL',
] as const;
export type TipoPonto = (typeof TIPOS_PONTO)[number];

export const SEQUENCIA_PONTO_OBRIGATORIA: readonly TipoPonto[] = TIPOS_PONTO;

export const REGIMES_PONTO = ['PRESENCIAL', 'HOME_OFFICE'] as const;
export type RegimePonto = (typeof REGIMES_PONTO)[number];

export const PONTO_FOTO_MAX_BYTES = 200 * 1024;
export const PONTO_JUSTIFICATIVA_MIN = 30;

// ============================================================================
// Relatorio diario
// ============================================================================
export const RELATORIO_MIN_CARACTERES = {
  atividades: 100,
  dificuldades: 50,
  justificativa: 50,
} as const;

export const TIPOS_ATESTADO = ['MEDICO', 'FACULDADE', 'OUTRO'] as const;
export type TipoAtestado = (typeof TIPOS_ATESTADO)[number];

// ============================================================================
// Demandas
// ============================================================================
export const PRIORIDADES_DEMANDA = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const;
export type PrioridadeDemanda = (typeof PRIORIDADES_DEMANDA)[number];

export const STATUS_DEMANDA = [
  'PENDENTE',
  'ANDAMENTO',
  'ENTREGUE',
  'EM_CORRECAO',
  'CONCLUIDA',
  'VENCIDA',
] as const;
export type StatusDemanda = (typeof STATUS_DEMANDA)[number];

export const TIPOS_DEMANDA = [
  'JURIDICA',
  'ADMINISTRATIVA',
  'PESQUISA',
  'ATENDIMENTO',
  'OUTRO',
] as const;
export type TipoDemanda = (typeof TIPOS_DEMANDA)[number];

export const NOTAS_CORRECAO = [0, 8, 10] as const;
export type NotaCorrecao = (typeof NOTAS_CORRECAO)[number];

// ============================================================================
// Checklist 5S
// ============================================================================
export const CATEGORIAS_CHECKLIST = [
  'S1_SEIRI',
  'S2_SEITON',
  'S3_SEISO',
  'S4_SEIKETSU',
  'S5_SHITSUKE',
  'ROTINA_INICIO',
  'ROTINA_JURIDICA',
  'ROTINA_ADMIN',
  'ENCERRAMENTO',
] as const;
export type CategoriaChecklist = (typeof CATEGORIAS_CHECKLIST)[number];

export const PERFIS_CHECKLIST = ['TODOS', 'ESTAGIARIO', 'ASSESSORA_JR'] as const;
export type PerfilChecklist = (typeof PERFIS_CHECKLIST)[number];

// ============================================================================
// Certificados e notificacoes
// ============================================================================
export const TIPOS_CERTIFICADO = ['SEMANAL', 'MENSAL', 'ANUAL', 'DESTAQUE'] as const;
export type TipoCertificado = (typeof TIPOS_CERTIFICADO)[number];

export const TIPOS_NOTIFICACAO = [
  'LEMBRETE_PONTO',
  'ALERTA_PRAZO',
  'DEMANDA_ATRIBUIDA',
  'DEMANDA_CORRIGIDA',
  'AUSENCIA_PONTO',
  'CERTIFICADO',
  'RELATORIO_RECEBIDO',
  'AUSENCIA_RELATORIO',
  'OUTRO',
] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

// ============================================================================
// Pontuacao semanal
// ============================================================================
export const PONTOS_MAXIMOS_SEMANA = {
  pontualidade: 25,
  qualidade: 40,
  extras: 15,
  checklist: 10,
  relatorios: 10,
} as const;

export const PONTOS_MAXIMOS_TOTAL = 100;

// ============================================================================
// Senha
// ============================================================================
export const SENHA_MIN_CARACTERES = 8;
export const SENHA_DIAS_EXPIRACAO = 90;
export const SENHA_HISTORICO_BLOQUEADO = 5;

// ============================================================================
// Upload
// ============================================================================
export const UPLOAD_MIMES_ATESTADO = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

// ============================================================================
// Acoes de auditoria
// ============================================================================
export const ACAO_AUDITORIA = {
  LOGIN: 'LOGIN',
  LOGIN_FALHA: 'LOGIN_FALHA',
  LOGOUT: 'LOGOUT',
  CRIAR_USUARIO: 'CRIAR_USUARIO',
  EDITAR_USUARIO: 'EDITAR_USUARIO',
  REMOVER_USUARIO: 'REMOVER_USUARIO',
  REDEFINIR_SENHA: 'REDEFINIR_SENHA',
  ACEITAR_POP: 'ACEITAR_POP',
  REGISTRAR_PONTO: 'REGISTRAR_PONTO',
  EDITAR_PONTO: 'EDITAR_PONTO',
  ENVIAR_RELATORIO: 'ENVIAR_RELATORIO',
  CRIAR_DEMANDA: 'CRIAR_DEMANDA',
  DELEGAR_DEMANDA: 'DELEGAR_DEMANDA',
  CORRIGIR_DEMANDA: 'CORRIGIR_DEMANDA',
  EMITIR_CERTIFICADO: 'EMITIR_CERTIFICADO',
  CRIAR_CHECKLIST_ITEM: 'CRIAR_CHECKLIST_ITEM',
  ATUALIZAR_CHECKLIST_ITEM: 'ATUALIZAR_CHECKLIST_ITEM',
  INATIVAR_CHECKLIST_ITEM: 'INATIVAR_CHECKLIST_ITEM',
} as const;

export type AcaoAuditoria = (typeof ACAO_AUDITORIA)[keyof typeof ACAO_AUDITORIA];

// ============================================================================
// Helpers hierarquia
// ============================================================================
export function podeDelegarPara(delegador: Perfil, destino: Perfil): boolean {
  return HIERARQUIA_PERFIL[delegador] > HIERARQUIA_PERFIL[destino];
}

export function nivelPerfil(perfil: Perfil): number {
  return HIERARQUIA_PERFIL[perfil];
}
