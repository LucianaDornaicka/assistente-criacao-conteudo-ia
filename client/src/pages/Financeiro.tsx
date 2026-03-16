import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface Transacao {
  id: string
  tipo: 'receita' | 'gasto'
  descricao: string
  valor: number
  categoria: string
  data: string
}

const CATEGORIAS_GASTO = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Casa', 'Outro']
const CATEGORIAS_RECEITA = ['Salário', 'Freelance', 'Investimento', 'Outro']

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [form, setForm] = useState({ tipo: 'gasto' as 'receita' | 'gasto', descricao: '', valor: '', categoria: 'Alimentação', data: new Date().toISOString().split('T')[0] })

  const adicionar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.descricao || !form.valor) return
    setTransacoes(t => [...t, { id: Date.now().toString(), ...form, valor: parseFloat(form.valor) }])
    setForm(f => ({ ...f, descricao: '', valor: '' }))
  }

  const deletar = (id: string) => setTransacoes(t => t.filter(x => x.id !== id))

  const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const gastos = transacoes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0)
  const saldo = receitas - gastos

  const categorias = form.tipo === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_RECEITA

  return (
    <ModuleLayout title="Financeiro" emoji="💰" description="Gastos e receitas" color="text-yellow-600" bgColor="bg-yellow-50">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Receitas</p>
          <p className="font-bold text-green-600">R$ {receitas.toFixed(2)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Gastos</p>
          <p className="font-bold text-red-500">R$ {gastos.toFixed(2)}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Saldo</p>
          <p className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>R$ {saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="card p-4 mb-4">
        <form onSubmit={adicionar} className="space-y-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['gasto', 'receita'] as const).map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t, categoria: t === 'gasto' ? 'Alimentação' : 'Salário' }))}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${form.tipo === t ? 'bg-white shadow text-yellow-600' : 'text-gray-500'}`}>
                {t === 'gasto' ? '📉 Gasto' : '📈 Receita'}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.01" className="input" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required />
            <input type="date" className="input" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <select className="input flex-1" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
            <button type="submit" className="btn-primary px-3"><Plus size={18} /></button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {transacoes.slice().reverse().map(t => (
          <div key={t.id} className="card p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.tipo === 'receita' ? 'bg-green-50' : 'bg-red-50'}`}>
              {t.tipo === 'receita' ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.descricao}</p>
              <p className="text-xs text-gray-400">{t.categoria} · {t.data}</p>
            </div>
            <p className={`font-semibold text-sm ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
              {t.tipo === 'receita' ? '+' : '-'}R$ {t.valor.toFixed(2)}
            </p>
            <button onClick={() => deletar(t.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {transacoes.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm">Nenhuma transação registrada</p>
          </div>
        )}
      </div>
    </ModuleLayout>
  )
}
