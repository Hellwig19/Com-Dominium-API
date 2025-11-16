

import { PrismaClient, StatusReserva } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const reservaSchema = z.object({
  area: z.string().min(3, { message: "O nome da área é obrigatório." }),
  dataReserva: z.string().datetime({ message: "Formato de data inválido." }),
  valor: z.number().nonnegative({ message: "O valor não pode ser negativo." }),
  capacidade: z.number().int().positive({ message: "A capacidade deve ser um número positivo." }),
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "O horário deve estar no formato HH:MM." }),
});
const statusSchema = z.object({
    status: z.enum([StatusReserva.CONFIRMADA, StatusReserva.CANCELADA]),
});

router.use(verificaToken);


router.get("/datas-ocupadas", async (req, res) => {
    const { area } = req.query;

    if (!area) {
        return res.status(400).json({ erro: "O nome da área é obrigatório." });
    }

    try {
        const reservasConfirmadas = await prisma.reserva.findMany({
            where: {
                area: String(area),
                status: StatusReserva.CONFIRMADA 
            },
            select: {
                dataReserva: true 
            }
        });
        
        const datas = reservasConfirmadas.map(r => r.dataReserva.toISOString());
        res.status(200).json(datas);

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível carregar as datas." });
    }
});


router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;
  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  const result = reservaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }
  const dataReserva = new Date(result.data.dataReserva);
  if (dataReserva < new Date()) {
      return res.status(400).json({ erro: "Não é possível fazer uma reserva para uma data passada." });
  }
  
  const conflito = await prisma.reserva.findFirst({
      where: {
          area: result.data.area,
          dataReserva: dataReserva,
          status: { in: [StatusReserva.CONFIRMADA, StatusReserva.PENDENTE] }
      }
  });

  if (conflito) {
      return res.status(409).json({ erro: "Esta data já está reservada ou aguardando confirmação." });
  }
  
  try {
    const novaReserva = await prisma.reserva.create({
      data: {
        ...result.data,
        dataReserva: dataReserva,
        status: StatusReserva.PENDENTE,
        clienteId,
      },
    });
    res.status(201).json(novaReserva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível solicitar a reserva." });
  }
});

router.get("/minhas", async (req, res) => {
  const clienteId = req.userLogadoId;
  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  try {
    const reservas = await prisma.reserva.findMany({
      where: { clienteId },
      orderBy: { dataReserva: 'desc' }
    });
    res.status(200).json(reservas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar suas reservas." });
  }
});

router.delete("/:id", async (req, res) => {
    const clienteId = req.userLogadoId;
    const { id } = req.params;

    if (!clienteId) {
        return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    try {
        const reserva = await prisma.reserva.findFirst({
            where: { id: Number(id), clienteId }
        });

        if (!reserva) {
            return res.status(404).json({ erro: "Reserva não encontrada ou não pertence a este usuário." });
        }

        if (reserva.status === StatusReserva.CANCELADA) {
            return res.status(403).json({ erro: "Esta reserva já está cancelada." });
        }
        
        const reservaCancelada = await prisma.reserva.update({
            where: { id: Number(id) },
            data: { status: StatusReserva.CANCELADA }
        });

        res.status(200).json(reservaCancelada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível cancelar a reserva." });
    }
});


// rotas admin
router.get("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }
  const { status } = req.query;
  try {
    const reservas = await prisma.reserva.findMany({
      where: {
        status: status ? (status as StatusReserva) : undefined
      },
      include: {
        cliente: { select: { nome: true } }
      },
      orderBy: { dataReserva: 'asc' }
    });
    res.status(200).json(reservas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar as reservas." });
  }
});

router.patch("/:id/status", async (req, res) => {
    if (req.userLogadoNivel !== 2) {
        return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
    }
    const { id } = req.params;
    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
    }
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { id: Number(id) }
        });
        if (!reserva) {
            return res.status(404).json({ erro: "Reserva não encontrada." });
        }
        const reservaAtualizada = await prisma.reserva.update({
            where: { id: Number(id) },
            data: { status: result.data.status }
        });
        res.status(200).json(reservaAtualizada);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível atualizar o status da reserva." });
    }
});


export default router;