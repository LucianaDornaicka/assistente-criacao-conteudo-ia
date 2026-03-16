import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Agenda from '@/pages/Agenda'
import Tarefa from '@/pages/Tarefa'
import Financeiro from '@/pages/Financeiro'
import Lembrete from '@/pages/Lembrete'
import Cardapio from '@/pages/Cardapio'
import Casa from '@/pages/Casa'
import Estudo from '@/pages/Estudo'
import Ingles from '@/pages/Ingles'
import Medico from '@/pages/Medico'
import CriacaoVideo from '@/pages/CriacaoVideo'
import PublicacaoVideo from '@/pages/PublicacaoVideo'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
        <Route path="/tarefa" element={<PrivateRoute><Tarefa /></PrivateRoute>} />
        <Route path="/financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
        <Route path="/lembrete" element={<PrivateRoute><Lembrete /></PrivateRoute>} />
        <Route path="/cardapio" element={<PrivateRoute><Cardapio /></PrivateRoute>} />
        <Route path="/casa" element={<PrivateRoute><Casa /></PrivateRoute>} />
        <Route path="/estudo" element={<PrivateRoute><Estudo /></PrivateRoute>} />
        <Route path="/ingles" element={<PrivateRoute><Ingles /></PrivateRoute>} />
        <Route path="/medico" element={<PrivateRoute><Medico /></PrivateRoute>} />
        <Route path="/criacao-video" element={<PrivateRoute><CriacaoVideo /></PrivateRoute>} />
        <Route path="/publicacao-video" element={<PrivateRoute><PublicacaoVideo /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
