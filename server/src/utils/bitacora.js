import db from '../db.js'

export async function registrar(clinicaId, usuarioId, pacienteId, accion, detalle = '') {
  await db.query(
    'INSERT INTO bitacora (clinica_id, usuario_id, paciente_id, accion, detalle) VALUES (?,?,?,?,?)',
    [clinicaId, usuarioId, pacienteId ?? null, accion, detalle]
  )
}
