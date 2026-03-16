import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface Tarefa {
  id: string
  titulo: string
  categoria: string
  prioridade: 'alta' | 'media' | 'baixa'
  concluida: boolean
}

const CATEGORIAS = ['Trabalho', 'Pessoal', 'Saúde', 'Estudos', 'Casa', 'Financeiro', 'Outro']
const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-700' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-700' },
]

export default function Tarefa() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [form, setForm] = useState({ titulo: '', categoria: 'Pessoal', prioridade: 'media' as 'alta' | 'media' | 'baixa' })
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'concluidas'>('todas')

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) return
    setTarefas(t => [...t, { id: Date.now().toString(), ...form, concluida: false }])
    setForm(f => ({ ...f, titulo: '' }))
  }

  const toggleConcluida = (id: string) => {
    setTarefas(t => t.map(x => x.id === id ? { ...x, concluida: !x.concluida } : x))
  }

  const deletar = (id: string) => {
    setTarefas(t => t.filter(x => x.id !== id))
  }

  const filtradas = tarefas.filter(t =>
    filtro === 'todas' ? true : filtro === 'pendentes' ? !t.concluida : t.concluida
  )

  const getPrioridade = (p: string) => PRIORIDADES.find(x => x.value === p)

  return (
    <ModuleLayout title="Tarefa" emoji="✅" description="Lista de tarefas" color="text-violet-600" bgColor="bg-violet-50">
      {/* Formulário */}
      <div className="card p-4 mb-4">
        <form onSubmit={adicionar} className="space-y-3">
          <input
            className="input"
            placeholder="Nova tarefa..."
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          />
          <div className="flex gap-2">
            <select className="input flex-1" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="input flex-1" value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value as any }))}>
              {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button type="submit" className="btn-primary px-3">
              <Plus size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['todas', 'pendentes', 'concluidas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filtro === f ? 'bg-white shadow text-violet-600' : 'text-gray-500'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtradas.map(t => {
          const p = getPrioridade(t.prioridade)
          return (
            <div key={t.id} className={`card p-3 flex items-center gap-3 ${t.concluida ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleConcluida(t.id)} className="flex-shrink-0">
                {t.concluida ? <CheckCircle2 size={20} className="text-violet-500" /> : <Circle size={20} className="text-gray-300" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.concluida ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{t.categoria}</span>
                  <span className={`badge text-xs ${p?.color}`}>{p?.label}</span>
                </div>
              </div>
              <button onClick={() => deletar(t.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
        {filtradas.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm">Nenhuma tarefa aqui</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
