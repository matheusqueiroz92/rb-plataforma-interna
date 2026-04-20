import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  AtualizarStatusInput,
  CorrigirDemandaInput,
  CriarDemandaInput,
  DelegarDemandaInput,
  FiltroDemandasInput,
} from '@rb/validators';
import { ACAO_AUDITORIA } from '@rb/constants';

import { ErroAutenticacao } from '../../shared/errors/app-error.js';
import type { DemandasService } from './demandas.service.js';

export class DemandasController {
  constructor(private readonly service: DemandasService) {}

  criar = async (
    req: FastifyRequest<{ Body: CriarDemandaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const criada = await this.service.criar(req.body, req.user);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.CRIAR_DEMANDA,
      entidade: 'Demanda',
      entidadeId: criada.id,
      dadosNovos: { titulo: criada.titulo, atribuidaA: criada.atribuidaAId },
    });
    reply.code(201).send(criada);
  };

  minhas = async (
    req: FastifyRequest<{ Querystring: FiltroDemandasInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const dados = await this.service.listarMinhas(req.user.id, req.query);
    reply.send({ total: dados.length, dados });
  };

  equipe = async (
    req: FastifyRequest<{ Querystring: FiltroDemandasInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.listarEquipe(req.query);
    reply.send({ total: dados.length, dados });
  };

  obter = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const d = await this.service.obter(req.params.id);
    reply.send(d);
  };

  atualizarStatus = async (
    req: FastifyRequest<{ Params: { id: string }; Body: AtualizarStatusInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const atualizada = await this.service.atualizarStatus(req.params.id, req.body, req.user);
    reply.send(atualizada);
  };

  delegar = async (
    req: FastifyRequest<{ Params: { id: string }; Body: DelegarDemandaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const delegada = await this.service.delegar(req.params.id, req.body, req.user);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.DELEGAR_DEMANDA,
      entidade: 'Demanda',
      entidadeId: delegada.id,
      dadosNovos: { novoAtribuido: delegada.atribuidaAId, motivo: req.body.motivoDelegacao },
    });
    reply.send(delegada);
  };

  corrigir = async (
    req: FastifyRequest<{ Params: { id: string }; Body: CorrigirDemandaInput }>,
    reply: FastifyReply,
  ): Promise<void> => {
    if (!req.user) throw new ErroAutenticacao();
    const anterior = await this.service.obter(req.params.id);
    const corrigida = await this.service.corrigir(req.params.id, req.body, req.user);
    await req.server.registrarAuditoria({
      req,
      acao: ACAO_AUDITORIA.CORRIGIR_DEMANDA,
      entidade: 'Demanda',
      entidadeId: corrigida.id,
      dadosAnteriores: { status: anterior.status },
      dadosNovos: { nota: corrigida.notaCorrecao, status: corrigida.status },
    });
    reply.send(corrigida);
  };

  semana = async (
    req: FastifyRequest<{ Params: { semana: string } }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const dados = await this.service.listarDaSemana(req.params.semana);
    reply.send({ total: dados.length, dados });
  };
}
