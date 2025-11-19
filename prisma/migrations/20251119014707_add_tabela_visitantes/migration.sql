/*
  Warnings:

  - You are about to drop the column `dataEntrada` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `dataSaida` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `placa` on the `visitas` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `visitas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."visitas" DROP COLUMN "dataEntrada",
DROP COLUMN "dataSaida",
DROP COLUMN "placa",
DROP COLUMN "status";

-- CreateTable
CREATE TABLE "public"."visitantes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "numeroCasa" VARCHAR(10) NOT NULL,
    "placa" VARCHAR(10),
    "observacoes" VARCHAR(255),
    "status" "public"."StatusVisita" NOT NULL DEFAULT 'DENTRO',
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSaida" TIMESTAMP(3),
    "porteiroId" VARCHAR(36),

    CONSTRAINT "visitantes_pkey" PRIMARY KEY ("id")
);
