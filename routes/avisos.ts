

import { PrismaClient, TipoAviso } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const avisoSchema = z.object({
  titulo: z.string().min(5, { message: "O título deve ter no mínimo 5 caracteres." }),
  descricao: z.string().min(10, { message: "A descrição deve ter no mínimo 10 caracteres." }),
  tipo: z.nativeEnum(TipoAviso).optional(), 
});

router.use(verificaToken);

router.get("/", async (req, res) => {
  try {
    const avisos = await prisma.aviso.findMany({
      orderBy: { data: 'desc' },
      include: {
        admin: {
          select: { nome: true }
        }
      }
    });
    res.status(200).json(avisos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os avisos." });
  }
});

router.post("/", async (req, res) => {
  if (req.userLogadoNivel !== 5) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  const result = avisoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const adminId = req.userLogadoId;
  if (!adminId) {
      return res.status(401).json({ erro: "ID do administrador não encontrado no token." });
  }

  try {
    const novoAviso = await prisma.aviso.create({
      data: {
        titulo: result.data.titulo,
        descricao: result.data.descricao,
        tipo: result.data.tipo, 
        adminId,
      },
    });
    res.status(201).json(novoAviso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível criar o aviso." });
  }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const adminId = req.userLogadoId;

    if (req.userLogadoNivel !== 5) {
        return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
    }

    try {
        const aviso = await prisma.aviso.findFirst({
            where: { id: Number(id), adminId }
        });

        if (!aviso) {
            return res.status(404).json({ erro: "Aviso não encontrado ou você não tem permissão para excluí-lo." });
        }

        await prisma.aviso.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: "Aviso removido com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Não foi possível remover o aviso." });
    }
});


export default router;