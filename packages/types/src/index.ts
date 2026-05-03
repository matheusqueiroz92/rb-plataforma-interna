import type {
  Perfil,
  StatusUsuario,
  TipoPonto,
  RegimePonto,
  TipoAtestado,
  PrioridadeDemanda,
  StatusDemanda,
  TipoDemanda,
  NotaCorrecao,
  CategoriaChecklist,
  PerfilChecklist,
  TipoCertificado,
  StatusPopDocumento,
} from '@rb/constants';

// ============================================================================
// Resposta generica
// ============================================================================
export interface RespostaLista<T> {
  total: number;
  dados: T[];
}

export interface RespostaPaginada<T> extends RespostaLista<T> {
  pagina: number;
  limite: number;
}

export interface RespostaErro {
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
}

// ============================================================================
// Usuario
// ============================================================================
export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  perfil: Perfil;
  status: StatusUsuario;
  instituicaoEnsino: string | null;
  periodoCurso: string | null;
  dataAdmissao: string | null;
  dataDesligamento: string | null;
  fotoUrl: string | null;
  telefoneWhatsapp: string | null;
  aceitePopEm: string | null;
  aceitePopVersao: string | null;
  aceitePopPerfil: Perfil | null;
  criadoEm: string;
  atualizadoEm: string;
}

// ============================================================================
// Sessao
// ============================================================================
export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  perfil: Perfil;
  aceitePopVersao: string | null;
  aceitePopPerfil: Perfil | null;
  precisaAceitarPop: boolean;
}

export interface PopDocumentoDTO {
  id: string;
  perfil: Perfil;
  titulo: string;
  conteudoMarkdown: string;
  versao: string;
  status: StatusPopDocumento;
  vigente: boolean;
  aprovadoEm: string | null;
  publicadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioSessao;
}

// ============================================================================
// Ponto
// ============================================================================
export interface PontoRegistro {
  id: string;
  tipo: TipoPonto;
  regime: RegimePonto;
  timestampServidor: string;
  editado: boolean;
  observacao?: string | null;
}

export interface EstadoPontoHoje {
  data: string;
  pontos: PontoRegistro[];
  proximoEsperado: TipoPonto | null;
  concluido: boolean;
}

// ============================================================================
// Relatorio diario
// ============================================================================
export interface RelatorioDiarioDTO {
  id: string;
  data: string;
  enviadoEm: string;
  pergunta1Atividades: string;
  pergunta2Dificuldades: string;
  pergunta3DemandaConcluida: boolean;
  pergunta3Justificativa: string | null;
  atestadoAnexoUrl: string | null;
  atestadoTipo: TipoAtestado | null;
}

// ============================================================================
// Checklist
// ============================================================================
export interface ChecklistItemDTO {
  id: string;
  categoria: CategoriaChecklist;
  perfilAlvo: PerfilChecklist;
  texto: string;
  obrigatorio: boolean;
  ordem: number;
}

export interface ChecklistItemProgresso extends ChecklistItemDTO {
  concluido: boolean;
  concluidoEm: string | null;
  melhoriaSugerida: string | null;
}

export interface ChecklistProgresso {
  data: string;
  totalItens: number;
  totalConcluido: number;
  percentual: number;
  itens: ChecklistItemProgresso[];
}

// ============================================================================
// Demanda
// ============================================================================
export interface DemandaDTO {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  criador: { id: string; nome: string; perfil: Perfil };
  atribuido: { id: string; nome: string; perfil: Perfil };
  delegador: { id: string; nome: string; perfil: Perfil } | null;
  prazoFatal: string | null;
  dataAtribuicao: string;
  dataEntrega: string | null;
  dataCorrecao: string | null;
  notaCorrecao: NotaCorrecao | null;
  feedbackCorretor: string | null;
  semanaReferencia: string | null;
  processoCnj: string | null;
  clienteVinculado: string | null;
  criadoEm: string;
}

// ============================================================================
// Produtividade
// ============================================================================
export interface PontuacaoSemanalDTO {
  usuarioId: string;
  usuarioNome: string;
  perfil: Perfil;
  semanaReferencia: string;
  pontualidade: number;
  qualidadeMedia: number;
  extras: number;
  checklist5s: number;
  relatorios: number;
  total: number;
  posicao: number | null;
}

// ============================================================================
// Certificado
// ============================================================================
export interface CertificadoDTO {
  id: string;
  tipo: TipoCertificado;
  periodoReferencia: string;
  pontuacaoObtida: number | null;
  posicaoFinal: number | null;
  emitidoEm: string;
  pdfUrl: string | null;
  numeroSequencial: string;
}
