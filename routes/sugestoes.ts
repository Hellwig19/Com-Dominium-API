import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const sugestaoSchema = z.object({
  titulo: z.string().min(5, { message: "O título deve ter no mínimo 5 caracteres." }),
  descricao: z.string().min(10, { message: "A descrição deve ter no mínimo 10 caracteres." }),
});

router.use(verificaToken);

// rotas cliente
router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = sugestaoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  try {
    const novaSugestao = await prisma.sugestao.create({
      data: {
        ...result.data,
        clienteId,
      },
    });
    res.status(201).json(novaSugestao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível enviar a sugestão." });
  }
});

router.get("/minhas", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const sugestoes = await prisma.sugestao.findMany({
      where: { clienteId },
      orderBy: { data: 'desc' }
    });
    res.status(200).json(sugestoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar suas sugestões." });
  }
});

// rotas admin
router.get("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  try {
    const sugestoes = await prisma.sugestao.findMany({
      include: {
        cliente: { select: { nome: true } }
      },
      orderBy: { data: 'desc' }
    });
    res.status(200).json(sugestoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar as sugestões." });
  }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.userLogadoId;
    const userLevel = req.userLogadoNivel;

    if (!userId) {
        return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    try {
        const sugestao = await prisma.sugestao.findUnique({
            where: { id: Number(id) }
        });

        if (!sugestao) {
            return res.status(404).json({ erro: "Sugestão não encontrada." });
        }

        const isOwner = sugestao.clienteId === userId;
        const isAdmin = userLevel === 2;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ erro: "Acesso negado. Você não tem permissão para apagar esta sugestão." });
        }

        await prisma.sugestao.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: "Sugestão removida com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível remover a sugestão." });
    }
});

export default router;