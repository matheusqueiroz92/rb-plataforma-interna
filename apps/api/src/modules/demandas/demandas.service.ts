import type { Perfil } from '@prisma/client';
import type {
  AtualizarStatusInput,
  CorrigirDemandaInput,
  CriarDemandaInput,
  DelegarDemandaInput,
  FiltroDemandasInput,
} from '@rb/validators';
import { semanaReferencia } from '@rb/utils';

import {
  ErroAutorizacao,
  ErroNaoEncontrado,
  ErroValidacao,
} from '../../shared/errors/app-error.js';
import { prisma } from '../../shared/prisma/prisma.js';
import { RegrasDelegacao, statusAposCorrecao } from './demandas.domain.js';
import type { IDemandasRepository } from './demandas.repository.js';

interface ContextoAutor {
  id: string;
  perfil: Perfil;
}

export class DemandasService {
  constructor(private readonly repo: IDemandasRepository) {}

  async criar(input: CriarDemandaInput, autor: ContextoAutor) {
    const destino = await prisma.usuario.findUnique({
      where: { id: input.atribuidaAId },
      select: { id: true, perfil: true, status: true },
    });
    if (!destino) throw new ErroNaoEncontrado('Usuario destinatario');
    if (destino.status !== 'ATIVO') throw new ErroValidacao('Destinatario inativo.');

    if (!RegrasDelegacao.podeCriarPara(autor.perfil, destino.perfil)) {
      throw new ErroAutorizacao(
        `Perfil ${autor.perfil} nao pode atribuir demandas a ${destino.perfil}.`,
      );
    }

    return this.repo.criar({
      titulo: input.titulo,
      descricao: input.descricao,
      criadaPorId: autor.id,
      atribuidaAId: input.atribuidaAId,
      tipo: input.tipo,
      prioridade: input.prioridade,
      processoCnj: input.processoCnj,
      clienteVinculado: input.clienteVinculado,
      prazoFatal: input.prazoFatal,
      tempoEstimadoMinutos: input.tempoEstimadoMinutos,
      semanaReferencia: input.semanaReferencia ?? semanaReferencia(),
    });
  }

  async obter(id: string) {
    const d = await this.repo.buscarPorId(id);
    if (!d) throw new ErroNaoEncontrado('Demanda');
    return d;
  }

  listarMinhas(usuarioId: string, filtro: FiltroDemandasInput = {}) {
    return this.repo.listar({ ...filtro, atribuidaA: usuarioId });
  }

  listarEquipe(filtro: FiltroDemandasInput = {}) {
    return this.repo.listar(filtro);
  }

  async atualizarStatus(id: string, input: AtualizarStatusInput, autor: ContextoAutor) {
    const demanda = await this.obter(id);
    if (demanda.atribuidaAId !== autor.id && autor.perfil === 'ESTAGIARIO') {
      throw new ErroAutorizacao('Voce so pode atualizar demandas atribuidas a voce.');
    }
    const dataEntrega = input.status === 'ENTREGUE' ? new Date() : undefined;
    return this.repo.atualizarStatus(id, input.status, input.tempoRealMinutos, dataEntrega);
  }

  async delegar(id: string, input: DelegarDemandaInput, autor: ContextoAutor) {
    const demanda = await this.obter(id);
    const destino = await prisma.usuario.findUnique({
      where: { id: input.novoAtribuidoId },
      select: { id: true, perfil: true, status: true },
    });
    if (!destino) throw new ErroNaoEncontrado('Novo atribuido');
    if (destino.status !== 'ATIVO') throw new ErroValidacao('Destinatario inativo.');

    const regra = RegrasDelegacao.validar(autor.perfil, destino.perfil);
    if (!regra.valida) throw new ErroAutorizacao(regra.motivo ?? 'Delegacao nao permitida.');

    if (demanda.atribuidaAId !== autor.id && autor.perfil !== 'SOCIO' && autor.perfil !== 'GESTORA') {
      throw new ErroAutorizacao('Somente quem possui a demanda ou niveis superiores podem delegar.');
    }

    return this.repo.delegar(id, input.novoAtribuidoId, autor.id);
  }

  async corrigir(id: string, input: CorrigirDemandaInput, corretor: ContextoAutor) {
    if (!RegrasDelegacao.podeCorrigir(corretor.perfil)) {
      throw new ErroAutorizacao('Estagiario nao pode corrigir demandas.');
    }
    const demanda = await this.obter(id);
    if (demanda.status !== 'ENTREGUE' && demanda.status !== 'EM_CORRECAO') {
      throw new ErroValidacao('Somente demandas entregues ou em correcao podem ser avaliadas.');
    }
    const novoStatus = statusAposCorrecao(input.nota);
    return this.repo.corrigir(id, corretor.id, input.nota, input.feedback, novoStatus);
  }

  listarDaSemana(semana: string) {
    return this.repo.listarDaSemana(semana);
  }
}
