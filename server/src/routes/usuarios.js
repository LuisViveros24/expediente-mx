import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

// GET /api/v1/usuarios
router.get('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo, limite_expedientes, creado_en FROM usuarios WHERE clinica_id = ?',
      [req.clinicaId]
    )
    // Agregar conteo de expedientes por usuario
    for (const u of rows) {
      const [cnt] = await db.query('SELECT COUNT(*) as total FROM pacientes WHERE usuario_creador_id = ? AND activo = TRUE', [u.id])
      u.total_expedientes = cnt[0].total
    }
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/usuarios
router.post('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, password, cedula, rol, email } = req.body
    if (!nombre || !password || !cedula || !rol) {
      return res.status(400).json({ error: 'nombre, cédula, contraseña y rol son requeridos' })
    }
    const hash = await bcrypt.hash(password, 12)
    // Email es opcional — si no se proporciona se deja null
    const emailFinal = email || null
    const [result] = await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, cedula, rol) VALUES (?,?,?,?,?,?)',
      [req.clinicaId, nombre, emailFinal, hash, cedula, rol]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) { next(err) }
})

// PUT /api/v1/usuarios/:id
router.put('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, cedula, rol, activo, password, limite_expedientes } = req.body
    const updates = []
    const vals = []
    if (nombre !== undefined) { updates.push('nombre = ?'); vals.push(nombre) }
    if (cedula !== undefined) { updates.push('cedula = ?'); vals.push(cedula) }
    if (rol !== undefined) { updates.push('rol = ?'); vals.push(rol) }
    if (activo !== undefined) { updates.push('activo = ?'); vals.push(activo) }
    if (limite_expedientes !== undefined) { updates.push('limite_expedientes = ?'); vals.push(limite_expedientes === '' ? null : Number(limite_expedientes)) }
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
