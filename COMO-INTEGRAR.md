# Como Integrar o App ao Seu Projeto no Render

## Estrutura de Pastas

Após copiar os arquivos, seu projeto ficará assim:

```
meu-projeto/
├── .env                    ← já existe, adicionar novas variáveis
├── package.json            ← adicionar dependências novas
├── server.js               ← adicionar as novas rotas
├── src/                    ← seus agentes existentes (não mexer)
├── client/                 ← NOVO: frontend React do app
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── lib/
│       │   ├── api.ts
│       │   └── modules.ts
│       ├── components/
│       │   └── ModuleLayout.tsx
│       └── pages/
│           ├── Home.tsx
│           ├── Login.tsx
│           ├── Agenda.tsx
│           ├── Tarefa.tsx
│           ├── Financeiro.tsx
│           ├── Lembrete.tsx
│           ├── Cardapio.tsx
│           ├── Casa.tsx
│           ├── Estudo.tsx
│           ├── Ingles.tsx
│           ├── Medico.tsx
│           ├── CriacaoVideo.tsx
│           └── PublicacaoVideo.tsx
└── server-routes/          ← NOVO: rotas Express
    ├── auth.js
    ├── agenda.js
    └── videos.js
```

---

## Passo 1 — Copiar os arquivos

1. Copie a pasta `client/` para a raiz do seu projeto
2. Copie a pasta `server-routes/` para a raiz do seu projeto

---

## Passo 2 — Adicionar variáveis ao .env

```env
# App Web
APP_PASSWORD=sua_senha_para_acessar_o_app
JWT_SECRET=uma_chave_secreta_muito_longa_aqui_123456

# Já devem existir:
# GOOGLE_SERVICE_ACCOUNT=...
# GOOGLE_CALENDAR_ID=...
# SPREADSHEET_ID=...
# ANTHROPIC_API_KEY=...
```

---

## Passo 3 — Adicionar dependências ao package.json

```bash
npm install jsonwebtoken
```

Se ainda não tiver:
```bash
npm install googleapis
```

---

## Passo 4 — Adicionar ao seu server.js

Cole este bloco no seu `server.js` (após as rotas existentes):

```javascript
const path = require('path')
const { router: authRoutes, autenticar } = require('./server-routes/auth')
const agendaRoutes = require('./server-routes/agenda')
const videosRoutes = require('./server-routes/videos')

// Rotas da API do app
app.use('/api/auth', authRoutes)
app.use('/api/agenda', autenticar, agendaRoutes)
app.use('/api/videos', autenticar, videosRoutes)

// Servir o frontend React (após o build)
app.use(express.static(path.join(__dirname, 'client/dist')))
app.get('*', (req, res) => {
  // Não interceptar rotas da API do WhatsApp/Twilio
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook')) {
    return res.status(404).json({ erro: 'Rota não encontrada' })
  }
  res.sendFile(path.join(__dirname, 'client/dist/index.html'))
})
```

---

## Passo 5 — Fazer o build do frontend

```bash
cd client
npm install
npm run build
cd ..
```

---

## Passo 6 — Configurar o Render

No painel do Render, em **Build Command**, adicione o build do frontend:

```bash
npm install && cd client && npm install && npm run build && cd ..
```

**Start Command** (não muda):
```bash
node server.js
```

---

## Passo 7 — Testar

Acesse seu domínio no Render. A tela de login aparecerá.
Digite a senha que você definiu em `APP_PASSWORD`.

---

## Observações Importantes

- O app web roda na **mesma URL** do seu agente WhatsApp
- As rotas do WhatsApp/Twilio continuam funcionando normalmente
- O frontend só é servido para rotas que não começam com `/api/` ou `/webhook`
- Os dados de Tarefa, Cardápio, Casa, Estudo, Inglês, Médico e Lembrete ficam **na memória do navegador** por enquanto — para persistir, você pode conectar ao Supabase depois
- A Agenda já persiste no **Google Calendar e Google Sheets**
