import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface TarefaCasa {
  id: string
  titulo: string
  comodo: string
  concluida: boolean
}

const COMODOS = ['Sala', 'Cozinha', 'Quarto', 'Banheiro', 'Área de Serviço', 'Garagem', 'Quintal', 'Geral']

export default function Casa() {
  const [tarefas, setTarefas] = useState<TarefaCasa[]>([])
  const [form, setForm] = useState({ titulo: '', comodo: 'Geral' })
  const [filtroComodo, setFiltroComodo] = useState('Todos')

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) return
    setTarefas(t => [...t, { id: Date.now().toString(), ...form, concluida: false }])
    setForm(f => ({ ...f, titulo: '' }))
  }

  const toggle = (id: string) => setTarefas(t => t.map(x => x.id === id ? { ...x, concluida: !x.concluida } : x))
  const deletar = (id: string) => setTarefas(t => t.filter(x => x.id !== id))

  const filtradas = filtroComodo === 'Todos' ? tarefas : tarefas.filter(t => t.comodo === filtroComodo)
  const comodosFiltro = ['Todos', ...COMODOS]

  return (
    <ModuleLayout title="Casa" emoji="🏠" description="Tarefas domésticas" color="text-red-600" bgColor="bg-red-50">
      <div className="card p-4 mb-4">
        <form onSubmit={adicionar} className="flex gap-2">
          <input className="input flex-1" placeholder="Nova tarefa doméstica..." value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          <select className="input w-32" value={form.comodo} onChange={e => setForm(f => ({ ...f, comodo: e.target.value }))}>
            {COMODOS.map(c => <option key={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
        </form>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {comodosFiltro.map(c => (
          <button key={c} onClick={() => setFiltroComodo(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              filtroComodo === c ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50'
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtradas.map(t => (
          <div key={t.id} className={`card p-3 flex items-center gap-3 ${t.concluida ? 'opacity-60' : ''}`}>
            <button onClick={() => toggle(t.id)}>
              {t.concluida ? <CheckCircle2 size={20} className="text-red-400" /> : <Circle size={20} className="text-gray-300" />}
            </button>
            <div className="flex-1">
              <p className={`text-sm font-medium ${t.concluida ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.titulo}</p>
              <p className="text-xs text-gray-400">{t.comodo}</p>
            </div>
            <button onClick={() => deletar(t.id)} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {filtradas.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🏠</p>
            <p className="text-sm">Nenhuma tarefa doméstica</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
