// Em routes/adminLogin.ts

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  cpf: z.string().length(11, { message: "O CPF deve conter 11 dígitos." }),
  senha: z.string().min(1, { message: "A senha não pode estar em branco." }),
});

router.post("/", async (req, res) => {
  const mensaPadrao = "CPF ou senha incorretos";

  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ erro: mensaPadrao });
  }
  
  const { cpf, senha } = result.data;

  try {
    const admin = await prisma.admin.findFirst({
      where: { 
        cpf,
        ativo: true
      }
    });

    if (!admin || !bcrypt.compareSync(senha, admin.senha)) {
      return res.status(400).json({ erro: mensaPadrao });
    }

    const token = jwt.sign({
      userId: admin.id,
      userName: admin.nome,
      userLevel: admin.nivel
    },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      id: admin.id,
      nome: admin.nome,
      nivel: admin.nivel,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
  }
});

export default router;