import db from '../db.js'

const SUBDOMINIOS_SISTEMA = ['www', 'admin', 'api', 'mail', 'localhost']

// Hostnames del propio servidor API (no son subdominios de clínica)
const API_HOSTNAMES = (process.env.API_HOSTNAMES || '').split(',').map(h => h.trim()).filter(Boolean)

export async function resolverTenant(req, res, next) {
  if (process.env.NODE_ENV === 'development' && req.headers['x-clinica-id']) {
    req.clinicaId = Number(req.headers['x-clinica-id'])
    return next()
  }

  const hostname = req.hostname

  // Si el request llega directamente al servidor API (no vía subdominio de clínica)
  if (process.env.NODE_ENV === 'development' || API_HOSTNAMES.includes(hostname)) {
    req.clinicaId = null
    return next()
  }

  const partes = hostname.split('.')
  const subdominio = partes[0]

  if (partes.length < 3 || SUBDOMINIOS_SISTEMA.includes(subdominio)) {
    return res.status(400).json({ error: 'Subdominio de clínica requerido' })
  }

  try {
    const [rows] = await db.query(
      'SELECT id, activo FROM clinicas WHERE subdominio = ?',
      [subdominio]
    )
    const clinica = rows[0]
    if (!clinica) return res.status(404).json({ error: 'Clínica no encontrada' })
    if (!clinica.activo) return res.status(403).json({ error: 'Clínica inactiva' })
    req.clinicaId = clinica.id
    next()
  } catch (err) {
    next(err)
  }
}
