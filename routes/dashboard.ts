import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { verificaToken } from "../middlewares/verificaToken" 

const prisma = new PrismaClient()
const router = Router()

router.use(verificaToken);

router.get("/gerais", async (req, res) => {
  try {
    const [clientes] = await prisma.$transaction([
      prisma.cliente.count()
    ]);

    res.status(200).json({ clientes });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os dados gerais." });
  }
});

type MarcaGroupByNome = {
  nome: string
  _count: {
    veiculos: number
  }
}

router.get("/veiculosMarca", async (req, res) => {
  try {
    const veiculosPorModelo = await prisma.veiculo.groupBy({
      by: ['modelo'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          modelo: 'desc'
        }
      }
    });

    const resultado = veiculosPorModelo.map(item => ({
      modelo: item.modelo,
      num: item._count._all
    }));

    res.status(200).json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os dados de veículos por marca." });
  }
});

type ClienteGroupByEstadoCivil = {
  estadoCivil: string
  _count: {
    _all: number
  }
}

router.get("/clientesEstadoCivil", async (req, res) => {
  try {
    const clientes = await prisma.cliente.groupBy({
      by: ['estadoCivil'],
      _count: {
        _all: true,
      },
    });

    const resultado = clientes.map((cliente: ClienteGroupByEstadoCivil) => ({
      estadoCivil: cliente.estadoCivil,
      num: cliente._count._all
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Não foi possível carregar os dados de clientes por cidade." });
  }
});


export default router