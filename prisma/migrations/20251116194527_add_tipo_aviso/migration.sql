-- CreateEnum
CREATE TYPE "public"."TipoAviso" AS ENUM ('URGENTE', 'NORMAL');

-- AlterTable
ALTER TABLE "public"."avisos" ADD COLUMN     "tipo" "public"."TipoAviso" NOT NULL DEFAULT 'NORMAL';
