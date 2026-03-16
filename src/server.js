import express from "express";
import { handle } from "./agents/orchestrator.js";
import { router as authRoutes, autenticar } from '../server-routes/auth.js'
import agendaRoutes from '../server-routes/agenda.js'
import videosRoutes from '../server-routes/videos.js'
import episodiosRoutes from '../server-routes/episodios.js'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Teste no navegador
//app.get("/", (req, res) => {
//res.send("Servidor funcionando 🚀");
//});

// Webhook do WhatsApp
app.post("/webhook/whatsapp", async (req, res) => {
  console.log("Mensagem recebida:");
  console.log(req.body);

  const mensagem = req.body.Body;
  const remetente = req.body.From;

  if (mensagem && remetente) {
    await handle(mensagem, remetente);
  }

  res.send("OK");
});

// Rotas do app web
app.use('/api/auth', authRoutes)
app.use('/api/agenda', autenticar, agendaRoutes)
app.use('/api/videos', autenticar, videosRoutes)
app.use('/api/episodios', autenticar, episodiosRoutes)

app.use(express.static(path.join(__dirname, '../client/dist')))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook')) {
    return res.status(404).json({ erro: 'Rota não encontrada' })
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
