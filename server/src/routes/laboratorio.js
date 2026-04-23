import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router({ mergeParams: true }) // hereda :id de pacientes

// GET /api/v1/pacientes/:id/laboratorio
router.get('/', async (req, res, next) => {
  try {
    const [solicitudes] = await db.query(
      `SELECT s.*, u.nombre as solicitante_nombre, u.cedula as solicitante_cedula
       FROM lab_solicitudes s
       JOIN usuarios u ON u.id = s.solicitante_id
       WHERE s.paciente_id = ?
       ORDER BY s.fecha_solicitud DESC`,
      [req.params.id]
    )
    for (const s of solicitudes) {
      const [items] = await db.query(
        'SELECT * FROM lab_examenes WHERE solicitud_id = ? ORDER BY id',
        [s.id]
      )
      s.examenes = items
    }
    res.json(solicitudes)
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes/:id/laboratorio — nueva solicitud
router.post('/', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { examenes = [], observaciones = '' } = req.body
    if (!examenes.length) {
      return res.status(400).json({ error: 'Debe incluir al menos un examen' })
    }

    const [result] = await db.query(
      'INSERT INTO lab_solicitudes (paciente_id, solicitante_id, observaciones) VALUES (?,?,?)',
      [req.params.id, req.usuario.id, observaciones || null]
    )
    const solicitudId = result.insertId

    for (const nombre of examenes) {
      if (nombre.trim()) {
        await db.query(
          'INSERT INTO lab_examenes (solicitud_id, nombre) VALUES (?,?)',
          [solicitudId, nombre.trim()]
        )
      }
    }

    await registrar(
      req.clinicaId, req.usuario.id, req.params.id,
      'SOLICITAR_LABORATORIO',
      `Solicitud #${solicitudId}: ${examenes.join(', ')}`
    )

    // Devolver la solicitud completa
    const [rows] = await db.query(
      `SELECT s.*, u.nombre as solicitante_nombre, u.cedula as solicitante_cedula
       FROM lab_solicitudes s JOIN usuarios u ON u.id = s.solicitante_id
       WHERE s.id = ?`,
      [solicitudId]
    )
    const [items] = await db.query('SELECT * FROM lab_examenes WHERE solicitud_id = ?', [solicitudId])
    rows[0].examenes = items

    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

// PUT /api/v1/pacientes/:id/laboratorio/examenes/:examenId — marcar recibido/pendiente
router.put('/examenes/:examenId', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { recibido } = req.body
    const fechaRecepcion = recibido ? new Date() : null

    await db.query(
      'UPDATE lab_examenes SET recibido = ?, fecha_recepcion = ? WHERE id = ?',
      [recibido, fechaRecepcion, req.params.examenId]
    )

    if (recibido) {
      // Obtener nombre del examen para la bitácora
      const [rows] = await db.query('SELECT nombre, solicitud_id FROM lab_examenes WHERE id = ?', [req.params.examenId])
      if (rows[0]) {
        await registrar(
          req.clinicaId, req.usuario.id, req.params.id,
          'RECIBIR_LABORATORIO',
          `Examen recibido: ${rows[0].nombre} (Solicitud #${rows[0].solicitud_id})`
        )
      }
    }

    const [updated] = await db.query('SELECT * FROM lab_examenes WHERE id = ?', [req.params.examenId])
    res.json(updated[0])
  } catch (err) { next(err) }
})

export default router
