-- CreateTable
CREATE TABLE "public"."mensagens_portaria" (
    "id" SERIAL NOT NULL,
    "texto" VARCHAR(500) NOT NULL,
    "enviadoPorPortaria" BOOLEAN NOT NULL DEFAULT false,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" VARCHAR(36) NOT NULL,

    CONSTRAINT "mensagens_portaria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."mensagens_portaria" ADD CONSTRAINT "mensagens_portaria_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
