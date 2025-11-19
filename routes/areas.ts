import { PrismaClient, StatusArea } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();
const areaSchema = z.object({
  nome: z.string(),
  capacidade: z.number(),
  preco: z.number(),
  status: z.enum([StatusArea.ATIVO, StatusArea.MANUTENCAO, StatusArea.INATIVO, StatusArea.OCUPADO]),
});

router.use(verificaToken); 

router.get("/", async (req, res) => {
  try {
    const areas = await prisma.areaComum.findMany({ orderBy: { id: 'asc' } });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar áreas." });
  }
});

router.put("/:id", async (req, res) => {
  if (req.userLogadoNivel !== 5) return res.status(403).json({ erro: "Acesso negado." });

  const { id } = req.params;
  
  const bodyFormatado = {
      ...req.body,
      preco: Number(req.body.preco),
      capacidade: Number(req.body.capacidade)
  };

  const result = areaSchema.safeParse(bodyFormatado);

  if (!result.success) {
      console.log("Erro de validação:", result.error);
      return res.status(400).json(result.error);
  }

  try {
    const areaAtualizada = await prisma.areaComum.update({
      where: { id: Number(id) },
      data: {
          nome: result.data.nome,
          preco: result.data.preco,
          status: result.data.status,
          capacidade: result.data.capacidade 
      }
    });
    res.json(areaAtualizada);
  } catch (error) {
    console.error("Erro no update:", error);
    res.status(500).json({ erro: "Erro ao atualizar área no banco." });
  }
});

router.get("/status-dia", async (req, res) => {
    const { data } = req.query;

    let dataAlvo = new Date();
    if (data) {
        dataAlvo = new Date(`${String(data)}T12:00:00.000Z`); 
    }

    const inicioDia = new Date(dataAlvo); inicioDia.setUTCHours(0,0,0,0);
    const fimDia = new Date(dataAlvo); fimDia.setUTCHours(23,59,59,999);

    try {
        const areas = await prisma.areaComum.findMany({
            include: {
                reservas: {
                    where: {
                        dataReserva: { gte: inicioDia, lte: fimDia },
                        status: 'CONFIRMADA'
                    }
                }
            },
            orderBy: { id: 'asc' }
        });

        const statusAreas = areas.map(area => {
            let statusFinal = "Disponível";
          
            if (area.status === 'MANUTENCAO') statusFinal = "Manutenção";
            else if (area.status === 'INATIVO') statusFinal = "Inativo";
            else if (area.status === 'OCUPADO') statusFinal = "Ocupado (Fixo)"; 
            else if (area.reservas.length > 0) statusFinal = "Ocupado"; 

            return {
                id: area.id,
                nome: area.nome,
                capacidade: area.capacidade,
                preco: area.preco,
                statusConfig: area.status, 
                statusHoje: statusFinal
            };
        });

        res.json(statusAreas);
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: "Erro ao buscar status." });
    }
});

export default router;