# SQL Database Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar backend Express + MySQL multi-tenant a MedpedienteX, con autenticación JWT en cookies httpOnly, para que los datos de expedientes persistan y cada clínica cliente tenga su propio subdominio aislado.

**Architecture:** Monorepo con `client/` (React+Vite existente), `server/` (Express API nueva) y `landing/` (HTML estático). El servidor resuelve el tenant por subdominio en cada request antes de verificar el JWT. Una sola base de datos MySQL con `clinica_id` en todas las tablas de datos.

**Tech Stack:** Node.js 18+, Express 4, mysql2, bcryptjs, jsonwebtoken, cookie-parser, uuid, dotenv. Frontend: Vite proxy en dev, `credentials: 'include'` en fetch.

---

## Mapa de Archivos

### Archivos NUEVOS — servidor
| Archivo | Responsabilidad |
|---------|----------------|
| `server/package.json` | Dependencias del backend |
| `server/.env.example` | Plantilla de variables de entorno |
| `server/src/index.js` | Entry point Express, monta middlewares y rutas |
| `server/src/db.js` | Pool de conexiones MySQL (mysql2/promise) |
| `server/src/middleware/tenant.js` | Resuelve `clinica_id` por subdominio → `req.clinicaId` |
| `server/src/middleware/auth.js` | Verifica JWT en cookie, comprueba blacklist, añade `req.usuario` |
| `server/src/middleware/roles.js` | Factory `requireRol(...roles)` para proteger rutas |
| `server/src/routes/auth.js` | POST /login, POST /logout, GET /me |
| `server/src/routes/pacientes.js` | CRUD de expedientes filtrado por clinica_id |
| `server/src/routes/notas.js` | Notas SOAP + firma |
| `server/src/routes/prescripciones.js` | Recetas + firma |
| `server/src/routes/consentimientos.js` | Consentimientos informados |
| `server/src/routes/bitacora.js` | Bitácora por paciente y global |
| `server/src/routes/usuarios.js` | CRUD usuarios de la clínica (admin) |
| `server/src/routes/superadmin.js` | Gestión de clínicas cliente (superadmin) |
| `server/src/utils/bitacora.js` | Helper `registrar(db, datos)` para insertar en bitácora |
| `server/migrations/001_schema_inicial.sql` | DDL completo de todas las tablas |
| `server/scripts/seed_admin.js` | Crea el primer superadmin en DB |

### Archivos NUEVOS — frontend
| Archivo | Responsabilidad |
|---------|----------------|
| `src/api/client.js` | Todas las llamadas fetch a la API (reemplaza mock.js) |

### Archivos MODIFICADOS — frontend
| Archivo | Qué cambia |
|---------|-----------|
| `src/App.jsx` | Login llama API, pacientes se cargan desde DB, se elimina LIMITE_DEMO y PACIENTES_MOCK |
| `vite.config.js` | Agrega proxy `/api` → `http://localhost:3001` para desarrollo |
| `package.json` (raíz) | Scripts `dev:server`, `dev:client`, `dev` (ambos en paralelo) |

### Archivos ELIMINADOS
| Archivo | Razón |
|---------|-------|
| `src/data/mock.js` | Reemplazado por API real |

### Archivos NUEVOS — landing
| Archivo | Responsabilidad |
|---------|----------------|
| `landing/index.html` | La landing page de ventas (mover desde raíz del proyecto) |

---

## Task 1: Reestructurar el repositorio

**Files:**
- Modify: `package.json`
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `landing/index.html`

- [ ] **Step 1: Hacer commit de seguridad del estado actual antes de mover archivos**

```bash
git add -A && git commit -m "chore: snapshot antes de restructura de monorepo"
```

- [ ] **Step 2: Crear la carpeta `client/` y mover el código React actual**

```bash
# Desde la raíz del proyecto
mkdir -p client
# Mover todo el código React a client/
mv src client/src
mv index.html client/index.html
mv public client/public
mv vite.config.js client/vite.config.js
mv tailwind.config.js client/tailwind.config.js
mv postcss.config.js client/postcss.config.js
cp package.json client/package.json
```

> Si algo falla en este paso, recuperar con: `git checkout -- . && git clean -fd`

- [ ] **Step 2: Actualizar `client/package.json` — dejar solo dependencias del frontend**

```json
{
  "name": "medpedientex-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
```

- [ ] **Step 3: Actualizar `client/vite.config.js` — agregar proxy**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

- [ ] **Step 4: Crear `server/package.json`**

```json
{
  "name": "medpedientex-server",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.6.5",
    "uuid": "^9.0.0"
  }
}
```

- [ ] **Step 5: Instalar dependencias del servidor**

```bash
cd server && npm install
```

- [ ] **Step 6: Crear `server/.env.example`**

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medpedientex
DB_USER=root
DB_PASSWORD=tu_password_aqui
JWT_SECRET=cambia_esto_por_un_string_aleatorio_de_al_menos_32_caracteres
JWT_EXPIRES_IN=8h
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

- [ ] **Step 7: Crear `server/.env` copiando el ejemplo y completando valores reales**

```bash
cp server/.env.example server/.env
# Editar server/.env con tus credenciales de MySQL
```

- [ ] **Step 8: Crear `landing/index.html` — mover la landing page**

```bash
mkdir -p landing
cp /Users/viverosmunoz/Desktop/Medpedientex/MedpedienteX.html landing/index.html
```

- [ ] **Step 9: Actualizar `package.json` raíz — scripts para orquestar**

```json
{
  "name": "medpedientex",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "npm run dev:server & npm run dev:client",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "cd server && npm start"
  }
}
```

- [ ] **Step 10: Agregar `.env` y `node_modules` al `.gitignore`**

```bash
echo "server/.env\nserver/node_modules\nclient/node_modules\nclient/dist" >> .gitignore
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: restructure monorepo — client/, server/, landing/"
```

---

## Task 2: Esquema de base de datos

**Files:**
- Create: `server/migrations/001_schema_inicial.sql`

- [ ] **Step 1: Crear `server/migrations/001_schema_inicial.sql`**

```sql
-- MedpedienteX — Schema inicial
-- Ejecutar: mysql -u root -p medpedientex < server/migrations/001_schema_inicial.sql

CREATE DATABASE IF NOT EXISTS medpedientex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medpedientex;

CREATE TABLE clinicas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  subdominio  VARCHAR(50)  NOT NULL UNIQUE,
  email_admin VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20),
  ciudad      VARCHAR(100),
  plan        ENUM('basico','profesional','clinica') DEFAULT 'basico',
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id    INT,
  nombre        VARCHAR(200) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cedula        VARCHAR(20),
  rol           ENUM('medico','enfermera','recepcion','admin','superadmin') NOT NULL,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
) ENGINE=InnoDB;

CREATE TABLE tokens_revocados (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  jti        VARCHAR(36) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  expira_en  DATETIME NOT NULL,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE pacientes (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id          INT NOT NULL,
  folio               VARCHAR(20) NOT NULL,
  fecha_creacion      DATE NOT NULL,
  usuario_creador_id  INT,
  nombre              VARCHAR(200) NOT NULL,
  fecha_nacimiento    DATE NOT NULL,
  sexo                ENUM('masculino','femenino','otro') NOT NULL,
  curp                VARCHAR(18),
  rfc                 VARCHAR(15),
  estado_civil        VARCHAR(30),
  escolaridad         VARCHAR(50),
  ocupacion           VARCHAR(100),
  nacionalidad        VARCHAR(50),
  religion            VARCHAR(50),
  lugar_nacimiento    VARCHAR(100),
  domicilio           TEXT,
  telefono            VARCHAR(20),
  telefono_emergencia VARCHAR(20),
  contacto_emergencia VARCHAR(200),
  grupo_sanguineo     VARCHAR(5),
  alergias            TEXT,
  creado_en           DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY folio_por_clinica (clinica_id, folio),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE historia_clinica (
  id                                     INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id                            INT NOT NULL UNIQUE,
  motivo_consulta                        TEXT,
  padecimiento_actual                    TEXT,
  antecedentes_heredofamiliares          TEXT,
  antecedentes_personales_patologicos    TEXT,
  antecedentes_personales_no_patologicos TEXT,
  antecedentes_ginecoobstetricos         TEXT,
  antecedentes_pediatricos               TEXT,
  exploracion_fisica                     JSON,
  actualizado_en                         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
) ENGINE=InnoDB;

CREATE TABLE notas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  autor_id    INT NOT NULL,
  fecha       DATETIME NOT NULL,
  tipo        VARCHAR(30) DEFAULT 'evolucion',
  subjetivo   TEXT,
  objetivo    TEXT,
  analisis    TEXT,
  plan        TEXT,
  firmado     BOOLEAN DEFAULT FALSE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE prescripciones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT NOT NULL,
  medico_id      INT NOT NULL,
  fecha          DATETIME NOT NULL,
  firmada        BOOLEAN DEFAULT FALSE,
  firma_digital  MEDIUMTEXT,
  firma_paciente MEDIUMTEXT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE prescripcion_medicamentos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  prescripcion_id INT NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  dosis           VARCHAR(100),
  via             VARCHAR(50),
  frecuencia      VARCHAR(100),
  duracion        VARCHAR(100),
  indicaciones    TEXT,
  FOREIGN KEY (prescripcion_id) REFERENCES prescripciones(id)
) ENGINE=InnoDB;

CREATE TABLE consentimientos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id   INT NOT NULL,
  fecha         DATETIME NOT NULL,
  tipo          VARCHAR(50) NOT NULL,
  texto         MEDIUMTEXT,
  firmado       BOOLEAN DEFAULT FALSE,
  testigo       VARCHAR(200),
  firma_digital MEDIUMTEXT,
  firma_medico  MEDIUMTEXT,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
) ENGINE=InnoDB;

CREATE TABLE bitacora (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id  INT,
  paciente_id INT,
  usuario_id  INT,
  fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
  accion      VARCHAR(100) NOT NULL,
  detalle     TEXT,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
```

- [ ] **Step 2: Ejecutar el schema en MySQL**

```bash
mysql -u root -p < server/migrations/001_schema_inicial.sql
```

Verificar que no haya errores. Resultado esperado: tablas creadas sin mensajes de error.

- [ ] **Step 3: Verificar tablas creadas**

```bash
mysql -u root -p -e "USE medpedientex; SHOW TABLES;"
```

Resultado esperado:
```
bitacora, clinicas, consentimientos, historia_clinica, notas,
pacientes, prescripcion_medicamentos, prescripciones, tokens_revocados, usuarios
```

- [ ] **Step 4: Commit**

```bash
git add server/migrations/001_schema_inicial.sql
git commit -m "feat: schema SQL inicial — 10 tablas InnoDB multi-tenant"
```

---

## Task 3: Conexión a la base de datos y servidor base

**Files:**
- Create: `server/src/db.js`
- Create: `server/src/index.js`

- [ ] **Step 1: Crear `server/src/db.js`**

```js
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
})

export default pool
```

- [ ] **Step 2: Crear `server/src/index.js`**

```js
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import pacientesRoutes from './routes/pacientes.js'
import notasRoutes from './routes/notas.js'
import prescripcionesRoutes from './routes/prescripciones.js'
import consentimientosRoutes from './routes/consentimientos.js'
import bitacoraRoutes from './routes/bitacora.js'
import usuariosRoutes from './routes/usuarios.js'
import superadminRoutes from './routes/superadmin.js'
import { resolverTenant } from './middleware/tenant.js'
import { verificarToken } from './middleware/auth.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
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
```

> **Nota:** Express 4 con `import` requiere `"type": "module"` en `server/package.json`. Agregar esa línea.

- [ ] **Step 3: Agregar `"type": "module"` a `server/package.json`**

```json
{
  "name": "medpedientex-server",
  "type": "module",
  ...
}
```

- [ ] **Step 4: Probar que el servidor arranca**

```bash
cd server && npm run dev
```

Resultado esperado: `MedpedienteX API corriendo en puerto 3001`

```bash
curl http://localhost:3001/api/health
# Esperado: {"ok":true}
```

- [ ] **Step 5: Commit**

```bash
git add server/src/db.js server/src/index.js server/package.json
git commit -m "feat: servidor Express base con pool MySQL"
```

---

## Task 4: Middleware de tenant

**Files:**
- Create: `server/src/middleware/tenant.js`

- [ ] **Step 1: Crear `server/src/middleware/tenant.js`**

```js
import db from '../db.js'

// Subdominios reservados que no son tenants de clínicas
const SUBDOMINIOS_SISTEMA = ['www', 'admin', 'api', 'mail', 'localhost']

export async function resolverTenant(req, res, next) {
  // En desarrollo, permitir pasar clinica_id por header
  if (process.env.NODE_ENV === 'development' && req.headers['x-clinica-id']) {
    req.clinicaId = Number(req.headers['x-clinica-id'])
    return next()
  }

  const hostname = req.hostname // ej: "clinicaejemplo.medpedientex.com.mx"
  const partes = hostname.split('.')
  const subdominio = partes[0]

  // Si es dominio raíz o subdominio del sistema, no hay tenant
  if (partes.length < 3 || SUBDOMINIOS_SISTEMA.includes(subdominio)) {
    req.clinicaId = null
    return next()
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
```

- [ ] **Step 2: Probar el middleware con curl (primero crear una clínica de prueba en DB)**

```bash
mysql -u root -p medpedientex -e "
INSERT INTO clinicas (nombre, subdominio, email_admin, ciudad)
VALUES ('Clínica Demo', 'demo', 'admin@demo.com', 'Torreón');
"
```

```bash
# En desarrollo, usar el header x-clinica-id
curl http://localhost:3001/api/v1/pacientes \
  -H "x-clinica-id: 1"
# Esperado: 401 (no tiene JWT todavía, pero pasó el tenant check)
```

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/tenant.js
git commit -m "feat: middleware resolverTenant — resuelve clinica_id por subdominio"
```

---

## Task 5: Middleware de autenticación JWT

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/middleware/roles.js`

- [ ] **Step 1: Crear `server/src/middleware/auth.js`**

```js
import jwt from 'jsonwebtoken'
import db from '../db.js'

// IMPORTANTE: req.path dentro de un router montado en '/api/v1' es relativo
// al prefijo — ej: req.path = '/auth/login' (NO '/api/v1/auth/login')
const RUTAS_PUBLICAS = ['/auth/login']

export async function verificarToken(req, res, next) {
  if (RUTAS_PUBLICAS.includes(req.path)) return next()

  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar que el token no haya sido revocado
    const [rows] = await db.query(
      'SELECT id FROM tokens_revocados WHERE jti = ?',
      [payload.jti]
    )
    if (rows.length > 0) return res.status(401).json({ error: 'Sesión expirada' })

    // Verificar que el usuario pertenezca a la clínica del tenant
    // (superadmin puede acceder a cualquier clinica_id)
    if (payload.rol !== 'superadmin' && req.clinicaId && payload.clinicaId !== req.clinicaId) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }

    req.usuario = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
```

- [ ] **Step 2: Crear `server/src/middleware/roles.js`**

```js
export function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: 'No autenticado' })
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Permiso insuficiente' })
    }
    next()
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/auth.js server/src/middleware/roles.js
git commit -m "feat: middleware auth JWT con httpOnly cookie y blacklist de tokens"
```

---

## Task 6: Utilidad de bitácora

**Files:**
- Create: `server/src/utils/bitacora.js`

- [ ] **Step 1: Crear `server/src/utils/bitacora.js`**

```js
import db from '../db.js'

export async function registrar(clinicaId, usuarioId, pacienteId, accion, detalle = '') {
  await db.query(
    'INSERT INTO bitacora (clinica_id, usuario_id, paciente_id, accion, detalle) VALUES (?,?,?,?,?)',
    [clinicaId, usuarioId, pacienteId ?? null, accion, detalle]
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/bitacora.js
git commit -m "feat: helper registrar() para bitácora de auditoría"
```

---

## Task 7: Rutas de autenticación

**Files:**
- Create: `server/src/routes/auth.js`
- Create: `server/scripts/seed_admin.js`

- [ ] **Step 1: Crear `server/src/routes/auth.js`**

```js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' })

    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    )
    const usuario = rows[0]
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const ok = await bcrypt.compare(password, usuario.password_hash)
    if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' })

    // Verificar que el usuario pertenezca a la clínica del tenant
    if (usuario.rol !== 'superadmin' && req.clinicaId && usuario.clinica_id !== req.clinicaId) {
      return res.status(403).json({ error: 'Usuario no pertenece a esta clínica' })
    }

    const jti = uuidv4()
    const token = jwt.sign(
      {
        jti,
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        cedula: usuario.cedula,
        clinicaId: usuario.clinica_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en ms
    })

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        cedula: usuario.cedula,
      }
    })
  } catch (err) { next(err) }
})

// POST /api/v1/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.token
    if (token) {
      const payload = jwt.decode(token)
      if (payload?.jti) {
        const expiraEn = new Date(payload.exp * 1000)
        await db.query(
          'INSERT IGNORE INTO tokens_revocados (jti, usuario_id, expira_en) VALUES (?,?,?)',
          [payload.jti, payload.id, expiraEn]
        )
      }
    }
    res.clearCookie('token')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  if (!req.usuario) return res.status(401).json({ error: 'No autenticado' })
  res.json({ usuario: req.usuario })
})

export default router
```

- [ ] **Step 2: Crear `server/scripts/seed_admin.js` — script para crear el primer superadmin**

```js
import bcrypt from 'bcryptjs'
import db from '../src/db.js'
import dotenv from 'dotenv'
dotenv.config()

const email = process.argv[2] || 'admin@medpedientex.com.mx'
const password = process.argv[3] || 'CambiarEsto123!'
const nombre = process.argv[4] || 'Super Admin'

const hash = await bcrypt.hash(password, 12)
await db.query(
  'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?,?,?,?)',
  [nombre, email, hash, 'superadmin']
)
console.log(`Superadmin creado: ${email}`)
process.exit(0)
```

- [ ] **Step 3: Ejecutar el seed para crear el primer superadmin**

```bash
cd server && node scripts/seed_admin.js admin@medpedientex.com.mx "TuPasswordSeguro123!" "Tu Nombre"
```

- [ ] **Step 4: Probar login con curl**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-clinica-id: 1" \
  -d '{"email":"admin@medpedientex.com.mx","password":"TuPasswordSeguro123!"}' \
  -c cookies.txt -v
```

Resultado esperado: `200 OK` con body `{ usuario: { ... } }` y cookie `token` en las cabeceras.

- [ ] **Step 5: Probar GET /me con la cookie**

```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "x-clinica-id: 1" \
  -b cookies.txt
# Esperado: { usuario: { id, nombre, rol, ... } }
```

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/auth.js server/scripts/seed_admin.js
git commit -m "feat: rutas de autenticación — login/logout/me con JWT httpOnly cookie"
```

---

## Task 8: Rutas de pacientes

**Files:**
- Create: `server/src/routes/pacientes.js`

- [ ] **Step 1: Crear `server/src/routes/pacientes.js`**

```js
import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

// GET /api/v1/pacientes — listar todos de la clínica
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM pacientes WHERE clinica_id = ? ORDER BY creado_en DESC',
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM pacientes WHERE id = ? AND clinica_id = ?',
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

// POST /api/v1/pacientes — crear expediente
router.post('/', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const { folio, fecha_creacion, nombre, fecha_nacimiento, sexo, ...resto } = req.body
    if (!nombre || !fecha_nacimiento || !sexo) {
      return res.status(400).json({ error: 'nombre, fecha_nacimiento y sexo son requeridos' })
    }

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
        req.clinicaId, folio, fecha_creacion || new Date().toISOString().split('T')[0],
        req.usuario.id, nombre, fecha_nacimiento, sexo,
        resto.curp||null, resto.rfc||null, resto.estado_civil||null,
        resto.escolaridad||null, resto.ocupacion||null, resto.nacionalidad||null,
        resto.religion||null, resto.lugar_nacimiento||null, resto.domicilio||null,
        resto.telefono||null, resto.telefono_emergencia||null,
        resto.contacto_emergencia||null, resto.grupo_sanguineo||null, resto.alergias||null,
      ]
    )

    const pacienteId = result.insertId

    // Crear historia clínica vacía asociada
    await db.query('INSERT INTO historia_clinica (paciente_id) VALUES (?)', [pacienteId])

    await registrar(req.clinicaId, req.usuario.id, pacienteId, 'CREAR_EXPEDIENTE', `Folio: ${folio}`)

    const [nuevo] = await db.query('SELECT * FROM pacientes WHERE id = ?', [pacienteId])
    res.status(201).json(nuevo[0])
  } catch (err) { next(err) }
})

// PUT /api/v1/pacientes/:id — actualizar identificación
router.put('/:id', requireRol('medico','recepcion','admin','superadmin'), async (req, res, next) => {
  try {
    const [existe] = await db.query(
      'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ?',
      [req.params.id, req.clinicaId]
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
      `UPDATE pacientes SET ${sets} WHERE id = ? AND clinica_id = ?`,
      [...vals, req.params.id, req.clinicaId]
    )

    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_IDENTIFICACION', '')

    const [updated] = await db.query('SELECT * FROM pacientes WHERE id = ?', [req.params.id])
    res.json(updated[0])
  } catch (err) { next(err) }
})

// DELETE /api/v1/pacientes/:id — solo admin
router.delete('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM pacientes WHERE id = ? AND clinica_id = ?', [req.params.id, req.clinicaId])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 2: Probar creación de paciente**

```bash
curl -X POST http://localhost:3001/api/v1/pacientes \
  -H "Content-Type: application/json" \
  -H "x-clinica-id: 1" \
  -b cookies.txt \
  -d '{"folio":"EXP-2026-0001","nombre":"Ana Torres","fecha_nacimiento":"1990-05-10","sexo":"femenino"}'
# Esperado: 201 con el paciente creado
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/pacientes.js
git commit -m "feat: CRUD pacientes filtrado por clinica_id"
```

---

## Task 9: Rutas de historia clínica, notas, prescripciones y consentimientos

**Files:**
- Create: `server/src/routes/notas.js`
- Create: `server/src/routes/prescripciones.js`
- Create: `server/src/routes/consentimientos.js`

- [ ] **Step 1: Crear `server/src/routes/notas.js`**

```js
import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

// GET /api/v1/pacientes/:id/notas — montado en pacientes router externamente
// Las notas se consumen desde pacientesRoutes; este router maneja rutas independientes

// PUT /api/v1/notas/:id/firmar
router.put('/:id/firmar', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT n.* FROM notas n
       JOIN pacientes p ON p.id = n.paciente_id
       WHERE n.id = ? AND p.clinica_id = ?`,
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Nota no encontrada' })

    await db.query('UPDATE notas SET firmado = TRUE WHERE id = ?', [req.params.id])
    await registrar(req.clinicaId, req.usuario.id, rows[0].paciente_id, 'FIRMAR_NOTA', `Nota #${req.params.id}`)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 2: Agregar sub-rutas de notas en `server/src/routes/pacientes.js`**

Agregar al final, antes de `export default router`:

```js
// GET /api/v1/pacientes/:id/historia
router.get('/:id/historia', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT h.* FROM historia_clinica h
       JOIN pacientes p ON p.id = h.paciente_id
       WHERE h.paciente_id = ? AND p.clinica_id = ?`,
      [req.params.id, req.clinicaId]
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
    await db.query(`UPDATE historia_clinica SET ${sets} WHERE paciente_id = ?`, [...vals, req.params.id])
    await registrar(req.clinicaId, req.usuario.id, req.params.id, 'ACTUALIZAR_HISTORIA', '')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/pacientes/:id/notas
router.get('/:id/notas', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, u.nombre as autor_nombre, u.cedula as autor_cedula
       FROM notas n
       JOIN usuarios u ON u.id = n.autor_id
       JOIN pacientes p ON p.id = n.paciente_id
       WHERE n.paciente_id = ? AND p.clinica_id = ?
       ORDER BY n.fecha DESC`,
      [req.params.id, req.clinicaId]
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
    const [recetas] = await db.query(
      `SELECT p.*, u.nombre as medico_nombre, u.cedula as medico_cedula
       FROM prescripciones p
       JOIN usuarios u ON u.id = p.medico_id
       JOIN pacientes pa ON pa.id = p.paciente_id
       WHERE p.paciente_id = ? AND pa.clinica_id = ?
       ORDER BY p.fecha DESC`,
      [req.params.id, req.clinicaId]
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
    const [rows] = await db.query(
      `SELECT c.* FROM consentimientos c
       JOIN pacientes p ON p.id = c.paciente_id
       WHERE c.paciente_id = ? AND p.clinica_id = ?
       ORDER BY c.fecha DESC`,
      [req.params.id, req.clinicaId]
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
       WHERE b.paciente_id = ? AND b.clinica_id = ?
       ORDER BY b.fecha DESC`,
      [req.params.id, req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})
```

- [ ] **Step 3: Crear `server/src/routes/prescripciones.js`** — solo la ruta de firmar

```js
import { Router } from 'express'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'
import { registrar } from '../utils/bitacora.js'

const router = Router()

// PUT /api/v1/prescripciones/:id/firmar
router.put('/:id/firmar', requireRol('medico','admin','superadmin'), async (req, res, next) => {
  try {
    const { firma_digital, firma_paciente } = req.body
    const [rows] = await db.query(
      `SELECT pr.* FROM prescripciones pr
       JOIN pacientes p ON p.id = pr.paciente_id
       WHERE pr.id = ? AND p.clinica_id = ?`,
      [req.params.id, req.clinicaId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Receta no encontrada' })

    await db.query(
      'UPDATE prescripciones SET firmada = TRUE, firma_digital = ?, firma_paciente = ? WHERE id = ?',
      [firma_digital||null, firma_paciente||null, req.params.id]
    )
    await registrar(req.clinicaId, req.usuario.id, rows[0].paciente_id, 'FIRMAR_RECETA', `Receta #${req.params.id}`)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 4: Crear `server/src/routes/consentimientos.js`** (placeholder, las rutas ya están en pacientes)

```js
import { Router } from 'express'
const router = Router()
export default router
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/
git commit -m "feat: rutas historia clínica, notas SOAP, prescripciones y consentimientos"
```

---

## Task 10: Rutas de bitácora, usuarios y superadmin

**Files:**
- Create: `server/src/routes/bitacora.js`
- Create: `server/src/routes/usuarios.js`
- Create: `server/src/routes/superadmin.js`

- [ ] **Step 1: Crear `server/src/routes/bitacora.js`**

```js
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
```

- [ ] **Step 2: Crear `server/src/routes/usuarios.js`**

```js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

// GET /api/v1/usuarios
router.get('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo, creado_en FROM usuarios WHERE clinica_id = ?',
      [req.clinicaId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/usuarios
router.post('/', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, email, password, cedula, rol } = req.body
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' })
    }
    const hash = await bcrypt.hash(password, 12)
    const [result] = await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, cedula, rol) VALUES (?,?,?,?,?,?)',
      [req.clinicaId, nombre, email, hash, cedula||null, rol]
    )
    res.status(201).json({ id: result.insertId })
  } catch (err) { next(err) }
})

// PUT /api/v1/usuarios/:id
router.put('/:id', requireRol('admin','superadmin'), async (req, res, next) => {
  try {
    const { nombre, cedula, rol, activo, password } = req.body
    const updates = []
    const vals = []
    if (nombre !== undefined) { updates.push('nombre = ?'); vals.push(nombre) }
    if (cedula !== undefined) { updates.push('cedula = ?'); vals.push(cedula) }
    if (rol !== undefined) { updates.push('rol = ?'); vals.push(rol) }
    if (activo !== undefined) { updates.push('activo = ?'); vals.push(activo) }
    if (password) {
      const hash = await bcrypt.hash(password, 12)
      updates.push('password_hash = ?'); vals.push(hash)
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ? AND clinica_id = ?`,
      [...vals, req.params.id, req.clinicaId]
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 3: Crear `server/src/routes/superadmin.js`**

```js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireRol } from '../middleware/roles.js'

const router = Router()

// Todas las rutas de superadmin requieren rol superadmin
router.use(requireRol('superadmin'))

// GET /api/v1/superadmin/clinicas
router.get('/clinicas', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM clinicas ORDER BY creado_en DESC')
    res.json(rows)
  } catch (err) { next(err) }
})

// POST /api/v1/superadmin/clinicas — dar de alta una clínica cliente
router.post('/clinicas', async (req, res, next) => {
  try {
    const { nombre, subdominio, email_admin, telefono, ciudad, plan, password_admin, nombre_admin } = req.body
    if (!nombre || !subdominio || !email_admin || !password_admin) {
      return res.status(400).json({ error: 'nombre, subdominio, email_admin y password_admin requeridos' })
    }
    const [result] = await db.query(
      'INSERT INTO clinicas (nombre, subdominio, email_admin, telefono, ciudad, plan) VALUES (?,?,?,?,?,?)',
      [nombre, subdominio, email_admin, telefono||null, ciudad||null, plan||'basico']
    )
    const clinicaId = result.insertId

    // Crear el primer usuario admin de la clínica
    const hash = await bcrypt.hash(password_admin, 12)
    await db.query(
      'INSERT INTO usuarios (clinica_id, nombre, email, password_hash, rol) VALUES (?,?,?,?,?)',
      [clinicaId, nombre_admin || nombre, email_admin, hash, 'admin']
    )

    res.status(201).json({ id: clinicaId, subdominio })
  } catch (err) { next(err) }
})

// PUT /api/v1/superadmin/clinicas/:id
router.put('/clinicas/:id', async (req, res, next) => {
  try {
    const { plan, activo } = req.body
    const updates = []
    const vals = []
    if (plan !== undefined) { updates.push('plan = ?'); vals.push(plan) }
    if (activo !== undefined) { updates.push('activo = ?'); vals.push(activo) }
    if (!updates.length) return res.status(400).json({ error: 'Sin campos' })
    await db.query(`UPDATE clinicas SET ${updates.join(', ')} WHERE id = ?`, [...vals, req.params.id])
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/v1/superadmin/clinicas/:id/usuarios
router.get('/clinicas/:id/usuarios', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, email, cedula, rol, activo FROM usuarios WHERE clinica_id = ?',
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

export default router
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/bitacora.js server/src/routes/usuarios.js server/src/routes/superadmin.js
git commit -m "feat: rutas bitácora, usuarios y superadmin"
```

---

## Task 11: Cliente API del frontend

**Files:**
- Create: `client/src/api/client.js`
- Delete: `client/src/data/mock.js`

- [ ] **Step 1: Crear `client/src/api/client.js`**

```js
const BASE = '/api/v1'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
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
export const login = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password } })
export const logout = () =>
  apiFetch('/auth/logout', { method: 'POST' })
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
```

- [ ] **Step 2: Eliminar `client/src/data/mock.js`**

```bash
rm client/src/data/mock.js
```

- [ ] **Step 3: Commit**

```bash
git add client/src/api/client.js
git rm client/src/data/mock.js
git commit -m "feat: módulo API client.js — reemplaza mock.js con fetch real"
```

---

## Task 12: Adaptar App.jsx — login y carga de pacientes

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/ModalImpresionReceta.jsx`
- Modify: `client/src/utils/reportGenerator.js`

> **Nota:** El frontend movido a `client/` tiene sus archivos en `client/src/`. Todos los paths de esta tarea son relativos a `client/`.

- [ ] **Step 1: Reemplazar el import de mock y agregar import de api en `client/src/App.jsx`**

Línea 2 actual:
```js
import { CLINICA_INFO } from "./data/mock";
```
Reemplazar por:
```js
import { useState, useRef, useEffect } from "react";
import * as api from "./api/client.js";
```

> También cambiar la línea 1: `import { useState, useRef } from "react"` → ya queda cubierta arriba.

- [ ] **Step 2: Eliminar las 3 constantes de mock (líneas 9-~50 de App.jsx)**

Eliminar exactamente estas líneas (están tras el bloque de comentario `CONSTANTES GLOBALES`):
```js
const LIMITE_DEMO = 25;
const USUARIOS_MOCK = [
  { id: 1, nombre: "Dr. Jorge Francisco Montoya Sarmiento", rol: "medico", especialidad: "Medicina General", cedula: "12834216", pin: "1234", activo: true },
  { id: 2, nombre: "Enf. Marisol Fuentes", rol: "enfermera", especialidad: "Enfermería", cedula: "5672310", pin: "5678", activo: true },
  { id: 3, nombre: "Recep. Carlos Domínguez", rol: "recepcion", especialidad: "Administración", cedula: "ADM001", pin: "9012", activo: true },
];
const PACIENTES_MOCK = [{ ...el objeto largo de María Guadalupe... }];
```

- [ ] **Step 3: Agregar constante `CLINICA_INFO` local (temporal) justo donde estaba `LIMITE_DEMO`**

```js
// Datos de clínica — en el futuro vendrán de la API /auth/me
const CLINICA_INFO = {
  nombre: "Consultorio Médico MedpedienteX",
  direccion: "Av. Juárez 123, Col. Centro, Torreón, Coahuila",
  telefono: "871-000-0000",
  rfc: "CME240101ABC",
}
```

- [ ] **Step 4: Reemplazar el componente `Login` (línea ~263) con versión que usa email+password**

Código actual (líneas 263-289 aprox.):
```js
const Login = ({ onLogin }) => {
  const [cedula, setCedula] = useState(""); const [pin, setPin] = useState(""); const [error, setError] = useState(""); const [intentos, setIntentos] = useState(0);
  const handleLogin = () => {
    if (intentos >= 3) { setError("Cuenta bloqueada. Contacte al administrador."); return; }
    const u = USUARIOS_MOCK.find(u => u.cedula === cedula && u.pin === pin && u.activo);
    ...
  }
  ...
  <p className="text-center text-[10px] text-slate-600 mt-4 pt-4 border-t border-slate-800">Demo: Cédula <span className="text-slate-400">12834216</span> · PIN <span className="text-slate-400">1234</span></p>
```

Reemplazar el cuerpo del componente `Login` con:
```js
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Ingresa tu correo y contraseña"); return; }
    setCargando(true); setError("");
    try {
      const { usuario } = await api.login(email, password);
      onLogin(usuario);
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: "Georgia, serif" }}>MedpedienteX</h1>
          <p className="text-slate-400 text-xs mt-1 tracking-widest uppercase">Sistema de Gestión de Historial Clínico</p>
          <div className="flex justify-center gap-2 mt-2"><Badge label="NOM-004-SSA3" color="blue" /><Badge label="NOM-024-SSA3" color="green" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <Campo label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="correo@tuclinica.com" required />
            <Campo label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            {error && <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300">{error}</div>}
            <button onClick={handleLogin} disabled={cargando} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl text-sm">
              {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Reemplazar el bloque de estado y handlers en la función `App` (líneas 848-860)**

Código actual:
```js
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState(PACIENTES_MOCK);
  const [vista, setVista] = useState("lista");
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [modalReporteGeneral, setModalReporteGeneral] = useState(false);

  const handleLogin = u => setUsuario(u);
  const handleLogout = () => { setUsuario(null); setPacienteActivo(null); setVista("lista"); };
  const abrirExpediente = p => { setPacienteActivo(p); setVista("expediente"); };
  const actualizarPaciente = p => { setPacientes(prev => prev.map(x => x.id === p.id ? p : x)); setPacienteActivo(p); };
  const crearExpediente = nuevo => { if (pacientes.length >= LIMITE_DEMO) { alert(`Límite demo de ${LIMITE_DEMO} expedientes alcanzado.`); return; } setPacientes(prev => [nuevo, ...prev]); setVista("lista"); };

  if (!usuario) return <Login onLogin={handleLogin} />;
```

Reemplazar por:
```js
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [vista, setVista] = useState("lista");
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [modalReporteGeneral, setModalReporteGeneral] = useState(false);
  const [inicializando, setInicializando] = useState(true);

  useEffect(() => {
    api.getMe()
      .then(({ usuario }) => {
        setUsuario(usuario);
        return api.getPacientes();
      })
      .then(setPacientes)
      .catch(() => {})
      .finally(() => setInicializando(false));

    const onExpired = () => { setUsuario(null); setPacientes([]); };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const handleLogin = async (usuarioLogueado) => {
    setUsuario(usuarioLogueado);
    const lista = await api.getPacientes().catch(() => []);
    setPacientes(lista);
    setVista("lista");
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setUsuario(null);
    setPacientes([]);
    setPacienteActivo(null);
    setVista("lista");
  };

  const abrirExpediente = p => { setPacienteActivo(p); setVista("expediente"); };

  const actualizarPaciente = async (p) => {
    try {
      const actualizado = await api.updatePaciente(p.id, p.identificacion || p);
      setPacientes(prev => prev.map(x => x.id === actualizado.id ? actualizado : x));
      setPacienteActivo(actualizado);
    } catch (err) { alert(err.message); }
  };

  const crearExpediente = async (nuevo) => {
    try {
      const creado = await api.createPaciente(nuevo);
      setPacientes(prev => [creado, ...prev]);
      setVista("lista");
    } catch (err) { alert(err.message); }
  };

  if (inicializando) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>;
  if (!usuario) return <Login onLogin={handleLogin} />;
```

- [ ] **Step 6: Eliminar referencias a `LIMITE_DEMO` en la barra de progreso (ListaPacientes, ~líneas 758-782)**

Buscar y eliminar el bloque de progreso de demo. Son estas líneas:
```js
const puedeCrear = pacientes.length < LIMITE_DEMO;
const pct = Math.round((pacientes.length / LIMITE_DEMO) * 100);
```
Reemplazar por:
```js
const puedeCrear = true; // sin límite en producción
```

También eliminar el bloque de UI con la barra de progreso:
```jsx
<div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">...</div>
  <span className="text-[10px] text-slate-400">{pacientes.length}/{LIMITE_DEMO}</span>
</div>
```
Y el banner de límite alcanzado:
```jsx
{!puedeCrear && (
  <div className="mb-4 bg-amber-900/30 ...">⚠️ Límite demo de {LIMITE_DEMO}...</div>
)}
```
Y en el header:
```jsx
<div className="hidden sm:block bg-amber-900/30 ...">Demo · {pacientes.length}/{LIMITE_DEMO}</div>
```
Y en el texto descriptivo:
```jsx
<p className="text-xs text-slate-500">{pacientes.length} de {LIMITE_DEMO} registros en modo demo</p>
```
Reemplazar ese texto con:
```jsx
<p className="text-xs text-slate-500">{pacientes.length} expedientes</p>
```

- [ ] **Step 7: Actualizar logout en el header — pasar `handleLogout` como prop**

Buscar donde se llama a `handleLogout` en el JSX del header y verificar que reciba la función async (no debería requerir cambio si ya se pasa como prop).

- [ ] **Step 8: Arreglar imports en `client/src/components/ModalImpresionReceta.jsx`**

Línea 1 actual:
```js
import { CLINICA_INFO } from "../data/mock"
```
Reemplazar por:
```js
const CLINICA_INFO = {
  nombre: "Consultorio Médico MedpedienteX",
  direccion: "Av. Juárez 123, Col. Centro, Torreón, Coahuila",
  telefono: "871-000-0000",
  rfc: "CME240101ABC",
}
```

- [ ] **Step 9: Arreglar import en `client/src/utils/reportGenerator.js`**

Línea 1 actual:
```js
import { CLINICA_INFO } from "../data/mock";
```
Reemplazar por:
```js
const CLINICA_INFO = {
  nombre: "Consultorio Médico MedpedienteX",
  direccion: "Av. Juárez 123, Col. Centro, Torreón, Coahuila",
  telefono: "871-000-0000",
  rfc: "CME240101ABC",
}
```

- [ ] **Step 10: Probar el flujo completo en el browser**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

1. Abrir `http://localhost:5173`
2. Hacer login con las credenciales del admin creado en seed
3. Verificar que la lista de pacientes carga desde la API
4. Crear un paciente nuevo y verificar que aparece en la lista
5. Verificar que al recargar la página la sesión persiste (cookie)

- [ ] **Step 15: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: App.jsx conectado a API real — login, pacientes, notas, recetas"
```

---

## Task 13: Limpieza final y verificación

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Verificar que no quedan referencias a `mock.js` o `PACIENTES_MOCK`**

```bash
grep -r "mock\|PACIENTES_MOCK\|LIMITE_DEMO\|USUARIOS_MOCK" client/src/
# Resultado esperado: sin salida (ninguna referencia)
```

- [ ] **Step 2: Verificar que el build del cliente funciona**

```bash
cd client && npm run build
# Esperado: Build exitoso, sin errores
```

- [ ] **Step 3: Probar logout y que la sesión se cierre**

1. En el browser, hacer login
2. Hacer logout
3. Intentar acceder a `http://localhost:5173` → debe mostrar login
4. Intentar llamar directamente a `http://localhost:3001/api/v1/pacientes` → debe responder 401

- [ ] **Step 4: Probar crear una segunda clínica desde superadmin**

```bash
curl -X POST http://localhost:3001/api/v1/superadmin/clinicas \
  -H "Content-Type: application/json" \
  -H "x-clinica-id: 1" \
  -b cookies.txt \
  -d '{
    "nombre": "Clínica San José",
    "subdominio": "sanjose",
    "email_admin": "admin@sanjose.com",
    "password_admin": "Password123!",
    "ciudad": "Torreón",
    "plan": "profesional"
  }'
# Esperado: { id: 2, subdominio: "sanjose" }
```

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: integración SQL completa — backend Express + MySQL multi-tenant"
```

---

## Task 14: Instrucciones de despliegue en Hostinger

**Files:**
- Create: `docs/deploy-hostinger.md`

- [ ] **Step 1: Crear `docs/deploy-hostinger.md`**

```markdown
# Despliegue en Hostinger

## Requisitos previos en Hostinger
- VPS con Node.js 18+
- MySQL / MariaDB habilitado
- SSL (Let's Encrypt activado desde el panel)
- Wildcard DNS: `*.medpedientex.com.mx` apunta a la IP del VPS

## Pasos

1. **Subir el código al servidor**
   ```bash
   git clone <repo> /var/www/medpedientex
   ```

2. **Crear la base de datos**
   ```bash
   mysql -u root -p < server/migrations/001_schema_inicial.sql
   ```

3. **Configurar variables de entorno**
   ```bash
   cp server/.env.example server/.env
   # Editar con nano/vim: credenciales DB reales, JWT_SECRET largo, NODE_ENV=production
   nano server/.env
   ```

4. **Instalar dependencias del servidor**
   ```bash
   cd server && npm install --production
   ```

5. **Crear el superadmin**
   ```bash
   node server/scripts/seed_admin.js tu@email.com "PasswordSeguro!" "Tu Nombre"
   ```

6. **Construir el frontend**
   ```bash
   cd client && npm install && npm run build
   # El build queda en client/dist/
   ```

7. **Configurar Nginx** (si Hostinger usa Nginx):
   - `medpedientex.com.mx` → servir `landing/index.html`
   - `*.medpedientex.com.mx` → proxy a Express en puerto 3001 + servir `client/dist/`

8. **Iniciar el servidor con PM2**
   ```bash
   npm install -g pm2
   cd server && pm2 start src/index.js --name medpedientex-api
   pm2 save && pm2 startup
   ```
```

- [ ] **Step 2: Commit**

```bash
git add docs/deploy-hostinger.md
git commit -m "docs: instrucciones de despliegue en Hostinger"
```

---

## Resumen de commits esperados

1. `refactor: restructure monorepo — client/, server/, landing/`
2. `feat: schema SQL inicial — 10 tablas InnoDB multi-tenant`
3. `feat: servidor Express base con pool MySQL`
4. `feat: middleware resolverTenant — resuelve clinica_id por subdominio`
5. `feat: middleware auth JWT con httpOnly cookie y blacklist de tokens`
6. `feat: helper registrar() para bitácora de auditoría`
7. `feat: rutas de autenticación — login/logout/me con JWT httpOnly cookie`
8. `feat: CRUD pacientes filtrado por clinica_id`
9. `feat: rutas historia clínica, notas SOAP, prescripciones y consentimientos`
10. `feat: rutas bitácora, usuarios y superadmin`
11. `feat: módulo API client.js — reemplaza mock.js con fetch real`
12. `feat: App.jsx conectado a API real — login, pacientes, notas, recetas`
13. `feat: integración SQL completa — backend Express + MySQL multi-tenant`
14. `docs: instrucciones de despliegue en Hostinger`
