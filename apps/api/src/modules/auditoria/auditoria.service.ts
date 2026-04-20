import type { FiltroAuditoria, IAuditoriaRepository } from './auditoria.repository.js';

export interface ListarAuditoriaInput {
  entidade?: string;
  usuarioId?: string;
  de?: Date;
  ate?: Date;
  limite?: number;
  pagina?: number;
}

export class AuditoriaService {
  constructor(private readonly repo: IAuditoriaRepository) {}

  async listar(input: ListarAuditoriaInput) {
    const filtro: FiltroAuditoria = {
      entidade: input.entidade,
      usuarioId: input.usuarioId,
      de: input.de,
      ate: input.ate,
      limite: Math.min(input.limite ?? 100, 500),
      pagina: Math.max(input.pagina ?? 1, 1),
    };
    const resultado = await this.repo.listar(filtro);
    return {
      total: resultado.total,
      pagina: filtro.pagina,
      limite: filtro.limite,
      dados: resultado.registros.map((r) => ({
        id: r.id.toString(),
        acao: r.acao,
        entidade: r.entidade,
        entidadeId: r.entidadeId,
        dadosAnteriores: r.dadosAnteriores,
        dadosNovos: r.dadosNovos,
        ip: r.ip,
        userAgent: r.userAgent,
        timestamp: r.timestamp,
        usuario: r.usuario,
      })),
    };
  }
}
