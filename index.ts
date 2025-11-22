import express from 'express'
import cors from 'cors'

import 'dotenv/config'

import routesLogin from './routes/login'
import routesClientes from './routes/clientes'
import routesDashboard from './routes/dashboard'
import routesAdminLogin from './routes/adminLogin'
import routesAdmins from './routes/admins'
import routesContatos from './routes/contatos'
import routesResidencias from './routes/residencias'
import routesMoradores from './routes/moradores'
import routesVeiculos from './routes/veiculos'
import routesPagamentos from './routes/pagamentos'
import routesVisitas from './routes/visitas'
import routesPrestadores from './routes/prestadores'
import routesEncomendas from './routes/encomendas'
import routesReservas from './routes/reservas'
import routesAvisos from './routes/avisos'
import routesVotacoes from './routes/votacoes'
import routesSugestoes from './routes/sugestoes'
import routesAtividades from './routes/atividades'
import routesCadastro from './routes/cadastro'
import routesAreaComum from './routes/areas'
import routesVisitantes from './routes/visitantes';
import routesManutencao from './routes/manutencao';
import routesNotificacoes from './routes/notificacoes'


const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/clientes/login", routesLogin)
app.use("/clientes", routesClientes)
app.use("/dashboard", routesDashboard)
app.use("/admin-login", routesAdminLogin)
app.use("/admins", routesAdmins)
app.use("/contatos", routesContatos)
app.use("/residencias", routesResidencias)
app.use("/moradores", routesMoradores)
app.use("/veiculos", routesVeiculos)
app.use("/pagamentos", routesPagamentos)
app.use("/visitas", routesVisitas)
app.use("/prestadores", routesPrestadores)
app.use("/encomendas", routesEncomendas)
app.use("/reservas", routesReservas)
app.use("/avisos", routesAvisos)
app.use("/votacoes", routesVotacoes)
app.use("/sugestoes", routesSugestoes)
app.use("/atividades", routesAtividades)
app.use("/cadastro", routesCadastro)
app.use("/areas", routesAreaComum)
app.use("/visitantes", routesVisitantes)
app.use("/manutencoes", routesManutencao);
app.use("/notificacoes", routesNotificacoes)





app.get('/', (req, res) => {
  res.send('API: Com Dominium rodando no Vercel!')
})


if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`)
  })
}

export default app;