import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const visitaSchema = z.object({
  nome: z.string().min(3, { message: "O nome do visitante deve ter no mínimo 3 caracteres." }),
  cpf: z.string().length(11, { message: "O CPF deve ter exatamente 11 dígitos." }),
  contato: z.string().min(10, { message: "O contato deve ter no mínimo 10 dígitos." }),
  dataVisita: z.string().datetime({ message: "Formato de data inválido." }),
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "O horário deve estar no formato HH:MM." }),
  observacoes: z.string().optional(),
  residenciaId: z.number().int().positive({ message: "O ID da residência é obrigatório." })
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = visitaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { residenciaId, ...dadosVisita } = result.data;

  try {
    const residencia = await prisma.residencia.findFirst({
      where: { id: residenciaId, clienteId }
    });

    if (!residencia) {
      return res.status(403).json({ erro: "Acesso negado. A residência não pertence a este usuário." });
    }

    const novaVisita = await prisma.visita.create({
      data: {
        ...dadosVisita,
        dataVisita: new Date(dadosVisita.dataVisita),
        residenciaId,
        clienteId,
      },
    });
    res.status(201).json(novaVisita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível agendar a visita." });
  }
});

router.get("/residencia/:residenciaId", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { residenciaId } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const residencia = await prisma.residencia.findFirst({
      where: { id: Number(residenciaId), clienteId }
    });

    if (!residencia) {
      return res.status(403).json({ erro: "Acesso negado." });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 

    const visitas = await prisma.visita.findMany({
      where: { 
        residenciaId: Number(residenciaId),
        dataVisita: { gte: hoje }
      },
      orderBy: { dataVisita: 'asc' }
    });
    res.status(200).json(visitas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar as visitas." });
  }
});

router.delete("/:id", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { id } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const visita = await prisma.visita.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!visita) {
      return res.status(404).json({ erro: "Visita não encontrada ou não pertence a este usuário." });
    }

    await prisma.visita.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ message: "Visita cancelada com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível cancelar a visita." });
  }
});

export default router;