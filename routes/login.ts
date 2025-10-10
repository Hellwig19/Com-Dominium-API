import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const loginSchema = z.object({
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  senha: z.string().min(1, { message: "A senha não pode estar em branco." }),
});

router.post("/", async (req, res) => {
  const mensaPadrao = "Login ou senha incorretos"
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erro: mensaPadrao });
  }
  
  const { email, senha } = result.data;

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { email, ativo: true } 
    })
    if (!cliente || !bcrypt.compareSync(senha, cliente.senha)) {
      return res.status(400).json({ erro: mensaPadrao });
    }

    const token = jwt.sign({
      userId: cliente.id,
      userName: cliente.nome,
      userLevel: 1 
    },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    )

    res.status(200).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      token
    })

  } catch (error) {
    console.error(error); 
    res.status(500).json({ erro: "Ocorreu um erro interno. Tente novamente." });
  }
})

export default router