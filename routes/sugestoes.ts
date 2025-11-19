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

router.use(verificaToken);

// 1. CRIAR SUGESTÃO (Disponível para todos logados)
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
      },
    });
    res.status(201).json(novaSugestao);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível enviar a sugestão." });
  }
});

// 2. MINHAS SUGESTÕES (Para o morador ver as dele)
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

// 3. LISTAR TODAS (Para Admin, Porteiro e Zeladora)
router.get("/", async (req, res) => {
  const nivel = req.userLogadoNivel;
  
  // IDs de permissão: 2=Admin, 3=Porteiro, 5=Zeladora
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
                    select: { numeroCasa: true } // Necessário para o frontend
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

// 4. DELETAR SUGESTÃO
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

        // Quem pode apagar?
        // 1. O dono da sugestão
        // 2. Admin (Nível 2)
        // 3. Zeladora (Nível 5) - Para marcar como resolvido/limpar
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