import { PrismaClient, EstadoCivil } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaToken } from "../middlewares/verificaToken" 

const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(10, { message: "O nome deve ter no mínimo 10 caracteres." }),
  cpf: z.string().length(11, { message: "O CPF deve ter exatamente 11 dígitos." }),
  rg: z.string().min(7, { message: "O RG deve ter no mínimo 7 dígitos." }),
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  dataNasc: z.string().datetime({ message: "Formato de data inválido." }),
  estadoCivil: z.nativeEnum(EstadoCivil, { errorMap: () => ({ message: "Selecione um estado civil válido." }) }),
  profissao: z.string().min(3, { message: "A profissão deve ter no mínimo 3 caracteres." }),
  senha: z.string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número." })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um símbolo." }),
});

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true }
    });
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível carregar os clientes." });
  }
});

router.post("/", async (req, res) => {
  const result = clienteSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => e.message) });
  }

  const { nome, cpf, rg, email, dataNasc, estadoCivil, profissao, senha } = result.data;

  try {
    const clienteExistente = await prisma.cliente.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });
    if (clienteExistente) {
      return res.status(400).json({ erro: "CPF ou E-mail já cadastrado." });
    }

    const salt = bcrypt.genSaltSync(12);
    const hashSenha = bcrypt.hashSync(senha, salt);

    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        cpf,
        rg,
        email,
        dataNasc: new Date(dataNasc),
        estadoCivil,
        profissao,
        senha: hashSenha,
      },
    });
    res.status(201).json(novoCliente);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar novo cliente." });
  }
});

router.delete("/:id", verificaToken, async (req, res) => {
    const { id } = req.params;

    try {
        const cliente = await prisma.cliente.update({
            where: { id },
            data: { ativo: false }
        });

        const adminId = req.userLogadoId as string; 
        const adminNome = req.userLogadoNome as string; 

        await prisma.log.create({
            data: {
                descricao: `Exclusão (lógica) do cliente: ${cliente.nome}`,
                complemento: `Admin responsável: ${adminNome}`,
                adminId,
            }
        });

        res.status(200).json({ message: "Cliente desativado com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível desativar o cliente." });
    }
});

export default router;