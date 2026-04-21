# Spec: Integración Base de Datos SQL — MedpedienteX

**Fecha:** 2026-04-20  
**Estado:** Aprobado por usuario  
**Autor:** Claude Code

---

## Contexto

MedpedienteX es un sistema de gestión de expedientes clínicos (NOM-004-SSA3-2012 y NOM-024-SSA3-2012) actualmente implementado como una app React+Vite frontend-only sin persistencia. Los datos viven únicamente en memoria (`PACIENTES_MOCK`) y se pierden al recargar la página.

**Objetivo:** Agregar persistencia real con MySQL y autenticación segura mediante JWT, manteniendo los datos bajo control del operador (servidor Hostinger propio) para cumplir con normativa de expedientes médicos en México.

---

## Arquitectura

### Estructura del Repositorio

```
expediente-mx/
├── client/          ← React+Vite (código actual)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     ← NUEVO: reemplaza mock.js
│   │   ├── data/
│   │   │   └── mock.js       ← se elimina
│   │   └── ...resto sin cambios
│   └── package.json
├── server/          ← NUEVO: API Express
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js             ← conexión MySQL (mysql2)
│   │   ├── middleware/
│   │   │   └── auth.js       ← verificarToken JWT
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── pacientes.js
│   │       ├── notas.js
│   │       ├── prescripciones.js
│   │       ├── consentimientos.js
│   │       ├── bitacora.js
│   │       └── usuarios.js
│   ├── migrations/
│   │   └── 001_schema_inicial.sql
│   └── package.json
└── package.json     ← scripts raíz (dev, build, start)
```

### Diagrama de Despliegue

```
┌─────────────────────────────────────────────────┐
│                  Hostinger VPS                  │
│                                                 │
│  ┌──────────────┐      ┌────────────────────┐   │
│  │  React+Vite  │ HTTP │  Express API       │   │
│  │  (build      │◄────►│  /api/v1/*         │   │
│  │  estático)   │      │  Puerto 3001       │   │
│  └──────────────┘      └────────┬───────────┘   │
│                                 │               │
│                        ┌────────▼───────────┐   │
│                        │  MySQL / MariaDB   │   │
│                        │  (Hostinger DB)    │   │
│                        └────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Base de Datos

### Esquema MySQL

```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cedula        VARCHAR(20),
  rol           ENUM('medico','enfermera','recepcion','admin') NOT NULL,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Información de la clínica
CREATE TABLE clinica (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(200) NOT NULL,
  direccion TEXT,
  telefono  VARCHAR(20),
  rfc       VARCHAR(15)
);

-- Expedientes / pacientes
CREATE TABLE pacientes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  folio                VARCHAR(20) NOT NULL UNIQUE,
  fecha_creacion       DATE NOT NULL,
  usuario_creador_id   INT REFERENCES usuarios(id),
  -- Identificación
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
  actualizado_en       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Historia clínica (uno por paciente)
CREATE TABLE historia_clinica (
  id                                    INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id                           INT NOT NULL UNIQUE REFERENCES pacientes(id),
  motivo_consulta                       TEXT,
  padecimiento_actual                   TEXT,
  antecedentes_heredofamiliares         TEXT,
  antecedentes_personales_patologicos   TEXT,
  antecedentes_personales_no_patologicos TEXT,
  antecedentes_ginecoobstetricos        TEXT,
  antecedentes_pediatricos              TEXT,
  exploracion_fisica                    JSON,
  actualizado_en                        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notas de evolución SOAP
CREATE TABLE notas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id),
  autor_id    INT NOT NULL REFERENCES usuarios(id),
  fecha       DATETIME NOT NULL,
  tipo        VARCHAR(30) DEFAULT 'evolucion',
  subjetivo   TEXT,
  objetivo    TEXT,
  analisis    TEXT,
  plan        TEXT,
  firmado     BOOLEAN DEFAULT FALSE,
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prescripciones / recetas
CREATE TABLE prescripciones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT NOT NULL REFERENCES pacientes(id),
  medico_id      INT NOT NULL REFERENCES usuarios(id),
  fecha          DATETIME NOT NULL,
  firmada        BOOLEAN DEFAULT FALSE,
  firma_digital  MEDIUMTEXT,
  firma_paciente MEDIUMTEXT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medicamentos de cada receta
CREATE TABLE prescripcion_medicamentos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  prescripcion_id INT NOT NULL REFERENCES prescripciones(id),
  nombre          VARCHAR(200) NOT NULL,
  dosis           VARCHAR(100),
  via             VARCHAR(50),
  frecuencia      VARCHAR(100),
  duracion        VARCHAR(100),
  indicaciones    TEXT
);

-- Consentimientos informados
CREATE TABLE consentimientos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id    INT NOT NULL REFERENCES pacientes(id),
  fecha          DATETIME NOT NULL,
  tipo           VARCHAR(50) NOT NULL,
  texto          MEDIUMTEXT,
  firmado        BOOLEAN DEFAULT FALSE,
  testigo        VARCHAR(200),
  firma_digital  MEDIUMTEXT,
  firma_medico   MEDIUMTEXT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bitácora de auditoría
CREATE TABLE bitacora (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT REFERENCES pacientes(id),
  usuario_id  INT REFERENCES usuarios(id),
  fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
  accion      VARCHAR(100) NOT NULL,
  detalle     TEXT
);
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
- Respuesta: `{ token, usuario: { id, nombre, rol, cedula } }`
- Token expira en **8 horas**
- Todas las rutas `/api/v1/*` requieren header `Authorization: Bearer <token>`
- Frontend guarda token en `localStorage`

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

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/pacientes/:id/bitacora` | medico, admin |

### Usuarios (admin)

| Método | Endpoint | Rol mínimo |
|--------|----------|-----------|
| GET | `/api/v1/usuarios` | admin |
| POST | `/api/v1/usuarios` | admin |
| PUT | `/api/v1/usuarios/:id` | admin |

---

## Cambios en el Frontend

### Principio: cambios mínimos y quirúrgicos

1. **Eliminar** `src/data/mock.js`
2. **Crear** `src/api/client.js` — módulo con funciones async que envuelven `fetch`:
   ```js
   export const getPacientes = () => apiFetch('/pacientes')
   export const createPaciente = (data) => apiFetch('/pacientes', { method: 'POST', body: data })
   // ...etc
   ```
3. **`App.jsx`** — cambiar `useState(PACIENTES_MOCK)` por `useEffect` que carga desde API al montar
4. **Login** — llamar a `POST /api/auth/login`, guardar JWT en `localStorage`, leer usuario desde token
5. **Cada operación** (crear nota, firmar receta, guardar historia) → llamar endpoint correspondiente
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
    "cors": "^2.8",
    "dotenv": "^16.0"
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
- JWT firmado con secret largo aleatorio (mínimo 32 chars)
- CORS restringido al dominio del cliente
- Middleware de rol verifica permisos antes de cada operación
- Bitácora automática en todas las mutaciones (POST/PUT/DELETE)
- Datos en servidor propio — cumple NOM-004 sobre custodia de expedientes

---

## Migración de Datos

Al hacer el primer deploy:
1. Ejecutar `001_schema_inicial.sql` para crear tablas
2. Ejecutar script `seed_admin.js` para crear el primer usuario admin
3. Los datos mock existentes se descartan (son datos de prueba)
