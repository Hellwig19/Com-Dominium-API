import { PrismaClient, StatusVisita } from "@prisma/client";
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

const limpaCpf = (valor: string) => valor ? valor.replace(/\D/g, "") : "";

router.use(verificaToken);

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
        cpf: limpaCpf(result.data.cpf),
        numeroCasa: result.data.numeroCasa,
        placa: result.data.placa ? result.data.placa.toUpperCase() : null,
        observacoes: result.data.observacoes,
        porteiroId: req.userLogadoId,
        dataEntrada: new Date(),
        status: StatusVisita.DENTRO
      }
    });
    res.status(201).json(novoVisitante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar entrada." });
  }
});

router.post("/entrada-agendada", async (req, res) => {
    const { nome, cpf, numeroCasa, placa, observacoes } = req.body;
    const cpfLimpo = limpaCpf(cpf);

    try {
        const hojeInicio = new Date(); hojeInicio.setHours(0,0,0,0);
        const hojeFim = new Date(); hojeFim.setHours(23,59,59,999);

        const existe = await prisma.visitante.findFirst({
            where: {
                cpf: cpfLimpo,
                dataEntrada: { gte: hojeInicio },
                status: 'DENTRO'
            }
        });

        if (existe) {
            return res.status(400).json({ erro: "Esta pessoa já consta como DENTRO do condomínio." });
        }

        const novoVisitante = await prisma.visitante.create({
            data: {
                nome,
                cpf: cpfLimpo,
                numeroCasa,
                placa: placa?.toUpperCase(),
                observacoes,
                porteiroId: req.userLogadoId,
                dataEntrada: new Date(),
                status: StatusVisita.DENTRO
            }
        });
        
        await prisma.visita.updateMany({
            where: { 
                cpf: cpfLimpo, 
                dataVisita: { gte: hojeInicio, lte: hojeFim }, 
                status: 'AGENDADA' 
            },
            data: { 
                status: StatusVisita.DENTRO, 
                dataEntrada: new Date() 
            }
        });
        
        await prisma.prestador.updateMany({
            where: { 
                cpf: cpfLimpo, 
                dataServico: { gte: hojeInicio, lte: hojeFim }, 
                status: 'AGENDADA' 
            },
            data: { 
                status: StatusVisita.DENTRO, 
                dataEntrada: new Date() 
            }
        });

        res.status(201).json(novoVisitante);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao registrar entrada agendada." });
    }
});

router.get("/hoje", async (req, res) => {
  try {
    const hojeInicio = new Date(); hojeInicio.setHours(0, 0, 0, 0);
    const hojeFim = new Date(); hojeFim.setHours(23, 59, 59, 999);
    
    const visitantesAtivos = await prisma.visitante.findMany({
      where: { dataEntrada: { gte: hojeInicio, lte: hojeFim } },
      orderBy: { dataEntrada: 'desc' }
    });


    const visitasAgendadas = await prisma.visita.findMany({
        where: { 
            dataVisita: { gte: hojeInicio, lte: hojeFim },
            status: 'AGENDADA' 
        },
        include: { 
            residencia: { select: { numeroCasa: true } } 
        }
    });

    const prestadoresAgendados = await prisma.prestador.findMany({
        where: { 
            dataServico: { gte: hojeInicio, lte: hojeFim },
            status: 'AGENDADA' 
        },
        include: { 
            residencia: { select: { numeroCasa: true } } 
        }
    });

    const listaAgendados = [
        ...visitasAgendadas.map(v => ({
            id: `v-${v.id}`,
            tipoOriginal: 'VISITA',
            nome: v.nome,
            cpf: v.cpf,
            numeroCasa: v.residencia?.numeroCasa || "S/N", 
            placa: null,
            status: 'AGENDADO',
            horario: v.horario, 
            dataEntrada: null
        })),
        ...prestadoresAgendados.map(p => ({
            id: `p-${p.id}`,
            tipoOriginal: 'PRESTADOR',
            nome: p.nome,
            cpf: p.cpf,
            numeroCasa: p.residencia?.numeroCasa || "S/N",
            placa: null,
            status: 'AGENDADO',
            horario: p.horario,
            dataEntrada: null
        }))
    ];

    const listaVisitantesReais = visitantesAtivos.map(v => ({
        ...v,
        tipoOriginal: 'REAL',
        status: v.status,
        horario: new Date(v.dataEntrada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }));

    res.json([...listaVisitantesReais, ...listaAgendados]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar lista unificada." });
  }
});

router.patch("/:id/saida", async (req, res) => {
  const { id } = req.params;
  try {
    const visitante = await prisma.visitante.update({
      where: { id: Number(id) },
      data: { 
          status: StatusVisita.SAIU, 
          dataSaida: new Date() 
      }
    });

    const hojeInicio = new Date(); hojeInicio.setHours(0,0,0,0);
    const hojeFim = new Date(); hojeFim.setHours(23,59,59,999);
    
    const updateData = { 
        status: StatusVisita.SAIU, 
        dataSaida: new Date() 
    };

    await prisma.visita.updateMany({
        where: { 
            cpf: visitante.cpf, 
            dataVisita: { gte: hojeInicio, lte: hojeFim }, 
            status: 'DENTRO' 
        },
        data: updateData
    });

    await prisma.prestador.updateMany({
        where: { 
            cpf: visitante.cpf, 
            dataServico: { gte: hojeInicio, lte: hojeFim }, 
            status: 'DENTRO' 
        },
        data: updateData
    });

    res.json(visitante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar saída." });
  }
});

export default router;