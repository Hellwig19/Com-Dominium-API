import { PrismaClient, StatusVisita } from "@prisma/client"; // Certifique-se de importar StatusVisita
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const visitanteSchema = z.object({
  nome: z.string().min(3, { message: "Nome obrigatório" }),
  cpf: z.string().length(11, { message: "CPF deve ter 11 dígitos" }),
  numeroCasa: z.string().min(1, { message: "Número da casa obrigatório" }),
  placa: z.string().optional(),
  observacoes: z.string().optional(),
});

router.use(verificaToken);

// 1. REGISTRAR ENTRADA
router.post("/", async (req, res) => {
  const nivel = req.userLogadoNivel;
  if (!nivel || (nivel !== 3 && nivel !== 2 && nivel !== 5)) {
      return res.status(403).json({ erro: "Acesso negado." });
  }

  const result = visitanteSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ erros: result.error.errors });

  try {
    const novoVisitante = await prisma.visitante.create({
      data: {
        nome: result.data.nome,
        cpf: result.data.cpf,
        numeroCasa: result.data.numeroCasa,
        placa: result.data.placa ? result.data.placa.toUpperCase() : null,
        observacoes: result.data.observacoes,
        porteiroId: req.userLogadoId,
        
        dataEntrada: new Date(),
        status: StatusVisita.DENTRO // Garante que entra como DENTRO
      }
    });
    res.status(201).json(novoVisitante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar entrada." });
  }
});

// 2. LISTAR VISITANTES DO DIA
router.get("/hoje", async (req, res) => {
  try {
    const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0);
    const hojeFim = new Date(); hojeFim.setHours(23, 59, 59, 999);

    const visitantes = await prisma.visitante.findMany({
      where: {
        dataEntrada: { gte: hojeInicio, lte: hojeFim }
      },
      orderBy: { dataEntrada: 'desc' }
    });
    res.json(visitantes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lista." });
  }
});

// 3. REGISTRAR SAÍDA (A CORREÇÃO ESTÁ AQUI)
router.patch("/:id/saida", async (req, res) => {
  const { id } = req.params;
  try {
    const visitante = await prisma.visitante.update({
      where: { id: Number(id) },
      data: { 
          status: StatusVisita.SAIU, // <--- ESSA LINHA É ESSENCIAL PARA MUDAR O BOTÃO
          dataSaida: new Date() 
      }
    });
    res.json(visitante);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao registrar saída." });
  }
});

export default router;