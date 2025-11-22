-- CreateEnum
CREATE TYPE "public"."StatusManutencao" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "public"."manutencoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."StatusManutencao" NOT NULL DEFAULT 'PENDENTE',
    "prioridade" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" VARCHAR(36) NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificacoes" (
    "id" SERIAL NOT NULL,
    "mensagem" VARCHAR(255) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" VARCHAR(36) NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."manutencoes" ADD CONSTRAINT "manutencoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacoes" ADD CONSTRAINT "notificacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
