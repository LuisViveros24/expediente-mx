import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

router.use(requireRol('superadmin'))

// GET /api/v1/superadmin/clinicas
router.get('/clinicas', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM clinicas ORDER BY creado_en DESC')
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/superadmin/clinicas
router.post('/clinicas', async (req, res, next) => {
  try {
    const { nombre, subdominio, email_admin, telefono, ciudad, plan, password_admin, nombre_admin } = req.body
    if (!nombre || !subdominio || !email_admin || !password_admin) {
      return res.status(400).json({ error: 'nombre, subdominio, email_admin y password_admin requeridos' })
    }
    const [result] = await db.query(
      'INSERT INTO clinicas (nombre, subdominio, email_admin, telefono, ciudad, plan) VALUES (?,?,?,?,?,?)',
      [nombre, subdominio, email_admin, telefono||null, ciudad||null, plan||'basico']
    )
    const clinicaId = result.insertId

    const hash = await bcrypt.hash(password_admin, 12)
    await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, rol) VALUES (?,?,?,?,?)',
      [clinicaId, nombre_admin || nombre, email_admin, hash, 'admin']
    )

    res.status(201).json({ id: clinicaId, subdominio })
  } catch (err) { next(err) }
})

// PUT /api/v1/superadmin/clinicas/:id
router.put('/clinicas/:id', async (req, res, next) => {
  try {
    const { plan, activo } = req.body
    const updates = []
    const vals = []
    if (plan !== undefined) { updates.push('plan = ?'); vals.push(plan) }
    if (activo !== undefined) { updates.push('activo = ?'); vals.push(activo) }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(`UPDATE clinicas SET ${updates.join(', ')} WHERE id = ?`, [...vals, req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/superadmin/clinicas/:id/usuarios
router.get('/clinicas/:id/usuarios', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo FROM usuarios WHERE clinica_id = ?',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
