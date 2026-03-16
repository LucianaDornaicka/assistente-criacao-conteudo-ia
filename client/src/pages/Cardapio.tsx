import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
const REFEICOES = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar']

type Cardapio = Record<string, Record<string, string>>

export default function Cardapio() {
  const [diaSelecionado, setDiaSelecionado] = useState('Segunda')
  const [cardapio, setCardapio] = useState<Cardapio>({})
  const [editando, setEditando] = useState<string | null>(null)
  const [valor, setValor] = useState('')

  const getRefeicao = (dia: string, refeicao: string) => cardapio[dia]?.[refeicao] || ''

  const salvar = (refeicao: string) => {
    setCardapio(c => ({
      ...c,
      [diaSelecionado]: { ...(c[diaSelecionado] || {}), [refeicao]: valor }
    }))
    setEditando(null)
    setValor('')
  }

  const iniciarEdicao = (refeicao: string) => {
    setEditando(refeicao)
    setValor(getRefeicao(diaSelecionado, refeicao))
  }

  return (
    <ModuleLayout title="Cardápio" emoji="🍽️" description="Refeições da semana" color="text-orange-600" bgColor="bg-orange-50">
      {/* Dias da semana */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {DIAS.map(dia => (
          <button key={dia} onClick={() => setDiaSelecionado(dia)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              diaSelecionado === dia ? 'bg-orange-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
            }`}>
            {dia}
          </button>
        ))}
      </div>

      {/* Refeições */}
      <div className="space-y-3">
        {REFEICOES.map(refeicao => {
          const conteudo = getRefeicao(diaSelecionado, refeicao)
          const isEditando = editando === refeicao
          return (
            <div key={refeicao} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">{refeicao}</h3>
                {!isEditando && (
                  <button onClick={() => iniciarEdicao(refeicao)} className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                    {conteudo ? 'Editar' : '+ Adicionar'}
                  </button>
                )}
              </div>
              {isEditando ? (
                <div className="space-y-2">
                  <textarea
                    className="input resize-none text-sm"
                    rows={2}
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder={`O que vai ter no ${refeicao.toLowerCase()}?`}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => salvar(refeicao)} className="btn-primary text-sm py-1.5 flex-1">Salvar</button>
                    <button onClick={() => setEditando(null)} className="btn-secondary text-sm py-1.5 flex-1">Cancelar</button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${conteudo ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                  {conteudo || 'Não planejado'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </ModuleLayout>
  )
}
