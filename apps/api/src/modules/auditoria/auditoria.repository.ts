import { prisma } from '../../shared/prisma/prisma.js';

export interface FiltroAuditoria {
  entidade?: string;
  usuarioId?: string;
  de?: Date;
  ate?: Date;
  limite: number;
  pagina: number;
}

export interface IAuditoriaRepository {
  listar(filtro: FiltroAuditoria): Promise<{
    total: number;
    registros: Array<{
      id: bigint;
      acao: string;
      entidade: string;
      entidadeId: string | null;
      dadosAnteriores: unknown;
      dadosNovos: unknown;
      ip: string | null;
      userAgent: string | null;
      timestamp: Date;
      usuario: { id: string; nome: string; matricula: string; perfil: string } | null;
    }>;
  }>;
}

export class PrismaAuditoriaRepository implements IAuditoriaRepository {
  async listar(filtro: FiltroAuditoria) {
    const where = {
      entidade: filtro.entidade,
      usuarioId: filtro.usuarioId,
      timestamp: { gte: filtro.de, lte: filtro.ate },
    };

    const [total, registros] = await prisma.$transaction([
      prisma.auditoriaLog.count({ where }),
      prisma.auditoriaLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filtro.limite,
        skip: (filtro.pagina - 1) * filtro.limite,
        include: {
          usuario: { select: { id: true, nome: true, matricula: true, perfil: true } },
        },
      }),
    ]);

    return { total, registros };
  }
}
