/**
 * Rotas da Agenda — Google Calendar + Sheets
 */

import express from 'express'
import { google } from 'googleapis'

const router = express.Router()

function getGoogleAuth() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  })
}

// POST /api/agenda/adicionar
router.post('/adicionar', async (req, res) => {
  try {
    const { titulo, data, horaInicio, horaFim, local, descricao } = req.body
    const auth = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const inicio = new Date(`${data}T${horaInicio}:00`)
    const fim = new Date(`${data}T${horaFim}:00`)

    const evento = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: titulo,
        location: local || '',
        description: descricao || '',
        start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' },
      },
    })

    try {
      const sheets = google.sheets({ version: 'v4', auth })
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Agenda!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toLocaleDateString('pt-BR'),
            data, horaInicio, horaFim, titulo, local || '',
          ]],
        },
      })
    } catch (sheetsErr) {
      console.error('[Agenda] Aviso: erro ao salvar no Sheets (evento criado no Calendar):', sheetsErr.message)
    }

    res.json({ ok: true, eventoId: evento.data.id, link: evento.data.htmlLink })
  } catch (err) {
    console.error('[Agenda] Erro ao adicionar:', err)
    res.status(500).json({ erro: err.message })
  }
})

// GET /api/agenda/dia?data=2026-03-15
router.get('/dia', async (req, res) => {
  try {
    const { data } = req.query
    if (!data) return res.status(400).json({ erro: 'Data obrigatória' })

    const auth = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const inicio = new Date(`${data}T00:00:00-03:00`)
    const fim = new Date(`${data}T23:59:59-03:00`)

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: inicio.toISOString(),
      timeMax: fim.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const compromissos = (response.data.items || []).map(e => ({
      id: e.id,
      titulo: e.summary || '(sem título)',
      horaInicio: e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Dia todo',
      horaFim: e.end?.dateTime
        ? new Date(e.end.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '',
      local: e.location || '',
      linkEdicao: e.htmlLink || '',
    }))

    res.json({ compromissos })
  } catch (err) {
    console.error('[Agenda] Erro ao buscar dia:', err)
    res.status(500).json({ erro: err.message })
  }
})

// GET /api/agenda/links-edicao?data=2026-03-15
router.get('/links-edicao', async (req, res) => {
  try {
    const { data } = req.query
    if (!data) return res.status(400).json({ erro: 'Data obrigatória' })

    const auth = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    const inicio = new Date(`${data}T00:00:00-03:00`)
    const fim = new Date(`${data}T23:59:59-03:00`)

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: inicio.toISOString(),
      timeMax: fim.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const compromissos = (response.data.items || []).map(e => ({
      id: e.id,
      titulo: e.summary || '(sem título)',
      horaInicio: e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Dia todo',
      horaFim: e.end?.dateTime
        ? new Date(e.end.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '',
      linkEdicao: e.htmlLink || '',
    }))

    res.json({ compromissos })
  } catch (err) {
    console.error('[Agenda] Erro ao buscar links:', err)
    res.status(500).json({ erro: err.message })
  }
})

export default router
