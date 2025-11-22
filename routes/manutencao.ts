import { PrismaClient, StatusManutencao } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const manutencaoSchema = z.object({
  titulo: z.string().min(5, "Título muito curto"),
  descricao: z.string().min(10, "Descrição muito curta"),
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const clienteId = req.userLogadoId;
  if (!clienteId) return res.status(401).json({ erro: "Autenticação necessária" });

  const result = manutencaoSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erros: result.error.errors });

  try {
    const nova = await prisma.manutencao.create({
      data: {
        ...result.data,
        clienteId,
        prioridade: false,
        status: 'PENDENTE'
      }
    });
    res.status(201).json(nova);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar solicitação" });
  }
});

router.get("/", async (req, res) => {
  const nivel = req.userLogadoNivel;
  const niveisPermitidos = [2, 3, 5]; 

  if (!nivel || !niveisPermitidos.includes(nivel)) {
     return res.status(403).json({ erro: "Acesso negado" });
  }

  try {
    const lista = await prisma.manutencao.findMany({
      orderBy: [
        { prioridade: 'desc' }, 
        { data: 'desc' }
      ],
      include: {
        cliente: {
          select: { nome: true, residencias: { select: { numeroCasa: true } } }
        }
      }
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar manutenções" });
  }
});

router.patch("/:id/prioridade", async (req, res) => {
    const { id } = req.params;
    const { prioridade } = req.body; 

    try {
        const atualizado = await prisma.manutencao.update({
            where: { id: Number(id) },
            data: { prioridade: Boolean(prioridade) }
        });
        res.json(atualizado);
    } catch (e) {
        res.status(500).json({ erro: "Erro ao mudar prioridade" });
    }
});

router.patch("/:id/concluir", async (req, res) => {
    const { id } = req.params;
    const adminNome = req.userLogadoNome || "A Administração";

    try {
        const item = await prisma.manutencao.findUnique({ where: { id: Number(id) } });
        
        if (!item) return res.status(404).json({ erro: "Item não encontrado" });

        await prisma.manutencao.update({
            where: { id: Number(id) },
            data: { status: 'CONCLUIDO' }
        });

        await prisma.notificacao.create({
            data: {
                clienteId: item.clienteId,
                mensagem: `Sua solicitação "${item.titulo}" foi concluída por ${adminNome}.`,
                lida: false
            }
        });

        res.json({ message: "Concluído e notificado com sucesso." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro ao concluir solicitação" });
    }
});

export default router;