/*
  Warnings:

  - You are about to drop the column `carroId` on the `propostas` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `propostas` table. All the data in the column will be lost.
  - You are about to drop the `carros` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clientes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `marcas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `usuarioId` to the `propostas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MetodoPagamento" AS ENUM ('CREDITO', 'DEBITO', 'BOLETO', 'PIX');

-- CreateEnum
CREATE TYPE "public"."EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO');

-- CreateEnum
CREATE TYPE "public"."TipoMorador" AS ENUM ('PROPRIETARIO', 'INQUILINO');

-- CreateEnum
CREATE TYPE "public"."Tipo" AS ENUM ('CASA', 'APARTAMENTO');

-- CreateEnum
CREATE TYPE "public"."TipoVeiculo" AS ENUM ('CARRO', 'MOTO');

-- DropForeignKey
ALTER TABLE "public"."carros" DROP CONSTRAINT "carros_adminId_fkey";

-- DropForeignKey
ALTER TABLE "public"."carros" DROP CONSTRAINT "carros_marcaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."propostas" DROP CONSTRAINT "propostas_carroId_fkey";

-- DropForeignKey
ALTER TABLE "public"."propostas" DROP CONSTRAINT "propostas_clienteId_fkey";

-- AlterTable
ALTER TABLE "public"."propostas" DROP COLUMN "carroId",
DROP COLUMN "clienteId",
ADD COLUMN     "usuarioId" VARCHAR(36) NOT NULL;

-- DropTable
DROP TABLE "public"."carros";

-- DropTable
DROP TABLE "public"."clientes";

-- DropTable
DROP TABLE "public"."marcas";

-- DropEnum
DROP TYPE "public"."Combustiveis";

-- CreateTable
CREATE TABLE "public"."usuarios" (
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

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contatos" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "telefone" VARCHAR(15) NOT NULL,
    "whatsapp" VARCHAR(15) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."residencias" (
    "id" SERIAL NOT NULL,
    "numeroCasa" VARCHAR(3) NOT NULL,
    "rua" VARCHAR(30) NOT NULL,
    "proprietario" VARCHAR(60) NOT NULL,
    "dataResidencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Tipo" "public"."Tipo" NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "residencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."moradores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "parentesco" VARCHAR(30) NOT NULL,
    "dataNasc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpf" VARCHAR(11) NOT NULL,
    "email" VARCHAR(40),
    "contato" VARCHAR(15) NOT NULL,
    "residencia" VARCHAR(60) NOT NULL,
    "tipoMorador" "public"."TipoMorador" NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "moradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."veiculos" (
    "id" SERIAL NOT NULL,
    "marca" VARCHAR(30) NOT NULL,
    "modelo" VARCHAR(30) NOT NULL,
    "ano" SMALLINT NOT NULL,
    "cor" VARCHAR(20) NOT NULL,
    "placa" VARCHAR(7) NOT NULL,
    "proprietario" VARCHAR(60) NOT NULL,
    "residencia" VARCHAR(60) NOT NULL,
    "garagem" VARCHAR(3) NOT NULL,
    "TipoVeiculo" "public"."TipoVeiculo" NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pagamentos" (
    "id" SERIAL NOT NULL,
    "boletos" VARCHAR(60) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL,
    "valor" REAL NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPagamento" "public"."MetodoPagamento" NOT NULL,
    "propostaId" INTEGER NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."visitas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "contato" VARCHAR(15) NOT NULL,
    "dataVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horario" VARCHAR(5) NOT NULL,
    "observacoes" VARCHAR(255) NOT NULL,
    "residencia" VARCHAR(60) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prestadores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "contato" VARCHAR(15) NOT NULL,
    "email" VARCHAR(40),
    "residencia" VARCHAR(60) NOT NULL,
    "servico" VARCHAR(60) NOT NULL,
    "dataServico" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horario" VARCHAR(5) NOT NULL,
    "observacoes" VARCHAR(255) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "prestadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."encomendas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "remetente" VARCHAR(60) NOT NULL,
    "codigorastreio" VARCHAR(30) NOT NULL,
    "tamanho" VARCHAR(10) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "encomendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id" SERIAL NOT NULL,
    "area" VARCHAR(60) NOT NULL,
    "dataReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" REAL NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "capacidade" SMALLINT NOT NULL,
    "horario" VARCHAR(5) NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."avisos" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."votacoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(30) NOT NULL,
    "opcoes" VARCHAR(255) NOT NULL,
    "votos" SMALLINT NOT NULL DEFAULT 0,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "votacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recupera_senha" (
    "id" SERIAL NOT NULL,
    "usuarioId" VARCHAR(36) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recupera_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sugestoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" VARCHAR(36) NOT NULL,

    CONSTRAINT "sugestoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."propostas" ADD CONSTRAINT "propostas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contatos" ADD CONSTRAINT "contatos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."residencias" ADD CONSTRAINT "residencias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."moradores" ADD CONSTRAINT "moradores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."veiculos" ADD CONSTRAINT "veiculos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamentos" ADD CONSTRAINT "pagamentos_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "public"."propostas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagamentos" ADD CONSTRAINT "pagamentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."visitas" ADD CONSTRAINT "visitas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."prestadores" ADD CONSTRAINT "prestadores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encomendas" ADD CONSTRAINT "encomendas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."avisos" ADD CONSTRAINT "avisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votacoes" ADD CONSTRAINT "votacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recupera_senha" ADD CONSTRAINT "recupera_senha_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sugestoes" ADD CONSTRAINT "sugestoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
