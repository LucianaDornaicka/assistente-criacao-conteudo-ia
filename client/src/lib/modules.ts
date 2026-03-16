export interface Module {
  id: string
  key: string       // letra de atalho
  name: string
  description: string
  path: string
  color: string
  bgColor: string
  emoji: string
  visible: boolean  // false = oculto no dashboard (mas rota ainda existe)
}

export const MODULES: Module[] = [
  { id: 'agenda',    key: 'A', name: 'Agenda',              description: 'Compromissos e calendário',   path: '/agenda',           color: 'text-blue-600',   bgColor: 'bg-blue-50',   emoji: '📅', visible: false },
  { id: 'cardapio',  key: 'C', name: 'Cardápio',            description: 'Refeições da semana',         path: '/cardapio',          color: 'text-orange-600', bgColor: 'bg-orange-50', emoji: '🍽️', visible: false },
  { id: 'casa',      key: 'K', name: 'Casa',                description: 'Tarefas domésticas',          path: '/casa',              color: 'text-red-600',    bgColor: 'bg-red-50',    emoji: '🏠', visible: false },
  { id: 'estudo',    key: 'E', name: 'Estudo',              description: 'Sessões e metas',             path: '/estudo',            color: 'text-green-600',  bgColor: 'bg-green-50',  emoji: '📚', visible: false },
  { id: 'financeiro',key: 'F', name: 'Financeiro',          description: 'Gastos e receitas',           path: '/financeiro',        color: 'text-yellow-600', bgColor: 'bg-yellow-50', emoji: '💰', visible: false },
  { id: 'ingles',    key: 'I', name: 'Inglês',              description: 'Vocabulário e progresso',     path: '/ingles',            color: 'text-indigo-600', bgColor: 'bg-indigo-50', emoji: '🇺🇸', visible: false },
  { id: 'lembrete',  key: 'L', name: 'Lembrete',            description: 'Alertas e avisos',            path: '/lembrete',          color: 'text-amber-600',  bgColor: 'bg-amber-50',  emoji: '🔔', visible: false },
  { id: 'medico',    key: 'M', name: 'Médico',              description: 'Consultas e medicamentos',    path: '/medico',            color: 'text-teal-600',   bgColor: 'bg-teal-50',   emoji: '🩺', visible: false },
  { id: 'tarefa',    key: 'T', name: 'Tarefa',              description: 'Lista de tarefas',            path: '/tarefa',            color: 'text-violet-600', bgColor: 'bg-violet-50', emoji: '✅', visible: false },
  { id: 'criacao',   key: '',  name: 'Criação de Vídeos',   description: 'Pipeline de produção',        path: '/criacao-video',    color: 'text-pink-600',   bgColor: 'bg-pink-50',   emoji: '🎬', visible: true },
  { id: 'publicacao',key: '',  name: 'Publicação de Vídeos',description: 'YouTube e Spotify',           path: '/publicacao-video', color: 'text-rose-600',   bgColor: 'bg-rose-50',   emoji: '📤', visible: true },
]

export const MODULE_SHORTCUTS: Record<string, string> = {
  'A': '/agenda',
  'C': '/cardapio',
  'K': '/casa',
  'E': '/estudo',
  'F': '/financeiro',
  'I': '/ingles',
  'L': '/lembrete',
  'M': '/medico',
  'T': '/tarefa',
}
