import { PrismaClient, StatusVotacao } from "@prisma/client"
import { Router } from "express";
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const votacaoSchema = z.object({
    titulo: z.string().min(5),
    descricao: z.string().min(10),
    dataInicio: z.string().datetime(),
    dataFim: z.string().datetime(),
    opcoes: z.array(z.string().min(1)).min(2, { message: "A votação deve ter pelo menos 2 opções." })
});

const votoSchema = z.object({
    opcaoId: z.number().int().positive()
});

router.use(verificaToken);


router.post("/", async (req, res) => {
    if (req.userLogadoNivel !== 2) {
        return res.status(403).json({ erro: "Acesso negado." });
    }

    const result = votacaoSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ erros: result.error.formErrors.fieldErrors });
    }

    const { titulo, descricao, dataInicio, dataFim, opcoes } = result.data;
    const adminId = req.userLogadoId as string;

    try {
        const novaVotacao = await prisma.votacao.create({
            data: {
                titulo,
                descricao,
                dataInicio: new Date(dataInicio),
                dataFim: new Date(dataFim),
                adminId,
                opcoes: {
                    create: opcoes.map(textoDaOpcao => ({ texto: textoDaOpcao }))
                }
            },
            include: {
                opcoes: true
            }
        });
        res.status(201).json(novaVotacao);
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível criar a votação." });
    }
});

router.get("/", async (req, res) => {
    try {
        const votacoes = await prisma.votacao.findMany({
            orderBy: { dataInicio: 'desc' }
        });
        res.status(200).json(votacoes);
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível carregar as votações." });
    }
});

router.post("/:id/votar", async (req, res) => {
    const clienteId = req.userLogadoId as string;
    const { id: votacaoId } = req.params;

    const result = votoSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ erros: result.error.formErrors.fieldErrors });
    }
    const { opcaoId } = result.data;

    try {
        const votacao = await prisma.votacao.findUnique({ where: { id: Number(votacaoId) } });
        if (!votacao) {
            return res.status(404).json({ erro: "Votação não encontrada." });
        }

        const now = new Date();
        if (now < votacao.dataInicio || now > votacao.dataFim) {
            return res.status(403).json({ erro: "Esta votação não está ativa." });
        }

        await prisma.voto.create({
            data: {
                clienteId,
                votacaoId: Number(votacaoId),
                opcaoId,
            }
        });

        res.status(201).json({ message: "Voto registrado com sucesso!" });
    } catch (error: any) {
        if (error.code === 'P2002') { 
            return res.status(409).json({ erro: "Você já votou nesta votação." });
        }
        res.status(500).json({ erro: "Não foi possível registrar o voto." });
    }
});

router.get("/:id/resultados", async (req, res) => {
    const { id: votacaoId } = req.params;

    try {
        const votacao = await prisma.votacao.findUnique({
            where: { id: Number(votacaoId) },
            include: {
                opcoes: true, 
            }
        });

        if (!votacao) {
            return res.status(404).json({ erro: "Votação não encontrada." });
        }
        
        const contagemDeVotos = await prisma.voto.groupBy({
            by: ['opcaoId'],
            where: { votacaoId: Number(votacaoId) },
            _count: {
                _all: true
            }
        });
        
        const resultados = votacao.opcoes.map(opcao => {
            const contagem = contagemDeVotos.find(v => v.opcaoId === opcao.id);
            return {
                opcao: opcao.texto,
                votos: contagem ? contagem._count._all : 0
            };
        });

        res.status(200).json({
            titulo: votacao.titulo,
            resultados,
        });

    } catch (error) {
        res.status(500).json({ erro: "Não foi possível obter os resultados." });
    }
});


export default router;