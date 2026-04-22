const BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`

// Token en memoria — no se pierde entre requests, no se guarda en localStorage
let _token = null
export const setToken = (t) => { _token = t }
export const clearToken = () => { _token = null }

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 401) {
    window.dispatchEvent(new Event('session-expired'))
    throw new Error('No autenticado')
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Error desconocido')
    throw new Error(msg)
  }
  return res.json()
}

// Auth
export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } })
  if (data.token) setToken(data.token)
  return data
}
export const logout = async () => {
  const res = await apiFetch('/auth/logout', { method: 'POST' })
  clearToken()
  return res
}
export const getMe = () => apiFetch('/auth/me')

// Pacientes
export const getPacientes = () => apiFetch('/pacientes')
export const getPaciente = (id) => apiFetch(`/pacientes/${id}`)
export const createPaciente = (data) =>
  apiFetch('/pacientes', { method: 'POST', body: data })
export const updatePaciente = (id, data) =>
  apiFetch(`/pacientes/${id}`, { method: 'PUT', body: data })
export const deletePaciente = (id) =>
  apiFetch(`/pacientes/${id}`, { method: 'DELETE' })

// Historia clínica
export const getHistoria = (id) => apiFetch(`/pacientes/${id}/historia`)
export const updateHistoria = (id, data) =>
  apiFetch(`/pacientes/${id}/historia`, { method: 'PUT', body: data })

// Notas
export const getNotas = (id) => apiFetch(`/pacientes/${id}/notas`)
export const createNota = (id, data) =>
  apiFetch(`/pacientes/${id}/notas`, { method: 'POST', body: data })
export const firmarNota = (id) =>
  apiFetch(`/notas/${id}/firmar`, { method: 'PUT' })

// Prescripciones
export const getPrescripciones = (id) => apiFetch(`/pacientes/${id}/prescripciones`)
export const createPrescripcion = (id, data) =>
  apiFetch(`/pacientes/${id}/prescripciones`, { method: 'POST', body: data })
export const firmarPrescripcion = (id, data) =>
  apiFetch(`/prescripciones/${id}/firmar`, { method: 'PUT', body: data })

// Consentimientos
export const getConsentimientos = (id) => apiFetch(`/pacientes/${id}/consentimientos`)
export const createConsentimiento = (id, data) =>
  apiFetch(`/pacientes/${id}/consentimientos`, { method: 'POST', body: data })

// Bitácora
export const getBitacora = (id) => apiFetch(`/pacientes/${id}/bitacora`)
export const getBitacoraGlobal = () => apiFetch('/bitacora')

// Usuarios
export const getUsuarios = () => apiFetch('/usuarios')
export const createUsuario = (data) =>
  apiFetch('/usuarios', { method: 'POST', body: data })
export const updateUsuario = (id, data) =>
  apiFetch(`/usuarios/${id}`, { method: 'PUT', body: data })
