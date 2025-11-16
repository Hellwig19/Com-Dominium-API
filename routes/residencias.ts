import { PrismaClient, Tipo } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const residenciaSchema = z.object({
  numeroCasa: z.string().max(4, { message: "O número da casa deve ter no máximo 4 caracteres." }),
  rua: z.string().min(3, { message: "O nome da rua deve ter no mínimo 3 caracteres." }),
  dataResidencia: z.string().datetime({ message: "Formato de data inválido." }),
  Tipo: z.nativeEnum(Tipo, { errorMap: () => ({ message: "Selecione um tipo válido (CASA ou APARTAMENTO)." }) }),
  clienteId: z.string().uuid({ message: "O ID do cliente deve ser um UUID válido." })
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  const result = residenciaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { numeroCasa, rua, dataResidencia, Tipo, clienteId } = result.data;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    const novaResidencia = await prisma.residencia.create({
      data: {
        numeroCasa,
        rua,
        dataResidencia: new Date(dataResidencia),
        Tipo,
        clienteId,
        proprietario: cliente.nome, 
      },
    });
    res.status(201).json(novaResidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível criar a residência." });
  }
});

router.get("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }
  
  try {
    const residencias = await prisma.residencia.findMany({
      include: {
        cliente: { select: { nome: true } } 
      }
    });
    res.status(200).json(residencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar as residências." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  try {

    await prisma.residencia.delete({
      where: { id: Number(id) }, 
    });
    res.status(200).json({ message: "Residência removida com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível remover a residência. Verifique se há registros associados." });
  }
});

router.get("/minha-principal", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
      const residencia = await prisma.residencia.findFirst({
          where: { clienteId: clienteId },
          select: { id: true, numeroCasa: true, rua: true }
      });

      if (!residencia) {
          return res.status(404).json({ erro: "Nenhuma residência encontrada para este usuário." });
      }
      
      res.status(200).json(residencia);

  } catch (error) {
      console.error(error);
      res.status(500).json({ erro: "Não foi possível carregar a residência." });
  }
});


router.get("/minhas", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }
  
  try {
    const residencias = await prisma.residencia.findMany({
      where: { clienteId }
    });
    res.status(200).json(residencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar suas residências." });
  }
});


export default router;