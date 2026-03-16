import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, Play, CheckCircle2 } from 'lucide-react'

interface Sessao {
  id: string
  materia: string
  duracao: number // minutos
  data: string
  concluida: boolean
}

interface Meta {
  id: string
  titulo: string
  progresso: number
  total: number
}

export default function Estudo() {
  const [aba, setAba] = useState<'sessoes' | 'metas'>('sessoes')
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [formSessao, setFormSessao] = useState({ materia: '', duracao: '60', data: new Date().toISOString().split('T')[0] })
  const [formMeta, setFormMeta] = useState({ titulo: '', total: '10' })

  const adicionarSessao = (e: React.FormEvent) => {
    e.preventDefault()
    setSessoes(s => [...s, { id: Date.now().toString(), ...formSessao, duracao: parseInt(formSessao.duracao), concluida: false }])
    setFormSessao(f => ({ ...f, materia: '' }))
  }

  const adicionarMeta = (e: React.FormEvent) => {
    e.preventDefault()
    setMetas(m => [...m, { id: Date.now().toString(), titulo: formMeta.titulo, progresso: 0, total: parseInt(formMeta.total) }])
    setFormMeta(f => ({ ...f, titulo: '' }))
  }

  const incrementarMeta = (id: string) => setMetas(m => m.map(x => x.id === id && x.progresso < x.total ? { ...x, progresso: x.progresso + 1 } : x))
  const deletarSessao = (id: string) => setSessoes(s => s.filter(x => x.id !== id))
  const deletarMeta = (id: string) => setMetas(m => m.filter(x => x.id !== id))

  const totalMinutos = sessoes.reduce((s, x) => s + x.duracao, 0)

  return (
    <ModuleLayout title="Estudo" emoji="📚" description="Sessões e metas" color="text-green-600" bgColor="bg-green-50">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Sessões</p>
          <p className="font-bold text-green-600 text-xl">{sessoes.length}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500">Horas estudadas</p>
          <p className="font-bold text-green-600 text-xl">{(totalMinutos / 60).toFixed(1)}h</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['sessoes', 'metas'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${aba === a ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>
            {a === 'sessoes' ? '📖 Sessões' : '🎯 Metas'}
          </button>
        ))}
      </div>

      {aba === 'sessoes' && (
        <>
          <div className="card p-4 mb-4">
            <form onSubmit={adicionarSessao} className="space-y-2">
              <input className="input" placeholder="Matéria / Assunto" value={formSessao.materia} onChange={e => setFormSessao(f => ({ ...f, materia: e.target.value }))} required />
              <div className="flex gap-2">
                <input type="number" className="input flex-1" placeholder="Duração (min)" value={formSessao.duracao} onChange={e => setFormSessao(f => ({ ...f, duracao: e.target.value }))} />
                <input type="date" className="input flex-1" value={formSessao.data} onChange={e => setFormSessao(f => ({ ...f, data: e.target.value }))} />
                <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
              </div>
            </form>
          </div>
          <div className="space-y-2">
            {sessoes.map(s => (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Play size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.materia}</p>
                  <p className="text-xs text-gray-400">{s.duracao} min · {s.data}</p>
                </div>
                <button onClick={() => deletarSessao(s.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {aba === 'metas' && (
        <>
          <div className="card p-4 mb-4">
            <form onSubmit={adicionarMeta} className="flex gap-2">
              <input className="input flex-1" placeholder="Meta de estudo" value={formMeta.titulo} onChange={e => setFormMeta(f => ({ ...f, titulo: e.target.value }))} required />
              <input type="number" className="input w-20" placeholder="Total" value={formMeta.total} onChange={e => setFormMeta(f => ({ ...f, total: e.target.value }))} />
              <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
            </form>
          </div>
          <div className="space-y-3">
            {metas.map(m => (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">{m.titulo}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{m.progresso}/{m.total}</span>
                    <button onClick={() => incrementarMeta(m.id)} className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold hover:bg-green-200">+</button>
                    <button onClick={() => deletarMeta(m.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((m.progresso / m.total) * 100, 100)}%` }} />
                </div>
                {m.progresso >= m.total && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Meta concluída!</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </ModuleLayout>
  )
}
