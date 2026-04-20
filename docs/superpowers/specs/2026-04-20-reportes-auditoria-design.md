# Reportes de Auditoría — Diseño

**Fecha:** 2026-04-20  
**Proyecto:** Mexpediente (NOM-004 / NOM-024 SSA3-2012)  
**Stack:** React + Vite + Tailwind, sin backend

---

## Objetivo

Agregar dos capacidades de reporte impresas orientadas a auditorías:

1. **Reporte individual** — expediente clínico completo de un paciente, accesible desde la vista de expediente.
2. **Reporte general** — resumen ejecutivo de múltiples expedientes seleccionados, accesible desde el panel superior en la vista de lista.

Ambos reportes deben cumplir NOM-004-SSA3-2012 y NOM-024-SSA3-2012 y ser presentables para auditorías.

---

## Arquitectura

### Patrón de impresión
Mismo que `ModalImpresionReceta.jsx`: función que genera HTML como string → `window.open()` → `document.write()` → `window.print()`.

### Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `src/utils/reportGenerator.js` | Genera strings HTML para ambos tipos de reporte |
| `src/components/ModalReporteExpediente.jsx` | Botón + lógica de disparo del reporte individual |
| `src/components/ModalReporteGeneral.jsx` | Modal de selección de expedientes + disparo del reporte general |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/App.jsx` | Botón `🖨 Imprimir Expediente` en `VistaExpediente`, botón `📊 Reporte General` en topbar (solo en vista `"lista"`) |

---

## Reporte Individual

### Botón
Ubicación: `VistaExpediente`, header, junto al botón `← Volver`.  
Label: `🖨 Imprimir Expediente`  
Acción: llama a `generarReporteExpediente(paciente, clinicaInfo, usuarioActual)` → abre ventana de impresión.

### Secciones del documento impreso

1. **Encabezado** — Logo Mexpediente, nombre y datos de la clínica (dirección, teléfono, RFC), fecha/hora de generación, médico que genera (nombre + cédula), badges NOM-004 y NOM-024.
2. **Identificación del paciente** — Folio, CURP, RFC, nombre completo, fecha de nacimiento, edad, sexo, estado civil, escolaridad, ocupación, nacionalidad, religión, lugar de nacimiento, domicilio, teléfono, contacto de emergencia, grupo sanguíneo, alergias (alerta en rojo si existen).
3. **Historia clínica** — Motivo de consulta, padecimiento actual, antecedentes heredofamiliares, antecedentes personales patológicos, antecedentes personales no patológicos, antecedentes gineco-obstétricos, antecedentes pediátricos, exploración física (talla, peso, IMC, TA, FC, FR, temperatura, SaO2, notas de exploración).
4. **Notas SOAP** — Tabla por nota: fecha, autor, cédula, tipo; bloques subjetivo / objetivo / análisis / plan; indicador de firma (✓ Firmado).
5. **Prescripciones** — Por receta: folio RX, fecha, médico, cédula; tabla de medicamentos (nombre, dosis, vía, frecuencia, duración, indicaciones); estado de firma (médico / paciente).
6. **Consentimientos informados** — Por consentimiento: tipo, fecha, texto completo, testigo, estado de firmas.
7. **Bitácora de auditoría** — Tabla completa: fecha/hora, usuario, acción, detalle. Nota al pie: "Registro inmutable conforme a NOM-024-SSA3-2012 §5.7".
8. **Pie de página** (en cada hoja) — `"Documento generado conforme a NOM-004-SSA3-2012 y NOM-024-SSA3-2012"`, folio del expediente, fecha de generación, número de página.

---

## Reporte General

### Botón
Ubicación: topbar de `App.jsx`, visible **solo** cuando `vista === "lista"`.  
Label: `📊 Reporte General`  
Acción: abre `ModalReporteGeneral`.

### Modal de selección
- Lista de todos los expedientes con checkbox por cada uno (nombre + folio).
- Toggle "Seleccionar todos".
- Contador: `"X expedientes seleccionados"`.
- Botón "Generar Reporte" deshabilitado si `seleccionados.length < 2`.
- Botón "Cancelar".

### Secciones del documento impreso

1. **Portada** — Logo Mexpediente, datos de la clínica, título "Reporte General de Expedientes Clínicos", rango de fechas de creación de los expedientes incluidos, fecha/hora de generación, médico que genera, total de expedientes incluidos, referencias NOM.
2. **Índice** — Tabla: #, folio, nombre del paciente.
3. **Resumen ejecutivo por expediente** (separados por `page-break-after: always`):
   - Encabezado de sección: folio + nombre del paciente.
   - Datos del paciente: edad, sexo, CURP, fecha de creación del expediente.
   - Estadísticas: total de notas SOAP, recetas y consentimientos.
   - Última nota SOAP: fecha, autor, plan.
   - Bitácora resumida: primeras 3 y últimas 3 entradas (o todas si son ≤ 6), con nota `"[... X entradas intermedias omitidas]"` si aplica.
4. **Pie de página** (en cada hoja) — nombre de clínica, referencias NOM, número de página.

---

## Estilo visual

- Misma paleta que `ModalImpresionReceta`: fondo blanco, texto oscuro, azul `#1e3a8a` para encabezados.
- Fuente: Georgia (serif) para encabezados, sistema sans-serif para cuerpo.
- Alertas de alergias en rojo.
- Bordes `1px solid #e5e7eb` para tablas y secciones.
- Optimizado para impresión en carta (A4 también aceptable): márgenes 20mm.

---

## Restricciones

- Sin backend: toda la generación es client-side.
- No se persiste ningún log de "reporte generado" en bitácora (fuera de alcance).
- `ModalReporteGeneral` solo se muestra cuando hay al menos 1 expediente en la lista.
