import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

router.use(requireRol('superadmin'))

router.get('/clinicas', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM clinicas ORDER BY creado_en DESC')
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/clinicas', async (req, res, next) => {
  try {
    const { nombre, subdominio, email_admin, telefono, ciudad, plan, password_admin, nombre_admin } = req.body
    if (!nombre || !subdominio || !email_admin || !password_admin) {
      return res.status(400).json({ error: 'nombre, subdominio, email_admin y password_admin requeridos' })
    }
    const { rows: clinicaRows } = await db.query(
      'INSERT INTO clinicas (nombre, subdominio, email_admin, telefono, ciudad, plan) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [nombre, subdominio, email_admin, telefono||null, ciudad||null, plan||'basico']
    )
    const clinicaId = clinicaRows[0].id

    const hash = await bcrypt.hash(password_admin, 12)
    await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4,$5)',
      [clinicaId, nombre_admin || nombre, email_admin, hash, 'admin']
    )

    res.status(201).json({ id: clinicaId, subdominio })
  } catch (err) { next(err) }
})

router.put('/clinicas/:id', async (req, res, next) => {
  try {
    const { plan, activo } = req.body
    const updates = []
    const vals = []
    let i = 1
    if (plan !== undefined) { updates.push(`plan = $${i++}`); vals.push(plan) }
    if (activo !== undefined) { updates.push(`activo = $${i++}`); vals.push(activo) }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(`UPDATE clinicas SET ${updates.join(', ')} WHERE id = $${i}`, [...vals, req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.get('/clinicas/:id/usuarios', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo FROM usuarios WHERE clinica_id = $1',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
