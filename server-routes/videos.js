/**
 * Rotas de Vídeos — Tradução, Prompts, Imagens, Áudios e Pasta do Projeto
 */

import express from 'express'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Pasta raiz onde os projetos de vídeo são salvos
const VIDEOS_DIR = path.resolve(__dirname, '..', 'Agente-Videos', 'videos')

// ── Lê o .env do Agente-Videos manualmente (sem dotenv) ──────────────────────
function lerEnvAgenteVideos() {
  const envPath = path.resolve(__dirname, '..', 'Agente-Videos', '.env')
  const vars = {}
  try {
    const conteudo = fs.readFileSync(envPath, 'utf-8')
    for (const linha of conteudo.split('\n')) {
      const trimada = linha.trim()
      if (!trimada || trimada.startsWith('#')) continue
      const idx = trimada.indexOf('=')
      if (idx < 0) continue
      vars[trimada.slice(0, idx).trim()] = trimada.slice(idx + 1).trim()
    }
  } catch { /* fallback para process.env */ }
  return vars
}

// ── Sanitiza texto para uso como nome de pasta ────────────────────────────────
function sanitizarNomePasta(texto) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40)
    .toLowerCase()
}

// ── Garante que uma pasta existe ──────────────────────────────────────────────
function garantirPasta(p) {
  fs.mkdirSync(p, { recursive: true })
}

// ── Parser de blocos [LUCIANA]...[/LUCIANA] e [TOM]...[/TOM] ─────────────────
function parsearBlocos(texto) {
  const blocos = []
  const regex = /\[(LUCIANA|TOM)\]([\s\S]*?)\[\/\1\]/gi
  let match
  while ((match = regex.exec(texto)) !== null) {
    const voz = match[1].toLowerCase()
    const conteudo = match[2].trim()
    if (conteudo) blocos.push({ voz, texto: conteudo })
  }
  return blocos
}

// ── Chama ElevenLabs e retorna Buffer com o MP3 ───────────────────────────────
async function gerarAudioBloco(texto, voiceId, apiKey) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  })
  if (!resp.ok) {
    const msg = await resp.text()
    throw new Error(`ElevenLabs ${resp.status}: ${msg}`)
  }
  const arrayBuffer = await resp.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ── Baixa uma imagem de uma URL e retorna Buffer ──────────────────────────────
async function baixarImagem(url) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Erro ao baixar imagem: ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/criar-pasta
// Cria a estrutura de pastas do projeto e salva o script PT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/criar-pasta', (req, res) => {
  try {
    const { scriptPT, titulo } = req.body
    if (!scriptPT) return res.status(400).json({ erro: 'scriptPT obrigatório' })

    const hoje = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const nomeBase = titulo
      ? sanitizarNomePasta(titulo)
      : sanitizarNomePasta(scriptPT.replace(/\[.*?\]/g, '').trim().slice(0, 50))
    const pastaNome = `${hoje}_${nomeBase}`
    const pastaProjeto = path.join(VIDEOS_DIR, pastaNome)

    garantirPasta(path.join(pastaProjeto, 'audios'))
    garantirPasta(path.join(pastaProjeto, 'imagens'))
    garantirPasta(path.join(pastaProjeto, 'imagens', 'videos_animados'))

    fs.writeFileSync(path.join(pastaProjeto, 'script_pt.txt'), scriptPT, 'utf-8')

    console.log(`[Videos] Pasta criada: ${pastaProjeto}`)
    res.json({ pasta: pastaProjeto, pastaNome, nomeBase })
  } catch (err) {
    console.error('[Videos] Erro ao criar pasta:', err)
    res.status(500).json({ erro: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/abrir-pasta
// Abre o Windows Explorer na pasta do projeto
// ─────────────────────────────────────────────────────────────────────────────
router.post('/abrir-pasta', (req, res) => {
  try {
    const { pasta } = req.body
    if (!pasta) return res.status(400).json({ erro: 'pasta obrigatória' })
    if (process.platform !== 'win32') return res.json({ ok: false, motivo: 'Indisponível fora do Windows' })
    if (!fs.existsSync(pasta)) return res.status(404).json({ erro: 'Pasta não encontrada' })
    execSync(`explorer "${pasta}"`)
    res.json({ ok: true })
  } catch {
    // Explorer retorna exit code 1 mesmo quando abre com sucesso — ignorar
    res.json({ ok: true })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/abrir-pasta-videos
// Abre o Windows Explorer na pasta geral de vídeos
// ─────────────────────────────────────────────────────────────────────────────
router.post('/abrir-pasta-videos', (req, res) => {
  try {
    if (process.platform !== 'win32') return res.json({ ok: false, motivo: 'Indisponível fora do Windows' })
    garantirPasta(VIDEOS_DIR)
    execSync(`explorer "${VIDEOS_DIR}"`)
    res.json({ ok: true })
  } catch {
    res.json({ ok: true })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/traduzir
// Traduz script PT → ES e EN; salva em disco se `pasta` fornecida
// ─────────────────────────────────────────────────────────────────────────────
router.post('/traduzir', async (req, res) => {
  try {
    const { texto, pasta } = req.body
    if (!texto) return res.status(400).json({ erro: 'Texto obrigatório' })

    const env = lerEnvAgenteVideos()
    const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
    const client = new Anthropic({ apiKey })

    const prompt = `Responda APENAS com JSON válido, sem texto antes ou depois.
Traduza o seguinte texto bíblico/religioso para espanhol e inglês.
Retorne APENAS um JSON válido no formato: {"es": "tradução em espanhol", "en": "english translation"}
Mantenha o tom pastoral e devocional.
IMPORTANTE: preserve exatamente os marcadores de voz [LUCIANA], [/LUCIANA], [TOM], [/TOM] em suas posições — apenas traduza o texto dentro deles.

Texto em português:
${texto}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const conteudo = message.content[0].text
    console.log('[Videos] Resposta bruta da IA:', JSON.stringify(conteudo).slice(0, 500))

    let jsonStr = conteudo.trim()
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('Resposta inválida da IA')
    jsonStr = jsonStr.slice(start, end + 1)
    const traducoes = JSON.parse(jsonStr)
    if (!traducoes.es || !traducoes.en) throw new Error('Tradução incompleta')

    // Salva em disco se pasta fornecida
    if (pasta && fs.existsSync(pasta)) {
      if (traducoes.es) fs.writeFileSync(path.join(pasta, 'script_es.txt'), traducoes.es, 'utf-8')
      if (traducoes.en) fs.writeFileSync(path.join(pasta, 'script_en.txt'), traducoes.en, 'utf-8')
      console.log(`[Videos] Scripts ES/EN salvos em: ${pasta}`)
    }

    res.json(traducoes)
  } catch (err) {
    console.error('[Videos] Erro ao traduzir:', err)
    res.status(500).json({ erro: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/gerar-prompts
// Divide o script em blocos e gera um prompt PT por bloco
// ─────────────────────────────────────────────────────────────────────────────
router.post('/gerar-prompts', async (req, res) => {
  try {
    const { texto } = req.body
    if (!texto) return res.status(400).json({ erro: 'Texto obrigatório' })

    const textoLimpo = texto
      .replace(/\[(LUCIANA|TOM)\]/gi, '')
      .replace(/\[\/(LUCIANA|TOM)\]/gi, '')
      .trim()

    const blocos = textoLimpo
      .split(/\n{2,}/)
      .map(b => b.replace(/\n/g, ' ').trim())
      .filter(b => b.length > 30)

    if (blocos.length === 0) {
      return res.status(400).json({ erro: 'Não foi possível dividir o script em blocos. Verifique se há parágrafos separados por linha em branco.' })
    }

    const env = lerEnvAgenteVideos()
    const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
    const client = new Anthropic({ apiKey })

    const blocosFormatados = blocos.map((b, i) => `BLOCO ${i + 1}:\n${b}`).join('\n\n')

    const systemPrompt = `Você é especialista em produção de vídeos bíblicos estilo whiteboard animation.
Para cada bloco de texto fornecido, crie um prompt de imagem em PORTUGUÊS BRASILEIRO para o DALL-E 3.

Regras dos prompts:
- Escreva o prompt em português, descrevendo a cena visual
- Cada prompt deve refletir ESPECIFICAMENTE o conteúdo daquele bloco (personagens, objetos, cenário, ação descritos no texto)
- Estilo visual: ilustração estilo whiteboard/lousa branca, contornos pretos nítidos, cores suaves e planas, traço simples de mão, conteúdo bíblico
- Sem rostos humanos detalhados — use figuras estilizadas, símbolos, paisagens bíblicas
- Os prompts devem ser diferentes entre si, correspondendo a cenas distintas do vídeo

Retorne APENAS um JSON válido no formato:
{"prompts": [{"pt_script": "trecho original do script", "pt_prompt": "prompt da imagem em português"}, ...]}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: blocosFormatados }],
    })

    const conteudo = message.content[0].text
    const jsonMatch = conteudo.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Resposta inválida da IA')
    const resultado = JSON.parse(jsonMatch[0])

    const prompts = (resultado.prompts || []).map((item, i) => ({
      ptScript: item.pt_script || blocos[i] || '',
      ptPrompt: item.pt_prompt || '',
    }))

    res.json({ prompts })
  } catch (err) {
    console.error('[Videos] Erro ao gerar prompts:', err)
    res.status(500).json({ erro: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/traduzir-prompt
// Traduz um prompt PT → EN otimizado para DALL-E 3
// ─────────────────────────────────────────────────────────────────────────────
router.post('/traduzir-prompt', async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ erro: 'prompt obrigatório' })

    const env = lerEnvAgenteVideos()
    const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Translate the following image prompt from Portuguese to English, optimized for DALL-E 3. Keep the visual style instructions. Return ONLY the translated prompt, no explanation.\n\nPrompt in Portuguese:\n${prompt}`,
      }],
    })

    res.json({ en: message.content[0].text.trim() })
  } catch (err) {
    console.error('[Videos] Erro ao traduzir prompt:', err)
    res.status(500).json({ erro: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/gerar-imagem
// Gera imagem via DALL-E 3; salva PNG em disco se `pasta` e `indice` fornecidos
// ─────────────────────────────────────────────────────────────────────────────
router.post('/gerar-imagem', async (req, res) => {
  try {
    const env = lerEnvAgenteVideos()
    const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) return res.status(400).json({ erro: 'OPENAI_API_KEY não configurada' })

    const { prompt, pasta, indice } = req.body
    if (!prompt) return res.status(400).json({ erro: 'Prompt obrigatório' })

    const openai = new OpenAI({ apiKey })
    const PREFIX = `Whiteboard drawing illustration style, clean solid black outlines, simple flat colors on white or cream background, hand-drawn educational look, no text, no letters, no words, no labels anywhere in the image, no writing of any kind, style consistent with animated explainer videos, minimal and friendly. Scene:`
    const SUFFIX = `No text, no writing, no letters, no labels in the image.`
    const promptFinal = `${PREFIX} ${prompt} ${SUFFIX}`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: promptFinal,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    })

    const imageUrl = response.data[0].url

    // Salva PNG em disco se pasta fornecida
    let arquivoLocal = null
    if (pasta && fs.existsSync(pasta)) {
      try {
        const imgBuffer = await baixarImagem(imageUrl)
        const num = String(indice != null ? indice + 1 : Date.now()).padStart(2, '0')
        const nomeBase = path.basename(pasta).replace(/^\d{4}-\d{2}-\d{2}_/, '')
        const nomeArquivo = `${nomeBase}_${num}.png`
        const caminhoArquivo = path.join(pasta, 'imagens', nomeArquivo)
        garantirPasta(path.join(pasta, 'imagens'))
        fs.writeFileSync(caminhoArquivo, imgBuffer)
        arquivoLocal = caminhoArquivo
        console.log(`[Videos] Imagem salva: ${caminhoArquivo}`)
      } catch (e) {
        console.warn(`[Videos] Não foi possível salvar imagem em disco: ${e.message}`)
      }
    }

    res.json({ url: imageUrl, arquivoLocal })
  } catch (err) {
    console.error('[Videos] Erro ao gerar imagem:', err)
    res.status(500).json({ erro: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/videos/gerar-audios
// Gera áudios PT/ES/EN via ElevenLabs; salva MP3s em disco se `pasta` fornecida
// ─────────────────────────────────────────────────────────────────────────────
router.post('/gerar-audios', async (req, res) => {
  try {
    const { scriptPT, scriptES, scriptEN, pasta } = req.body
    if (!scriptPT) return res.status(400).json({ erro: 'scriptPT obrigatório' })

    const env = lerEnvAgenteVideos()
    const apiKey = env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY
    const voiceIdLuciana = env.VOICE_ID_LUCIANA || process.env.VOICE_ID_LUCIANA
    const voiceIdTom = env.VOICE_ID_TOM || process.env.VOICE_ID_TOM

    if (!apiKey) return res.status(400).json({ erro: 'ELEVENLABS_API_KEY não configurada' })
    if (!voiceIdLuciana || !voiceIdTom) return res.status(400).json({ erro: 'VOICE_ID_LUCIANA ou VOICE_ID_TOM não configurados' })

    const scripts = { pt: scriptPT, es: scriptES || '', en: scriptEN || '' }
    const resultado = {}
    const arquivos = {}

    for (const [idioma, script] of Object.entries(scripts)) {
      if (!script.trim()) {
        console.log(`[Videos] ${idioma}: script vazio, pulando`)
        continue
      }

      let blocos = parsearBlocos(script)

      // Fallback: tradução não preservou os marcadores → usa texto limpo com voz LUCIANA
      if (blocos.length === 0) {
        const textoLimpo = script.replace(/\[.*?\]/g, '').trim()
        if (!textoLimpo) {
          console.warn(`[Videos] ${idioma}: script sem conteúdo após remover marcadores, pulando`)
          continue
        }
        console.warn(`[Videos] ${idioma}: sem marcadores [LUCIANA]/[TOM] — gerando com voz LUCIANA (texto completo)`)
        blocos = [{ voz: 'luciana', texto: textoLimpo }]
      }

      console.log(`[Videos] ${idioma}: ${blocos.length} bloco(s) para gerar`)
      const buffers = []
      for (const bloco of blocos) {
        const voiceId = bloco.voz === 'luciana' ? voiceIdLuciana : voiceIdTom
        console.log(`[Videos] ${idioma} — ${bloco.voz.toUpperCase()} — ${bloco.texto.slice(0, 60)}...`)
        try {
          buffers.push(await gerarAudioBloco(bloco.texto, voiceId, apiKey))
        } catch (errBloco) {
          console.error(`[Videos] ${idioma} — erro no bloco ${bloco.voz}: ${errBloco.message}`)
          throw errBloco
        }
      }

      const audioFinal = Buffer.concat(buffers)
      resultado[idioma] = audioFinal.toString('base64')
      console.log(`[Videos] ${idioma}: áudio gerado (${Math.round(audioFinal.length / 1024)} KB)`)

      // Salva MP3 em disco se pasta fornecida
      if (pasta && fs.existsSync(pasta)) {
        const nomeBase = path.basename(pasta).replace(/^\d{4}-\d{2}-\d{2}_/, '')
        const nomeArquivo = `${nomeBase}_${idioma}.mp3`
        const caminhoAudio = path.join(pasta, 'audios', nomeArquivo)
        garantirPasta(path.join(pasta, 'audios'))
        fs.writeFileSync(caminhoAudio, audioFinal)
        arquivos[idioma] = caminhoAudio
        console.log(`[Videos] Áudio salvo: ${caminhoAudio}`)
      }
    }

    console.log(`[Videos] Áudios gerados: ${Object.keys(resultado).join(', ')}`)
    res.json({ ...resultado, arquivos })
  } catch (err) {
    console.error('[Videos] Erro ao gerar áudios:', err)
    res.status(500).json({ erro: err.message })
  }
})

export default router
