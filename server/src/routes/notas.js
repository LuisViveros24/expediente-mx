import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

router.put('/:id/firmar', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT n.* FROM notas n
       JOIN pacientes p ON p.id = n.paciente_id
       WHERE n.id = $1 AND p.clinica_id = $2`,
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Nota no encontrada' })

    await db.query('UPDATE notas SET firmado = TRUE WHERE id = $1', [req.params.id])
    await registrar(req.clinicaId, req.usuario.id, rows[0].paciente_id, 'FIRMAR_NOTA', `Nota #${req.params.id}`)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
