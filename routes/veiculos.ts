import { PrismaClient, TipoVeiculo } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const veiculoSchema = z.object({
  marca: z.string().min(2, { message: "A marca deve ter no mínimo 2 caracteres." }),
  modelo: z.string().min(2, { message: "O modelo deve ter no mínimo 2 caracteres." }),
  ano: z.number().int().positive().min(1950, { message: "O ano do veículo parece inválido." }),
  cor: z.string().min(3, { message: "A cor deve ter no mínimo 3 caracteres." }),
  placa: z.string().length(7, { message: "A placa deve ter exatamente 7 caracteres." }),
  garagem: z.string().max(4, { message: "A garagem deve ter no máximo 4 caracteres." }),
  TipoVeiculo: z.nativeEnum(TipoVeiculo),
  residenciaId: z.number().int().positive({ message: "O ID da residência é obrigatório." })
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;
  const clienteNome = req.userLogadoNome; 

  if (!clienteId || !clienteNome) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = veiculoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { residenciaId, ...dadosVeiculo } = result.data;

  try {
    const residencia = await prisma.residencia.findFirst({
      where: { id: residenciaId, clienteId }
    });

    if (!residencia) {
      return res.status(403).json({ erro: "Acesso negado. A residência não pertence a este usuário." });
    }

    const novoVeiculo = await prisma.veiculo.create({
      data: {
        ...dadosVeiculo,
        proprietario: clienteNome,
        residenciaId,
        clienteId,
      },
    });
    res.status(201).json(novoVeiculo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível adicionar o veículo." });
  }
});

router.get("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const veiculos = await prisma.veiculo.findMany({
      where: { clienteId }
    });
    res.status(200).json(veiculos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os veículos." });
  }
});

router.put("/:id", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { id } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  
  const veiculoUpdateSchema = veiculoSchema.partial();
  const result = veiculoUpdateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  try {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!veiculo) {
      return res.status(404).json({ erro: "Veículo não encontrado ou não pertence a este usuário." });
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: result.data
    });

    res.status(200).json(veiculoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível atualizar o veículo." });
  }
});

router.delete("/:id", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { id } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const veiculo = await prisma.veiculo.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!veiculo) {
      return res.status(404).json({ erro: "Veículo não encontrado ou não pertence a este usuário." });
    }

    await prisma.veiculo.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({ message: "Veículo removido com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível remover o veículo." });
  }
});

export default router;