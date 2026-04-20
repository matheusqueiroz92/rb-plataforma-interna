import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST ?? '12', 10);

async function semearUsuarios(): Promise<void> {
  const usuarios = [
    {
      nome: 'Dr. Ricardo Bulhoes',
      email: process.env.SEED_SOCIO_EMAIL ?? 'ricardo.bulhoes@reboucasebulhoes.com.br',
      matricula: 'RB-0001',
      senha: process.env.SEED_SOCIO_SENHA ?? 'Trocar@Primeiro@Acesso1',
      perfil: 'SOCIO' as const,
    },
    {
      nome: 'Larissa',
      email: process.env.SEED_GESTORA_EMAIL ?? 'larissa@reboucasebulhoes.com.br',
      matricula: 'RB-0002',
      senha: process.env.SEED_GESTORA_SENHA ?? 'Trocar@Primeiro@Acesso1',
      perfil: 'GESTORA' as const,
    },
  ];

  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash(u.senha, BCRYPT_COST);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: {
        nome: u.nome,
        email: u.email.toLowerCase(),
        matricula: u.matricula,
        senhaHash,
        perfil: u.perfil,
        status: 'ATIVO',
      },
    });
  }
}

async function semearChecklist(): Promise<void> {
  const itens = [
    { categoria: 'S1_SEIRI' as const, perfilAlvo: 'TODOS' as const, texto: 'Descartei documentos, rascunhos e arquivos digitais que nao serao mais utilizados.', ordem: 1 },
    { categoria: 'S1_SEIRI' as const, perfilAlvo: 'TODOS' as const, texto: 'Identifiquei e separei itens que nao pertencem a minha rotina imediata.', ordem: 2 },
    { categoria: 'S1_SEIRI' as const, perfilAlvo: 'ESTAGIARIO' as const, texto: 'Revisei a caixa de entrada de e-mail e arquivei o que ja foi tratado.', ordem: 3 },
    { categoria: 'S2_SEITON' as const, perfilAlvo: 'TODOS' as const, texto: 'Organizei os processos fisicos em ordem de prazo e prioridade.', ordem: 1 },
    { categoria: 'S2_SEITON' as const, perfilAlvo: 'TODOS' as const, texto: 'Organizei pastas digitais seguindo o padrao institucional (cliente/materia/data).', ordem: 2 },
    { categoria: 'S2_SEITON' as const, perfilAlvo: 'ESTAGIARIO' as const, texto: 'Renomeei arquivos baixados de acordo com o padrao: AAAAMMDD_descricao.', ordem: 3 },
    { categoria: 'S3_SEISO' as const, perfilAlvo: 'TODOS' as const, texto: 'Mantive a estacao de trabalho limpa e sem objetos nao relacionados ao expediente.', ordem: 1, aplicaRemoto: false },
    { categoria: 'S3_SEISO' as const, perfilAlvo: 'TODOS' as const, texto: 'Encerrei abas e aplicativos nao utilizados; mantive apenas o necessario.', ordem: 2 },
    { categoria: 'S4_SEIKETSU' as const, perfilAlvo: 'TODOS' as const, texto: 'Segui o padrao visual institucional em minutas e comunicacoes.', ordem: 1 },
    { categoria: 'S4_SEIKETSU' as const, perfilAlvo: 'ESTAGIARIO' as const, texto: 'Utilizei os modelos de peticao aprovados pela gestora.', ordem: 2 },
    { categoria: 'S5_SHITSUKE' as const, perfilAlvo: 'TODOS' as const, texto: 'Cumpri os horarios de entrada, intervalo e saida sem necessidade de lembrete.', ordem: 1 },
    { categoria: 'S5_SHITSUKE' as const, perfilAlvo: 'TODOS' as const, texto: 'Entreguei as demandas dentro do prazo acordado.', ordem: 2 },
    { categoria: 'S5_SHITSUKE' as const, perfilAlvo: 'ESTAGIARIO' as const, texto: 'Enviei o relatorio diario antes de registrar a saida final.', ordem: 3 },
    { categoria: 'ROTINA_INICIO' as const, perfilAlvo: 'TODOS' as const, texto: 'Bati o ponto de entrada.', ordem: 1 },
    { categoria: 'ROTINA_INICIO' as const, perfilAlvo: 'TODOS' as const, texto: 'Revisei a agenda de prazos e compromissos do dia.', ordem: 2 },
    { categoria: 'ROTINA_INICIO' as const, perfilAlvo: 'TODOS' as const, texto: 'Consultei as demandas atribuidas e priorizei por urgencia.', ordem: 3 },
    { categoria: 'ROTINA_JURIDICA' as const, perfilAlvo: 'TODOS' as const, texto: 'Verifiquei andamento processual dos feitos sob minha responsabilidade.', ordem: 1 },
    { categoria: 'ROTINA_JURIDICA' as const, perfilAlvo: 'ESTAGIARIO' as const, texto: 'Registrei novas intimacoes e publicacoes na pasta do cliente.', ordem: 2 },
    { categoria: 'ROTINA_ADMIN' as const, perfilAlvo: 'TODOS' as const, texto: 'Respondi as comunicacoes internas pendentes.', ordem: 1 },
    { categoria: 'ROTINA_ADMIN' as const, perfilAlvo: 'ASSESSORA_JR' as const, texto: 'Corrigi as demandas entregues pelos estagiarios e atribui nota.', ordem: 2 },
    { categoria: 'ENCERRAMENTO' as const, perfilAlvo: 'TODOS' as const, texto: 'Preenchi o relatorio diario completo.', ordem: 1 },
    { categoria: 'ENCERRAMENTO' as const, perfilAlvo: 'TODOS' as const, texto: 'Salvei e fechei arquivos; deixei a estacao pronta para o dia seguinte.', ordem: 2 },
    { categoria: 'ENCERRAMENTO' as const, perfilAlvo: 'TODOS' as const, texto: 'Registrei o ponto de saida final apos concluir o relatorio.', ordem: 3 },
  ];

  for (const item of itens) {
    const existente = await prisma.checklistItem.findFirst({
      where: { categoria: item.categoria, texto: item.texto },
    });
    if (!existente) {
      await prisma.checklistItem.create({ data: item });
    }
  }
}

async function semearCursos(): Promise<void> {
  const cursos = [
    {
      titulo: 'Politica de Conduta e Codigo de Etica Interno',
      descricao: 'Regras de conduta, sigilo profissional e relacionamento com clientes.',
      obrigatorio: true,
      perfilAlvo: 'ESTAGIARIO',
      conclusaoObrigatoriaDias: 15,
    },
    {
      titulo: 'LGPD aplicada a advocacia',
      descricao: 'Fundamentos da Lei 13.709/2018 e seu impacto no escritorio.',
      obrigatorio: true,
      perfilAlvo: 'TODOS',
      conclusaoObrigatoriaDias: 30,
    },
    {
      titulo: 'POP-EST-001 - Procedimento Operacional do Estagiario',
      descricao: 'Rotina, deveres e responsabilidades previstas na Lei 11.788/2008.',
      obrigatorio: true,
      perfilAlvo: 'ESTAGIARIO',
      conclusaoObrigatoriaDias: 7,
    },
  ];

  for (const curso of cursos) {
    const existente = await prisma.cursoTrilha.findFirst({ where: { titulo: curso.titulo } });
    if (!existente) {
      await prisma.cursoTrilha.create({ data: curso });
    }
  }
}

async function main(): Promise<void> {
  console.info('Iniciando seed...');
  await semearUsuarios();
  console.info('Usuarios iniciais semeados.');
  await semearChecklist();
  console.info('Itens do checklist 5S semeados.');
  await semearCursos();
  console.info('Cursos e trilhas obrigatorios semeados.');
  console.info('Seed concluido.');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
