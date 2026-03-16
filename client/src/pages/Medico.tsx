import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, Calendar, Pill } from 'lucide-react'

interface Consulta {
  id: string
  medico: string
  especialidade: string
  data: string
  hora: string
  local: string
  observacoes: string
}

interface Medicamento {
  id: string
  nome: string
  dosagem: string
  horarios: string
  inicio: string
  fim: string
}

export default function Medico() {
  const [aba, setAba] = useState<'consultas' | 'medicamentos'>('consultas')
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [formConsulta, setFormConsulta] = useState({ medico: '', especialidade: '', data: '', hora: '', local: '', observacoes: '' })
  const [formMed, setFormMed] = useState({ nome: '', dosagem: '', horarios: '', inicio: '', fim: '' })

  const adicionarConsulta = (e: React.FormEvent) => {
    e.preventDefault()
    setConsultas(c => [...c, { id: Date.now().toString(), ...formConsulta }])
    setFormConsulta({ medico: '', especialidade: '', data: '', hora: '', local: '', observacoes: '' })
  }

  const adicionarMed = (e: React.FormEvent) => {
    e.preventDefault()
    setMedicamentos(m => [...m, { id: Date.now().toString(), ...formMed }])
    setFormMed({ nome: '', dosagem: '', horarios: '', inicio: '', fim: '' })
  }

  return (
    <ModuleLayout title="Médico" emoji="🩺" description="Consultas e medicamentos" color="text-teal-600" bgColor="bg-teal-50">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['consultas', 'medicamentos'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${aba === a ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>
            {a === 'consultas' ? '🏥 Consultas' : '💊 Medicamentos'}
          </button>
        ))}
      </div>

      {aba === 'consultas' && (
        <>
          <div className="card p-4 mb-4">
            <form onSubmit={adicionarConsulta} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Nome do médico" value={formConsulta.medico} onChange={e => setFormConsulta(f => ({ ...f, medico: e.target.value }))} required />
                <input className="input" placeholder="Especialidade" value={formConsulta.especialidade} onChange={e => setFormConsulta(f => ({ ...f, especialidade: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input" value={formConsulta.data} onChange={e => setFormConsulta(f => ({ ...f, data: e.target.value }))} required />
                <input type="time" className="input" value={formConsulta.hora} onChange={e => setFormConsulta(f => ({ ...f, hora: e.target.value }))} />
              </div>
              <input className="input" placeholder="Local / Clínica" value={formConsulta.local} onChange={e => setFormConsulta(f => ({ ...f, local: e.target.value }))} />
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Observações" value={formConsulta.observacoes} onChange={e => setFormConsulta(f => ({ ...f, observacoes: e.target.value }))} />
                <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
              </div>
            </form>
          </div>
          <div className="space-y-2">
            {consultas.map(c => (
              <div key={c.id} className="card p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{c.medico}</p>
                  <p className="text-xs text-gray-500">{c.especialidade}</p>
                  <p className="text-xs text-gray-400">{c.data} às {c.hora} · {c.local}</p>
                  {c.observacoes && <p className="text-xs text-gray-400 italic">{c.observacoes}</p>}
                </div>
                <button onClick={() => setConsultas(x => x.filter(i => i.id !== c.id))} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            {consultas.length === 0 && <div className="text-center py-8 text-gray-400"><p className="text-3xl mb-2">🏥</p><p className="text-sm">Nenhuma consulta agendada</p></div>}
          </div>
        </>
      )}

      {aba === 'medicamentos' && (
        <>
          <div className="card p-4 mb-4">
            <form onSubmit={adicionarMed} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Nome do medicamento" value={formMed.nome} onChange={e => setFormMed(f => ({ ...f, nome: e.target.value }))} required />
                <input className="input" placeholder="Dosagem (ex: 500mg)" value={formMed.dosagem} onChange={e => setFormMed(f => ({ ...f, dosagem: e.target.value }))} />
              </div>
              <input className="input" placeholder="Horários (ex: 8h, 14h, 20h)" value={formMed.horarios} onChange={e => setFormMed(f => ({ ...f, horarios: e.target.value }))} />
              <div className="flex gap-2">
                <input type="date" className="input flex-1" placeholder="Início" value={formMed.inicio} onChange={e => setFormMed(f => ({ ...f, inicio: e.target.value }))} />
                <input type="date" className="input flex-1" placeholder="Fim" value={formMed.fim} onChange={e => setFormMed(f => ({ ...f, fim: e.target.value }))} />
                <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
              </div>
            </form>
          </div>
          <div className="space-y-2">
            {medicamentos.map(m => (
              <div key={m.id} className="card p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Pill size={16} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{m.nome} <span className="text-gray-400 font-normal">{m.dosagem}</span></p>
                  <p className="text-xs text-gray-500">⏰ {m.horarios}</p>
                  {(m.inicio || m.fim) && <p className="text-xs text-gray-400">{m.inicio} → {m.fim}</p>}
                </div>
                <button onClick={() => setMedicamentos(x => x.filter(i => i.id !== m.id))} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            {medicamentos.length === 0 && <div className="text-center py-8 text-gray-400"><p className="text-3xl mb-2">💊</p><p className="text-sm">Nenhum medicamento cadastrado</p></div>}
          </div>
        </>
      )}
    </ModuleLayout>
  )
}
