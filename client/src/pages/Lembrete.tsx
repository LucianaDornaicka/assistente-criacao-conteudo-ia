import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, Bell, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react'

interface Lembrete {
  id: string
  titulo: string
  descricao: string
  dataHora: string
  tipo: 'aviso' | 'urgente' | 'rotina'
  concluido: boolean
}

const TIPOS = [
  { value: 'aviso', label: 'Aviso', icon: Bell, color: 'bg-blue-50 text-blue-600' },
  { value: 'urgente', label: 'Urgente', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { value: 'rotina', label: 'Rotina', icon: RefreshCw, color: 'bg-green-50 text-green-600' },
]

export default function Lembrete() {
  const [lembretes, setLembretes] = useState<Lembrete[]>([])
  const [form, setForm] = useState({ titulo: '', descricao: '', dataHora: '', tipo: 'aviso' as 'aviso' | 'urgente' | 'rotina' })

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo || !form.dataHora) return
    setLembretes(l => [...l, { id: Date.now().toString(), ...form, concluido: false }])
    setForm(f => ({ ...f, titulo: '', descricao: '', dataHora: '' }))
  }

  const toggleConcluido = (id: string) => setLembretes(l => l.map(x => x.id === id ? { ...x, concluido: !x.concluido } : x))
  const deletar = (id: string) => setLembretes(l => l.filter(x => x.id !== id))

  const getTipo = (t: string) => TIPOS.find(x => x.value === t)

  return (
    <ModuleLayout title="Lembrete" emoji="🔔" description="Alertas e avisos" color="text-amber-600" bgColor="bg-amber-50">
      <div className="card p-4 mb-4">
        <form onSubmit={adicionar} className="space-y-3">
          <input className="input" placeholder="Título do lembrete" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <input className="input" placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" className="input" value={form.dataHora} onChange={e => setForm(f => ({ ...f, dataHora: e.target.value }))} required />
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={16} /> Adicionar Lembrete
          </button>
        </form>
      </div>

      <div className="space-y-2">
        {lembretes.slice().sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()).map(l => {
          const tipo = getTipo(l.tipo)
          const Icon = tipo?.icon || Bell
          return (
            <div key={l.id} className={`card p-3 flex items-start gap-3 ${l.concluido ? 'opacity-60' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tipo?.color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${l.concluido ? 'line-through text-gray-400' : 'text-gray-900'}`}>{l.titulo}</p>
                {l.descricao && <p className="text-xs text-gray-500">{l.descricao}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{new Date(l.dataHora).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleConcluido(l.id)} className={`p-1.5 rounded-lg transition-colors ${l.concluido ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                  <CheckCircle2 size={16} />
                </button>
                <button onClick={() => deletar(l.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
        {lembretes.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-sm">Nenhum lembrete cadastrado</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
