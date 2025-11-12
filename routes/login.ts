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
  
  console.log("Recebido na API:", req.body);
  
  const mensaPadrao = "CPF ou senha incorretos"
  const result = loginSchema.safeParse(req.body);
  
  if (!result.success) {
    console.log("Falha na validação do Zod:", result.error.errors);
    return res.status(400).json({ erro: mensaPadrao });
  }
  
  const { cpf, senha } = result.data;

  try {
    console.log(`Procurando cliente com CPF: ${cpf}`);
    const cliente = await prisma.cliente.findFirst({
      where: { cpf, ativo: true } 
    })

    console.log("Cliente encontrado no banco:", cliente);

    if (!cliente || !bcrypt.compareSync(senha, cliente.senha)) {
      if (!cliente) {
        console.log("Motivo da falha: Cliente não encontrado com o CPF:", cpf);
      } else {
        console.log("Motivo da falha: bcrypt.compareSync falhou (senha errada).");
      }
      return res.status(400).json({ erro: mensaPadrao });
    }

    console.log("Login bem-sucedido! Buscando residência...");

    // --- LÓGICA PARA BUSCAR A RESIDÊNCIA ---
    // Após o login, buscamos a primeira residência associada a esse cliente
    const residencia = await prisma.residencia.findFirst({
      where: { clienteId: cliente.id },
      select: { numeroCasa: true } // Selecionamos apenas o número da casa
    });

    // Pega o número da casa, ou 'null' se não encontrar
    const numeroCasa = residencia?.numeroCasa || null; 
    console.log("Residência encontrada:", numeroCasa);
    // --- FIM DA LÓGICA ---

    const token = jwt.sign({
      userId: cliente.id,
      userName: cliente.nome,
      userLevel: 1 
    },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    )

    // --- RESPOSTA ATUALIZADA ---
    // Agora enviamos o 'numeroCasa' junto com os outros dados
    res.status(200).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email, 
      numeroCasa: numeroCasa, // <<< CAMPO ADICIONADO
      token
    })

  } catch (error) {
    console.error("Erro catastrófico no /login:", error); 
    res.status(500).json({ erro: "Ocorreu um erro interno. Tente novamente." });
  }
})

export default router