/*
  Warnings:

  - You are about to drop the column `area` on the `reservas` table. All the data in the column will be lost.
  - Added the required column `areaId` to the `reservas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."StatusArea" AS ENUM ('ATIVO', 'MANUTENCAO', 'INATIVO');

-- AlterTable
ALTER TABLE "public"."reservas" DROP COLUMN "area",
ADD COLUMN     "areaId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."areas_comuns" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "capacidade" SMALLINT NOT NULL,
    "preco" REAL NOT NULL,
    "status" "public"."StatusArea" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "areas_comuns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_comuns_nome_key" ON "public"."areas_comuns"("nome");

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."areas_comuns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
