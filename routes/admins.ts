import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaToken } from "../middlewares/verificaToken" 

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
  nome: z.string().min(10, { message: "O nome deve ter no mínimo 10 caracteres." }),
  cpf: z.string().length(11, { message: "O CPF deve ter exatamente 11 dígitos." }),
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  senha: z.string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um símbolo." }),
  nivel: z.number()
    .min(1, { message: "O nível deve ser no mínimo 1." })
    .max(5, { message: "O nível deve ser no máximo 5." })
});

router.use(verificaToken);

router.get("/", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      where: { ativo: true }
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível carregar os administradores." });
  }
});

router.post("/", async (req, res) => {
  const result = adminSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { nome, cpf, email, senha, nivel } = result.data;

  try {
    const adminExistente = await prisma.admin.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });
    if (adminExistente) {
      return res.status(400).json({ erro: "CPF ou E-mail já cadastrado." });
    }

    const salt = bcrypt.genSaltSync(12);
    const hashSenha = bcrypt.hashSync(senha, salt);

    const novoAdmin = await prisma.admin.create({
      data: {
        nome,
        cpf,
        email,
        senha: hashSenha,
        nivel,
      },
    });
    const { senha: _, ...adminSemSenha } = novoAdmin;
    res.status(201).json(adminSemSenha);

  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar novo administrador." });
  }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const adminLogadoId = req.userLogadoId as string;
    if (id === adminLogadoId) {
        return res.status(403).json({ erro: "Não é permitido se auto-desativar." });
    }

    try {
        const admin = await prisma.admin.update({
            where: { id },
            data: { ativo: false }
        });
        const adminNome = req.userLogadoNome as string;
        await prisma.log.create({
            data: {
                descricao: `Desativação do admin: ${admin.nome}`,
                complemento: `Admin responsável: ${adminNome}`,
                adminId: adminLogadoId,
            }
        });

        res.status(200).json({ message: "Administrador desativado com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível desativar o administrador." });
    }
});


const adminUpdateSchema = adminSchema.partial();
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const result = adminUpdateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
    }
    const dados = result.data;
    if (dados.senha) {
      const salt = bcrypt.genSaltSync(12);
      dados.senha = bcrypt.hashSync(dados.senha, salt);
    }

    try {
      const adminAtualizado = await prisma.admin.update({
        where: { id },
        data: dados
      });

      const { senha: _, ...adminSemSenha } = adminAtualizado;
      res.status(200).json(adminSemSenha);
    } catch (error) {
      res.status(500).json({ erro: "Não foi possível atualizar o administrador." });
    }
});


export default router;