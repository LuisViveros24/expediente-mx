import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

router.put('/:id/firmar', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { firma_digital, firma_paciente } = req.body
    const { rows } = await db.query(
      `SELECT pr.* FROM prescripciones pr
       JOIN pacientes p ON p.id = pr.paciente_id
       WHERE pr.id = $1 AND p.clinica_id = $2`,
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Receta no encontrada' })

    await db.query(
      'UPDATE prescripciones SET firmada = TRUE, firma_digital = $1, firma_paciente = $2 WHERE id = $3',
      [firma_digital||null, firma_paciente||null, req.params.id]
    )
    await registrar(req.clinicaId, req.usuario.id, rows[0].paciente_id, 'FIRMAR_RECETA', `Receta #${req.params.id}`)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
