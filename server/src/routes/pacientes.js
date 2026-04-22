import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM pacientes WHERE clinica_id = $1 AND activo = TRUE ORDER BY creado_en DESC',
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM pacientes WHERE id = $1 AND clinica_id = $2 AND activo = TRUE',
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.post('/', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { folio, fecha_creacion, nombre, fecha_nacimiento, sexo, ...resto } = req.body
    if (!nombre || !fecha_nacimiento || !sexo) {
      return res.status(400).json({ error: 'nombre, fecha_nacimiento y sexo son requeridos' })
    }
    const { rows } = await db.query(
      `INSERT INTO pacientes
        (clinica_id, folio, fecha_creacion, usuario_creador_id,
         nombre, fecha_nacimiento, sexo,
         curp, rfc, estado_civil, escolaridad, ocupacion,
         nacionalidad, religion, lugar_nacimiento, domicilio,
         telefono, telefono_emergencia, contacto_emergencia,
         grupo_sanguineo, alergias)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING id`,
      [
        req.clinicaId, folio, fecha_creacion || new Date().toISOString().split('T')[0],
        req.usuario.id, nombre, fecha_nacimiento, sexo,
        resto.curp||null, resto.rfc||null, resto.estado_civil||null,
        resto.escolaridad||null, resto.ocupacion||null, resto.nacionalidad||null,
        resto.religion||null, resto.lugar_nacimiento||null, resto.domicilio||null,
        resto.telefono||null, resto.telefono_emergencia||null,
        resto.contacto_emergencia||null, resto.grupo_sanguineo||null, resto.alergias||null,
      ]
    )
    const pacienteId = rows[0].id

    await db.query('INSERT INTO historia_clinica (paciente_id) VALUES ($1)', [pacienteId])
    await registrar(req.clinicaId, req.usuario.id, pacienteId, 'CREAR_EXPEDIENTE', `Folio: ${folio}`)

    const { rows: nuevo } = await db.query('SELECT * FROM pacientes WHERE id = $1', [pacienteId])
    res.status(201).json(nuevo[0])
  } catch (err) { next(err) }
})

router.put('/:id', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { rows: existe } = await db.query(
      'SELECT id FROM pacientes WHERE id = $1 AND clinica_id = $2',
      [req.params.id, req.clinicaId]
    )
    if (!existe[0]) return res.status(404).json({ error: 'Paciente no encontrado' })

    const campos = ['nombre','fecha_nacimiento','sexo','curp','rfc','estado_civil',
      'escolaridad','ocupacion','nacionalidad','religion','lugar_nacimiento',
      'domicilio','telefono','telefono_emergencia','contacto_emergencia',
      'grupo_sanguineo','alergias']

    let i = 1
    const sets = campos.filter(c => req.body[c] !== undefined).map(c => `${c} = $${i++}`).join(', ')
    const vals = campos.filter(c => req.body[c] !== undefined).map(c => req.body[c])

    if (!sets) return res.status(400).json({ error: 'No hay campos para actualizar' })

    await db.query(
      `UPDATE pacientes SET ${sets} WHERE id = $${i++} AND clinica_id = $${i}`,
      [...vals, req.params.id, req.clinicaId]
    )

    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_IDENTIFICACION', '')

    const { rows: updated } = await db.query('SELECT * FROM pacientes WHERE id = $1', [req.params.id])
    res.json(updated[0])
  } catch (err) { next(err) }
})

router.delete('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { rows: existe } = await db.query(
      'SELECT id FROM pacientes WHERE id = $1 AND clinica_id = $2',
      [req.params.id, req.clinicaId]
    )
    if (!existe[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
    await db.query(
      'UPDATE pacientes SET activo = FALSE WHERE id = $1 AND clinica_id = $2',
      [req.params.id, req.clinicaId]
    )
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ARCHIVAR_EXPEDIENTE', 'NOM-004: registro archivado, no eliminado')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.get('/:id/historia', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT h.* FROM historia_clinica h
       JOIN pacientes p ON p.id = h.paciente_id
       WHERE h.paciente_id = $1 AND p.clinica_id = $2`,
      [req.params.id, req.clinicaId]
    )
    res.json(rows[0] || {})
  } catch (err) { next(err) }
})

router.put('/:id/historia', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const campos = ['motivo_consulta','padecimiento_actual','antecedentes_heredofamiliares',
      'antecedentes_personales_patologicos','antecedentes_personales_no_patologicos',
      'antecedentes_ginecoobstetricos','antecedentes_pediatricos','exploracion_fisica']
    let i = 1
    const sets = campos.filter(c => req.body[c] !== undefined).map(c => `${c} = $${i++}`).join(', ')
    const vals = campos.filter(c => req.body[c] !== undefined).map(c =>
      c === 'exploracion_fisica' ? JSON.stringify(req.body[c]) : req.body[c]
    )
    if (!sets) return res.status(400).json({ error: 'Sin campos' })
    const { rows: existe } = await db.query(
      `SELECT h.id FROM historia_clinica h
       JOIN pacientes p ON p.id = h.paciente_id
       WHERE h.paciente_id = $1 AND p.clinica_id = $2`,
      [req.params.id, req.clinicaId]
    )
    if (!existe[0]) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    await db.query(`UPDATE historia_clinica SET ${sets} WHERE paciente_id = $${i}`, [...vals, req.params.id])
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_HISTORIA', '')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

router.get('/:id/notas', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT n.*, u.nombre as autor_nombre, u.cedula as autor_cedula
       FROM notas n
       JOIN usuarios u ON u.id = n.autor_id
       JOIN pacientes p ON p.id = n.paciente_id
       WHERE n.paciente_id = $1 AND p.clinica_id = $2
       ORDER BY n.fecha DESC`,
      [req.params.id, req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/:id/notas', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const { subjetivo, objetivo, analisis, plan, tipo = 'evolucion' } = req.body
    const { rows } = await db.query(
      `INSERT INTO notas (paciente_id, autor_id, fecha, tipo, subjetivo, objetivo, analisis, plan)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6,$7) RETURNING id`,
      [req.params.id, req.usuario.id, tipo, subjetivo||'', objetivo||'', analisis||'', plan||'']
    )
    const notaId = rows[0].id
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'AGREGAR_NOTA', `Nota #${notaId}`)
    const { rows: nueva } = await db.query('SELECT * FROM notas WHERE id = $1', [notaId])
    res.status(201).json(nueva[0])
  } catch (err) { next(err) }
})

router.get('/:id/prescripciones', async (req, res, next) => {
  try {
    const { rows: recetas } = await db.query(
      `SELECT p.*, u.nombre as medico_nombre, u.cedula as medico_cedula
       FROM prescripciones p
       JOIN usuarios u ON u.id = p.medico_id
       JOIN pacientes pa ON pa.id = p.paciente_id
       WHERE p.paciente_id = $1 AND pa.clinica_id = $2
       ORDER BY p.fecha DESC`,
      [req.params.id, req.clinicaId]
    )
    for (const r of recetas) {
      const { rows: meds } = await db.query('SELECT * FROM prescripcion_medicamentos WHERE prescripcion_id = $1', [r.id])
      r.medicamentos = meds
    }
    res.json(recetas)
  } catch (err) { next(err) }
})

router.post('/:id/prescripciones', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { medicamentos = [], firma_digital, firma_paciente } = req.body
    const { rows } = await db.query(
      `INSERT INTO prescripciones (paciente_id, medico_id, fecha, firma_digital, firma_paciente)
       VALUES ($1,$2,NOW(),$3,$4) RETURNING id`,
      [req.params.id, req.usuario.id, firma_digital||null, firma_paciente||null]
    )
    const prescripcionId = rows[0].id
    for (const m of medicamentos) {
      await db.query(
        `INSERT INTO prescripcion_medicamentos (prescripcion_id, nombre, dosis, via, frecuencia, duracion, indicaciones)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [prescripcionId, m.nombre, m.dosis||'', m.via||'', m.frecuencia||'', m.duracion||'', m.indicaciones||'']
      )
    }
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'CREAR_RECETA', `Receta #${prescripcionId}`)
    res.status(201).json({ id: prescripcionId })
  } catch (err) { next(err) }
})

router.get('/:id/consentimientos', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.* FROM consentimientos c
       JOIN pacientes p ON p.id = c.paciente_id
       WHERE c.paciente_id = $1 AND p.clinica_id = $2
       ORDER BY c.fecha DESC`,
      [req.params.id, req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/:id/consentimientos', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const { tipo, texto, testigo, firma_digital, firma_medico } = req.body
    const { rows } = await db.query(
      `INSERT INTO consentimientos (paciente_id, fecha, tipo, texto, firmado, testigo, firma_digital, firma_medico)
       VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7) RETURNING id`,
      [req.params.id, tipo, texto||'', !!(firma_digital||firma_medico), testigo||null, firma_digital||null, firma_medico||null]
    )
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'AGREGAR_CONSENTIMIENTO', tipo)
    res.status(201).json({ id: rows[0].id })
  } catch (err) { next(err) }
})

router.get('/:id/bitacora', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, u.nombre as usuario_nombre
       FROM bitacora b
       LEFT JOIN usuarios u ON u.id = b.usuario_id
       WHERE b.paciente_id = $1 AND b.clinica_id = $2
       ORDER BY b.fecha DESC`,
      [req.params.id, req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
