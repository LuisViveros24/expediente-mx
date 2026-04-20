# Reportes de Auditoría — Diseño

**Fecha:** 2026-04-20  
**Proyecto:** Mexpediente (NOM-004 / NOM-024 SSA3-2012)  
**Stack:** React + Vite + Tailwind, sin backend

---

## Objetivo

Agregar dos capacidades de reporte impreso orientadas a auditorías:

1. **Reporte individual** — expediente clínico completo de un paciente, accesible desde la vista de expediente.
2. **Reporte general** — resumen ejecutivo de múltiples expedientes seleccionados, accesible desde el panel superior en la vista de lista.

Ambos reportes deben cumplir NOM-004-SSA3-2012 y NOM-024-SSA3-2012 y ser presentables para auditorías.

---

## Arquitectura

### Patrón de impresión

`reportGenerator.js` genera un string HTML completo → se pasa directamente a `window.open()` + `document.write()` + `window.print()`. **No se renderiza en el DOM antes de imprimir** (a diferencia de `ModalImpresionReceta.jsx`, que lee del DOM; aquí se genera el HTML directamente como string).

### CLINICA_INFO

`reportGenerator.js` importa `CLINICA_INFO` directamente desde `src/data/mock.js` (igual que `ModalImpresionReceta`). No se pasa como parámetro.

### Funciones exportadas de `reportGenerator.js`

```js
export function generarReporteExpediente(paciente, usuarioActual): string
export function generarReporteGeneral(pacientesSeleccionados, usuarioActual): string
```

Ambas retornan un string HTML completo listo para `document.write()`.

### Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `src/utils/reportGenerator.js` | Genera strings HTML para ambos tipos de reporte. Importa `CLINICA_INFO` de `mock.js`. |
| `src/components/ModalReporteExpediente.jsx` | Botón de impresión individual. Props: `{ paciente, usuarioActual }`. No es un modal; es un botón que llama a `generarReporteExpediente` y abre la ventana de impresión directamente. |
| `src/components/ModalReporteGeneral.jsx` | Modal con lista de expedientes y checkboxes. Props: `{ pacientes, usuarioActual, onCerrar }`. Maneja selección interna con `useState`. |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | 1) Reemplazar `const CLINICA_INFO = {...}` (línea 7) con `import { CLINICA_INFO } from "./data/mock"` para eliminar la definición duplicada. 2) Importar `ModalReporteExpediente` y usarlo en el header de `VistaExpediente`. 3) Agregar `const [modalReporteGeneral, setModalReporteGeneral] = useState(false)` en la raíz. 4) Agregar botón `📊 Reporte General` en topbar (condición: `vista === "lista" && pacientes.length >= 2`). 5) Renderizar `<ModalReporteGeneral>` cuando `modalReporteGeneral === true`. |

---

## Reporte Individual

### Componente `ModalReporteExpediente`

Props: `{ paciente, usuarioActual }`  
Renderiza: un botón `🖨 Imprimir Expediente`.  
Al hacer clic: llama `generarReporteExpediente(paciente, usuarioActual)`, abre `window.open()`, escribe con `document.write(html)`, y dispara `setTimeout(() => win.print(), 500)`. No se llama `win.close()` (el usuario cierra la ventana tras imprimir), igual que `ModalImpresionReceta.jsx`.

### Botón en App.jsx

Ubicación: `VistaExpediente`, header, junto al botón `← Volver`.

```jsx
<ModalReporteExpediente paciente={paciente} usuarioActual={usuarioActual} />
```

### Secciones del documento impreso

1. **Encabezado** — Logo Mexpediente, datos de la clínica (nombre, dirección, teléfono, RFC), fecha/hora de generación, médico que genera (nombre + cédula), badges NOM-004 y NOM-024.
2. **Identificación del paciente** — Folio, CURP, RFC, nombre completo, fecha de nacimiento, edad calculada, sexo, estado civil, escolaridad, ocupación, nacionalidad, religión, lugar de nacimiento, domicilio, teléfono, contacto de emergencia + teléfono, grupo sanguíneo, alergias (en caja roja si no está vacío).
3. **Historia clínica** — Motivo de consulta, padecimiento actual, antecedentes heredofamiliares, antecedentes personales patológicos, antecedentes personales no patológicos, antecedentes gineco-obstétricos, antecedentes pediátricos, exploración física (talla, peso, IMC —mostrar `exploFisica.imc` almacenado; si vacío, calcular con `calcIMC(peso, talla)`—, TA, FC, FR, temperatura, SaO2, notas de exploración). Los campos de antecedentes vacíos se muestran como `"No registrado"`.
4. **Notas SOAP** — Por cada nota: fecha, autor, cédula, tipo; bloques subjetivo / objetivo / análisis / plan; indicador `✓ Firmado`. Si no hay notas: sección con texto `"Sin notas registradas"`.
5. **Prescripciones** — Por cada receta: folio RX, fecha, médico, cédula; tabla de medicamentos (nombre, dosis, vía, frecuencia, duración, indicaciones); estado de firma (médico / paciente). Si no hay recetas: `"Sin prescripciones registradas"`.
6. **Consentimientos informados** — Por cada consentimiento: tipo, fecha, texto completo, testigo, estado de firmas. Si no hay consentimientos: `"Sin consentimientos registrados"`.
7. **Bitácora de auditoría** — Tabla completa: fecha/hora, usuario, acción, detalle. Las entradas de bitácora se muestran tal cual (son strings opacos, no se validan contra `USUARIOS_MOCK`). Nota al pie: `"Registro inmutable conforme a NOM-024-SSA3-2012 §5.7"`.
8. **Pie de página** (en cada hoja impresa) — `"Documento generado conforme a NOM-004-SSA3-2012 y NOM-024-SSA3-2012"`, folio del expediente, fecha de generación. Número de página mediante CSS `@page` con `counter(page)` (ver sección Estilos).

---

## Reporte General

### Botón en App.jsx (topbar)

Condición de visibilidad: `vista === "lista" && pacientes.length >= 2`.  
Al hacer clic: `setModalReporteGeneral(true)`.

> **Nota:** El mínimo de 2 expedientes es un requisito de producto. Si solo hay 1 expediente en el sistema, el botón no se renderiza.

### Componente `ModalReporteGeneral`

Props: `{ pacientes, usuarioActual, onCerrar }`  
Estado interno:
```js
const [seleccionados, setSeleccionados] = useState([]) // array de ids
```

**UI del modal:**
- Título: "Generar Reporte General"
- Lista scrollable con un checkbox por expediente (label: `{folio} — {identificacion.nombre}`)
- Toggle "Seleccionar todos"
- Contador: `"{N} expedientes seleccionados"`
- Botón "Generar Reporte" — deshabilitado si `seleccionados.length < 2`
- Botón "Cancelar" → llama `onCerrar()`

Al hacer clic en "Generar Reporte":
1. Filtrar `pacientes` por `seleccionados`.
2. Llamar `generarReporteGeneral(filtrados, usuarioActual)`.
3. Ejecutar `window.open()` → `document.write(html)` → `setTimeout(() => win.print(), 500)`. No llamar `win.close()`.
4. Llamar `onCerrar()`.

### Secciones del documento impreso

1. **Portada** — Logo Mexpediente, datos de la clínica, título `"Reporte General de Expedientes Clínicos"`, rango de fechas (`min(fechaCreacion) — max(fechaCreacion)` formateado como `dd/mm/yyyy`; si `min === max`, mostrar fecha única), total de expedientes incluidos, fecha/hora de generación, médico que genera (nombre + cédula), referencias NOM.
2. **Índice** — Tabla: #, Folio, Nombre del paciente.
3. **Resumen ejecutivo por expediente** — Cada sección separada por `page-break-after: always` excepto la última. Contenido:
   - Encabezado de sección: folio + nombre completo.
   - Datos: edad calculada, sexo, CURP, fecha de creación del expediente.
   - Estadísticas: total de notas SOAP, total de recetas, total de consentimientos.
   - Última nota SOAP (si existe): fecha, autor, campo `plan`. Si no hay notas: `"Sin notas registradas"`.
   - Bitácora resumida: si `bitacora.length <= 6`, mostrar todas; si `> 6`, mostrar primeras 3 + `"[... X entradas intermedias omitidas]"` + últimas 3.
4. **Pie de página** (en cada hoja) — nombre de clínica, `"NOM-004-SSA3-2012 / NOM-024-SSA3-2012"`, número de página (CSS counter).

---

## Estilos de impresión

- Paleta: fondo blanco, texto `#111827`, azul `#1e3a8a` para encabezados.
- Fuente: Georgia (serif) para títulos, sistema sans-serif para cuerpo.
- Alertas de alergias: caja con fondo `#fee2e2`, borde `#ef4444`.
- Tablas: borde `1px solid #e5e7eb`, cabecera con fondo `#f3f4f6`.
- Márgenes de página: 20mm.
- Números de página en pie de cada hoja. Solo `counter(page)` (no `counter(pages)` — no soportado en Firefox/Safari):
```css
@page {
  margin: 20mm;
  @bottom-right {
    content: "Página " counter(page);
    font-size: 9px;
    color: #9ca3af;
  }
}
```
- `page-break-inside: avoid` en cada sección de nota/receta/consentimiento para evitar cortes mid-block.

---

## Restricciones

- Sin backend: toda la generación es client-side.
- No se agrega entrada a bitácora cuando se genera un reporte (fuera de alcance).
- Las entradas de bitácora se muestran como strings opacos sin validación contra `USUARIOS_MOCK`.
- Si `pacientes.length < 2`, el botón de Reporte General no se renderiza (no se muestra deshabilitado).
