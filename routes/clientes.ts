import { PrismaClient, EstadoCivil } from "@prisma/client";
import { Router } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// --- Schemas (Mantidos) ---
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

router.use(verificaToken);

// ======================================================
// 1. ROTAS ESPECÍFICAS (DEVEM VIR PRIMEIRO)
// ======================================================

// Rota para o PRÓPRIO USUÁRIO ver seu perfil
router.get("/me", async (req, res) => {
  const clienteId = req.userLogadoId;

  if (!clienteId) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        contatos: { take: 1, select: { telefone: true } },
        residencias: { take: 1, select: { id: true, numeroCasa: true, rua: true, dataResidencia: true } }
      }
    });

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }
    
    const response = {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.contatos[0]?.telefone || null,
      numeroCasa: cliente.residencias[0]?.numeroCasa || null,
      setor: cliente.residencias[0]?.rua || null,
      residenciaId: cliente.residencias[0]?.id || null,
      dataResidencia: cliente.residencias[0]?.dataResidencia || null
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar o perfil." });
  }
});

// Rota para LISTAR clientes (Ativos ou Pendentes)
router.get("/", async (req, res) => {
  // Se mandar ?pendentes=true, busca os inativos. Se não, busca os ativos.
  const apenasPendentes = req.query.pendentes === 'true';

  try {
    const clientes = await prisma.cliente.findMany({
      where: { 
        ativo: apenasPendentes ? false : true 
      },
      include: {
        residencias: { select: { numeroCasa: true } } // Inclui o nº da casa para o dashboard
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os clientes." });
  }
});

router.get("/:id", async (req, res) => {
  // Apenas Admin (Nível 2+) ou o próprio usuário
  const nivel = req.userLogadoNivel || 0;
  if (nivel < 2 && req.userLogadoId !== req.params.id) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        contatos: true,
        residencias: true,
        moradores: true,
        veiculos: true,
        documentos: true, // <<< Importante: trazer os documentos/fotos
      }
    });

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    // Remove a senha antes de enviar
    const { senha, ...dadosCliente } = cliente;
    res.status(200).json(dadosCliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao carregar detalhes do cliente." });
  }
});

// Rota POST (Criar Cliente Manualmente - Opcional, pois existe /cadastro)
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
        nome, cpf, rg, email,
        dataNasc: new Date(dataNasc),
        estadoCivil, profissao,
        senha: hashSenha,
        ativo: true // Se criado por Admin, já nasce ativo
      },
    });
    res.status(201).json(novoCliente);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar novo cliente." });
  }
});

// ======================================================
// 2. ROTAS COM PARÂMETRO :ID (DEVEM VIR POR ÚLTIMO)
// ======================================================

// Rota para APROVAR (Ativar) cliente
router.patch("/:id/aprovar", async (req, res) => {
  if (req.userLogadoNivel !== 5) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: { ativo: true } // Ativa o cliente
    });
    res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao aprovar cliente." });
  }
});

// Rota para REJEITAR (Excluir Definitivamente) um cadastro pendente
router.delete("/:id/rejeitar", async (req, res) => {
  if (req.userLogadoNivel !== 5) return res.status(403).json({ erro: "Acesso negado." });
  
  const { id } = req.params;
  try {
    // Deleta o cliente (o Cascade do banco deve limpar o resto)
    await prisma.cliente.delete({ where: { id } });
    res.status(200).json({ message: "Cadastro rejeitado e removido." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao rejeitar cadastro." });
  }
});

// Rota para DESATIVAR (Exclusão Lógica - Soft Delete)
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const cliente = await prisma.cliente.update({
            where: { id },
            data: { ativo: false }
        });

        const adminId = req.userLogadoId as string; 
        const adminNome = req.userLogadoNome as string; 

        // Tenta criar log se possível
        try {
          await prisma.log.create({
              data: {
                  descricao: `Exclusão (lógica) do cliente: ${cliente.nome}`,
                  complemento: `Admin responsável: ${adminNome}`,
                  adminId,
              }
          });
        } catch (e) { 
          // Ignora erro de log se falhar
        }

        res.status(200).json({ message: "Cliente desativado com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível desativar o cliente." });
    }
});

export default router;