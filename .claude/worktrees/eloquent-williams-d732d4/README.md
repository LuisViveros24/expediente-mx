# ExpedienteMX 🏥

Sistema de Gestión de Historial Clínico Electrónico conforme a:
- **NOM-004-SSA3-2012** — Del Expediente Clínico
- **NOM-024-SSA3-2012** — Sistemas de Información de Registro Electrónico para la Salud

---

## 🚀 Inicio rápido (Mac)

### Requisitos previos
- [Node.js](https://nodejs.org/) v18 o superior
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/expediente-mx.git
cd expediente-mx

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abrir en el navegador: **http://localhost:5173**

### Credenciales de demo

| Usuario | Cédula | PIN | Rol |
|---------|--------|-----|-----|
| Dr. Alejandro Rivas | `3891045` | `1234` | Médico |
| Enf. Marisol Fuentes | `5672310` | `5678` | Enfermería |
| Recep. Carlos Domínguez | `ADM001` | `9012` | Recepción |

---

## 📋 Módulos del sistema

| Módulo | NOM referencia | Descripción |
|--------|---------------|-------------|
| Login / Autenticación | NOM-024 §5.4 | Acceso por cédula + PIN, bloqueo tras 3 intentos |
| Registro del paciente | NOM-004 §8.1 | Identificación completa (CURP, RFC, grupo sanguíneo, etc.) |
| Historia clínica | NOM-004 §8.2–8.3 | Motivo, padecimiento, antecedentes, exploración física |
| Notas SOAP | NOM-004 §8.5 | Subjetivo / Objetivo / Análisis / Plan |
| Prescripciones | NOM-004 §8.7 | Recetas con firma digital + impresión/PDF |
| Consentimiento informado | NOM-004 §8.8 | Firma digital biométrica paciente + médico |
| Control de acceso RBAC | NOM-024 §5.5 | Roles: Médico / Enfermería / Recepción |
| Bitácora de auditoría | NOM-024 §5.7 | Registro inmutable de todas las operaciones |

---

## 🔬 Modo Demo

Esta versión está configurada para un máximo de **25 expedientes**. El sistema muestra una barra de capacidad y bloquea el alta de nuevos pacientes al alcanzar el límite.

---

## 🚀 Migración a producción (Flask + PostgreSQL)

Ver [`docs/migracion-flask.md`](docs/migracion-flask.md) para instrucciones completas.

**Stack recomendado para producción:**
- Backend: Python + Flask + SQLAlchemy
- Base de datos: PostgreSQL
- Auth: JWT + bcrypt
- Servidor: Gunicorn + Nginx
- Deploy: Render.com / Railway / VPS propio

---

## 🗂️ Estructura del proyecto

```
expediente-mx/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui.jsx                    # Badge, Campo, Seccion
│   │   ├── PadFirma.jsx              # Pad firma digital canvas
│   │   └── ModalImpresionReceta.jsx  # Vista previa + impresión
│   ├── data/
│   │   └── mock.js                   # Datos de prueba y constantes
│   ├── utils/
│   │   └── helpers.js                # Funciones utilitarias
│   ├── App.jsx                       # Aplicación principal
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Estilos globales + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 📜 Cumplimiento normativo

| Requisito | NOM-024 | Estado |
|-----------|---------|--------|
| Confidencialidad | §5.2 | ✅ RBAC por rol |
| Integridad | §5.3 | ✅ Registros inmutables tras firma |
| Autenticación | §5.4 | ✅ Cédula + PIN, bloqueo 3 intentos |
| Control de acceso | §5.5 | ✅ Tres roles diferenciados |
| Firma electrónica | §5.6 | ✅ Canvas biométrico + timestamp |
| Trazabilidad | §5.7 | ✅ Bitácora completa |
| Disponibilidad | §5.8 | 🔄 Listo para producción |

---

## 📄 Licencia

Uso educativo / demo. Para despliegue en entornos clínicos reales, consulte con un especialista en regulación sanitaria (COFEPRIS).
