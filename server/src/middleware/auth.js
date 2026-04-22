import jwt from 'jsonwebtoken'
import db from '../db.js'

// IMPORTANTE: req.path dentro de un router montado en '/api/v1' es relativo
// al prefijo — ej: req.path = '/auth/login' (NO '/api/v1/auth/login')
const RUTAS_PUBLICAS = ['/auth/login']

export async function verificarToken(req, res, next) {
  if (RUTAS_PUBLICAS.includes(req.path)) return next()

  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const [rows] = await db.query(
      'SELECT id FROM tokens_revocados WHERE jti = ?',
      [payload.jti]
    )
    if (rows.length > 0) return res.status(401).json({ error: 'Sesión expirada' })

    if (payload.rol !== 'superadmin' && req.clinicaId && payload.clinicaId !== req.clinicaId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }

    req.usuario = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
