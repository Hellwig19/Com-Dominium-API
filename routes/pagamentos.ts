import { PrismaClient, StatusPagamento, MetodoPagamento, StatusReserva } from "@prisma/client";
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken"; 

const prisma = new PrismaClient();
const router = Router();

const pagamentoSchema = z.object({
  boletos: z.string().min(5, { message: "A informação do boleto é muito curta." }),
  dataVencimento: z.string().datetime({ message: "Formato de data de vencimento inválido." }),
  valor: z.number().positive({ message: "O valor deve ser um número positivo." }),
  metodoPagamento: z.nativeEnum(MetodoPagamento),
  clienteId: z.string().uuid({ message: "O ID do cliente é obrigatório." })
});

router.use(verificaToken);

router.post("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  const result = pagamentoSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { clienteId, ...dadosPagamento } = result.data;

  try {
    const [cliente] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId } })   
     ]);

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrados." });
    }

    const novoPagamento = await prisma.pagamento.create({
      data: {
        ...dadosPagamento,
        dataVencimento: new Date(dadosPagamento.dataVencimento),
        status: StatusPagamento.PENDENTE,
        dataPagamento: new Date(),
        clienteId
      },
    });
    res.status(201).json(novoPagamento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível criar o lançamento de pagamento." });
  }
});

router.get("/", async (req, res) => {
  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }

  try {
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        cliente: { select: { nome: true } }
      },
      orderBy: { dataVencimento: 'desc' }
    });
    res.status(200).json(pagamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os pagamentos." });
  }
});

router.patch("/:id/confirmar", async (req, res) => {
  const { id } = req.params;

  if (req.userLogadoNivel !== 2) {
    return res.status(403).json({ erro: "Acesso negado: rota exclusiva para administradores." });
  }
  
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: Number(id) }
    });

    if (!pagamento) {
      return res.status(404).json({ erro: "Lançamento de pagamento não encontrado." });
    }

    const pagamentoConfirmado = await prisma.pagamento.update({
      where: { id: Number(id) },
      data: {
        status: StatusPagamento.PAGO,
        dataPagamento: new Date() 
      }
    });
    res.status(200).json(pagamentoConfirmado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível confirmar o pagamento." });
  }
});

router.post("/:id/pagar", async (req, res) => {
  const { id } = req.params;
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const pagamento = await prisma.pagamento.findFirst({
      where: { 
        id: Number(id),
        clienteId: clienteId
      }
    });

    if (!pagamento) {
      return res.status(404).json({ erro: "Pagamento não encontrado." });
    }

    if (pagamento.status === StatusPagamento.PAGO) {
      return res.status(400).json({ erro: "Este boleto já foi pago." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.update({
        where: { id: pagamento.id },
        data: {
          status: StatusPagamento.PAGO,
          dataPagamento: new Date(),
          metodoPagamento: MetodoPagamento.PIX
        }
      });

      if (pagamento.boletos.startsWith("Reserva:")) {
        const reservaPendente = await tx.reserva.findFirst({
            where: {
                clienteId: clienteId,
                status: StatusReserva.PENDENTE,
                valor: pagamento.valor,
            }
        });

        if (reservaPendente) {
            await tx.reserva.update({
                where: { id: reservaPendente.id },
                data: { status: StatusReserva.CONFIRMADA }
            });
        }
      }
    });

    res.status(200).json({ mensagem: "Pagamento realizado e reserva confirmada (se aplicável)." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao processar pagamento." });
  }
});

router.get("/meus/proximo", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const proximoPagamento = await prisma.pagamento.findFirst({
      where: {
        clienteId: clienteId,
        status: 'PENDENTE' 
      },
      orderBy: { 
        dataVencimento: 'asc' 
      } 
    });

    res.status(200).json(proximoPagamento); 

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível buscar o próximo pagamento." });
  }
});

router.get("/meus", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: { clienteId },
      orderBy: { dataVencimento: 'desc' }
    });
    res.status(200).json(pagamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar seus pagamentos." });
  }
});

export default router;