# Spec: Integración Base de Datos SQL — MedpedienteX

**Fecha:** 2026-04-20  
**Estado:** Aprobado por usuario  
**Autor:** Claude Code

---

## Contexto

MedpedienteX es un sistema de gestión de expedientes clínicos (NOM-004-SSA3-2012 y NOM-024-SSA3-2012) actualmente implementado como una app React+Vite frontend-only sin persistencia. Los datos viven únicamente en memoria (`PACIENTES_MOCK`) y se pierden al recargar la página.

**Objetivo:** Agregar persistencia real con MySQL y autenticación segura mediante JWT, con arquitectura **multi-tenant** — cada clínica cliente accede por su propio subdominio (`clinica.medpedientex.com.mx`) con datos completamente aislados. El dominio raíz (`medpedientex.com.mx`) es la landing page de ventas.

---

## Arquitectura

### Estructura del Repositorio

```
expediente-mx/
├── client/          ← React+Vite (app de expedientes para clínicas)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     ← NUEVO: reemplaza mock.js
│   │   ├── data/
│   │   │   └── mock.js       ← se elimina
│   │   └── ...resto sin cambios
│   └── package.json
├── server/          ← NUEVO: API Express (multi-tenant)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js             ← conexión MySQL (mysql2)
│   │   ├── middleware/
│   │   │   ├── tenant.js     ← resuelve clínica por subdominio
│   │   │   └── auth.js       ← verifica JWT + tenant
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── pacientes.js
│   │       ├── notas.js
│   │       ├── prescripciones.js
│   │       ├── consentimientos.js
│   │       ├── bitacora.js
│   │       ├── usuarios.js
│   │       └── superadmin.js ← gestión de clínicas (solo superadmin)
│   ├── migrations/
│   │   └── 001_schema_inicial.sql
│   └── package.json
├── landing/         ← NUEVO: página de ventas (medpedientex.com.mx)
│   └── index.html   ← HTML estático, no requiere build
└── package.json     ← scripts raíz (dev, build, start)
```

### Diagrama de Despliegue

```
medpedientex.com.mx  →  landing/index.html  (página de ventas, HTML estático)

clinicaX.medpedientex.com.mx
        │
        ▼
┌─────────────────────────────────────────────────┐
│                  Hostinger VPS                  │
│                                                 │
│  ┌──────────────┐      ┌────────────────────┐   │
│  │  React+Vite  │ HTTP │  Express API       │   │
│  │  (build      │◄────►│  middleware:       │   │
│  │  estático)   │      │  1. tenant.js      │   │
│  └──────────────┘      │  2. auth.js        │   │
│                        │  /api/v1/*         │   │
│                        └────────┬───────────┘   │
│                                 │               │
│                        ┌────────▼───────────┐   │
│                        │  MySQL / MariaDB   │   │
│                        │  (una sola DB,     │   │
│                        │  datos aislados    │   │
│                        │  por clinica_id)   │   │
│                        └────────────────────┘   │
└─────────────────────────────────────────────────┘

admin.medpedientex.com.mx  →  panel superadmin (tú)
```

### Resolución de Tenant por Subdominio

El middleware `tenant.js` extrae el subdominio del hostname en cada request:

```js
// req.hostname = "clinicaejemplo.medpedientex.com.mx"
// subdominio   = "clinicaejemplo"
const subdominio = req.hostname.split('.')[0]
const clinica = await db.query('SELECT * FROM clinicas WHERE subdominio = ?', [subdominio])
if (!clinica) return res.status(404).json({ error: 'Clínica no encontrada' })
req.clinicaId = clinica.id  // disponible en todos los handlers siguientes
```

Todos los queries de datos llevan automáticamente `WHERE clinica_id = req.clinicaId`.

---

## Base de Datos

### Esquema MySQL

```sql
-- Motor InnoDB requerido en todas las tablas para foreign keys reales

-- Clínicas clientes (tenants)
CREATE TABLE clinicas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  subdominio  VARCHAR(50) NOT NULL UNIQUE,   -- "clinicaejemplo" → clinicaejemplo.medpedientex.com.mx
  email_admin VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20),
  ciudad      VARCHAR(100),
  plan        ENUM('basico','profesional','clinica') DEFAULT 'basico',
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Usuarios del sistema
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id    INT,                          -- NULL = superadmin (acceso global)
  nombre        VARCHAR(200) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cedula        VARCHAR(20),
  rol           ENUM('medico','enfermera','recepcion','admin','superadmin') NOT NULL,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id)
) ENGINE=InnoDB;

-- Blacklist de tokens revocados (para logout real)
CREATE TABLE tokens_revocados (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  jti       VARCHAR(36) NOT NULL UNIQUE,  -- JWT ID único
  usuario_id INT NOT NULL,
  expira_en DATETIME NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Información de la clínica
CREATE TABLE clinica (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(200) NOT NULL,
  direccion TEXT,
  telefono  VARCHAR(20),
  rfc       VARCHAR(15)
) ENGINE=InnoDB;

-- Expedientes / pacientes
CREATE TABLE pacientes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id           INT NOT NULL,
  folio                VARCHAR(20) NOT NULL,
  fecha_creacion       DATE NOT NULL,
  usuario_creador_id   INT,
  nombre               VARCHAR(200) NOT NULL,
  fecha_nacimiento     DATE NOT NULL,
  sexo                 ENUM('masculino','femenino','otro') NOT NULL,
  curp                 VARCHAR(18),
  rfc                  VARCHAR(15),
  estado_civil         VARCHAR(30),
  escolaridad          VARCHAR(50),
  ocupacion            VARCHAR(100),
  nacionalidad         VARCHAR(50),
  religion             VARCHAR(50),
  lugar_nacimiento     VARCHAR(100),
  domicilio            TEXT,
  telefono             VARCHAR(20),
  telefono_emergencia  VARCHAR(20),
  contacto_emergencia  VARCHAR(200),
  grupo_sanguineo      VARCHAR(5),
  alergias             TEXT,
  creado_en            DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY folio_por_clinica (clinica_id, folio),
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Historia clínica (uno por paciente)
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

-- Notas de evolución SOAP
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

-- Prescripciones / recetas
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

-- Medicamentos de cada receta
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

-- Consentimientos informados
CREATE TABLE consentimientos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT NOT NULL,
  fecha          DATETIME NOT NULL,
  tipo           VARCHAR(50) NOT NULL,
  texto          MEDIUMTEXT,
  firmado        BOOLEAN DEFAULT FALSE,
  testigo        VARCHAR(200),
  firma_digital  MEDIUMTEXT,
  firma_medico   MEDIUMTEXT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
) ENGINE=InnoDB;

-- Bitácora de auditoría
CREATE TABLE bitacora (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT,
  usuario_id  INT,
  fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
  accion      VARCHAR(100) NOT NULL,
  detalle     TEXT,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;
```

---

## API REST

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login con email + password → JWT |
| POST | `/api/v1/auth/logout` | Invalidar sesión |
| GET | `/api/v1/auth/me` | Datos del usuario autenticado |

**Flujo JWT:**
- Body de login: `{ email, password }`
- Respuesta: cookie `httpOnly; Secure; SameSite=Strict` con el JWT + body `{ usuario: { id, nombre, rol, cedula } }`
- Token incluye claim `jti` (UUID único por sesión) para poder revocarlo
- Token expira en **8 horas** (jornada médica)
- Todas las rutas `/api/v1/*` leen el JWT desde la cookie automáticamente (no requiere header manual)
- **Logout real**: `POST /api/v1/auth/logout` inserta el `jti` en `tokens_revocados`; el middleware verifica esta tabla en cada request
- HTTPS obligatorio en producción (Hostinger SSL gratuito via Let's Encrypt)

### Pacientes

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes` | todos |
| POST | `/api/v1/pacientes` | medico, recepcion |
| GET | `/api/v1/pacientes/:id` | todos |
| PUT | `/api/v1/pacientes/:id` | medico, recepcion |
| DELETE | `/api/v1/pacientes/:id` | admin |

### Historia Clínica

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes/:id/historia` | todos |
| PUT | `/api/v1/pacientes/:id/historia` | medico, enfermera |

### Notas

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes/:id/notas` | todos |
| POST | `/api/v1/pacientes/:id/notas` | medico, enfermera |
| PUT | `/api/v1/notas/:id/firmar` | medico |

### Prescripciones

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes/:id/prescripciones` | todos |
| POST | `/api/v1/pacientes/:id/prescripciones` | medico |
| PUT | `/api/v1/prescripciones/:id/firmar` | medico |

### Consentimientos

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes/:id/consentimientos` | todos |
| POST | `/api/v1/pacientes/:id/consentimientos` | medico, enfermera |

### Bitácora

| Método | Endpoint | Rol mínimo | Descripción |
|--------|----------|-----------|-------------|
| GET | `/api/v1/pacientes/:id/bitacora` | medico, admin | Bitácora de un expediente |
| GET | `/api/v1/bitacora` | admin | Bitácora global (todos los expedientes) — reporte NOM-004/NOM-024 |

### Usuarios (admin de clínica)

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/usuarios` | admin |
| POST | `/api/v1/usuarios` | admin |
| PUT | `/api/v1/usuarios/:id` | admin |

### Superadmin — Gestión de Clínicas

Accesible desde `admin.medpedientex.com.mx`. Solo usuarios con `rol = 'superadmin'`.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/superadmin/clinicas` | Listar todas las clínicas |
| POST | `/api/v1/superadmin/clinicas` | Crear nueva clínica (alta de cliente) |
| PUT | `/api/v1/superadmin/clinicas/:id` | Actualizar plan, activar/desactivar |
| GET | `/api/v1/superadmin/clinicas/:id/usuarios` | Usuarios de una clínica |

---

## Cambios en el Frontend

### Principio: cambios mínimos y quirúrgicos

1. **Eliminar** `src/data/mock.js`
2. **Crear** `src/api/client.js` — función base `apiFetch` con manejo centralizado de errores:
   ```js
   async function apiFetch(path, options = {}) {
     const res = await fetch(`/api/v1${path}`, {
       ...options,
       credentials: 'include',  // envía cookie httpOnly automáticamente
       headers: { 'Content-Type': 'application/json', ...options.headers },
       body: options.body ? JSON.stringify(options.body) : undefined,
     })
     if (res.status === 401) {
       // sesión expirada → redirigir a login
       window.dispatchEvent(new Event('session-expired'))
       throw new Error('No autorizado')
     }
     if (!res.ok) throw new Error(await res.text())
     return res.json()
   }

   export const getPacientes = () => apiFetch('/pacientes')
   export const getPaciente = (id) => apiFetch(`/pacientes/${id}`)
   export const createPaciente = (data) => apiFetch('/pacientes', { method: 'POST', body: data })
   export const updatePaciente = (id, data) => apiFetch(`/pacientes/${id}`, { method: 'PUT', body: data })
   export const getHistoria = (id) => apiFetch(`/pacientes/${id}/historia`)
   export const updateHistoria = (id, data) => apiFetch(`/pacientes/${id}/historia`, { method: 'PUT', body: data })
   export const getNotas = (id) => apiFetch(`/pacientes/${id}/notas`)
   export const createNota = (id, data) => apiFetch(`/pacientes/${id}/notas`, { method: 'POST', body: data })
   export const firmarNota = (id) => apiFetch(`/notas/${id}/firmar`, { method: 'PUT' })
   export const getPrescripciones = (id) => apiFetch(`/pacientes/${id}/prescripciones`)
   export const createPrescripcion = (id, data) => apiFetch(`/pacientes/${id}/prescripciones`, { method: 'POST', body: data })
   export const firmarPrescripcion = (id, data) => apiFetch(`/prescripciones/${id}/firmar`, { method: 'PUT', body: data })
   export const getConsentimientos = (id) => apiFetch(`/pacientes/${id}/consentimientos`)
   export const createConsentimiento = (id, data) => apiFetch(`/pacientes/${id}/consentimientos`, { method: 'POST', body: data })
   export const getBitacora = (id) => apiFetch(`/pacientes/${id}/bitacora`)
   export const login = (email, password) => apiFetch('/auth/login', { method: 'POST', body: { email, password } })
   export const logout = () => apiFetch('/auth/logout', { method: 'POST' })
   export const getMe = () => apiFetch('/auth/me')
   ```
3. **`App.jsx`** — cambiar `useState(PACIENTES_MOCK)` por `useEffect` que carga desde API al montar; escuchar evento `session-expired` para forzar logout
4. **Login** — llamar a `login(email, password)`, guardar `{ usuario }` en estado React (el JWT vive en cookie httpOnly, no en JS)
5. **Cada operación** (crear nota, firmar receta, guardar historia) → llamar función correspondiente de `client.js`
6. **Eliminar** constante `LIMITE_DEMO = 25`

**No se modifica:** UI, componentes, modales, reportes, lógica de impresión.

---

## Stack Técnico — Servidor

```json
{
  "dependencies": {
    "express": "^4.18",
    "mysql2": "^3.6",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.0",
    "cookie-parser": "^1.4",
    "cors": "^2.8",
    "dotenv": "^16.0",
    "uuid": "^9.0"
  }
}
```

### Variables de entorno (`.env`)

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=medpedientex
DB_USER=...
DB_PASSWORD=...
JWT_SECRET=...          # string aleatorio largo
JWT_EXPIRES_IN=8h
PORT=3001
CLIENT_URL=https://tudominio.com
```

---

## Consideraciones de Seguridad

- Contraseñas hasheadas con **bcrypt** (saltRounds = 12)
- JWT firmado con secret aleatorio mínimo 32 chars; incluye claim `jti` (UUID) para revocación
- JWT almacenado en **cookie httpOnly + Secure + SameSite=Strict** — no accesible desde JS, protege contra XSS
- Logout real: `jti` se inserta en `tokens_revocados`; el middleware verifica esta tabla en cada request
- CORS restringido al dominio del cliente (`CLIENT_URL`)
- **HTTPS obligatorio** en producción — Hostinger provee SSL gratuito via Let's Encrypt
- Middleware de rol verifica permisos antes de cada operación
- Bitácora automática en todas las mutaciones (POST/PUT/DELETE)
- Datos en servidor propio — cumple NOM-004 sobre custodia de expedientes médicos

---

## Migración de Datos

Al hacer el primer deploy:
1. Ejecutar `001_schema_inicial.sql` para crear tablas
2. Ejecutar script `seed_admin.js` para crear el primer usuario admin
3. Los datos mock existentes se descartan (son datos de prueba)
