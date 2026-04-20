# Guía de Migración: React Demo → Flask + PostgreSQL

## Arquitectura objetivo

```
expediente-mx-backend/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── paciente.py
│   │   ├── historia_clinica.py
│   │   ├── nota.py
│   │   ├── prescripcion.py
│   │   ├── consentimiento.py
│   │   ├── bitacora.py
│   │   └── usuario.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── pacientes.py
│   │   ├── notas.py
│   │   ├── prescripciones.py
│   │   └── consentimientos.py
│   └── utils/
│       ├── auth.py        # JWT + bcrypt
│       └── bitacora.py    # Decorador de trazabilidad
├── migrations/
├── requirements.txt
└── run.py
```

## Pasos de migración

### 1. Backend Flask

```bash
pip install flask flask-sqlalchemy flask-migrate flask-jwt-extended psycopg2-binary bcrypt
```

### 2. Modelos SQLAlchemy

Cada módulo del sistema → tabla PostgreSQL:
- `pacientes` → datos de identificación (NOM-004 §8.1)
- `historias_clinicas` → FK paciente_id
- `notas` → FK paciente_id + usuario_id (inmutables)
- `prescripciones` → FK paciente_id + firma_digital BYTEA
- `consentimientos` → FK paciente_id + firma_paciente BYTEA + firma_medico BYTEA
- `bitacora` → append-only, sin UPDATE/DELETE permitido

### 3. Auth JWT (reemplaza PIN demo)

```python
# POST /api/auth/login
# Body: { "cedula": "3891045", "password": "hash_bcrypt" }
# Response: { "access_token": "...", "rol": "medico" }
```

### 4. Frontend: cambiar PACIENTES_MOCK por fetch()

```javascript
// Antes (demo)
const [pacientes, setPacientes] = useState(PACIENTES_MOCK)

// Después (producción)
const [pacientes, setPacientes] = useState([])
useEffect(() => {
  fetch('/api/pacientes', {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(setPacientes)
}, [])
```

### 5. Sin límite de 25 registros

Eliminar `LIMITE_DEMO` y su lógica en `ListaPacientes` y `App`.

### 6. Deploy en Render.com

```yaml
# render.yaml
services:
  - type: web
    name: expediente-mx-api
    env: python
    buildCommand: pip install -r requirements.txt && flask db upgrade
    startCommand: gunicorn app:create_app()
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: expediente-mx-db
          property: connectionString
      - key: JWT_SECRET_KEY
        generateValue: true

databases:
  - name: expediente-mx-db
    plan: starter
```
