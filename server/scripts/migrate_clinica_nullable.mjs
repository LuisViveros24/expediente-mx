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

console.log('Haciendo clinica_id nullable en pacientes...')
await db.execute('ALTER TABLE pacientes MODIFY COLUMN clinica_id INT NULL')
console.log('✅ Listo')
await db.end()
