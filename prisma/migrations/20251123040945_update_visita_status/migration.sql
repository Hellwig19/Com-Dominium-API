-- AlterTable
ALTER TABLE "public"."prestadores" ADD COLUMN     "dataEntrada" TIMESTAMP(3),
ADD COLUMN     "dataSaida" TIMESTAMP(3),
ADD COLUMN     "status" "public"."StatusVisita" NOT NULL DEFAULT 'AGENDADA';

-- AlterTable
ALTER TABLE "public"."visitas" ADD COLUMN     "dataEntrada" TIMESTAMP(3),
ADD COLUMN     "dataSaida" TIMESTAMP(3),
ADD COLUMN     "status" "public"."StatusVisita" NOT NULL DEFAULT 'AGENDADA';
