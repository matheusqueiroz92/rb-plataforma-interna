-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('SOCIO', 'GESTORA', 'ASSESSORA_JR', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO');

-- CreateEnum
CREATE TYPE "TipoPonto" AS ENUM ('ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA_FINAL');

-- CreateEnum
CREATE TYPE "RegimePonto" AS ENUM ('PRESENCIAL', 'HOME_OFFICE');

-- CreateEnum
CREATE TYPE "PrioridadeDemanda" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusDemanda" AS ENUM ('PENDENTE', 'ANDAMENTO', 'ENTREGUE', 'EM_CORRECAO', 'CONCLUIDA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "TipoDemanda" AS ENUM ('JURIDICA', 'ADMINISTRATIVA', 'PESQUISA', 'ATENDIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaChecklist" AS ENUM ('S1_SEIRI', 'S2_SEITON', 'S3_SEISO', 'S4_SEIKETSU', 'S5_SHITSUKE', 'ROTINA_INICIO', 'ROTINA_JURIDICA', 'ROTINA_ADMIN', 'ENCERRAMENTO');

-- CreateEnum
CREATE TYPE "PerfilChecklist" AS ENUM ('TODOS', 'ESTAGIARIO', 'ASSESSORA_JR');

-- CreateEnum
CREATE TYPE "TipoAtestado" AS ENUM ('MEDICO', 'FACULDADE', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoCertificado" AS ENUM ('SEMANAL', 'MENSAL', 'ANUAL', 'DESTAQUE');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('LEMBRETE_PONTO', 'ALERTA_PRAZO', 'DEMANDA_ATRIBUIDA', 'DEMANDA_CORRIGIDA', 'AUSENCIA_PONTO', 'CERTIFICADO', 'RELATORIO_RECEBIDO', 'AUSENCIA_RELATORIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusNotificacao" AS ENUM ('PENDENTE', 'ENVIADA', 'FALHA');

-- CreateEnum
CREATE TYPE "PapelChat" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "matricula" VARCHAR(20) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "instituicao_ensino" VARCHAR(200),
    "periodo_curso" VARCHAR(20),
    "data_admissao" DATE,
    "data_desligamento" DATE,
    "foto_url" VARCHAR(500),
    "telefone_whatsapp" VARCHAR(20),
    "aceite_pop_em" TIMESTAMPTZ,
    "aceite_pop_versao" VARCHAR(10),
    "aceite_pop_ip" VARCHAR(64),
    "senhas_anteriores" JSONB,
    "senha_atualizada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "tipo" "TipoPonto" NOT NULL,
    "regime" "RegimePonto" NOT NULL,
    "timestamp_servidor" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp_cliente" TIMESTAMPTZ,
    "ip_registro" VARCHAR(64) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "dispositivo" VARCHAR(50),
    "foto_base64" TEXT,
    "observacao" TEXT,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "editado_por" UUID,
    "editado_em" TIMESTAMPTZ,
    "justificativa_edicao" TEXT,

    CONSTRAINT "pontos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandas" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "criada_por" UUID NOT NULL,
    "atribuida_a" UUID NOT NULL,
    "delegada_por" UUID,
    "corrigida_por" UUID,
    "prioridade" "PrioridadeDemanda" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusDemanda" NOT NULL DEFAULT 'PENDENTE',
    "tipo" "TipoDemanda" NOT NULL,
    "processo_cnj" VARCHAR(25),
    "cliente_vinculado" VARCHAR(150),
    "prazo_fatal" TIMESTAMPTZ,
    "tempo_estimado_minutos" INTEGER,
    "tempo_real_minutos" INTEGER,
    "data_atribuicao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" TIMESTAMPTZ,
    "data_correcao" TIMESTAMPTZ,
    "nota_correcao" INTEGER,
    "feedback_corretor" TEXT,
    "arquivos_anexos" JSONB,
    "semana_referencia" VARCHAR(10),
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_itens" (
    "id" UUID NOT NULL,
    "categoria" "CategoriaChecklist" NOT NULL,
    "perfil_alvo" "PerfilChecklist" NOT NULL DEFAULT 'TODOS',
    "texto" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "aplica_remoto" BOOLEAN NOT NULL DEFAULT true,
    "aplica_presencial" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" UUID,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "checklist_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_respostas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "concluido_em" TIMESTAMPTZ,
    "melhoria_sugerida" TEXT,

    CONSTRAINT "checklist_respostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_diarios" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "pergunta_1_atividades" TEXT NOT NULL,
    "pergunta_2_dificuldades" TEXT NOT NULL,
    "pergunta_3_demanda_concluida" BOOLEAN NOT NULL,
    "pergunta_3_justificativa" TEXT,
    "atestado_anexo_url" VARCHAR(500),
    "atestado_tipo" "TipoAtestado",
    "enviado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lido_por" UUID,
    "lido_em" TIMESTAMPTZ,

    CONSTRAINT "relatorios_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontuacoes_semanais" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "semana_referencia" VARCHAR(10) NOT NULL,
    "pontualidade_pontos" INTEGER NOT NULL DEFAULT 0,
    "qualidade_demanda_media" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "demandas_extras_pontos" INTEGER NOT NULL DEFAULT 0,
    "checklist_5s_pontos" INTEGER NOT NULL DEFAULT 0,
    "relatorios_entregues_pontos" INTEGER NOT NULL DEFAULT 0,
    "total_pontos" INTEGER NOT NULL DEFAULT 0,
    "posicao_ranking" INTEGER,
    "calculado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pontuacoes_semanais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo" "TipoCertificado" NOT NULL,
    "periodo_referencia" VARCHAR(20) NOT NULL,
    "pontuacao_obtida" INTEGER,
    "posicao_final" INTEGER,
    "emitido_por" UUID,
    "emitido_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_url" VARCHAR(500),
    "numero_sequencial" VARCHAR(20) NOT NULL,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_log" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "acao" VARCHAR(50) NOT NULL,
    "entidade" VARCHAR(50) NOT NULL,
    "entidade_id" UUID,
    "dados_anteriores" JSONB,
    "dados_novos" JSONB,
    "ip" VARCHAR(64),
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes_whatsapp" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "telefone_destino" VARCHAR(20) NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" "StatusNotificacao" NOT NULL DEFAULT 'PENDENTE',
    "zapi_response" JSONB,
    "agendada_para" TIMESTAMPTZ,
    "enviada_em" TIMESTAMPTZ,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_whatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_ia_mensagens" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "conversa_id" UUID NOT NULL,
    "papel" "PapelChat" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tokens_consumidos" INTEGER,
    "modelo_claude" VARCHAR(50),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_ia_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos_trilhas" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "perfil_alvo" VARCHAR(50) NOT NULL,
    "conclusao_obrigatoria_dias" INTEGER,
    "url_externa" VARCHAR(500),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cursos_trilhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conclusoes_cursos" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "curso_id" UUID NOT NULL,
    "concluido_em" TIMESTAMPTZ,
    "certificado_url" VARCHAR(500),

    CONSTRAINT "conclusoes_cursos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios"("matricula");

-- CreateIndex
CREATE INDEX "usuarios_perfil_status_idx" ON "usuarios"("perfil", "status");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "pontos_data_idx" ON "pontos"("data");

-- CreateIndex
CREATE INDEX "pontos_usuario_id_data_idx" ON "pontos"("usuario_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "pontos_usuario_id_data_tipo_key" ON "pontos"("usuario_id", "data", "tipo");

-- CreateIndex
CREATE INDEX "demandas_atribuida_a_status_idx" ON "demandas"("atribuida_a", "status");

-- CreateIndex
CREATE INDEX "demandas_semana_referencia_idx" ON "demandas"("semana_referencia");

-- CreateIndex
CREATE INDEX "demandas_prazo_fatal_idx" ON "demandas"("prazo_fatal");

-- CreateIndex
CREATE INDEX "checklist_itens_categoria_ordem_idx" ON "checklist_itens"("categoria", "ordem");

-- CreateIndex
CREATE INDEX "checklist_itens_ativo_idx" ON "checklist_itens"("ativo");

-- CreateIndex
CREATE INDEX "checklist_respostas_data_idx" ON "checklist_respostas"("data");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_respostas_usuario_id_item_id_data_key" ON "checklist_respostas"("usuario_id", "item_id", "data");

-- CreateIndex
CREATE INDEX "relatorios_diarios_data_idx" ON "relatorios_diarios"("data");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_diarios_usuario_id_data_key" ON "relatorios_diarios"("usuario_id", "data");

-- CreateIndex
CREATE INDEX "pontuacoes_semanais_semana_referencia_posicao_ranking_idx" ON "pontuacoes_semanais"("semana_referencia", "posicao_ranking");

-- CreateIndex
CREATE UNIQUE INDEX "pontuacoes_semanais_usuario_id_semana_referencia_key" ON "pontuacoes_semanais"("usuario_id", "semana_referencia");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_numero_sequencial_key" ON "certificados"("numero_sequencial");

-- CreateIndex
CREATE INDEX "certificados_tipo_periodo_referencia_idx" ON "certificados"("tipo", "periodo_referencia");

-- CreateIndex
CREATE INDEX "auditoria_log_usuario_id_timestamp_idx" ON "auditoria_log"("usuario_id", "timestamp");

-- CreateIndex
CREATE INDEX "auditoria_log_entidade_entidade_id_idx" ON "auditoria_log"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_log_timestamp_idx" ON "auditoria_log"("timestamp");

-- CreateIndex
CREATE INDEX "notificacoes_whatsapp_status_agendada_para_idx" ON "notificacoes_whatsapp"("status", "agendada_para");

-- CreateIndex
CREATE INDEX "notificacoes_whatsapp_tipo_idx" ON "notificacoes_whatsapp"("tipo");

-- CreateIndex
CREATE INDEX "chat_ia_mensagens_usuario_id_conversa_id_timestamp_idx" ON "chat_ia_mensagens"("usuario_id", "conversa_id", "timestamp");

-- CreateIndex
CREATE INDEX "chat_ia_mensagens_conversa_id_idx" ON "chat_ia_mensagens"("conversa_id");

-- CreateIndex
CREATE UNIQUE INDEX "conclusoes_cursos_usuario_id_curso_id_key" ON "conclusoes_cursos"("usuario_id", "curso_id");

-- AddForeignKey
ALTER TABLE "pontos" ADD CONSTRAINT "pontos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos" ADD CONSTRAINT "pontos_editado_por_fkey" FOREIGN KEY ("editado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_criada_por_fkey" FOREIGN KEY ("criada_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_atribuida_a_fkey" FOREIGN KEY ("atribuida_a") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_delegada_por_fkey" FOREIGN KEY ("delegada_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_corrigida_por_fkey" FOREIGN KEY ("corrigida_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_itens" ADD CONSTRAINT "checklist_itens_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_respostas" ADD CONSTRAINT "checklist_respostas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_respostas" ADD CONSTRAINT "checklist_respostas_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "checklist_itens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_diarios" ADD CONSTRAINT "relatorios_diarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_diarios" ADD CONSTRAINT "relatorios_diarios_lido_por_fkey" FOREIGN KEY ("lido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontuacoes_semanais" ADD CONSTRAINT "pontuacoes_semanais_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_emitido_por_fkey" FOREIGN KEY ("emitido_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_whatsapp" ADD CONSTRAINT "notificacoes_whatsapp_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_ia_mensagens" ADD CONSTRAINT "chat_ia_mensagens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conclusoes_cursos" ADD CONSTRAINT "conclusoes_cursos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conclusoes_cursos" ADD CONSTRAINT "conclusoes_cursos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos_trilhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
