import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const mensagemSchema = z.object({
  texto: z.string().min(1, "A mensagem não pode estar vazia"),
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const result = mensagemSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erro: "Mensagem inválida" });

  const nivel = req.userLogadoNivel || 0;
  const isPortaria = nivel >= 2; 
  
  let targetClienteId = req.userLogadoId;
  
  if (isPortaria) {
      if (!req.body.clienteId) {
          return res.status(400).json({ erro: "Portaria deve informar o clienteId de destino." });
      }
      targetClienteId = req.body.clienteId;
  }

  if (!targetClienteId) {
      return res.status(400).json({ erro: "ID do morador não identificado." });
  }

  try {
    const novaMsg = await prisma.mensagemPortaria.create({
      data: {
        texto: result.data.texto,
        clienteId: targetClienteId, 
        enviadoPorPortaria: isPortaria,
        lido: false
      }
    });
    res.status(201).json(novaMsg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar mensagem." });
  }
});

router.get("/:clienteId?", async (req, res) => {
    const nivel = req.userLogadoNivel || 0;
    const isPortaria = nivel >= 2;

    const targetId = isPortaria ? req.params.clienteId : req.userLogadoId;

    if (!targetId) return res.status(400).json({ erro: "ID do cliente não fornecido." });

    try {
        const ontem = new Date();
        ontem.setHours(ontem.getHours() - 24);

        const mensagens = await prisma.mensagemPortaria.findMany({
            where: {
                clienteId: targetId,
                createdAt: { gte: ontem }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(mensagens);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar mensagens." });
    }
});

export default router;