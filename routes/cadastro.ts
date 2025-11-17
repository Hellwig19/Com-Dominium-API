
import { PrismaClient, EstadoCivil, Tipo, TipoMorador, TipoVeiculo } from "@prisma/client";
import { Router } from "express";
import bcrypt from 'bcrypt';
import { z } from 'zod';
import upload from '../UploadConfig'; 

const prisma = new PrismaClient();
const router = Router();

const moradorSchema = z.object({
  nome: z.string().min(3),
  parentesco: z.string().min(3),
  dataNasc: z.string().datetime(),
  cpf: z.string().length(11),
  email: z.string().email().optional().or(z.literal('')),
  contato: z.string().min(10),
  tipoMorador: z.nativeEnum(TipoMorador),
});

const veiculoSchema = z.object({
  placa: z.string().length(7),
  TipoVeiculo: z.nativeEnum(TipoVeiculo),
  marca: z.string().min(2),
  modelo: z.string().min(2),
  cor: z.string().min(3),
  ano: z.number().int().min(1950),
  garagem: z.string().max(4),
});

const cadastroCompletoSchema = z.object({
  nome: z.string().min(10),
  cpf: z.string().length(11),
  rg: z.string().min(7),
  dataNasc: z.string().datetime(),
  estadoCivil: z.nativeEnum(EstadoCivil),
  profissao: z.string().min(3),
  senha: z.string().min(8),
  email: z.string().email(),
  telefone: z.string().min(10),
  whatsapp: z.string().min(11),
  numeroCasa: z.string().max(4),
  rua: z.string().min(3), 
  Tipo: z.nativeEnum(Tipo),
  proprietario: z.string(), 
  dataResidencia: z.string().datetime(),
  moradores: z.array(moradorSchema).optional(),
  veiculos: z.array(veiculoSchema).optional(),
});


const uploadFields = [
  { name: 'documento_cpf', maxCount: 1 },
  { name: 'comprovante_residencia', maxCount: 1 }
];

router.post("/", upload.fields(uploadFields), async (req, res) => {
  
  let jsonData;
  try {
    jsonData = JSON.parse(req.body.jsonData);
  } catch (e) {
    return res.status(400).json({ erro: "Dados JSON ('jsonData') inválidos ou ausentes." });
  }

  const result = cadastroCompletoSchema.safeParse(jsonData);
  if (!result.success) {
    return res.status(400).json({ erros: result.error.errors.map(e => `${e.path.join('.')} - ${e.message}`) });
  }

  const {
    nome, cpf, rg, dataNasc, estadoCivil, profissao, senha,
    email, telefone, whatsapp,
    numeroCasa, rua, Tipo, proprietario, dataResidencia,
    moradores, veiculos
  } = result.data;

  const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

  const cpfFile = files['documento_cpf']?.[0];
  const comprovanteFile = files['comprovante_residencia']?.[0];
  
  if (!cpfFile || !comprovanteFile) {
    return res.status(400).json({ erro: "Documento CPF e Comprovante de Residência são obrigatórios." });
  }

  try {
    const clienteExistente = await prisma.cliente.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });
    if (clienteExistente) {
      return res.status(409).json({ erro: "CPF ou E-mail já cadastrado." });
    }

    const salt = bcrypt.genSaltSync(12);
    const hashSenha = bcrypt.hashSync(senha, salt);

    const novoCadastro = await prisma.$transaction(async (tx) => {

      const novoCliente = await tx.cliente.create({
        data: {
          nome, cpf, rg, email, dataNasc: new Date(dataNasc), estadoCivil, profissao, senha: hashSenha
        }
      });

      await tx.contato.create({
        data: {
          email, telefone, whatsapp, clienteId: novoCliente.id
        }
      });

      const novaResidencia = await tx.residencia.create({
        data: {
          numeroCasa, rua, Tipo, proprietario, dataResidencia: new Date(dataResidencia), clienteId: novoCliente.id
        }
      });

      if (moradores && moradores.length > 0) {
        await tx.morador.createMany({
          data: moradores.map(m => ({
            ...m,
            dataNasc: new Date(m.dataNasc),
            clienteId: novoCliente.id,
            residenciaId: novaResidencia.id
          }))
        });
      }

      if (veiculos && veiculos.length > 0) {
        await tx.veiculo.createMany({
          data: veiculos.map(v => ({
            ...v,
            proprietario: novoCliente.nome, 
            clienteId: novoCliente.id,
            residenciaId: novaResidencia.id
          }))
        });
      }

      await tx.documento.create({
        data: {
          nomeArquivo: cpfFile.originalname,
          url: cpfFile.location, 
          tipo: "CPF_CNH",
          tamanhoKB: Math.round(cpfFile.size / 1024),
          clienteId: novoCliente.id
        }
      });
      
      await tx.documento.create({
        data: {
          nomeArquivo: comprovanteFile.originalname,
          url: comprovanteFile.location, 
          tipo: "COMPROVANTE_RESIDENCIA",
          tamanhoKB: Math.round(comprovanteFile.size / 1024),
          clienteId: novoCliente.id
        }
      });

      return novoCliente;
    });

    res.status(201).json({ message: "Cadastro realizado com sucesso! Aguarde a aprovação.", cliente: novoCadastro });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Ocorreu um erro interno ao processar o cadastro." });
  }
});

export default router;