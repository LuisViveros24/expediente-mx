import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

// Helper: cuando clinicaId es null (acceso directo sin subdominio) no filtra por clínica
const cFiltro = (clinicaId) =>
  clinicaId !== null && clinicaId !== undefined
    ? { sql: 'clinica_id = ?', params: [clinicaId] }
    : { sql: '1=1',            params: [] }

// GET /api/v1/pacientes — superadmin ve todos, cada usuario ve solo los suyos
router.get('/', async (req, res, next) => {
  try {
    let rows
    if (req.usuario.rol === 'superadmin') {
      ;[rows] = await db.query('SELECT * FROM pacientes WHERE activo = TRUE ORDER BY creado_en DESC')
    } else {
      ;[rows] = await db.query(
        'SELECT * FROM pacientes WHERE usuario_creador_id = ? AND activo = TRUE ORDER BY creado_en DESC',
        [req.usuario.id]
      )
    }
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [rows] = await db.query(
      `SELECT * FROM pacientes WHERE id = ? AND ${cf.sql} AND activo = TRUE`,
      [req.params.id, ...cf.params]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes — crear expediente
router.post('/', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { fecha_creacion, nombre, fecha_nacimiento, sexo, ...resto } = req.body
    if (!nombre || !fecha_nacimiento || !sexo) {
      return res.status(400).json({ error: 'nombre, fecha_nacimiento y sexo son requeridos' })
    }

    // Verificar límite de expedientes del usuario
    if (req.usuario.rol !== 'superadmin') {
      const [uRows] = await db.query('SELECT limite_expedientes FROM usuarios WHERE id = ?', [req.usuario.id])
      const limite = uRows[0]?.limite_expedientes
      if (limite !== null && limite !== undefined) {
        const [cnt] = await db.query(
          'SELECT COUNT(*) as total FROM pacientes WHERE usuario_creador_id = ? AND activo = TRUE',
          [req.usuario.id]
        )
        if (cnt[0].total >= limite) {
          return res.status(403).json({ error: `Límite de expedientes alcanzado (${limite}). Contacta al administrador.` })
        }
      }
    }

    // Insertar con folio temporal — se actualiza con insertId para garantizar unicidad
    const [result] = await db.query(
      `INSERT INTO pacientes
        (clinica_id, folio, fecha_creacion, usuario_creador_id,
         nombre, fecha_nacimiento, sexo,
         curp, rfc, estado_civil, escolaridad, ocupacion,
         nacionalidad, religion, lugar_nacimiento, domicilio,
         telefono, telefono_emergencia, contacto_emergencia,
         grupo_sanguineo, alergias)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.clinicaId || null,
        'TEMP',
        fecha_creacion || new Date().toISOString().split('T')[0],
        req.usuario.id, nombre, fecha_nacimiento, sexo,
        resto.curp||null, resto.rfc||null, resto.estado_civil||null,
        resto.escolaridad||null, resto.ocupacion||null, resto.nacionalidad||null,
        resto.religion||null, resto.lugar_nacimiento||null, resto.domicilio||null,
        resto.telefono||null, resto.telefono_emergencia||null,
        resto.contacto_emergencia||null, resto.grupo_sanguineo||null, resto.alergias||null,
      ]
    )

    const pacienteId = result.insertId

    // Folio único: EXP-YYYY-000001 basado en el ID autoincremental
    const folioFinal = `EXP-${new Date().getFullYear()}-${String(pacienteId).padStart(6, '0')}`
    await db.query('UPDATE pacientes SET folio = ? WHERE id = ?', [folioFinal, pacienteId])

    await db.query('INSERT INTO historia_clinica (paciente_id) VALUES (?)', [pacienteId])
    await registrar(req.clinicaId, req.usuario.id, pacienteId, 'CREAR_EXPEDIENTE', `Folio: ${folioFinal}`)

    const [nuevo] = await db.query('SELECT * FROM pacientes WHERE id = ?', [pacienteId])
    res.status(201).json(nuevo[0])
  } catch (err) { next(err) }
})

// PUT /api/v1/pacientes/:id — actualizar identificación
router.put('/:id', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [existe] = await db.query(
      `SELECT id FROM pacientes WHERE id = ? AND ${cf.sql}`,
      [req.params.id, ...cf.params]
    )
    if (!existe[0]) return res.status(404).json({ error: 'Paciente no encontrado' })

    const campos = ['nombre','fecha_nacimiento','sexo','curp','rfc','estado_civil',
      'escolaridad','ocupacion','nacionalidad','religion','lugar_nacimiento',
      'domicilio','telefono','telefono_emergencia','contacto_emergencia',
      'grupo_sanguineo','alergias']

    const sets = campos.filter(c => req.body[c] !== undefined).map(c => `${c} = ?`).join(', ')
    const vals = campos.filter(c => req.body[c] !== undefined).map(c => req.body[c])

    if (!sets) return res.status(400).json({ error: 'No hay campos para actualizar' })

    await db.query(
      `UPDATE pacientes SET ${sets} WHERE id = ?`,
      [...vals, req.params.id]
    )

    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_IDENTIFICACION', '')

    const [updated] = await db.query('SELECT * FROM pacientes WHERE id = ?', [req.params.id])
    res.json(updated[0])
  } catch (err) { next(err) }
})

// DELETE /api/v1/pacientes/:id
// Superadmin: cualquier expediente · Otros: solo los propios
router.delete('/:id', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    let existe
    if (req.usuario.rol === 'superadmin') {
      ;[existe] = await db.query(
        'SELECT id FROM pacientes WHERE id = ? AND activo = TRUE',
        [req.params.id]
      )
    } else {
      ;[existe] = await db.query(
        'SELECT id FROM pacientes WHERE id = ? AND usuario_creador_id = ? AND activo = TRUE',
        [req.params.id, req.usuario.id]
      )
    }
    if (!existe[0]) return res.status(404).json({ error: 'Expediente no encontrado o sin permiso para archivarlo' })
    await db.query('UPDATE pacientes SET activo = FALSE WHERE id = ?', [req.params.id])
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ARCHIVAR_EXPEDIENTE', 'NOM-004: registro archivado, no eliminado')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/historia
router.get('/:id/historia', async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [rows] = await db.query(
      `SELECT h.* FROM historia_clinica h
       JOIN pacientes p ON p.id = h.paciente_id
       WHERE h.paciente_id = ? AND ${cf.sql}`,
      [req.params.id, ...cf.params]
    )
    res.json(rows[0] || {})
  } catch (err) { next(err) }
})

// PUT /api/v1/pacientes/:id/historia
router.put('/:id/historia', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const campos = ['motivo_consulta','padecimiento_actual','antecedentes_heredofamiliares',
      'antecedentes_personales_patologicos','antecedentes_personales_no_patologicos',
      'antecedentes_ginecoobstetricos','antecedentes_pediatricos','exploracion_fisica']
    const sets = campos.filter(c => req.body[c] !== undefined).map(c => `${c} = ?`).join(', ')
    const vals = campos.filter(c => req.body[c] !== undefined).map(c =>
      c === 'exploracion_fisica' ? JSON.stringify(req.body[c]) : req.body[c]
    )
    if (!sets) return res.status(400).json({ error: 'Sin campos' })

    const cf = cFiltro(req.clinicaId)
    const [existe] = await db.query(
      `SELECT h.id FROM historia_clinica h
       JOIN pacientes p ON p.id = h.paciente_id
       WHERE h.paciente_id = ? AND ${cf.sql}`,
      [req.params.id, ...cf.params]
    )
    if (!existe[0]) return res.status(404).json({ error: 'Historia clínica no encontrada' })
    await db.query(`UPDATE historia_clinica SET ${sets} WHERE paciente_id = ?`, [...vals, req.params.id])
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_HISTORIA', '')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/notas
router.get('/:id/notas', async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [rows] = await db.query(
      `SELECT n.*, u.nombre as autor_nombre, u.cedula as autor_cedula
       FROM notas n
       JOIN usuarios u ON u.id = n.autor_id
       JOIN pacientes p ON p.id = n.paciente_id
       WHERE n.paciente_id = ? AND ${cf.sql}
       ORDER BY n.fecha DESC`,
      [req.params.id, ...cf.params]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes/:id/notas
router.post('/:id/notas', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const { subjetivo, objetivo, analisis, plan, tipo = 'evolucion' } = req.body
    const [result] = await db.query(
      `INSERT INTO notas (paciente_id, autor_id, fecha, tipo, subjetivo, objetivo, analisis, plan)
       VALUES (?,?,NOW(),?,?,?,?,?)`,
      [req.params.id, req.usuario.id, tipo, subjetivo||'', objetivo||'', analisis||'', plan||'']
    )
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'AGREGAR_NOTA', `Nota #${result.insertId}`)
    const [nueva] = await db.query('SELECT * FROM notas WHERE id = ?', [result.insertId])
    res.status(201).json(nueva[0])
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/prescripciones
router.get('/:id/prescripciones', async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [recetas] = await db.query(
      `SELECT p.*, u.nombre as medico_nombre, u.cedula as medico_cedula
       FROM prescripciones p
       JOIN usuarios u ON u.id = p.medico_id
       JOIN pacientes pa ON pa.id = p.paciente_id
       WHERE p.paciente_id = ? AND ${cf.sql}
       ORDER BY p.fecha DESC`,
      [req.params.id, ...cf.params]
    )
    for (const r of recetas) {
      const [meds] = await db.query('SELECT * FROM prescripcion_medicamentos WHERE prescripcion_id = ?', [r.id])
      r.medicamentos = meds
    }
    res.json(recetas)
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes/:id/prescripciones
router.post('/:id/prescripciones', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { medicamentos = [], firma_digital, firma_paciente } = req.body
    const [result] = await db.query(
      `INSERT INTO prescripciones (paciente_id, medico_id, fecha, firma_digital, firma_paciente)
       VALUES (?,?,NOW(),?,?)`,
      [req.params.id, req.usuario.id, firma_digital||null, firma_paciente||null]
    )
    const prescripcionId = result.insertId
    for (const m of medicamentos) {
      await db.query(
        `INSERT INTO prescripcion_medicamentos (prescripcion_id, nombre, dosis, via, frecuencia, duracion, indicaciones)
         VALUES (?,?,?,?,?,?,?)`,
        [prescripcionId, m.nombre, m.dosis||'', m.via||'', m.frecuencia||'', m.duracion||'', m.indicaciones||'']
      )
    }
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'CREAR_RECETA', `Receta #${prescripcionId}`)
    res.status(201).json({ id: prescripcionId })
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/consentimientos
router.get('/:id/consentimientos', async (req, res, next) => {
  try {
    const cf = cFiltro(req.clinicaId)
    const [rows] = await db.query(
      `SELECT c.* FROM consentimientos c
       JOIN pacientes p ON p.id = c.paciente_id
       WHERE c.paciente_id = ? AND ${cf.sql}
       ORDER BY c.fecha DESC`,
      [req.params.id, ...cf.params]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes/:id/consentimientos
router.post('/:id/consentimientos', requireRol('medico','enfermera','admin','superadmin'), async (req, res, next) => {
  try {
    const { tipo, texto, testigo, firma_digital, firma_medico } = req.body
    const [result] = await db.query(
      `INSERT INTO consentimientos (paciente_id, fecha, tipo, texto, firmado, testigo, firma_digital, firma_medico)
       VALUES (?,NOW(),?,?,?,?,?,?)`,
      [req.params.id, tipo, texto||'', !!(firma_digital||firma_medico), testigo||null, firma_digital||null, firma_medico||null]
    )
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'AGREGAR_CONSENTIMIENTO', tipo)
    res.status(201).json({ id: result.insertId })
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/bitacora
router.get('/:id/bitacora', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.nombre as usuario_nombre
       FROM bitacora b
       LEFT JOIN usuarios u ON u.id = b.usuario_id
       WHERE b.paciente_id = ?
       ORDER BY b.fecha DESC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/laboratorio
router.get('/:id/laboratorio', async (req, res, next) => {
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
router.post('/:id/laboratorio', requireRol('medico','admin','superadmin'), async (req, res, next) => {
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
router.put('/:id/laboratorio/examenes/:examenId', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { recibido } = req.body
    const fechaRecepcion = recibido ? new Date() : null

    await db.query(
      'UPDATE lab_examenes SET recibido = ?, fecha_recepcion = ? WHERE id = ?',
      [recibido, fechaRecepcion, req.params.examenId]
    )

    if (recibido) {
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
