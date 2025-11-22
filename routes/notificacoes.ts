import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

router.use(verificaToken);

router.get("/", async (req, res) => {
  const clienteId = req.userLogadoId; 

  if (!clienteId) return res.status(401).json({ erro: "Não autenticado" });

  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: { clienteId }, 
      orderBy: { data: 'desc' }, 
      take: 20 
    });
    res.json(notificacoes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar notificações" });
  }
});

router.patch("/:id/lida", async (req, res) => {
  const { id } = req.params;
  const clienteId = req.userLogadoId;

  try {
    const notif = await prisma.notificacao.findFirst({
        where: { id: Number(id), clienteId }
    });

    if (!notif) return res.status(404).json({ erro: "Notificação não encontrada" });

    await prisma.notificacao.update({
      where: { id: Number(id) },
      data: { lida: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

router.get("/nao-lidas", async (req, res) => {
    const clienteId = req.userLogadoId;
    const count = await prisma.notificacao.count({
        where: { clienteId, lida: false }
    });
    res.json({ count });
});

export default router;