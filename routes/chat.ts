import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const mensagemSchema = z.object({
  texto: z.string().min(1, "A mensagem não pode estar vazia"),
  clienteId: z.string().optional()
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

router.get("/inbox", async (req, res) => {
    if ((req.userLogadoNivel || 0) < 2) return res.status(403).json({ erro: "Acesso negado" });

    try {
        const dataLimite = new Date();
        dataLimite.setHours(dataLimite.getHours() - 48);

        const mensagens = await prisma.mensagemPortaria.findMany({
            where: { createdAt: { gte: dataLimite } },
            include: { 
                cliente: { 
                    select: { 
                        id: true, 
                        nome: true, 
                        residencias: { select: { numeroCasa: true }, take: 1 } 
                    } 
                } 
            },
            orderBy: { createdAt: 'desc' }
        });

        const chatsMap = new Map();

        for (const msg of mensagens) {
            if (!chatsMap.has(msg.clienteId)) {
                chatsMap.set(msg.clienteId, {
                    clienteId: msg.clienteId,
                    nome: msg.cliente.nome,
                    casa: msg.cliente.residencias[0]?.numeroCasa || 'S/N',
                    ultimaMensagem: msg.texto,
                    horario: msg.createdAt,
                    naoLidas: 0
                });
            }
            if (!msg.enviadoPorPortaria && !msg.lido) {
                const chat = chatsMap.get(msg.clienteId);
                chat.naoLidas += 1;
            }
        }

        const listaOrdenada = Array.from(chatsMap.values());
        res.json(listaOrdenada);

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao carregar inbox." });
    }
});

router.get("/:clienteId?", async (req, res) => {
    const nivel = req.userLogadoNivel || 0;
    const isPortaria = nivel >= 2;

    const targetId = isPortaria ? req.params.clienteId : req.userLogadoId;

    if (!targetId) return res.status(400).json({ erro: "ID do cliente não fornecido." });

    try {
        if (isPortaria) {
            await prisma.mensagemPortaria.updateMany({
                where: { clienteId: targetId, enviadoPorPortaria: false, lido: false },
                data: { lido: true }
            });
        }

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