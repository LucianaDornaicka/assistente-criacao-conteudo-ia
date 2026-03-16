/**
 * Rota de Autenticação — Login simples com senha
 * Adicione ao .env:
 *   APP_PASSWORD=sua_senha_aqui
 *   JWT_SECRET=uma_chave_secreta_longa
 */

import express from 'express'
import jwt from 'jsonwebtoken'

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { senha } = req.body
  if (!senha || senha !== process.env.APP_PASSWORD) {
    return res.status(401).json({ erro: 'Senha incorreta' })
  }
  const token = jwt.sign({ ok: true }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

// Middleware de autenticação
export function autenticar(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autenticado' })
  }
  try {
    jwt.verify(auth.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido' })
  }
}

export { router }
