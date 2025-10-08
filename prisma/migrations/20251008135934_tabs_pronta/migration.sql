/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `avisos` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `contatos` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `encomendas` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `moradores` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `pagamentos` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `prestadores` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `propostas` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `recupera_senha` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `reservas` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `residencias` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `sugestoes` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `veiculos` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `votacoes` table. All the data in the column will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clienteId` to the `avisos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `contatos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `encomendas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `moradores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `pagamentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `prestadores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `propostas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `recupera_senha` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `reservas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `residencias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `sugestoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `veiculos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `visitas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `votacoes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."avisos" DROP CONSTRAINT "avisos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contatos" DROP CONSTRAINT "contatos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."encomendas" DROP CONSTRAINT "encomendas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."moradores" DROP CONSTRAINT "moradores_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pagamentos" DROP CONSTRAINT "pagamentos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."prestadores" DROP CONSTRAINT "prestadores_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."propostas" DROP CONSTRAINT "propostas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."recupera_senha" DROP CONSTRAINT "recupera_senha_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservas" DROP CONSTRAINT "reservas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."residencias" DROP CONSTRAINT "residencias_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sugestoes" DROP CONSTRAINT "sugestoes_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."veiculos" DROP CONSTRAINT "veiculos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."visitas" DROP CONSTRAINT "visitas_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "public"."votacoes" DROP CONSTRAINT "votacoes_usuarioId_fkey";

-- AlterTable
ALTER TABLE "public"."avisos" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."contatos" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."encomendas" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."moradores" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."pagamentos" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."prestadores" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."propostas" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."recupera_senha" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."reservas" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."residencias" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."sugestoes" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."veiculos" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."visitas" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."votacoes" DROP COLUMN "usuarioId",
ADD COLUMN     "clienteId" VARCHAR(36) NOT NULL;

-- DropTable
DROP TABLE "public"."usuarios";

-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "rg" VARCHAR(10) NOT NULL,
    "dataNasc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoCivil" "public"."EstadoCivil" NOT NULL,
    "profissao" VARCHAR(30) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."propostas" ADD CONSTRAINT "propostas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contatos" ADD CONSTRAINT "contatos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."residencias" ADD CONSTRAINT "residencias_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moradores" ADD CONSTRAINT "moradores_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamentos" ADD CONSTRAINT "pagamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitas" ADD CONSTRAINT "visitas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prestadores" ADD CONSTRAINT "prestadores_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encomendas" ADD CONSTRAINT "encomendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avisos" ADD CONSTRAINT "avisos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votacoes" ADD CONSTRAINT "votacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recupera_senha" ADD CONSTRAINT "recupera_senha_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sugestoes" ADD CONSTRAINT "sugestoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
