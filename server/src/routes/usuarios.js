import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

// GET /api/v1/usuarios
router.get('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo, creado_en FROM usuarios WHERE clinica_id = ?',
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/usuarios
router.post('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, email, password, cedula, rol } = req.body
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' })
    }
    const hash = await bcrypt.hash(password, 12)
    const [result] = await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, cedula, rol) VALUES (?,?,?,?,?,?)',
      [req.clinicaId, nombre, email, hash, cedula||null, rol]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) { next(err) }
})

// PUT /api/v1/usuarios/:id
router.put('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, cedula, rol, activo, password } = req.body
    const updates = []
    const vals = []
    if (nombre !== undefined) { updates.push('nombre = ?'); vals.push(nombre) }
    if (cedula !== undefined) { updates.push('cedula = ?'); vals.push(cedula) }
    if (rol !== undefined) { updates.push('rol = ?'); vals.push(rol) }
    if (activo !== undefined) { updates.push('activo = ?'); vals.push(activo) }
    if (password) {
      const hash = await bcrypt.hash(password, 12)
      updates.push('password_hash = ?'); vals.push(hash)
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`,
      [...vals, req.params.id, req.clinicaId]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
