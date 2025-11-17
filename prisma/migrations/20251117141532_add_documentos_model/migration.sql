-- CreateTable
CREATE TABLE "public"."documentos" (
    "id" SERIAL NOT NULL,
    "nomeArquivo" VARCHAR(100) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "tamanhoKB" INTEGER NOT NULL,
    "clienteId" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."documentos" ADD CONSTRAINT "documentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
