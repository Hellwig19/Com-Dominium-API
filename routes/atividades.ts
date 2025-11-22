import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

router.use(verificaToken);

type FeedItem = {
  id: string;
  tipo: 'ENCOMENDA' | 'RESERVA' | 'VISITA' | 'SUGESTAO' | 'VOTO' | 'PRESTADOR' | 'VEICULO' | 'MORADOR';
  titulo: string;
  subtitulo: string;
  timestamp: Date;
}

router.get("/recentes", async (req, res) => {
  const clienteId = req.userLogadoId as string;
  const LIMITE_POR_TIPO = 5; 
  const LIMITE_FINAL = 5; 

  try {
    const encomendas = await prisma.encomendas.findMany({
      where: { clienteId },
      orderBy: { dataChegada: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, remetente: true, dataChegada: true, status: true }
    });

    const reservas = await prisma.reserva.findMany({
      where: { clienteId },
      orderBy: { dataReserva: 'desc' }, 
      take: LIMITE_POR_TIPO,
      select: { 
        id: true, 
        area: {
            select: { nome: true }
        }, 
        dataReserva: true, 
        status: true 
      }
    });

    const visitas = await prisma.visita.findMany({
      where: { clienteId },
      orderBy: { dataVisita: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, nome: true, dataVisita: true }
    });

    const sugestoes = await prisma.sugestao.findMany({
      where: { clienteId },
      orderBy: { data: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, titulo: true, data: true }
    });

    const votos = await prisma.voto.findMany({
      where: { clienteId },
      orderBy: { dataVoto: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { 
        id: true, 
        dataVoto: true,
        votacao: { select: { titulo: true } },
        opcao: { select: { texto: true } }
      }
    });

    const prestadores = await prisma.prestador.findMany({
      where: { clienteId },
      orderBy: { dataServico: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, nome: true, servico: true, dataServico: true }
    });

    const veiculos = await prisma.veiculo.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' }, 
      take: LIMITE_POR_TIPO,
      select: { id: true, placa: true, modelo: true, createdAt: true }
    });

    const moradores = await prisma.morador.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' }, 
      take: LIMITE_POR_TIPO,
      select: { id: true, nome: true, parentesco: true, createdAt: true }
    });

    const feedEncomendas: FeedItem[] = encomendas.map(item => ({ id: `enc-${item.id}`, tipo: 'ENCOMENDA', titulo: `Nova encomenda: ${item.remetente}`, subtitulo: `Status: ${item.status.replace('_', ' ')}`, timestamp: item.dataChegada }));
    
    const feedReservas: FeedItem[] = reservas.map(item => ({ 
        id: `res-${item.id}`, 
        tipo: 'RESERVA', 
        titulo: `Reserva: ${item.area.nome}`,
        subtitulo: `Status: ${item.status}`, 
        timestamp: item.dataReserva 
    }));

    const feedVisitas: FeedItem[] = visitas.map(item => ({ id: `vis-${item.id}`, tipo: 'VISITA', titulo: `Visita autorizada: ${item.nome}`, subtitulo: `Em: ${item.dataVisita.toLocaleDateString('pt-BR')}`, timestamp: item.dataVisita }));
    const feedSugestoes: FeedItem[] = sugestoes.map(item => ({ id: `sug-${item.id}`, tipo: 'SUGESTAO', titulo: `Enviado: ${item.titulo}`, subtitulo: `Em: ${item.data.toLocaleDateString('pt-BR')}`, timestamp: item.data }));
    const feedVotos: FeedItem[] = votos.map(item => ({ id: `voto-${item.id}`, tipo: 'VOTO', titulo: `Votou em: ${item.votacao.titulo}`, subtitulo: `Sua escolha: ${item.opcao.texto}`, timestamp: item.dataVoto }));
    const feedVeiculos: FeedItem[] = veiculos.map(item => ({
      id: `vei-${item.id}`,
      tipo: 'VEICULO',
      titulo: `Veículo Adicionado: ${item.placa}`,
      subtitulo: `Modelo: ${item.modelo}`,
      timestamp: item.createdAt
    }));
    const feedMoradores: FeedItem[] = moradores.map(item => ({
      id: `mor-${item.id}`,
      tipo: 'MORADOR',
      titulo: `Novo Morador: ${item.nome}`,
      subtitulo: `Parentesco: ${item.parentesco}`,
      timestamp: item.createdAt
    }));
    const feedPrestadores: FeedItem[] = prestadores.map(item => ({
      id: `pre-${item.id}`,
      tipo: 'PRESTADOR',
      titulo: `Serviço agendado: ${item.nome}`,
      subtitulo: `Serviço: ${item.servico}`,
      timestamp: item.dataServico
    }));

    const atividadesCombinadas: FeedItem[] = [
      ...feedEncomendas,
      ...feedReservas,
      ...feedVisitas,
      ...feedSugestoes,
      ...feedVotos,
      ...feedPrestadores,
      ...feedVeiculos,
      ...feedMoradores
    ];

    atividadesCombinadas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const feedFinal = atividadesCombinadas.slice(0, LIMITE_FINAL);
    res.status(200).json(feedFinal);

  } catch (error) {
    console.error("Erro ao buscar atividades recentes:", error);
    res.status(500).json({ erro: "Não foi possível carregar as atividades." });
  }
});

router.get("/geral", async (req, res) => {
  const nivel = req.userLogadoNivel;
  if (!nivel || (nivel !== 3 && nivel !== 2 && nivel !== 5)) {
     return res.status(403).json({ erro: "Acesso negado." });
  }

  const LIMITE = 10;

  try {
    const visitas = await prisma.visita.findMany({
      take: 5, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        residencia: { 
          select: { numeroCasa: true } 
        } 
      }
    });
    
    const encomendas = await prisma.encomendas.findMany({
      take: 5, 
      orderBy: { dataChegada: 'desc' },
      include: { 
        cliente: { 
          select: { nome: true } 
        } 
      }
    });


    const feedVisitas = visitas.map(v => ({
        id: `vis-${v.id}`,
        tipo: 'VISITA',
        titulo: `Visita: ${v.nome}`,
        subtitulo: `Para Casa ${v.residencia.numeroCasa} - ${v.horario}`,
        timestamp: v.createdAt 
    }));

    const feedEncomendas = encomendas.map(e => ({
        id: `enc-${e.id}`,
        tipo: 'ENCOMENDA',
        titulo: `Encomenda: ${e.remetente}`,
        subtitulo: `Para: ${e.cliente.nome}`,
        timestamp: e.dataChegada
    }));

    const combined = [...feedVisitas, ...feedEncomendas]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, LIMITE);

    res.json(combined);

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar log geral." });
  }
});

export default router;