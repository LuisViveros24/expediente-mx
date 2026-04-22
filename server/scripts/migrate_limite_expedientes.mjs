import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })
const conn = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})
await conn.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS limite_expedientes INT NULL DEFAULT NULL')
console.log('✅ columna limite_expedientes agregada')
await conn.end()
