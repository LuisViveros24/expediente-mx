import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

console.log('Creando tablas de laboratorio...')

await db.execute(`
  CREATE TABLE IF NOT EXISTS lab_solicitudes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id      INT NOT NULL,
    solicitante_id   INT NOT NULL,
    fecha_solicitud  DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones    TEXT,
    creado_en        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id)    REFERENCES pacientes(id),
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
  ) ENGINE=InnoDB
`)

await db.execute(`
  CREATE TABLE IF NOT EXISTS lab_examenes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id     INT NOT NULL,
    nombre           VARCHAR(200) NOT NULL,
    recibido         BOOLEAN DEFAULT FALSE,
    fecha_recepcion  DATETIME NULL,
    FOREIGN KEY (solicitud_id) REFERENCES lab_solicitudes(id)
  ) ENGINE=InnoDB
`)

console.log('✅ Tablas lab_solicitudes y lab_examenes creadas')
await db.end()
