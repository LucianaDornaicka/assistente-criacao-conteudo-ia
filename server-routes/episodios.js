/**
 * Rotas de Episódios — Persistência de progresso do pipeline de criação de vídeos
 * Armazena em data/episodios.json (configurável via DATA_DIR)
 */

import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Em produção (Render com disco persistente), configure DATA_DIR=/data
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '..', 'data')
const EPISODIOS_FILE = path.join(DATA_DIR, 'episodios.json')

function lerEpisodios() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(EPISODIOS_FILE)) return []
    return JSON.parse(fs.readFileSync(EPISODIOS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function salvarEpisodios(episodios) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(EPISODIOS_FILE, JSON.stringify(episodios, null, 2), 'utf-8')
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/episodios — lista resumida (sem campos longos)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const episodios = lerEpisodios()
  const resumo = episodios
    .map(({ id, titulo, etapaAtual, etapasConcluidas, pastaNome, atualizadoEm }) => ({
      id, titulo, etapaAtual, etapasConcluidas, pastaNome, atualizadoEm,
    }))
    .sort((a, b) => new Date(b.atualizadoEm) - new Date(a.atualizadoEm))
  res.json(resumo)
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/episodios/:id — episódio completo
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const episodios = lerEpisodios()
  const ep = episodios.find(e => e.id === req.params.id)
  if (!ep) return res.status(404).json({ erro: 'Episódio não encontrado' })
  res.json(ep)
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/episodios — criar novo episódio
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const episodios = lerEpisodios()
  const novo = {
    titulo: '',
    pastaNome: '',
    pastaAtual: '',
    etapaAtual: 'script',
    etapasConcluidas: [],
    scriptPT: '',
    traducaoES: '',
    traducaoEN: '',
    audiosGerados: { pt: false, es: false, en: false },
    prompts: [],
    ...req.body,
    id: randomUUID(),
    atualizadoEm: new Date().toISOString(),
  }
  episodios.push(novo)
  salvarEpisodios(episodios)
  res.status(201).json(novo)
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/episodios/:id — salvar progresso (auto-save)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const episodios = lerEpisodios()
  const idx = episodios.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ erro: 'Episódio não encontrado' })
  episodios[idx] = {
    ...episodios[idx],
    ...req.body,
    id: req.params.id,          // id imutável
    atualizadoEm: new Date().toISOString(),
  }
  salvarEpisodios(episodios)
  res.json(episodios[idx])
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/episodios/:id — excluir episódio
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const episodios = lerEpisodios()
  const filtrado = episodios.filter(e => e.id !== req.params.id)
  if (filtrado.length === episodios.length) return res.status(404).json({ erro: 'Episódio não encontrado' })
  salvarEpisodios(filtrado)
  res.json({ ok: true })
})

export default router
