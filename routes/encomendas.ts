import { PrismaClient, StatusEncomenda } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient();
const router = Router();

const encomendaSchema = z.object({
  nome: z.string().min(3, { message: "O nome do destinatário é obrigatório." }),
  remetente: z.string().min(3, { message: "O nome do remetente é obrigatório." }),
  tamanho: z.string().min(1, { message: "O tamanho da encomenda é obrigatório." }),
  clienteId: z.string().uuid({ message: "O ID do cliente é obrigatório." }),
  codigo: z.string().optional(),
  codigorastreio: z.string().optional(),
});

router.use(verificaToken);

// rotas admin
router.post("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  const result = encomendaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const adminId = req.userLogadoId;
  const { clienteId, ...dadosEncomenda } = result.data;

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    const novaEncomenda = await prisma.encomendas.create({
      data: {
        ...dadosEncomenda,
        clienteId,
        adminRegistroId: adminId,
      },
    });
    res.status(201).json(novaEncomenda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível registrar a encomenda." });
  }
});

router.patch("/:id/retirar", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  const { id } = req.params;
  const adminId = req.userLogadoId;

  try {
    const encomenda = await prisma.encomendas.findUnique({ where: { id: Number(id) } });
    if (!encomenda) {
      return res.status(404).json({ erro: "Encomenda não encontrada." });
    }

    const encomendaEntregue = await prisma.encomendas.update({
      where: { id: Number(id) },
      data: {
        status: StatusEncomenda.ENTREGUE,
        dataRetirada: new Date(),
        adminEntregaId: adminId,
      }
    });
    res.status(200).json(encomendaEntregue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível atualizar o status da encomenda." });
  }
});

// rotas clientes
router.get("/minhas", async (req, res) => {
  const clienteId = req.userLogadoId;
  const { status } = req.query; 

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const encomendas = await prisma.encomendas.findMany({
      where: { 
        clienteId,
        status: status ? (status as StatusEncomenda) : undefined
      },
      orderBy: { dataChegada: 'desc' }
    });
    res.status(200).json(encomendas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar suas encomendas." });
  }
});

export default router;