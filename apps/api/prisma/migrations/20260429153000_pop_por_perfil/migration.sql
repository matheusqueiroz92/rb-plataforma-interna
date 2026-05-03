-- CreateEnum
CREATE TYPE "StatusPopDocumento" AS ENUM ('RASCUNHO', 'APROVADO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "pops_documentos" (
    "id" UUID NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "conteudo_markdown" TEXT NOT NULL,
    "versao" VARCHAR(20) NOT NULL,
    "status" "StatusPopDocumento" NOT NULL DEFAULT 'RASCUNHO',
    "vigente" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" UUID,
    "aprovado_por" UUID,
    "aprovado_em" TIMESTAMPTZ,
    "publicado_por" UUID,
    "publicado_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pops_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pops_aceites" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "pop_documento_id" UUID NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "versao" VARCHAR(20) NOT NULL,
    "ip" VARCHAR(64),
    "user_agent" TEXT,
    "aceito_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pops_aceites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pops_documentos_perfil_status_idx" ON "pops_documentos"("perfil", "status");

-- CreateIndex
CREATE INDEX "pops_documentos_perfil_vigente_idx" ON "pops_documentos"("perfil", "vigente");

-- CreateIndex
CREATE UNIQUE INDEX "pops_documentos_perfil_versao_key" ON "pops_documentos"("perfil", "versao");

-- CreateIndex
CREATE INDEX "pops_aceites_usuario_id_perfil_aceito_em_idx" ON "pops_aceites"("usuario_id", "perfil", "aceito_em");

-- CreateIndex
CREATE INDEX "pops_aceites_pop_documento_id_idx" ON "pops_aceites"("pop_documento_id");

-- AddForeignKey
ALTER TABLE "pops_documentos" ADD CONSTRAINT "pops_documentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pops_documentos" ADD CONSTRAINT "pops_documentos_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pops_documentos" ADD CONSTRAINT "pops_documentos_publicado_por_fkey" FOREIGN KEY ("publicado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pops_aceites" ADD CONSTRAINT "pops_aceites_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pops_aceites" ADD CONSTRAINT "pops_aceites_pop_documento_id_fkey" FOREIGN KEY ("pop_documento_id") REFERENCES "pops_documentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
