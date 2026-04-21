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
  activo              BOOLEAN DEFAULT TRUE,
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
