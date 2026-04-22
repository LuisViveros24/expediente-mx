import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' })

    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE',
      [email]
    )
    const usuario = rows[0]
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const ok = await bcrypt.compare(password, usuario.password_hash)
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' })

    if (usuario.rol !== 'superadmin' && req.clinicaId && usuario.clinica_id !== req.clinicaId) {
      return res.status(403).json({ error: 'Usuario no pertenece a esta clínica' })
    }

    const jti = uuidv4()
    const token = jwt.sign(
      { jti, id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, cedula: usuario.cedula, clinicaId: usuario.clinica_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    })

    res.json({ usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, cedula: usuario.cedula } })
  } catch (err) { next(err) }
})

router.post('/logout', async (req, res, next) => {
  try {
    if (req.usuario?.jti) {
      const expiraEn = new Date(req.usuario.exp * 1000)
      await db.query(
        'INSERT INTO tokens_revocados (jti, usuario_id, expira_en) VALUES ($1,$2,$3) ON CONFLICT (jti) DO NOTHING',
        [req.usuario.jti, req.usuario.id, expiraEn]
      )
    }
    res.clearCookie('token')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.get('/me', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' })
  res.json({ usuario: req.usuario })
})

export default router
