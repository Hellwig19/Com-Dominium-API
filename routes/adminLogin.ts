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
    const admin = await prisma.admin.findFirst({
      where: { 
        email,
        ativo: true 
      }
    })

    if (!admin) {
      return res.status(400).json({ erro: mensaPadrao });
    }

    const senhaValida = bcrypt.compareSync(senha, admin.senha);

    if (senhaValida) {
      const token = jwt.sign({
        userId: admin.id,
        userName: admin.nome,
        userLevel: admin.nivel
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      res.status(200).json({
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        nivel: admin.nivel,
        token
      })
    } else {
      await prisma.log.create({
        data: { 
          descricao: `Tentativa de acesso inválida para o e-mail: ${email}`,
          complemento: `ID do Admin: ${admin.id}`,
          adminId: admin.id 
        }
      })

      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    console.error(error); 
    res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
  }
})

export default router