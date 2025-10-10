import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient();
const router = Router();

const contatoSchema = z.object({
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  telefone: z.string().min(10, { message: "O telefone deve ter no mínimo 10 dígitos (com DDD)." }),
  whatsapp: z.string().min(11, { message: "O WhatsApp deve ter no mínimo 11 dígitos (com DDD)." }),
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = contatoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { email, telefone, whatsapp } = result.data;

  try {
    const novoContato = await prisma.contato.create({
      data: {
        email,
        telefone,
        whatsapp,
        clienteId,
      },
    });
    res.status(201).json(novoContato);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível adicionar o contato." });
  }
});

router.get("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  
  try {
    const contatos = await prisma.contato.findMany({
      where: { clienteId }
    });
    res.status(200).json(contatos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os contatos." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = contatoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  try {
    const contato = await prisma.contato.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!contato) {
      return res.status(404).json({ erro: "Contato não encontrado ou não pertence a este usuário." });
    }

    const contatoAtualizado = await prisma.contato.update({
      where: { id: Number(id) },
      data: result.data,
    });

    res.status(200).json(contatoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível atualizar o contato." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const contato = await prisma.contato.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!contato) {
      return res.status(404).json({ erro: "Contato não encontrado ou não pertence a este usuário." });
    }

    await prisma.contato.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Contato removido com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível remover o contato." });
  }
});

export default router;