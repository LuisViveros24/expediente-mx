import { CLINICA_INFO } from "../data/mock";
import { calcIMC, calcEdad } from "./helpers";

const nr = (v) => v || "No registrado";

const fmt = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const estilosBase = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111827; background: #fff; }
  @page { margin: 20mm; @bottom-right { content: "Página " counter(page); font-size: 9px; color: #9ca3af; } }
  h1 { font-family: Georgia, serif; font-size: 20px; font-weight: 900; color: #0A2540; }
  h2 { font-family: Georgia, serif; font-size: 15px; font-weight: 700; color: #0A2540; margin-bottom: 8px; border-bottom: 2px solid #0A2540; padding-bottom: 4px; }
  h3 { font-size: 12px; font-weight: 700; color: #0A2540; margin-bottom: 6px; }
  .encabezado { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0A2540; padding-bottom: 12px; margin-bottom: 20px; }
  .clinica-info { font-size: 10px; color: #6b7280; margin-top: 4px; }
  .meta-reporte { text-align: right; font-size: 10px; color: #6b7280; }
  .noms { display: flex; gap: 6px; margin-top: 6px; }
  .nom-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid; }
  .nom-004 { color: #0369a1; border-color: #0369a1; background: #e0f2fe; }
  .nom-024 { color: #15803d; border-color: #15803d; background: #dcfce7; }
  .seccion { margin-bottom: 20px; page-break-inside: avoid; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .campo { margin-bottom: 6px; }
  .campo-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .campo-valor { font-size: 11px; color: #111827; margin-top: 2px; }
  .alergias { background: #fee2e2; border: 1px solid #ef4444; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; color: #b91c1c; font-weight: 700; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
  th { background: #f3f4f6; font-weight: 700; text-align: left; padding: 5px 8px; border: 1px solid #e5e7eb; color: #374151; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .nota-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 10px; page-break-inside: avoid; }
  .nota-header { display: flex; gap: 12px; margin-bottom: 8px; font-size: 10px; color: #6b7280; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
  .nota-header strong { color: #0A2540; }
  .soap-bloque { margin-bottom: 6px; }
  .soap-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  .soap-val { font-size: 11px; color: #111827; margin-top: 2px; }
  .firmado { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #15803d; border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: 700; }
  .sin-datos { color: #9ca3af; font-style: italic; font-size: 11px; padding: 8px 0; }
  .footer { border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 8px; font-size: 9px; color: #9ca3af; text-align: center; }
  .page-break { page-break-after: always; }
  .stat-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 900; color: #0A2540; }
  .stat-label { font-size: 9px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
  .bitacora-omitida { color: #9ca3af; font-style: italic; text-align: center; padding: 4px 0; font-size: 10px; }
  .portada { text-align: center; padding: 60px 0; }
  .portada h1 { font-size: 28px; margin-bottom: 12px; }
  .portada .subtitulo { font-size: 16px; color: #374151; margin-bottom: 24px; }
  .portada .meta { font-size: 11px; color: #6b7280; margin-top: 8px; }
  .indice-table td, .indice-table th { padding: 6px 10px; }
`;

function encabezadoHTML(usuarioActual) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const hora = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return `
    <div class="encabezado">
      <div>
        <h1>MedpedienteX</h1>
        <div class="clinica-info">
          <strong>${CLINICA_INFO.nombre}</strong><br>
          ${CLINICA_INFO.direccion}<br>
          Tel: ${CLINICA_INFO.telefono} · RFC: ${CLINICA_INFO.rfc}
        </div>
        <div class="noms">
          <span class="nom-badge nom-004">NOM-004-SSA3-2012</span>
          <span class="nom-badge nom-024">NOM-024-SSA3-2012</span>
        </div>
      </div>
      <div class="meta-reporte">
        <div>Fecha: <strong>${fecha}</strong></div>
        <div>Hora: <strong>${hora}</strong></div>
        <div style="margin-top:6px;">Generado por:</div>
        <div><strong>${usuarioActual.nombre}</strong></div>
        <div>Cédula: ${usuarioActual.cedula}</div>
      </div>
    </div>`;
}

function footerHTML(folio) {
  return `<div class="footer">Documento generado conforme a NOM-004-SSA3-2012 y NOM-024-SSA3-2012${folio ? ` · Expediente: ${folio}` : ""} · ${CLINICA_INFO.nombre}</div>`;
}

function campo(label, valor) {
  return `<div class="campo"><div class="campo-label">${label}</div><div class="campo-valor">${nr(valor)}</div></div>`;
}

export function generarReporteExpediente(paciente, usuarioActual) {
  const { identificacion: id, historiaClinica: hc, notas, prescripciones, consentimientos, bitacora, folio, fechaCreacion } = paciente;
  const ef = hc.exploFisica;
  const imc = ef.imc || calcIMC(ef.peso, ef.talla) || "—";

  const seccionIdentificacion = `
    <div class="seccion">
      <h2>1. Identificación del Paciente</h2>
      ${id.alergias ? `<div class="alergias">⚠ ALERGIAS: ${id.alergias}</div>` : ""}
      <div class="grid-3">
        ${campo("Folio", folio)}
        ${campo("Fecha de creación", fmt(fechaCreacion))}
        ${campo("CURP", id.curp)}
        ${campo("RFC", id.rfc)}
        ${campo("Nombre completo", id.nombre)}
        ${campo("Fecha de nacimiento", fmt(id.fechaNacimiento))}
        ${campo("Edad", calcEdad(id.fechaNacimiento))}
        ${campo("Sexo", id.sexo === "M" ? "Masculino" : id.sexo === "F" ? "Femenino" : id.sexo)}
        ${campo("Estado civil", id.estadoCivil)}
        ${campo("Escolaridad", id.escolaridad)}
        ${campo("Ocupación", id.ocupacion)}
        ${campo("Nacionalidad", id.nacionalidad)}
        ${campo("Religión", id.religion)}
        ${campo("Lugar de nacimiento", id.lugarNacimiento)}
        ${campo("Grupo sanguíneo", id.grupoSanguineo)}
      </div>
      <div class="grid-2" style="margin-top:6px;">
        ${campo("Domicilio", id.domicilio)}
        ${campo("Teléfono", id.telefono)}
        ${campo("Contacto de emergencia", id.contactoEmergencia)}
        ${campo("Tel. emergencia", id.telefonoEmergencia)}
      </div>
    </div>`;

  const seccionHistoria = `
    <div class="seccion">
      <h2>2. Historia Clínica</h2>
      ${campo("Motivo de consulta", hc.motivoConsulta)}
      ${campo("Padecimiento actual", hc.padecimientoActual)}
      <div style="margin-top:10px;"><h3>Antecedentes</h3></div>
      <div class="grid-2">
        ${campo("Heredofamiliares", hc.antecedentesHeredoFamiliares)}
        ${campo("Personales patológicos", hc.antecedentesPersonalesPatologicos)}
        ${campo("Personales no patológicos", hc.antecedentesPersonalesNoPatologicos)}
        ${campo("Gineco-obstétricos", hc.antecedentesGinecoObstetricos)}
        ${campo("Pediátricos", hc.antecedentesPediatricos)}
      </div>
      <div style="margin-top:10px;"><h3>Exploración Física</h3></div>
      <div class="grid-3">
        ${campo("Talla (m)", ef.talla)}
        ${campo("Peso (kg)", ef.peso)}
        ${campo("IMC", imc)}
        ${campo("T/A (mmHg)", ef.ta)}
        ${campo("FC (lpm)", ef.fc)}
        ${campo("FR (rpm)", ef.fr)}
        ${campo("Temperatura (°C)", ef.temp)}
        ${campo("SaO₂ (%)", ef.sao2)}
      </div>
      ${campo("Notas de exploración", ef.notasExploracion)}
    </div>`;

  const seccionNotas = `
    <div class="seccion">
      <h2>3. Notas de Evolución SOAP</h2>
      ${notas.length === 0 ? `<p class="sin-datos">Sin notas registradas.</p>` : notas.map((n, i) => `
        <div class="nota-card">
          <div class="nota-header">
            <span>#${i + 1}</span>
            <span><strong>${n.fecha}</strong></span>
            <span>${n.autor} · Céd: ${n.cedula}</span>
            <span>Tipo: ${n.tipo}</span>
            ${n.firmado ? `<span class="firmado">✓ Firmado</span>` : ""}
          </div>
          <div class="grid-2">
            <div class="soap-bloque"><div class="soap-label">S — Subjetivo</div><div class="soap-val">${nr(n.subjetivo)}</div></div>
            <div class="soap-bloque"><div class="soap-label">O — Objetivo</div><div class="soap-val">${nr(n.objetivo)}</div></div>
            <div class="soap-bloque"><div class="soap-label">A — Análisis</div><div class="soap-val">${nr(n.analisis)}</div></div>
            <div class="soap-bloque"><div class="soap-label">P — Plan</div><div class="soap-val">${nr(n.plan)}</div></div>
          </div>
        </div>`).join("")}
    </div>`;

  const seccionRecetas = `
    <div class="seccion">
      <h2>4. Prescripciones</h2>
      ${prescripciones.length === 0 ? `<p class="sin-datos">Sin prescripciones registradas.</p>` : prescripciones.map((rx, i) => `
        <div class="nota-card">
          <div class="nota-header">
            <span>RX-${rx.id}</span>
            <span><strong>${rx.fecha}</strong></span>
            <span>${rx.medico} · Céd: ${rx.cedula}</span>
            ${rx.firmada ? `<span class="firmado">✓ Firmada</span>` : ""}
          </div>
          <table>
            <thead><tr><th>Medicamento</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr></thead>
            <tbody>${rx.medicamentos.map(m => `<tr><td><strong>${m.nombre}</strong></td><td>${m.dosis}</td><td>${m.via}</td><td>${m.frecuencia}</td><td>${m.duracion}</td><td>${m.indicaciones}</td></tr>`).join("")}</tbody>
          </table>
        </div>`).join("")}
    </div>`;

  const seccionConsentimientos = `
    <div class="seccion">
      <h2>5. Consentimientos Informados</h2>
      ${consentimientos.length === 0 ? `<p class="sin-datos">Sin consentimientos registrados.</p>` : consentimientos.map((c, i) => `
        <div class="nota-card">
          <div class="nota-header">
            <span>#${i + 1}</span>
            <span><strong>${c.fecha}</strong></span>
            <span>Tipo: ${c.tipo}</span>
            ${c.firmado ? `<span class="firmado">✓ Firmado</span>` : ""}
            ${c.testigo ? `<span>Testigo: ${c.testigo}</span>` : ""}
          </div>
          <p style="font-size:11px;color:#374151;line-height:1.6;">${c.texto}</p>
        </div>`).join("")}
    </div>`;

  const filasBitacora = bitacora.map(b => `<tr><td>${b.fecha}</td><td>${b.usuario}</td><td><strong>${b.accion}</strong></td><td>${b.detalle}</td></tr>`).join("");
  const seccionBitacora = `
    <div class="seccion">
      <h2>6. Bitácora de Auditoría</h2>
      ${bitacora.length === 0 ? `<p class="sin-datos">Sin registros en bitácora.</p>` : `
        <table>
          <thead><tr><th>Fecha / Hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody>${filasBitacora}</tbody>
        </table>
        <p style="margin-top:8px;font-size:9px;color:#9ca3af;">Registro inmutable conforme a NOM-024-SSA3-2012 §5.7</p>`}
    </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Expediente ${folio} — ${id.nombre}</title>
  <style>${estilosBase}</style>
</head>
<body>
  ${encabezadoHTML(usuarioActual)}
  <div class="seccion" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 14px;margin-bottom:20px;">
    <strong style="color:#0369a1;font-size:13px;">${id.nombre}</strong>
    <span style="color:#6b7280;font-size:10px;margin-left:12px;">Folio: ${folio} · ${calcEdad(id.fechaNacimiento)} · Creado: ${fmt(fechaCreacion)}</span>
  </div>
  ${seccionIdentificacion}
  ${seccionHistoria}
  ${seccionNotas}
  ${seccionRecetas}
  ${seccionConsentimientos}
  ${seccionBitacora}
  ${footerHTML(folio)}
</body>
</html>`;
}

export function generarReporteGeneral(pacientesSeleccionados, usuarioActual) {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const horaStr = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const fechas = pacientesSeleccionados.map(p => p.fechaCreacion).filter(Boolean).sort();
  const fMin = fmt(fechas[0]);
  const fMax = fmt(fechas[fechas.length - 1]);
  const rangoFechas = fMin === fMax ? fMin : `${fMin} — ${fMax}`;

  const portada = `
    <div class="portada page-break">
      <div style="margin-bottom:32px;">
        <h1>MedpedienteX</h1>
        <div class="clinica-info" style="font-size:12px;margin-top:6px;">
          ${CLINICA_INFO.nombre}<br>
          ${CLINICA_INFO.direccion}<br>
          Tel: ${CLINICA_INFO.telefono} · RFC: ${CLINICA_INFO.rfc}
        </div>
      </div>
      <div class="subtitulo" style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0A2540;margin-bottom:16px;">Reporte General de Expedientes Clínicos</div>
      <div class="noms" style="justify-content:center;margin-bottom:20px;">
        <span class="nom-badge nom-004">NOM-004-SSA3-2012</span>
        <span class="nom-badge nom-024">NOM-024-SSA3-2012</span>
      </div>
      <div class="meta">
        <div style="margin-bottom:4px;">Total de expedientes incluidos: <strong>${pacientesSeleccionados.length}</strong></div>
        <div style="margin-bottom:4px;">Rango de fechas: <strong>${rangoFechas}</strong></div>
        <div style="margin-bottom:4px;">Fecha de generación: <strong>${fechaStr}</strong> · Hora: <strong>${horaStr}</strong></div>
        <div>Generado por: <strong>${usuarioActual.nombre}</strong> · Cédula: ${usuarioActual.cedula}</div>
      </div>
    </div>`;

  const indice = `
    <div class="seccion page-break">
      <h2>Índice de Expedientes</h2>
      <table class="indice-table">
        <thead><tr><th>#</th><th>Folio</th><th>Paciente</th><th>Creación</th><th>Notas</th><th>Recetas</th><th>Consent.</th></tr></thead>
        <tbody>
          ${pacientesSeleccionados.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${p.folio}</strong></td>
              <td>${p.identificacion.nombre}</td>
              <td>${fmt(p.fechaCreacion)}</td>
              <td>${p.notas.length}</td>
              <td>${p.prescripciones.length}</td>
              <td>${p.consentimientos.length}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;

  const resumenes = pacientesSeleccionados.map((p, i) => {
    const id = p.identificacion;
    const ultimaNota = p.notas.length > 0 ? p.notas[p.notas.length - 1] : null;

    let filasBit = [];
    if (p.bitacora.length <= 6) {
      filasBit = p.bitacora.map(b => `<tr><td>${b.fecha}</td><td>${b.usuario}</td><td>${b.accion}</td><td>${b.detalle}</td></tr>`);
    } else {
      const primeras = p.bitacora.slice(0, 3).map(b => `<tr><td>${b.fecha}</td><td>${b.usuario}</td><td>${b.accion}</td><td>${b.detalle}</td></tr>`);
      const omitidas = p.bitacora.length - 6;
      const ultimas = p.bitacora.slice(-3).map(b => `<tr><td>${b.fecha}</td><td>${b.usuario}</td><td>${b.accion}</td><td>${b.detalle}</td></tr>`);
      filasBit = [
        ...primeras,
        `<tr><td colspan="4" class="bitacora-omitida">[... ${omitidas} entradas intermedias omitidas]</td></tr>`,
        ...ultimas,
      ];
    }

    const isLast = i === pacientesSeleccionados.length - 1;
    return `
      <div class="seccion${isLast ? "" : " page-break"}">
        <h2 style="font-size:14px;">${i + 1}. ${id.nombre}</h2>
        <div style="font-size:10px;color:#6b7280;margin-bottom:12px;">Folio: ${p.folio}</div>
        ${id.alergias ? `<div class="alergias" style="font-size:10px;">⚠ ALERGIAS: ${id.alergias}</div>` : ""}
        <div class="grid-3" style="margin-bottom:14px;">
          ${campo("Edad", calcEdad(id.fechaNacimiento))}
          ${campo("Sexo", id.sexo === "M" ? "Masculino" : id.sexo === "F" ? "Femenino" : id.sexo || "—")}
          ${campo("CURP", id.curp)}
          ${campo("Fecha de creación", fmt(p.fechaCreacion))}
          ${campo("Grupo sanguíneo", id.grupoSanguineo)}
          ${campo("Teléfono", id.telefono)}
        </div>
        <div class="grid-3" style="margin-bottom:14px;">
          <div class="stat-box"><div class="stat-num">${p.notas.length}</div><div class="stat-label">Notas SOAP</div></div>
          <div class="stat-box"><div class="stat-num">${p.prescripciones.length}</div><div class="stat-label">Recetas</div></div>
          <div class="stat-box"><div class="stat-num">${p.consentimientos.length}</div><div class="stat-label">Consentimientos</div></div>
        </div>
        <h3 style="margin-bottom:6px;">Última nota SOAP</h3>
        ${ultimaNota ? `
          <div class="nota-card" style="margin-bottom:14px;">
            <div class="nota-header" style="margin-bottom:6px;">
              <span><strong>${ultimaNota.fecha}</strong></span>
              <span>${ultimaNota.autor}</span>
              ${ultimaNota.firmado ? `<span class="firmado">✓ Firmado</span>` : ""}
            </div>
            <div class="soap-bloque"><div class="soap-label">P — Plan</div><div class="soap-val">${nr(ultimaNota.plan)}</div></div>
          </div>` : `<p class="sin-datos" style="margin-bottom:14px;">Sin notas registradas.</p>`}
        <h3 style="margin-bottom:6px;">Bitácora de auditoría</h3>
        <table>
          <thead><tr><th>Fecha / Hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody>${filasBit.join("")}</tbody>
        </table>
        <p style="margin-top:6px;font-size:9px;color:#9ca3af;">NOM-024-SSA3-2012 §5.7</p>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte General — ${CLINICA_INFO.nombre}</title>
  <style>${estilosBase}</style>
</head>
<body>
  ${portada}
  ${indice}
  ${resumenes}
  ${footerHTML(null)}
</body>
</html>`;
}
