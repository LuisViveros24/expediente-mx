import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import pacientesRoutes from './routes/pacientes.js'
import laboratorioRoutes from './routes/laboratorio.js'
import notasRoutes from './routes/notas.js'
import prescripcionesRoutes from './routes/prescripciones.js'
import consentimientosRoutes from './routes/consentimientos.js'
import bitacoraRoutes from './routes/bitacora.js'
import usuariosRoutes from './routes/usuarios.js'
import superadminRoutes from './routes/superadmin.js'
import { resolverTenant } from './middleware/tenant.js'
import { verificarToken } from './middleware/auth.js'

const app = express()

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(o => o.trim())
  : []

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Health check (sin auth)
app.get('/api/health', (_, res) => res.json({ ok: true }))

// Todas las rutas /api/v1/* requieren tenant + auth
app.use('/api/v1', resolverTenant, verificarToken)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/pacientes', pacientesRoutes)
app.use('/api/v1/pacientes/:id/laboratorio', laboratorioRoutes)
app.use('/api/v1/notas', notasRoutes)
app.use('/api/v1/prescripciones', prescripcionesRoutes)
app.use('/api/v1/consentimientos', consentimientosRoutes)
app.use('/api/v1/bitacora', bitacoraRoutes)
app.use('/api/v1/usuarios', usuariosRoutes)
app.use('/api/v1/superadmin', superadminRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`MedpedienteX API corriendo en puerto ${PORT}`))
