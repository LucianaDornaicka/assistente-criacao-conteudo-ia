import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface ModuleLayoutProps {
  title: string
  emoji: string
  description?: string
  color?: string
  bgColor?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function ModuleLayout({
  title,
  emoji,
  description,
  color = 'text-violet-600',
  bgColor = 'bg-violet-50',
  children,
  actions,
}: ModuleLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-ghost p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={`w-9 h-9 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <span className="text-lg">{emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`font-semibold text-gray-900 leading-tight`}>{title}</h1>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        {children}
      </div>
    </div>
  )
}
