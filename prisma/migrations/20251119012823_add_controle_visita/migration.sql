-- CreateEnum
CREATE TYPE "public"."StatusVisita" AS ENUM ('AGENDADA', 'DENTRO', 'SAIU');

-- AlterTable
ALTER TABLE "public"."visitas" ADD COLUMN     "dataEntrada" TIMESTAMP(3),
ADD COLUMN     "dataSaida" TIMESTAMP(3),
ADD COLUMN     "status" "public"."StatusVisita" NOT NULL DEFAULT 'AGENDADA';
