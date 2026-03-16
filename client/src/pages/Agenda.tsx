import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { adicionarCompromisso, verCompromissosDoDia, getLinksEdicao } from '@/lib/api'
import { CalendarPlus, CalendarSearch, CalendarCheck, ExternalLink, Clock } from 'lucide-react'

type Aba = 'adicionar' | 'ver' | 'editar'

interface Compromisso {
  id: string
  titulo: string
  horaInicio: string
  horaFim: string
  local?: string
  linkEdicao: string
}

// ─── Parsers de data e hora ──────────────────────────────────────────────────

const MESES: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
}

function parsearData(texto: string): string | null {
  const t = texto.trim().toLowerCase()

  // "6 mar 26" | "6 mar" | "06 março 2026"
  const m1 = t.match(/^(\d{1,2})\s+([a-záéíóú]{3,})(?:\s+(\d{2,4}))?$/)
  if (m1) {
    const mesNum = MESES[m1[2].substring(0, 3)]
    if (!mesNum) return null
    let ano = m1[3] ?? String(new Date().getFullYear())
    if (ano.length === 2) ano = '20' + ano
    return `${ano}-${mesNum}-${m1[1].padStart(2, '0')}`
  }

  // "06/03/26" | "06/03/2026" | "06/03"
  const m2 = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (m2) {
    let ano = m2[3] ?? String(new Date().getFullYear())
    if (ano.length === 2) ano = '20' + ano
    return `${ano}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
  }

  // já no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t

  return null
}

function parsearHora(texto: string): string | null {
  const m = texto.trim().toLowerCase().match(/^(\d{1,2})(?:h(\d{2})?|:(\d{2}))?$/)
  if (!m) return null
  const min = (m[2] ?? m[3] ?? '00').padStart(2, '0')
  return `${m[1].padStart(2, '0')}:${min}`
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Agenda() {
  const [aba, setAba] = useState<Aba>('adicionar')

  // Adicionar
  const [titulo, setTitulo] = useState('')
  const [dataAdd, setDataAdd] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [msgAdd, setMsgAdd] = useState<{ tipo: 'ok' | 'erro'; texto: string; link?: string } | null>(null)

  // Ver dia
  const [dataVer, setDataVer] = useState('')
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loadingVer, setLoadingVer] = useState(false)
  const [erroVer, setErroVer] = useState<string | null>(null)
  const [buscouVer, setBuscouVer] = useState(false)

  // Editar
  const [dataEditar, setDataEditar] = useState('')
  const [linksEdicao, setLinksEdicao] = useState<Compromisso[]>([])
  const [loadingEditar, setLoadingEditar] = useState(false)
  const [erroEditar, setErroEditar] = useState<string | null>(null)
  const [buscouEditar, setBuscouEditar] = useState(false)

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgAdd(null)

    const dataISO = parsearData(dataAdd)
    if (!dataISO) { setMsgAdd({ tipo: 'erro', texto: 'Data inválida. Use: "6 mar 26", "06/03/26" ou "2026-03-06".' }); return }

    const hInicio = parsearHora(horaInicio)
    if (!hInicio) { setMsgAdd({ tipo: 'erro', texto: 'Hora início inválida. Use: "14", "14h", "14h30" ou "14:30".' }); return }

    const hFim = parsearHora(horaFim)
    if (!hFim) { setMsgAdd({ tipo: 'erro', texto: 'Hora fim inválida. Use: "15", "15h", "15h30" ou "15:30".' }); return }

    setLoadingAdd(true)
    try {
      const res = await adicionarCompromisso({ titulo, data: dataISO, horaInicio: hInicio, horaFim: hFim })
      setMsgAdd({ tipo: 'ok', texto: '✅ Compromisso adicionado com sucesso!', link: res?.link ?? res?.linkEvento ?? undefined })
      setTitulo('')
      setDataAdd('')
      setHoraInicio('')
      setHoraFim('')
    } catch (err: any) {
      setMsgAdd({ tipo: 'erro', texto: err.message })
    } finally {
      setLoadingAdd(false)
    }
  }

  const handleVerDia = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroVer(null)
    setBuscouVer(false)

    const dataISO = parsearData(dataVer)
    if (!dataISO) { setErroVer('Data inválida. Use: "6 mar 26", "06/03/26" ou "2026-03-06".'); return }

    setLoadingVer(true)
    try {
      const data = await verCompromissosDoDia(dataISO)
      setCompromissos(data.compromissos ?? [])
      setBuscouVer(true)
    } catch (err: any) {
      setErroVer(err.message)
    } finally {
      setLoadingVer(false)
    }
  }

  const handleGetLinks = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroEditar(null)
    setBuscouEditar(false)

    const dataISO = parsearData(dataEditar)
    if (!dataISO) { setErroEditar('Data inválida. Use: "6 mar 26", "06/03/26" ou "2026-03-06".'); return }

    setLoadingEditar(true)
    try {
      const data = await getLinksEdicao(dataISO)
      setLinksEdicao(data.compromissos ?? [])
      setBuscouEditar(true)
    } catch (err: any) {
      setErroEditar(err.message)
    } finally {
      setLoadingEditar(false)
    }
  }

  // ─── Abas ─────────────────────────────────────────────────────────────────

  const abas = [
    { id: 'adicionar' as Aba, label: 'Adicionar', icon: CalendarPlus },
    { id: 'ver' as Aba, label: 'Ver dia', icon: CalendarSearch },
    { id: 'editar' as Aba, label: 'Editar', icon: CalendarCheck },
  ]

  return (
    <ModuleLayout title="Agenda" emoji="📅" description="Compromissos e calendário" color="text-blue-600" bgColor="bg-blue-50">
      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {abas.map(a => {
          const Icon = a.icon
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                aba === a.id ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {a.label}
            </button>
          )
        })}
      </div>

      {/* ── ABA: ADICIONAR ─────────────────────────────────────────────────── */}
      {aba === 'adicionar' && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Novo Compromisso</h2>
          <form onSubmit={handleAdicionar} className="space-y-4">
            <div>
              <label className="label">Título *</label>
              <input
                className="input"
                placeholder="Ex: Reunião com equipe"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Data *</label>
              <input
                className="input"
                placeholder='Ex: "6 mar 26", "06/03/26", "2026-03-06"'
                value={dataAdd}
                onChange={e => setDataAdd(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Hora início *</label>
                <input
                  className="input"
                  placeholder='Ex: "14", "14h30", "14:30"'
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Hora fim *</label>
                <input
                  className="input"
                  placeholder='Ex: "15", "15h30", "15:30"'
                  value={horaFim}
                  onChange={e => setHoraFim(e.target.value)}
                  required
                />
              </div>
            </div>

            {msgAdd && (
              <div className={`text-sm px-3 py-2 rounded-lg ${msgAdd.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <p>{msgAdd.texto}</p>
                {msgAdd.link && (
                  <a href={msgAdd.link} target="_blank" rel="noopener noreferrer" className="underline font-medium mt-1 inline-flex items-center gap-1">
                    Abrir evento <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}

            <button type="submit" disabled={loadingAdd} className="btn-primary w-full">
              {loadingAdd ? 'Salvando...' : 'Salvar no Google Calendar'}
            </button>
          </form>
        </div>
      )}

      {/* ── ABA: VER DIA ───────────────────────────────────────────────────── */}
      {aba === 'ver' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Ver compromissos do dia</h2>
            <form onSubmit={handleVerDia} className="flex gap-3">
              <input
                className="input flex-1"
                placeholder='Ex: "6 mar 26", "06/03/26", "2026-03-06"'
                value={dataVer}
                onChange={e => setDataVer(e.target.value)}
                required
              />
              <button type="submit" disabled={loadingVer} className="btn-primary whitespace-nowrap">
                {loadingVer ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
            {erroVer && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroVer}</p>
            )}
          </div>

          {compromissos.length > 0 && (
            <div className="space-y-3">
              {compromissos.map(c => (
                <div key={c.id} className="card p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{c.titulo}</p>
                    <p className="text-sm text-gray-500">{c.horaInicio} – {c.horaFim}</p>
                    {c.local && <p className="text-xs text-gray-400 mt-0.5">📍 {c.local}</p>}
                  </div>
                  <a href={c.linkEdicao} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 text-blue-600" title="Editar no Google Calendar">
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {buscouVer && compromissos.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>Nenhum compromisso neste dia</p>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: EDITAR ────────────────────────────────────────────────────── */}
      {aba === 'editar' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Editar compromisso</h2>
            <p className="text-sm text-gray-500 mb-4">Busque pelo dia para ver os links de edição no Google Calendar.</p>
            <form onSubmit={handleGetLinks} className="flex gap-3">
              <input
                className="input flex-1"
                placeholder='Ex: "6 mar 26", "06/03/26", "2026-03-06"'
                value={dataEditar}
                onChange={e => setDataEditar(e.target.value)}
                required
              />
              <button type="submit" disabled={loadingEditar} className="btn-primary whitespace-nowrap">
                {loadingEditar ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
            {erroEditar && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erroEditar}</p>
            )}
          </div>

          {linksEdicao.length > 0 && (
            <div className="space-y-3">
              {linksEdicao.map(c => (
                <div key={c.id} className="card p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{c.titulo}</p>
                    <p className="text-sm text-gray-500">{c.horaInicio} – {c.horaFim}</p>
                  </div>
                  <a
                    href={c.linkEdicao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <ExternalLink size={14} />
                    Editar no Google
                  </a>
                </div>
              ))}
            </div>
          )}

          {buscouEditar && linksEdicao.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>Nenhum compromisso neste dia</p>
            </div>
          )}
        </div>
      )}
    </ModuleLayout>
  )
}
