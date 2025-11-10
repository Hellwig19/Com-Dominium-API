import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const loginSchema = z.object({
  cpf: z.string().length(11, { message: "O CPF deve ter 11 dígitos." }),
  senha: z.string().min(1, { message: "A senha não pode estar em branco." }),
});

router.post("/", async (req, res) => {
  
  // --- DEBUG 1 ---
  // Vamos ver exatamente o que o seu app está enviando.
  console.log("Recebido na API:", req.body);
  
  const mensaPadrao = "CPF ou senha incorretos"
  const result = loginSchema.safeParse(req.body);
  
  if (!result.success) {
    // Se a validação falhar (ex: CPF com 10 dígitos)
    console.log("Falha na validação do Zod:", result.error.errors);
    return res.status(400).json({ erro: mensaPadrao });
  }
  
  const { cpf, senha } = result.data;

  try {
    // --- DEBUG 2 ---
    // Vamos procurar o cliente no banco
    console.log(`Procurando cliente com CPF: ${cpf}`);
    const cliente = await prisma.cliente.findFirst({
      where: { cpf, ativo: true } 
    })

    // --- DEBUG 3 ---
    // Vamos ver se o cliente foi encontrado
    console.log("Cliente encontrado no banco:", cliente);

    if (!cliente || !bcrypt.compareSync(senha, cliente.senha)) {
      // Se falhar, vamos logar o motivo
      if (!cliente) {
        console.log("Motivo da falha: Cliente não encontrado com o CPF:", cpf);
      } else {
        console.log("Motivo da falha: bcrypt.compareSync falhou (senha errada).");
        console.log("Senha recebida (do app):", senha);
        console.log("Senha no banco (hash):", cliente.senha);
      }
      return res.status(400).json({ erro: mensaPadrao });
    }

    // Se chegou aqui, o login funcionou
    console.log("Login bem-sucedido! Gerando token...");

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
    console.error("Erro catastrófico no /login:", error); 
    res.status(500).json({ erro: "Ocorreu um erro interno. Tente novamente." });
  }
})

export default router