-- MedpedienteX — Schema PostgreSQL
-- Ejecutar: psql $DATABASE_URL < server/migrations/002_schema_postgresql.sql

CREATE TYPE plan_clinica AS ENUM ('basico', 'profesional', 'clinica');
CREATE TYPE rol_usuario AS ENUM ('medico', 'enfermera', 'recepcion', 'admin', 'superadmin');
CREATE TYPE sexo_paciente AS ENUM ('masculino', 'femenino', 'otro');

CREATE TABLE IF NOT EXISTS clinicas (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  subdominio  VARCHAR(50)  NOT NULL UNIQUE,
  email_admin VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20),
  ciudad      VARCHAR(100),
  plan        plan_clinica DEFAULT 'basico',
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  clinica_id    INT REFERENCES clinicas(id),
  nombre        VARCHAR(200) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cedula        VARCHAR(20),
  rol           rol_usuario NOT NULL,
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens_revocados (
  id         SERIAL PRIMARY KEY,
  jti        VARCHAR(36) NOT NULL UNIQUE,
  usuario_id INT NOT NULL REFERENCES usuarios(id),
  expira_en  TIMESTAMP NOT NULL,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pacientes (
  id                  SERIAL PRIMARY KEY,
  clinica_id          INT NOT NULL REFERENCES clinicas(id),
  folio               VARCHAR(20) NOT NULL,
  fecha_creacion      DATE NOT NULL,
  usuario_creador_id  INT REFERENCES usuarios(id),
  nombre              VARCHAR(200) NOT NULL,
  fecha_nacimiento    DATE NOT NULL,
  sexo                sexo_paciente NOT NULL,
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
  activo              BOOLEAN DEFAULT TRUE,
  creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (clinica_id, folio)
);

CREATE TABLE IF NOT EXISTS historia_clinica (
  id                                     SERIAL PRIMARY KEY,
  paciente_id                            INT NOT NULL UNIQUE REFERENCES pacientes(id),
  motivo_consulta                        TEXT,
  padecimiento_actual                    TEXT,
  antecedentes_heredofamiliares          TEXT,
  antecedentes_personales_patologicos    TEXT,
  antecedentes_personales_no_patologicos TEXT,
  antecedentes_ginecoobstetricos         TEXT,
  antecedentes_pediatricos               TEXT,
  exploracion_fisica                     JSONB,
  actualizado_en                         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notas (
  id          SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL REFERENCES pacientes(id),
  autor_id    INT NOT NULL REFERENCES usuarios(id),
  fecha       TIMESTAMP NOT NULL,
  tipo        VARCHAR(30) DEFAULT 'evolucion',
  subjetivo   TEXT,
  objetivo    TEXT,
  analisis    TEXT,
  plan        TEXT,
  firmado     BOOLEAN DEFAULT FALSE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescripciones (
  id             SERIAL PRIMARY KEY,
  paciente_id    INT NOT NULL REFERENCES pacientes(id),
  medico_id      INT NOT NULL REFERENCES usuarios(id),
  fecha          TIMESTAMP NOT NULL,
  firmada        BOOLEAN DEFAULT FALSE,
  firma_digital  TEXT,
  firma_paciente TEXT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescripcion_medicamentos (
  id              SERIAL PRIMARY KEY,
  prescripcion_id INT NOT NULL REFERENCES prescripciones(id),
  nombre          VARCHAR(200) NOT NULL,
  dosis           VARCHAR(100),
  via             VARCHAR(50),
  frecuencia      VARCHAR(100),
  duracion        VARCHAR(100),
  indicaciones    TEXT
);

CREATE TABLE IF NOT EXISTS consentimientos (
  id            SERIAL PRIMARY KEY,
  paciente_id   INT NOT NULL REFERENCES pacientes(id),
  fecha         TIMESTAMP NOT NULL,
  tipo          VARCHAR(50) NOT NULL,
  texto         TEXT,
  firmado       BOOLEAN DEFAULT FALSE,
  testigo       VARCHAR(200),
  firma_digital TEXT,
  firma_medico  TEXT,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora (
  id          SERIAL PRIMARY KEY,
  clinica_id  INT REFERENCES clinicas(id),
  paciente_id INT REFERENCES pacientes(id),
  usuario_id  INT REFERENCES usuarios(id),
  fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accion      VARCHAR(100) NOT NULL,
  detalle     TEXT
);
