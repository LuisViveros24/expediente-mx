import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

// GET /api/v1/bitacora — bitácora global (admin)
router.get('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.nombre as usuario_nombre, p.nombre as paciente_nombre, p.folio
       FROM bitacora b
       LEFT JOIN usuarios u ON u.id = b.usuario_id
       LEFT JOIN pacientes p ON p.id = b.paciente_id
       WHERE b.clinica_id = ?
       ORDER BY b.fecha DESC
       LIMIT 500`,
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
