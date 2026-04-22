import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

router.get('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo, creado_en FROM usuarios WHERE clinica_id = $1',
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, email, password, cedula, rol } = req.body
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' })
    }
    const hash = await bcrypt.hash(password, 12)
    const { rows } = await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, cedula, rol) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [req.clinicaId, nombre, email, hash, cedula||null, rol]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) { next(err) }
})

router.put('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, cedula, rol, activo, password } = req.body
    const updates = []
    const vals = []
    let i = 1
    if (nombre !== undefined) { updates.push(`nombre = $${i++}`); vals.push(nombre) }
    if (cedula !== undefined) { updates.push(`cedula = $${i++}`); vals.push(cedula) }
    if (rol !== undefined) { updates.push(`rol = $${i++}`); vals.push(rol) }
    if (activo !== undefined) { updates.push(`activo = $${i++}`); vals.push(activo) }
    if (password) {
      const hash = await bcrypt.hash(password, 12)
      updates.push(`password_hash = $${i++}`); vals.push(hash)
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${i++} AND clinica_id = $${i}`,
      [...vals, req.params.id, req.clinicaId]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
