/*
  Warnings:

  - You are about to drop the column `residencia` on the `moradores` table. All the data in the column will be lost.
  - You are about to drop the column `residencia` on the `prestadores` table. All the data in the column will be lost.
  - You are about to drop the column `residencia` on the `veiculos` table. All the data in the column will be lost.
  - You are about to drop the column `residencia` on the `visitas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cpf` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residenciaId` to the `moradores` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `pagamentos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `residenciaId` to the `prestadores` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `reservas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `residenciaId` to the `veiculos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `residenciaId` to the `visitas` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `votacoes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."StatusReserva" AS ENUM ('CONFIRMADA', 'PENDENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."StatusVotacao" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'AGENDADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "public"."sugestoes" DROP CONSTRAINT "sugestoes_clienteId_fkey";

-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "cpf" VARCHAR(11) NOT NULL;

-- AlterTable
ALTER TABLE "public"."clientes" ALTER COLUMN "dataNasc" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."moradores" DROP COLUMN "residencia",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ALTER COLUMN "dataNasc" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."pagamentos" ALTER COLUMN "dataVencimento" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."StatusPagamento" NOT NULL,
ALTER COLUMN "dataPagamento" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."prestadores" DROP COLUMN "residencia",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ALTER COLUMN "dataServico" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."reservas" ALTER COLUMN "dataReserva" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."StatusReserva" NOT NULL;

-- AlterTable
ALTER TABLE "public"."residencias" ALTER COLUMN "dataResidencia" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."veiculos" DROP COLUMN "residencia",
ADD COLUMN     "residenciaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."visitas" DROP COLUMN "residencia",
ADD COLUMN     "residenciaId" INTEGER NOT NULL,
ALTER COLUMN "dataVisita" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."votacoes" ALTER COLUMN "dataInicio" DROP DEFAULT,
ALTER COLUMN "dataFim" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."StatusVotacao" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_cpf_key" ON "public"."admins"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "public"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "public"."clientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "public"."clientes"("email");

-- AddForeignKey
ALTER TABLE "public"."moradores" ADD CONSTRAINT "moradores_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "public"."residencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "public"."residencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitas" ADD CONSTRAINT "visitas_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "public"."residencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prestadores" ADD CONSTRAINT "prestadores_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "public"."residencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sugestoes" ADD CONSTRAINT "sugestoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
