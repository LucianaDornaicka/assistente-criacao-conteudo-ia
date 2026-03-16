import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Bot } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES, MODULE_SHORTCUTS } from '@/lib/modules'

export default function Home() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [search, setSearch] = useState('')
  const [shortcutKey, setShortcutKey] = useState<string | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    const key = e.key.toUpperCase()
    const path = MODULE_SHORTCUTS[key]
    if (path) {
      setShortcutKey(key)
      setTimeout(() => {
        setShortcutKey(null)
        navigate(path)
      }, 150)
    }
  }, [navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const visible = MODULES.filter(m => m.visible)
  const filtered = visible.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.key.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm leading-tight">Assistente - Criação de Conteúdo - IA</h1>
          </div>
          <button onClick={logout} className="btn-ghost p-2 text-gray-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Barra de busca */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="input pl-9 bg-white shadow-sm"
          />
        </div>


        {/* Grid de módulos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => navigate(m.path)}
              className={`card p-4 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group ${
                shortcutKey === m.key ? 'ring-2 ring-violet-400 scale-95' : ''
              }`}
            >
              <div className={`w-12 h-12 ${m.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{m.emoji}</span>
              </div>
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{m.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                </div>
                {m.key && (
                  <span className={`badge ${m.bgColor} ${m.color} flex-shrink-0 mt-0.5`}>
                    {m.key}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p>Nenhum módulo encontrado para "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
