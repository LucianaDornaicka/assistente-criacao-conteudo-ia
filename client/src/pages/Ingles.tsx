import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react'

interface Palavra {
  id: string
  ingles: string
  portugues: string
  exemplo: string
  aprendida: boolean
}

export default function Ingles() {
  const [palavras, setPalavras] = useState<Palavra[]>([])
  const [form, setForm] = useState({ ingles: '', portugues: '', exemplo: '' })
  const [flashcard, setFlashcard] = useState<string | null>(null)
  const [mostrarTradução, setMostrarTraducao] = useState<Record<string, boolean>>({})

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.ingles || !form.portugues) return
    setPalavras(p => [...p, { id: Date.now().toString(), ...form, aprendida: false }])
    setForm({ ingles: '', portugues: '', exemplo: '' })
  }

  const toggleAprendida = (id: string) => setPalavras(p => p.map(x => x.id === id ? { ...x, aprendida: !x.aprendida } : x))
  const deletar = (id: string) => setPalavras(p => p.filter(x => x.id !== id))
  const toggleTraducao = (id: string) => setMostrarTraducao(m => ({ ...m, [id]: !m[id] }))

  const pendentes = palavras.filter(p => !p.aprendida)
  const aprendidas = palavras.filter(p => p.aprendida)

  return (
    <ModuleLayout title="Inglês" emoji="🇺🇸" description="Vocabulário e progresso" color="text-indigo-600" bgColor="bg-indigo-50">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-bold text-indigo-600 text-xl">{palavras.length}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Aprendidas</p>
          <p className="font-bold text-green-600 text-xl">{aprendidas.length}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="font-bold text-orange-500 text-xl">{pendentes.length}</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <form onSubmit={adicionar} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="Palavra em inglês" value={form.ingles} onChange={e => setForm(f => ({ ...f, ingles: e.target.value }))} required />
            <input className="input" placeholder="Tradução em português" value={form.portugues} onChange={e => setForm(f => ({ ...f, portugues: e.target.value }))} required />
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Exemplo de uso (opcional)" value={form.exemplo} onChange={e => setForm(f => ({ ...f, exemplo: e.target.value }))} />
            <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {palavras.map(p => (
          <div key={p.id} className={`card p-3 ${p.aprendida ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{p.ingles}</p>
                  <button onClick={() => toggleTraducao(p.id)} className="text-xs text-indigo-500 hover:text-indigo-700">
                    {mostrarTradução[p.id] ? 'ocultar' : 'ver tradução'}
                  </button>
                </div>
                {mostrarTradução[p.id] && (
                  <p className="text-sm text-gray-600 mt-0.5">{p.portugues}</p>
                )}
                {p.exemplo && mostrarTradução[p.id] && (
                  <p className="text-xs text-gray-400 italic mt-0.5">"{p.exemplo}"</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleAprendida(p.id)} className={`p-1.5 rounded-lg transition-colors ${p.aprendida ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                  <CheckCircle2 size={16} />
                </button>
                <button onClick={() => deletar(p.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {palavras.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🇺🇸</p>
            <p className="text-sm">Adicione palavras para estudar</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
