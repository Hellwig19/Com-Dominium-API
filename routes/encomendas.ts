import { PrismaClient, StatusEncomenda } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const gerarCodigoRetirada = (): string => {
  const codigo = Math.floor(1000 + Math.random() * 9000).toString();
  return `#${codigo}`;
}

const encomendaSchema = z.object({
  nome: z.string().min(3, { message: "Nome do destinatário obrigatório." }),
  remetente: z.string().min(3, { message: "Remetente/Transportadora obrigatório." }),
  tamanho: z.string().min(1, { message: "Tamanho obrigatório." }),
  numeroCasa: z.string().min(1, { message: "Número da casa obrigatório." }),
  codigorastreio: z.string().optional(),
  tipo: z.string().optional(),
  observacoes: z.string().optional(),
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  const nivel = req.userLogadoNivel;
  if (!nivel || (nivel !== 3 && nivel !== 2 && nivel !== 5)) {
      return res.status(403).json({ erro: "Acesso negado." });
  }

  const result = encomendaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const adminId = req.userLogadoId;
  const { numeroCasa, ...dadosEncomenda } = result.data;

  try {
    const residencia = await prisma.residencia.findFirst({
        where: { numeroCasa: numeroCasa },
        include: { cliente: { select: { id: true, nome: true, email: true } } }
    });

    if (!residencia) {
        return res.status(404).json({ erro: `Casa número ${numeroCasa} não encontrada.` });
    }

    const codigoUnico = gerarCodigoRetirada();

    const novaEncomenda = await prisma.encomendas.create({
      data: {
        nome: dadosEncomenda.nome,
        remetente: dadosEncomenda.remetente,
        tamanho: dadosEncomenda.tamanho,
        
        tipo: dadosEncomenda.tipo || "Encomenda",
        observacoes: dadosEncomenda.observacoes,
        
        codigorastreio: dadosEncomenda.codigorastreio, 

        codigo: codigoUnico,
        status: StatusEncomenda.AGUARDANDO_RETIRADA,
        
        clienteId: residencia.clienteId,
        adminRegistroId: adminId,
      },
    });

    console.log(`[SIMULAÇÃO] Notificar cliente ${residencia.cliente.nome} (ID: ${residencia.cliente.id}) sobre código ${codigoUnico}`);

    res.status(201).json(novaEncomenda);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível registrar a encomenda." });
  }
});

router.get("/minhas", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const encomendas = await prisma.encomendas.findMany({
      where: { clienteId },
      orderBy: { dataChegada: 'desc' },
      select: {
        id: true,
        remetente: true,
        dataChegada: true,
        dataRetirada: true,
        status: true,
        tamanho: true,
        codigorastreio: true,
        codigo: true
      }
    });
    res.status(200).json(encomendas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar suas encomendas." });
  }
});

router.get("/", async (req, res) => {
    const nivel = req.userLogadoNivel;
    if (!nivel || (nivel !== 3 && nivel !== 2 && nivel !== 5)) return res.status(403).json({ erro: "Acesso negado." });

    try {
        const encomendas = await prisma.encomendas.findMany({
            orderBy: { dataChegada: 'desc' },
            include: {
                cliente: {
                    select: { 
                        nome: true,
                        residencias: { select: { numeroCasa: true } }
                    }
                }
            }
        });
        res.json(encomendas);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar encomendas." });
    }
});

router.post("/retirar-codigo", async (req, res) => {
    const { codigo } = req.body;
    const adminId = req.userLogadoId;

    if (!codigo) return res.status(400).json({ erro: "Código obrigatório." });

    try {
        const encomenda = await prisma.encomendas.findFirst({
            where: { 
                codigo: codigo,
                status: StatusEncomenda.AGUARDANDO_RETIRADA
            }
        });

        if (!encomenda) {
            return res.status(404).json({ erro: "Código inválido ou encomenda já retirada." });
        }

        const atualizada = await prisma.encomendas.update({
            where: { id: encomenda.id },
            data: {
                status: StatusEncomenda.ENTREGUE,
                dataRetirada: new Date(),
                adminEntregaId: adminId
            }
        });

        res.json(atualizada);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao validar código." });
    }
});

router.patch("/:id/retirar", async (req, res) => {
  const { id } = req.params;
  const adminId = req.userLogadoId;

  try {
    const encomenda = await prisma.encomendas.update({
      where: { id: Number(id) },
      data: {
        status: StatusEncomenda.ENTREGUE,
        dataRetirada: new Date(),
        adminEntregaId: adminId,
      }
    });
    res.status(200).json(encomenda);
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar o status." });
  }
});

export default router;