import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const prestadorSchema = z.object({
  nome: z.string().min(3, { message: "O nome do prestador deve ter no mínimo 3 caracteres." }),
  cpf: z.string().length(14, { message: "O CPF/CNPJ deve ter exatamente 14 caracteres." }),
  contato: z.string().min(10, { message: "O contato deve ter no mínimo 10 dígitos." }),
  email: z.string().email({ message: "Formato de e-mail inválido." }).optional().or(z.literal('')),
  servico: z.string().min(3, { message: "A descrição do serviço é obrigatória." }),
  dataServico: z.string().datetime({ message: "Formato de data inválido." }),
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

  const result = prestadorSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { residenciaId, ...dadosPrestador } = result.data;

  try {
    const residencia = await prisma.residencia.findFirst({
      where: { id: residenciaId, clienteId }
    });

    if (!residencia) {
      return res.status(403).json({ erro: "Acesso negado. A residência não pertence a este usuário." });
    }

    const novoPrestador = await prisma.prestador.create({
      data: {
        ...dadosPrestador,
        dataServico: new Date(dadosPrestador.dataServico),
        residenciaId,
        clienteId,
      },
    });
    res.status(201).json(novoPrestador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível agendar o serviço." });
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
      return res.status(403).json({ erro: "Acesso negado. A residência não pertence a este usuário." });
    }

    const prestadores = await prisma.prestador.findMany({
      where: { residenciaId: Number(residenciaId) },
      orderBy: { dataServico: 'desc' }
    });
    res.status(200).json(prestadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os agendamentos." });
  }
});

router.delete("/:id", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { id } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const prestador = await prisma.prestador.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!prestador) {
      return res.status(404).json({ erro: "Agendamento não encontrado ou não pertence a este usuário." });
    }

    await prisma.prestador.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ message: "Agendamento de serviço cancelado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível cancelar o agendamento." });
  }
});

export default router;