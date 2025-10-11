/*
  Warnings:

  - You are about to drop the column `clienteId` on the `avisos` table. All the data in the column will be lost.
  - You are about to drop the column `propostaId` on the `pagamentos` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `votacoes` table. All the data in the column will be lost.
  - You are about to drop the column `opcoes` on the `votacoes` table. All the data in the column will be lost.
  - You are about to drop the column `votos` on the `votacoes` table. All the data in the column will be lost.
  - You are about to drop the `propostas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `adminId` to the `avisos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `votacoes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."StatusEncomenda" AS ENUM ('AGUARDANDO_RETIRADA', 'ENTREGUE');

-- DropForeignKey
ALTER TABLE "public"."avisos" DROP CONSTRAINT "avisos_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."pagamentos" DROP CONSTRAINT "pagamentos_propostaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."propostas" DROP CONSTRAINT "propostas_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."propostas" DROP CONSTRAINT "propostas_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."votacoes" DROP CONSTRAINT "votacoes_clienteId_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."avisos" DROP COLUMN "clienteId",
ADD COLUMN     "adminId" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."clientes" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."encomendas" ADD COLUMN     "adminEntregaId" VARCHAR(36),
ADD COLUMN     "adminRegistroId" VARCHAR(36),
ADD COLUMN     "dataChegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataRetirada" TIMESTAMP(3),
ADD COLUMN     "status" "public"."StatusEncomenda" NOT NULL DEFAULT 'AGUARDANDO_RETIRADA',
ALTER COLUMN "codigo" DROP NOT NULL,
ALTER COLUMN "codigorastreio" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."pagamentos" DROP COLUMN "propostaId";

-- AlterTable
ALTER TABLE "public"."prestadores" ALTER COLUMN "observacoes" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."visitas" ALTER COLUMN "observacoes" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."votacoes" DROP COLUMN "clienteId",
DROP COLUMN "opcoes",
DROP COLUMN "votos",
ADD COLUMN     "adminId" VARCHAR(36) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'AGENDADA';

-- DropTable
DROP TABLE "public"."propostas";

-- CreateTable
CREATE TABLE "public"."opcoes_votacao" (
    "id" SERIAL NOT NULL,
    "texto" VARCHAR(100) NOT NULL,
    "votacaoId" INTEGER NOT NULL,

    CONSTRAINT "opcoes_votacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."votos" (
    "id" SERIAL NOT NULL,
    "votacaoId" INTEGER NOT NULL,
    "opcaoId" INTEGER NOT NULL,
    "clienteId" VARCHAR(36) NOT NULL,
    "dataVoto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "votos_votacaoId_clienteId_key" ON "public"."votos"("votacaoId", "clienteId");

-- AddForeignKey
ALTER TABLE "public"."avisos" ADD CONSTRAINT "avisos_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votacoes" ADD CONSTRAINT "votacoes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opcoes_votacao" ADD CONSTRAINT "opcoes_votacao_votacaoId_fkey" FOREIGN KEY ("votacaoId") REFERENCES "public"."votacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votos" ADD CONSTRAINT "votos_votacaoId_fkey" FOREIGN KEY ("votacaoId") REFERENCES "public"."votacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votos" ADD CONSTRAINT "votos_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "public"."opcoes_votacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votos" ADD CONSTRAINT "votos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
