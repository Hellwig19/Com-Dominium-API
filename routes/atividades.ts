// /routes/atividades.ts

import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Todas as rotas aqui são protegidas
router.use(verificaToken);

// Define um formato padrão para cada item do feed
type FeedItem = {
  id: string;
  tipo: 'ENCOMENDA' | 'RESERVA' | 'VISITA' | 'SUGESTAO' | 'VOTO'; // <<< 1. ADICIONA 'VOTO'
  titulo: string;
  subtitulo: string;
  timestamp: Date;
};

router.get("/recentes", async (req, res) => {
  const clienteId = req.userLogadoId as string;
  const LIMITE_POR_TIPO = 5; 
  const LIMITE_FINAL = 5; 

  try {
    // 1. Fetch Encomendas
    const encomendas = await prisma.encomendas.findMany({
      where: { clienteId },
      orderBy: { dataChegada: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, remetente: true, dataChegada: true, status: true }
    });

    // 2. Fetch Reservas
    const reservas = await prisma.reserva.findMany({
      where: { clienteId },
      orderBy: { dataReserva: 'desc' }, 
      take: LIMITE_POR_TIPO,
      select: { id: true, area: true, dataReserva: true, status: true }
    });

    // 3. Fetch Visitas
    const visitas = await prisma.visita.findMany({
      where: { clienteId },
      orderBy: { dataVisita: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, nome: true, dataVisita: true }
    });

    // 4. Fetch Sugestões
    const sugestoes = await prisma.sugestao.findMany({
      where: { clienteId },
      orderBy: { data: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { id: true, titulo: true, data: true }
    });

    // <<< 5. (NOVO) Fetch Votos >>>
    const votos = await prisma.voto.findMany({
      where: { clienteId },
      orderBy: { dataVoto: 'desc' },
      take: LIMITE_POR_TIPO,
      select: { 
        id: true, 
        dataVoto: true,
        votacao: { // Inclui a votação relacionada
          select: { titulo: true } 
        },
        opcao: { // Inclui a opção relacionada
          select: { texto: true }
        }
      }
    });

    // 6. Mapear tudo para um formato padrão
    const feedEncomendas: FeedItem[] = encomendas.map(item => ({
      id: `enc-${item.id}`,
      tipo: 'ENCOMENDA',
      titulo: `Nova encomenda: ${item.remetente}`,
      subtitulo: `Status: ${item.status.replace('_', ' ')}`,
      timestamp: item.dataChegada
    }));

    const feedReservas: FeedItem[] = reservas.map(item => ({
      id: `res-${item.id}`,
      tipo: 'RESERVA',
      titulo: `Reserva: ${item.area}`,
      subtitulo: `Status: ${item.status}`,
      timestamp: item.dataReserva
    }));

    const feedVisitas: FeedItem[] = visitas.map(item => ({
      id: `vis-${item.id}`,
      tipo: 'VISITA',
      titulo: `Visita autorizada: ${item.nome}`,
      subtitulo: `Em: ${item.dataVisita.toLocaleDateString('pt-BR')}`,
      timestamp: item.dataVisita
    }));

    const feedSugestoes: FeedItem[] = sugestoes.map(item => ({
      id: `sug-${item.id}`,
      tipo: 'SUGESTAO',
      titulo: `Enviado: ${item.titulo}`,
      subtitulo: `Em: ${item.data.toLocaleDateString('pt-BR')}`,
      timestamp: item.data
    }));

    // <<< 7. (NOVO) Mapear Votos >>>
    const feedVotos: FeedItem[] = votos.map(item => ({
      id: `voto-${item.id}`,
      tipo: 'VOTO',
      titulo: `Votou em: ${item.votacao.titulo}`, // ex: "Votou em: Horário da Piscina"
      subtitulo: `Sua escolha: ${item.opcao.texto}`, // ex: "Sua escolha: A favor"
      timestamp: item.dataVoto
    }));

    // 8. Combinar, Ordenar e Limitar
    const atividadesCombinadas: FeedItem[] = [
      ...feedEncomendas,
      ...feedReservas,
      ...feedVisitas,
      ...feedSugestoes,
      ...feedVotos // <<< 8. ADICIONA VOTOS NA LISTA
    ];

    // Ordena pelo timestamp (data) mais recente
    atividadesCombinadas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 9. Pega os 5 mais recentes do total
    const feedFinal = atividadesCombinadas.slice(0, LIMITE_FINAL);

    res.status(200).json(feedFinal);

  } catch (error) {
    console.error("Erro ao buscar atividades recentes:", error);
    res.status(500).json({ erro: "Não foi possível carregar as atividades." });
  }
});

export default router;