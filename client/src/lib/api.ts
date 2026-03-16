function getToken() {
  return localStorage.getItem('app_token') ?? ''
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(err.error || `Erro ${res.status}`)
  }
  return res.json()
}

// ─── AGENDA ────────────────────────────────────────────────────────────────

export interface NovoCompromisso {
  titulo: string
  data: string       // YYYY-MM-DD
  horaInicio: string // HH:MM
  horaFim: string    // HH:MM
  local?: string
  descricao?: string
}

export async function adicionarCompromisso(data: NovoCompromisso) {
  const res = await fetch('/api/agenda/adicionar', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export async function verCompromissosDoDia(data: string) {
  const res = await fetch(`/api/agenda/dia?data=${data}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function getLinksEdicao(data: string) {
  const res = await fetch(`/api/agenda/links-edicao?data=${data}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

// ─── TAREFAS ───────────────────────────────────────────────────────────────

export interface Tarefa {
  id?: string
  titulo: string
  categoria: string
  prioridade: 'alta' | 'media' | 'baixa'
  concluida?: boolean
}

export async function listarTarefas() {
  const res = await fetch('/api/tarefas', { headers: authHeaders() })
  return handleResponse(res)
}

export async function adicionarTarefa(tarefa: Tarefa) {
  const res = await fetch('/api/tarefas', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(tarefa),
  })
  return handleResponse(res)
}

export async function atualizarTarefa(id: string, dados: Partial<Tarefa>) {
  const res = await fetch(`/api/tarefas/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(dados),
  })
  return handleResponse(res)
}

export async function deletarTarefa(id: string) {
  const res = await fetch(`/api/tarefas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

// ─── FINANCEIRO ────────────────────────────────────────────────────────────

export interface Transacao {
  id?: string
  tipo: 'receita' | 'gasto'
  descricao: string
  valor: number
  categoria: string
  data: string
}

export async function listarTransacoes() {
  const res = await fetch('/api/financeiro', { headers: authHeaders() })
  return handleResponse(res)
}

export async function adicionarTransacao(transacao: Transacao) {
  const res = await fetch('/api/financeiro', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(transacao),
  })
  return handleResponse(res)
}

export async function deletarTransacao(id: string) {
  const res = await fetch(`/api/financeiro/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse(res)
}

// ─── LEMBRETES ─────────────────────────────────────────────────────────────

export interface Lembrete {
  id?: string
  titulo: string
  descricao?: string
  dataHora: string
  tipo: 'aviso' | 'urgente' | 'rotina'
  concluido?: boolean
}

export async function listarLembretes() {
  const res = await fetch('/api/lembretes', { headers: authHeaders() })
  return handleResponse(res)
}

export async function adicionarLembrete(lembrete: Lembrete) {
  const res = await fetch('/api/lembretes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(lembrete),
  })
  return handleResponse(res)
}

export async function atualizarLembrete(id: string, dados: Partial<Lembrete>) {
  const res = await fetch(`/api/lembretes/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(dados),
  })
  return handleResponse(res)
}

export async function deletarLembrete(id: string) {
  const res = await fetch(`/api/lembretes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse(res)
}
