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
