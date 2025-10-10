import { PrismaClient, TipoMorador } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const moradorSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres." }),
  parentesco: z.string().min(3, { message: "O parentesco deve ter no mínimo 3 caracteres." }),
  dataNasc: z.string().datetime({ message: "Formato de data inválido." }),
  cpf: z.string().length(11, { message: "O CPF deve ter exatamente 11 dígitos." }),
  email: z.string().email({ message: "Formato de e-mail inválido." }).optional().or(z.literal('')),
  contato: z.string().min(10, { message: "O contato deve ter no mínimo 10 dígitos." }),
  tipoMorador: z.nativeEnum(TipoMorador),
  residenciaId: z.number().int().positive({ message: "O ID da residência é obrigatório." })
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  const result = moradorSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { residenciaId, ...dadosMorador } = result.data;

  try {
    const residencia = await prisma.residencia.findFirst({
      where: { id: residenciaId, clienteId }
    });

    if (!residencia) {
      return res.status(403).json({ erro: "Acesso negado. A residência não pertence a este usuário." });
    }

    const novoMorador = await prisma.morador.create({
      data: {
        ...dadosMorador,
        dataNasc: new Date(dadosMorador.dataNasc),
        residenciaId,
        clienteId, 
      },
    });
    res.status(201).json(novoMorador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível adicionar o morador." });
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

    const moradores = await prisma.morador.findMany({
      where: { residenciaId: Number(residenciaId) }
    });
    res.status(200).json(moradores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os moradores." });
  }
});

router.delete("/:id", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { id } = req.params;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const morador = await prisma.morador.findFirst({
      where: { id: Number(id), clienteId }
    });

    if (!morador) {
      return res.status(404).json({ erro: "Morador não encontrado ou não pertence a este usuário." });
    }

    await prisma.morador.delete({
      where: { id: Number(id) }
    });
    res.status(200).json({ message: "Morador removido com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível remover o morador." });
  }
});

export default router;