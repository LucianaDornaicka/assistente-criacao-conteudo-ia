import React, { createContext, useContext, useState } from 'react'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('app_token')
  )
  const [loading] = useState(false)

  const isAuthenticated = !!token

  const login = async (senha: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.erro || err.error || 'Senha incorreta')
    }
    const data = await res.json()
    localStorage.setItem('app_token', data.token)
    setToken(data.token)
  }

  const logout = () => {
    localStorage.removeItem('app_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
