import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

import db from '../src/db.js'

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
