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

const lidoSchema = z.object({
    lido: z.boolean({ required_error: "O status lido é obrigatório." })
});

router.use(verificaToken);

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
        lido: false, 
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

router.get("/", async (req, res) => {
  const nivel = req.userLogadoNivel;
  
  const niveisPermitidos = [2, 3, 5];

  if (!nivel || !niveisPermitidos.includes(nivel)) {
    return res.status(403).json({ erro: "Acesso negado: permissão insuficiente." });
  }

  try {
    const sugestoes = await prisma.sugestao.findMany({
      include: {
        cliente: { 
            select: { 
                nome: true,
                residencias: {
                    select: { numeroCasa: true }
                }
            } 
        }
      },
      orderBy: { data: 'desc' }
    });
    res.status(200).json(sugestoes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar as sugestões." });
  }
});

router.patch("/:id/lido", async (req, res) => {
    const { id } = req.params;
    const nivel = req.userLogadoNivel;
    const niveisPermitidos = [2, 3, 5];

    if (!nivel || !niveisPermitidos.includes(nivel)) {
        return res.status(403).json({ erro: "Acesso negado: permissão insuficiente." });
    }

    const result = lidoSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
    }

    try {
        const sugestaoAtualizada = await prisma.sugestao.update({
            where: { id: Number(id) },
            data: { lido: result.data.lido }
        });
        res.status(200).json(sugestaoAtualizada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível atualizar o status da sugestão." });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.userLogadoId;
    const userLevel = req.userLogadoNivel || 0;

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
        const isStaff = [2, 5].includes(userLevel);

        if (!isOwner && !isStaff) {
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