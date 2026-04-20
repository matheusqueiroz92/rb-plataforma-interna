import type { Perfil } from '@prisma/client';
import type {
  AtualizarItemChecklistInput,
  CriarItemChecklistInput,
  ResponderChecklistInput,
} from '@rb/validators';
import { dataHojeBahia } from '@rb/utils';

import { ErroNaoEncontrado } from '../../shared/errors/app-error.js';
import type { IChecklistRepository } from './checklist.repository.js';

export class ChecklistService {
  constructor(private readonly repo: IChecklistRepository) {}

  listar(perfil?: Perfil) {
    return this.repo.listarItens(perfil);
  }

  criar(input: CriarItemChecklistInput, criadoPorId: string) {
    return this.repo.criarItem({
      categoria: input.categoria,
      perfilAlvo: input.perfilAlvo,
      texto: input.texto,
      obrigatorio: input.obrigatorio,
      aplicaRemoto: input.aplicaRemoto,
      aplicaPresencial: input.aplicaPresencial,
      ordem: input.ordem,
      ativo: input.ativo,
      criadoPorId,
    });
  }

  async atualizar(id: string, input: AtualizarItemChecklistInput) {
    const existe = await this.repo.buscarItem(id);
    if (!existe) throw new ErroNaoEncontrado('Item do checklist');
    return this.repo.atualizarItem(id, input as never);
  }

  async inativar(id: string) {
    const existe = await this.repo.buscarItem(id);
    if (!existe) throw new ErroNaoEncontrado('Item do checklist');
    return this.repo.inativarItem(id);
  }

  responder(usuarioId: string, input: ResponderChecklistInput) {
    return this.repo.upsertResposta(
      usuarioId,
      input.itemId,
      dataHojeBahia(),
      input.concluido,
      input.melhoriaSugerida,
    );
  }

  async progressoHoje(usuarioId: string, perfil: Perfil) {
    const hoje = dataHojeBahia();
    const [itens, respostas] = await Promise.all([
      this.repo.listarItens(perfil),
      this.repo.respostasDoDia(usuarioId, hoje),
    ]);

    const mapa = new Map(respostas.map((r) => [r.itemId, r]));
    const combinado = itens.map((item) => {
      const r = mapa.get(item.id);
      return {
        id: item.id,
        categoria: item.categoria,
        perfilAlvo: item.perfilAlvo,
        texto: item.texto,
        obrigatorio: item.obrigatorio,
        ordem: item.ordem,
        concluido: r?.concluido ?? false,
        concluidoEm: r?.concluidoEm ?? null,
        melhoriaSugerida: r?.melhoriaSugerida ?? null,
      };
    });

    const total = combinado.length;
    const concluidos = combinado.filter((c) => c.concluido).length;
    return {
      data: hoje.toISOString().substring(0, 10),
      totalItens: total,
      totalConcluido: concluidos,
      percentual: total === 0 ? 0 : Math.round((concluidos / total) * 100),
      itens: combinado,
    };
  }

  async progressoEquipe() {
    const hoje = dataHojeBahia();
    const usuarios = await this.repo.listarUsuariosAtivos();
    if (usuarios.length === 0) return [];

    const ids = usuarios.map((u) => u.id);
    const [respostas, itens] = await Promise.all([
      this.repo.respostasPorData(hoje, ids),
      this.repo.listarItensAtivos(),
    ]);

    return usuarios.map((u) => {
      const aplicaveis = itens.filter(
        (i) => i.perfilAlvo === 'TODOS' || i.perfilAlvo === u.perfil,
      );
      const proprios = respostas.filter((r) => r.usuarioId === u.id);
      const concluidos = proprios.filter((r) => r.concluido).length;
      const total = aplicaveis.length;
      return {
        usuario: u,
        total,
        concluidos,
        percentual: total === 0 ? 0 : Math.round((concluidos / total) * 100),
      };
    });
  }
}
