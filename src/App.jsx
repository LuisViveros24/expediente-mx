import { useState, useRef } from "react";

// ══════════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES
// ══════════════════════════════════════════════════════════════════
const LIMITE_DEMO = 25;
const CLINICA_INFO = { nombre: "Consultorio Médico Mexpediente", direccion: "Av. Juárez 123, Col. Centro, Torreón, Coahuila", telefono: "871-000-0000", rfc: "CME240101ABC" };
const USUARIOS_MOCK = [
  { id: 1, nombre: "Dr. Jorge Francisco Montoya Sarmiento", rol: "medico", especialidad: "Medicina General", cedula: "12834216", pin: "1234", activo: true },
  { id: 2, nombre: "Enf. Marisol Fuentes", rol: "enfermera", especialidad: "Enfermería", cedula: "5672310", pin: "5678", activo: true },
  { id: 3, nombre: "Recep. Carlos Domínguez", rol: "recepcion", especialidad: "Administración", cedula: "ADM001", pin: "9012", activo: true },
];
const PACIENTES_MOCK = [{
  id: "EXP-2024-001", folio: "EXP-2024-001", fechaCreacion: "2024-01-15",
  identificacion: { nombre: "María Guadalupe Torres Hernández", fechaNacimiento: "1985-03-22", sexo: "F", curp: "TOHM850322MCOTRR09", rfc: "TOHM850322", estadoCivil: "casada", escolaridad: "licenciatura", ocupacion: "Maestra", nacionalidad: "Mexicana", religion: "Católica", lugarNacimiento: "Torreón, Coahuila", domicilio: "Av. Independencia 456, Col. Centro, Torreón, Coah.", telefono: "871-123-4567", telefonoEmergencia: "871-987-6543", contactoEmergencia: "Juan Torres (esposo)", grupoSanguineo: "O+", alergias: "Penicilina, AINES" },
  historiaClinica: { motivoConsulta: "Cefalea persistente y mareo de 3 días", padecimientoActual: "Cefalea holocraneana 7/10 EVA, mareo no rotatorio, fotofobia, náusea sin vómito.", antecedentesHeredoFamiliares: "Madre: HTA, DM2. Padre: IAM a los 60 años.", antecedentesPersonalesPatologicos: "HTA en control con Losartán 50mg. Migraña desde los 25 años.", antecedentesPersonalesNoPatologicos: "Tabaquismo: negado. Alcoholismo: ocasional.", antecedentesGinecoObstetricos: "G2P2A0. FUM: 10/01/2024. DIU.", antecedentesPediatricos: "", exploFisica: { talla: "1.62", peso: "68", imc: "25.9", ta: "145/90", fc: "78", fr: "16", temp: "36.6", sao2: "97", notasExploracion: "Consciente, orientada. Cráneo normocéfalo. Pupilas isocóricas. Sin rigidez de nuca." } },
  notas: [{ id: 1, fecha: "2024-01-15 10:30", autor: "Dr. Jorge Francisco Montoya Sarmiento", cedula: "12834216", tipo: "evolucion", subjetivo: "Mejoría parcial de cefalea.", objetivo: "TA: 142/88 mmHg. FC: 76 lpm.", analisis: "Cefalea tipo migraña con probable componente hipertensivo.", plan: "Ajuste de Losartán a 100mg. Sumatriptán 50mg SOS.", firmado: true }],
  prescripciones: [{ id: 1001, fecha: "15/01/2024", medico: "Dr. Jorge Francisco Montoya Sarmiento", cedula: "12834216", medicamentos: [{ nombre: "Losartán", dosis: "100mg", via: "VO", frecuencia: "c/24h", duracion: "30 días", indicaciones: "Tomar por la mañana con alimentos" }, { nombre: "Sumatriptán", dosis: "50mg", via: "VO", frecuencia: "Al inicio de crisis, repetir c/2h", duracion: "SOS", indicaciones: "No más de 2 tabletas en 24h" }], firmada: true, firmaDigital: null, firmaPaciente: null }],
  consentimientos: [{ id: 2001, fecha: "2024-01-15 10:15", tipo: "consulta_general", texto: "Autorizo la atención médica y el manejo de mis datos conforme a la NOM-004-SSA3-2012 y NOM-024-SSA3-2012. Declaro haber recibido información sobre los procedimientos a realizar, sus beneficios y riesgos. Esta autorización es libre y voluntaria.", firmado: true, testigo: "Enf. Marisol Fuentes", firmaDigital: null, firmaMedico: null }],
  bitacora: [{ fecha: "2024-01-15 10:15", usuario: "Dr. Alejandro Rivas", accion: "CREAR_EXPEDIENTE", detalle: "Expediente creado" }, { fecha: "2024-01-15 10:30", usuario: "Dr. Alejandro Rivas", accion: "AGREGAR_NOTA", detalle: "Nota SOAP #1001" }]
}];

// ══════════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════════
const calcIMC = (peso, talla) => { const p = parseFloat(peso), t = parseFloat(talla); if (!p || !t) return ""; return (p / (t * t)).toFixed(1); };
const generarFolio = () => `EXP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const fechaHoraActual = () => { const n = new Date(); return `${n.toLocaleDateString("es-MX")} ${n.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`; };
const calcEdad = (f) => { if (!f) return "—"; const h = new Date(), n = new Date(f); let e = h.getFullYear() - n.getFullYear(); if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--; return `${e} años`; };
const PLANTILLA = () => ({ id: "", folio: "", fechaCreacion: new Date().toISOString().split("T")[0], identificacion: { nombre: "", fechaNacimiento: "", sexo: "", curp: "", rfc: "", estadoCivil: "", escolaridad: "", ocupacion: "", nacionalidad: "Mexicana", religion: "", lugarNacimiento: "", domicilio: "", telefono: "", telefonoEmergencia: "", contactoEmergencia: "", grupoSanguineo: "", alergias: "" }, historiaClinica: { motivoConsulta: "", padecimientoActual: "", antecedentesHeredoFamiliares: "", antecedentesPersonalesPatologicos: "", antecedentesPersonalesNoPatologicos: "", antecedentesGinecoObstetricos: "", antecedentesPediatricos: "", exploFisica: { talla: "", peso: "", imc: "", ta: "", fc: "", fr: "", temp: "", sao2: "", notasExploracion: "" } }, notas: [], prescripciones: [], consentimientos: [], bitacora: [] });

// ══════════════════════════════════════════════════════════════════
// UI PRIMITIVOS
// ══════════════════════════════════════════════════════════════════
const Badge = ({ label, color = "blue" }) => {
  const c = { blue: "bg-sky-900/60 text-sky-300 border-sky-700", green: "bg-emerald-900/60 text-emerald-300 border-emerald-700", amber: "bg-amber-900/60 text-amber-300 border-amber-700", red: "bg-red-900/60 text-red-300 border-red-700", slate: "bg-slate-700/60 text-slate-300 border-slate-600" };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wider uppercase ${c[color]}`}>{label}</span>;
};

const Campo = ({ label, value, onChange, type = "text", required, options, rows, readOnly, placeholder, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} disabled={readOnly} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500">
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : rows ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} readOnly={readOnly} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 resize-none" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500" />
    )}
  </div>
);

const Seccion = ({ titulo, icono, children, colapsable = false }) => {
  const [abierto, setAbierto] = useState(true);
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-4">
      <div className={`flex items-center justify-between px-4 py-3 bg-slate-800/80 ${colapsable ? "cursor-pointer select-none" : ""}`} onClick={() => colapsable && setAbierto(!abierto)}>
        <div className="flex items-center gap-2"><span className="text-sky-400">{icono}</span><span className="text-sm font-bold text-slate-100">{titulo}</span></div>
        {colapsable && <span className="text-slate-400 text-xs">{abierto ? "▲" : "▼"}</span>}
      </div>
      {abierto && <div className="p-4 bg-slate-900/40">{children}</div>}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// PAD DE FIRMA DIGITAL (CANVAS)
// ══════════════════════════════════════════════════════════════════
const PadFirma = ({ titulo, onFirmar, onCancelar }) => {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const [tieneFirma, setTieneFirma] = useState(false);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const iniciar = e => { e.preventDefault(); const c = canvasRef.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y); dibujando.current = true; setTieneFirma(true); };
  const dibujar = e => { e.preventDefault(); if (!dibujando.current) return; const c = canvasRef.current, ctx = c.getContext("2d"), p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#1e3a8a"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); };
  const terminar = e => { e?.preventDefault(); dibujando.current = false; };
  const limpiar = () => { canvasRef.current.getContext("2d").clearRect(0, 0, 480, 180); setTieneFirma(false); };
  const confirmar = () => { if (tieneFirma) onFirmar(canvasRef.current.toDataURL("image/png")); };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div><h3 className="font-bold text-gray-900 text-sm">{titulo}</h3><p className="text-xs text-gray-400 mt-0.5">Firme con el dedo o el ratón</p></div>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-4">
          <div className="border-2 border-dashed border-blue-300 rounded-xl overflow-hidden bg-blue-50/20 relative" style={{ touchAction: "none" }}>
            <canvas ref={canvasRef} width={480} height={180} className="w-full block cursor-crosshair"
              onMouseDown={iniciar} onMouseMove={dibujar} onMouseUp={terminar} onMouseLeave={terminar}
              onTouchStart={iniciar} onTouchMove={dibujar} onTouchEnd={terminar} />
            {!tieneFirma && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><p className="text-blue-300 text-sm font-medium select-none">✍️ Firme aquí</p></div>}
          </div>
          <div className="border-t border-gray-300 mx-2 mt-1" />
          <p className="text-[10px] text-gray-400 text-center mt-0.5">Línea de firma</p>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={limpiar} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">Limpiar</button>
          <button onClick={confirmar} disabled={!tieneFirma} className="flex-1 bg-blue-800 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm">Confirmar firma</button>
        </div>
        <p className="text-[10px] text-gray-400 text-center pb-3">Firma electrónica simple · NOM-024-SSA3-2012 §5.6</p>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MODAL DE IMPRESIÓN DE RECETA
// ══════════════════════════════════════════════════════════════════
const ModalImpresionReceta = ({ receta, paciente, onCerrar }) => {
  const printId = `receta-${receta.id}`;

  const imprimir = () => {
    const contenido = document.getElementById(printId).innerHTML;
    const ventana = window.open("", "_blank", "width=800,height=600");
    ventana.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receta ${receta.id}</title><style>
      body { font-family: Georgia, serif; color: #111; margin: 0; padding: 20px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 20px; }
      .clinica-nombre { font-size: 18px; font-weight: 900; color: #1e3a8a; }
      .clinica-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
      .folio { text-align: right; }
      .folio p { font-size: 11px; color: #6b7280; margin: 0; }
      .folio .num { font-family: monospace; font-size: 14px; font-weight: bold; color: #1e3a8a; }
      .medico-box { background: #eff6ff; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }
      .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; }
      .medico-nombre { font-size: 14px; font-weight: 700; color: #1e3a8a; }
      .medico-cedula { font-size: 11px; color: #6b7280; }
      .paciente-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      .campo-val { font-size: 13px; font-weight: 600; }
      .alergia { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 10px; margin-top: 8px; font-size: 11px; font-weight: 700; color: #b91c1c; }
      .rx-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      .rx-symbol { font-size: 36px; font-weight: 900; color: #1e3a8a; line-height: 1; }
      .rx-line { flex: 1; height: 1px; background: #bfdbfe; }
      .medicamento { border-left: 4px solid #1e3a8a; padding: 4px 0 4px 14px; margin-bottom: 16px; }
      .med-nombre { font-size: 15px; font-weight: 900; color: #1e3a8a; }
      .med-datos { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; font-size: 12px; color: #374151; }
      .med-indica { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 4px; }
      .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      .firma-box { text-align: center; }
      .firma-img { height: 52px; display: block; margin: 0 auto; }
      .firma-linea { height: 52px; border-bottom: 1px solid #9ca3af; }
      .firma-nombre { font-size: 10px; color: #6b7280; margin-top: 4px; }
      .firma-titulo { font-size: 9px; color: #9ca3af; }
      .pie { margin-top: 24px; padding-top: 12px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 9px; color: #9ca3af; }
    </style></head><body>${contenido}</body></html>`);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 overflow-hidden">
        {/* Barra de controles */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-bold">Vista previa · Receta #{receta.id}</span>
            {receta.firmaDigital && <Badge label="✍️ Médico" color="blue" />}
            {receta.firmaPaciente && <Badge label="✍️ Paciente" color="amber" />}
          </div>
          <div className="flex gap-2">
            <button onClick={imprimir} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">🖨️ Imprimir / Guardar PDF</button>
            <button onClick={onCerrar} className="text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-xs">Cerrar</button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div id={printId} className="p-8 bg-white text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
          {/* Encabezado */}
          <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1e3a8a", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <div className="clinica-nombre" style={{ fontSize: "18px", fontWeight: 900, color: "#1e3a8a" }}>{CLINICA_INFO.nombre}</div>
              <div className="clinica-sub" style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{CLINICA_INFO.direccion}</div>
              <div className="clinica-sub" style={{ fontSize: "11px", color: "#6b7280" }}>Tel: {CLINICA_INFO.telefono} · RFC: {CLINICA_INFO.rfc}</div>
            </div>
            <div className="folio" style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>Folio de receta</p>
              <p className="num" style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#1e3a8a", margin: 0 }}>RX-{receta.id}</p>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{receta.fecha}</p>
            </div>
          </div>

          {/* Médico */}
          <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 2px" }}>Médico responsable</p>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", margin: 0 }}>{receta.medico}</p>
            <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>Cédula Profesional: {receta.cedula}</p>
          </div>

          {/* Paciente */}
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 6px" }}>Paciente</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              <div><p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Nombre completo</p><p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{paciente.identificacion.nombre}</p></div>
              <div><p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Edad</p><p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{calcEdad(paciente.identificacion.fechaNacimiento)}</p></div>
              <div><p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Folio expediente</p><p style={{ fontSize: "13px", fontWeight: 600, fontFamily: "monospace", margin: 0 }}>{paciente.folio}</p></div>
            </div>
            {paciente.identificacion.alergias && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "6px 10px", marginTop: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#b91c1c", margin: 0 }}>⚠️ ALERGIAS: {paciente.identificacion.alergias}</p>
              </div>
            )}
          </div>

          {/* Rx */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#1e3a8a", lineHeight: 1 }}>℞</span>
            <div style={{ flex: 1, height: "1px", background: "#bfdbfe" }} />
          </div>
          {receta.medicamentos.map((m, i) => (
            <div key={i} style={{ borderLeft: "4px solid #1e3a8a", paddingLeft: "14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "15px", fontWeight: 900, color: "#1e3a8a", margin: "0 0 4px" }}>{i + 1}. {m.nombre}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#374151" }}>
                <span><b>Dosis:</b> {m.dosis}</span>
                <span><b>Vía:</b> {m.via}</span>
                <span><b>Frecuencia:</b> {m.frecuencia}</span>
                <span><b>Duración:</b> {m.duracion}</span>
              </div>
              {m.indicaciones && <p style={{ fontSize: "11px", color: "#6b7280", fontStyle: "italic", margin: "4px 0 0" }}>Indicaciones: {m.indicaciones}</p>}
            </div>
          ))}

          {/* Firmas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ textAlign: "center" }}>
              {receta.firmaDigital ? <img src={receta.firmaDigital} alt="Firma médico" style={{ height: "52px", display: "block", margin: "0 auto" }} /> : <div style={{ height: "52px", borderBottom: "1px solid #9ca3af" }} />}
              <p style={{ fontSize: "10px", color: "#6b7280", margin: "4px 0 0" }}>{receta.medico}</p>
              <p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Médico responsable · Cédula: {receta.cedula}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              {receta.firmaPaciente ? <img src={receta.firmaPaciente} alt="Firma paciente" style={{ height: "52px", display: "block", margin: "0 auto" }} /> : <div style={{ height: "52px", borderBottom: "1px solid #9ca3af" }} />}
              <p style={{ fontSize: "10px", color: "#6b7280", margin: "4px 0 0" }}>{paciente.identificacion.nombre}</p>
              <p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Paciente / Representante legal</p>
            </div>
          </div>

          {/* Pie */}
          <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
            <p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Documento generado por Mexpediente · NOM-004-SSA3-2012 §8.7 · NOM-024-SSA3-2012</p>
            <p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Válido únicamente con firma del médico responsable</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: LOGIN
// ══════════════════════════════════════════════════════════════════
const Login = ({ onLogin }) => {
  const [cedula, setCedula] = useState(""); const [pin, setPin] = useState(""); const [error, setError] = useState(""); const [intentos, setIntentos] = useState(0);
  const handleLogin = () => {
    if (intentos >= 3) { setError("Cuenta bloqueada. Contacte al administrador."); return; }
    const u = USUARIOS_MOCK.find(u => u.cedula === cedula && u.pin === pin && u.activo);
    if (u) { onLogin(u); } else { setIntentos(i => i + 1); setError(`Credenciales incorrectas. Intento ${intentos + 1}/3.`); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 30% 20%, #0c1a2e 0%, #050a14 60%)" }}>
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 mb-4">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Georgia, serif" }}>Mexpediente</h1>
          <p className="text-slate-400 text-xs mt-1 tracking-widest uppercase">Sistema de Gestión de Historial Clínico</p>
          <div className="flex justify-center gap-2 mt-2"><Badge label="NOM-004-SSA3" color="blue" /><Badge label="NOM-024-SSA3" color="green" /></div>
          <div className="mt-2 inline-block bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-1"><p className="text-[10px] text-amber-300">🔬 Versión Demo · Máximo {LIMITE_DEMO} expedientes</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <Campo label="Cédula Profesional / ID" value={cedula} onChange={setCedula} placeholder="3891045" required />
            <Campo label="PIN de acceso" type="password" value={pin} onChange={setPin} placeholder="••••" required />
            {error && <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300">{error}</div>}
            <button onClick={handleLogin} disabled={intentos >= 3} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl text-sm">Iniciar sesión</button>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4 pt-4 border-t border-slate-800">Demo: Cédula <span className="text-slate-400">3891045</span> · PIN <span className="text-slate-400">1234</span></p>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: REGISTRO PACIENTE
// ══════════════════════════════════════════════════════════════════
const RegistroPaciente = ({ paciente, onChange, soloLectura }) => {
  const id = paciente.identificacion;
  const set = (c, v) => onChange({ ...paciente, identificacion: { ...id, [c]: v } });
  return (
    <div>
      <Seccion titulo="Identificación del Paciente (NOM-004 §8.1)" icono="👤">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo label="Nombre completo" value={id.nombre} onChange={v => set("nombre", v)} required readOnly={soloLectura} className="sm:col-span-2" />
          <Campo label="Fecha de nacimiento" type="date" value={id.fechaNacimiento} onChange={v => set("fechaNacimiento", v)} required readOnly={soloLectura} />
          <Campo label="Sexo" value={id.sexo} onChange={v => set("sexo", v)} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }, { value: "I", label: "Indeterminado" }]} required readOnly={soloLectura} />
          <Campo label="CURP" value={id.curp} onChange={v => set("curp", v.toUpperCase())} placeholder="XXXX000000XXXXXX00" readOnly={soloLectura} />
          <Campo label="RFC" value={id.rfc} onChange={v => set("rfc", v.toUpperCase())} readOnly={soloLectura} />
          <Campo label="Estado civil" value={id.estadoCivil} onChange={v => set("estadoCivil", v)} options={[{ value: "soltero", label: "Soltero/a" }, { value: "casado", label: "Casado/a" }, { value: "divorciado", label: "Divorciado/a" }, { value: "viudo", label: "Viudo/a" }, { value: "union_libre", label: "Unión libre" }]} readOnly={soloLectura} />
          <Campo label="Escolaridad" value={id.escolaridad} onChange={v => set("escolaridad", v)} options={[{ value: "ninguna", label: "Ninguna" }, { value: "primaria", label: "Primaria" }, { value: "secundaria", label: "Secundaria" }, { value: "preparatoria", label: "Preparatoria" }, { value: "tecnico", label: "Técnico" }, { value: "licenciatura", label: "Licenciatura" }, { value: "posgrado", label: "Posgrado" }]} readOnly={soloLectura} />
          <Campo label="Ocupación" value={id.ocupacion} onChange={v => set("ocupacion", v)} readOnly={soloLectura} />
          <Campo label="Grupo sanguíneo" value={id.grupoSanguineo} onChange={v => set("grupoSanguineo", v)} options={[{ value: "A+", label: "A+" }, { value: "A-", label: "A-" }, { value: "B+", label: "B+" }, { value: "B-", label: "B-" }, { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" }, { value: "O+", label: "O+" }, { value: "O-", label: "O-" }]} readOnly={soloLectura} />
          <Campo label="Domicilio completo" value={id.domicilio} onChange={v => set("domicilio", v)} required readOnly={soloLectura} className="sm:col-span-2" />
          <Campo label="Teléfono" type="tel" value={id.telefono} onChange={v => set("telefono", v)} readOnly={soloLectura} />
          <Campo label="Contacto de emergencia" value={id.contactoEmergencia} onChange={v => set("contactoEmergencia", v)} readOnly={soloLectura} />
          <Campo label="Teléfono de emergencia" type="tel" value={id.telefonoEmergencia} onChange={v => set("telefonoEmergencia", v)} readOnly={soloLectura} />
          <Campo label="Alergias conocidas" value={id.alergias} onChange={v => set("alergias", v)} placeholder="Ej: Penicilina, AINES · o 'Niega alergias'" readOnly={soloLectura} className="sm:col-span-2" />
        </div>
      </Seccion>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: HISTORIA CLÍNICA
// ══════════════════════════════════════════════════════════════════
const HistoriaClinica = ({ paciente, onChange, soloLectura }) => {
  const hc = paciente.historiaClinica;
  const set = (c, v) => onChange({ ...paciente, historiaClinica: { ...hc, [c]: v } });
  const setF = (c, v) => { const ef = { ...hc.exploFisica, [c]: v }; if (c === "peso" || c === "talla") ef.imc = calcIMC(c === "peso" ? v : ef.peso, c === "talla" ? v : ef.talla); onChange({ ...paciente, historiaClinica: { ...hc, exploFisica: ef } }); };
  return (
    <div>
      <Seccion titulo="Motivo de Consulta (NOM-004 §8.2.1)" icono="📋"><Campo label="Motivo principal" value={hc.motivoConsulta} onChange={v => set("motivoConsulta", v)} rows={2} required readOnly={soloLectura} /></Seccion>
      <Seccion titulo="Padecimiento Actual (NOM-004 §8.2.2)" icono="🔍"><Campo label="Descripción detallada" value={hc.padecimientoActual} onChange={v => set("padecimientoActual", v)} rows={4} readOnly={soloLectura} /></Seccion>
      <Seccion titulo="Antecedentes (NOM-004 §8.2.3–8.2.7)" icono="📖" colapsable>
        <div className="flex flex-col gap-3">
          <Campo label="Heredo-familiares" value={hc.antecedentesHeredoFamiliares} onChange={v => set("antecedentesHeredoFamiliares", v)} rows={2} readOnly={soloLectura} />
          <Campo label="Personales patológicos" value={hc.antecedentesPersonalesPatologicos} onChange={v => set("antecedentesPersonalesPatologicos", v)} rows={2} readOnly={soloLectura} />
          <Campo label="Personales no patológicos" value={hc.antecedentesPersonalesNoPatologicos} onChange={v => set("antecedentesPersonalesNoPatologicos", v)} rows={2} readOnly={soloLectura} />
          <Campo label="Gineco-obstétricos (si aplica)" value={hc.antecedentesGinecoObstetricos} onChange={v => set("antecedentesGinecoObstetricos", v)} rows={2} readOnly={soloLectura} />
        </div>
      </Seccion>
      <Seccion titulo="Exploración Física (NOM-004 §8.3)" icono="🩺">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <Campo label="Talla (m)" value={hc.exploFisica.talla} onChange={v => setF("talla", v)} placeholder="1.65" readOnly={soloLectura} />
          <Campo label="Peso (kg)" value={hc.exploFisica.peso} onChange={v => setF("peso", v)} placeholder="70" readOnly={soloLectura} />
          <Campo label="IMC (auto)" value={hc.exploFisica.imc} onChange={() => {}} readOnly placeholder="Auto" />
          <Campo label="T/A (mmHg)" value={hc.exploFisica.ta} onChange={v => setF("ta", v)} placeholder="120/80" readOnly={soloLectura} />
          <Campo label="FC (lpm)" value={hc.exploFisica.fc} onChange={v => setF("fc", v)} placeholder="72" readOnly={soloLectura} />
          <Campo label="FR (rpm)" value={hc.exploFisica.fr} onChange={v => setF("fr", v)} placeholder="16" readOnly={soloLectura} />
          <Campo label="Temp (°C)" value={hc.exploFisica.temp} onChange={v => setF("temp", v)} placeholder="36.5" readOnly={soloLectura} />
          <Campo label="SpO₂ (%)" value={hc.exploFisica.sao2} onChange={v => setF("sao2", v)} placeholder="98" readOnly={soloLectura} />
        </div>
        <Campo label="Hallazgos por aparatos y sistemas" value={hc.exploFisica.notasExploracion} onChange={v => setF("notasExploracion", v)} rows={3} readOnly={soloLectura} />
      </Seccion>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: NOTAS SOAP
// ══════════════════════════════════════════════════════════════════
const NotasEvolucion = ({ paciente, onChange, usuarioActual }) => {
  const [modal, setModal] = useState(false);
  const [nota, setNota] = useState({ subjetivo: "", objetivo: "", analisis: "", plan: "" });
  const agregar = () => {
    const n = { id: Date.now(), fecha: fechaHoraActual(), autor: usuarioActual.nombre, cedula: usuarioActual.cedula, tipo: "evolucion", ...nota, firmado: true };
    onChange({ ...paciente, notas: [...paciente.notas, n], bitacora: [...paciente.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "AGREGAR_NOTA", detalle: `Nota SOAP #${n.id}` }] });
    setNota({ subjetivo: "", objetivo: "", analisis: "", plan: "" }); setModal(false);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300">Notas de Evolución SOAP (NOM-004 §8.5)</h3>
        {usuarioActual.rol === "medico" && <button onClick={() => setModal(true)} className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2 rounded-lg">+ Nueva nota</button>}
      </div>
      {paciente.notas.length === 0 && <div className="text-center py-10 text-slate-600 text-sm">Sin notas registradas.</div>}
      <div className="flex flex-col gap-3">
        {paciente.notas.map(n => (
          <div key={n.id} className="border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap"><span className="text-xs font-semibold text-sky-400">{n.fecha}</span><span className="text-xs text-slate-300 font-medium">{n.autor}</span><span className="text-[10px] text-slate-500">Céd: {n.cedula}</span></div>
              {n.firmado && <Badge label="✓ Firmado" color="green" />}
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[["Subjetivo (S)", n.subjetivo], ["Objetivo (O)", n.objetivo], ["Análisis (A)", n.analisis], ["Plan (P)", n.plan]].map(([lbl, val]) => (
                <div key={lbl}><p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{lbl}</p><p className="text-sm text-slate-200">{val || <span className="italic text-slate-600">—</span>}</p></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700"><h3 className="font-bold text-white">Nueva Nota SOAP</h3><button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button></div>
            <div className="p-5 flex flex-col gap-3">
              <div className="bg-sky-900/20 border border-sky-800/40 rounded-lg px-3 py-2 text-xs text-sky-300">Médico: <strong>{usuarioActual.nombre}</strong> · Cédula: {usuarioActual.cedula}</div>
              <Campo label="S — Subjetivo" value={nota.subjetivo} onChange={v => setNota({ ...nota, subjetivo: v })} rows={3} required />
              <Campo label="O — Objetivo" value={nota.objetivo} onChange={v => setNota({ ...nota, objetivo: v })} rows={3} required />
              <Campo label="A — Análisis / Diagnóstico" value={nota.analisis} onChange={v => setNota({ ...nota, analisis: v })} rows={2} required />
              <Campo label="P — Plan" value={nota.plan} onChange={v => setNota({ ...nota, plan: v })} rows={3} required />
              <div className="flex gap-2 pt-2">
                <button onClick={agregar} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm">Firmar y guardar</button>
                <button onClick={() => setModal(false)} className="px-4 bg-slate-800 text-slate-300 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: PRESCRIPCIONES (firma digital + impresión)
// ══════════════════════════════════════════════════════════════════
const Prescripciones = ({ paciente, onChange, usuarioActual }) => {
  const [modal, setModal] = useState(false);
  const [meds, setMeds] = useState([{ nombre: "", dosis: "", via: "", frecuencia: "", duracion: "", indicaciones: "" }]);
  const [imprimiendo, setImprimiendo] = useState(null);
  const [firmandoPad, setFirmandoPad] = useState(null); // { recetaId, tipo }

  const addMed = () => setMeds([...meds, { nombre: "", dosis: "", via: "", frecuencia: "", duracion: "", indicaciones: "" }]);
  const setMed = (i, c, v) => { const m = [...meds]; m[i][c] = v; setMeds(m); };

  const guardar = () => {
    const rx = { id: Date.now(), fecha: new Date().toLocaleDateString("es-MX"), medico: usuarioActual.nombre, cedula: usuarioActual.cedula, medicamentos: meds, firmada: true, firmaDigital: null, firmaPaciente: null };
    onChange({ ...paciente, prescripciones: [...paciente.prescripciones, rx], bitacora: [...paciente.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "AGREGAR_RECETA", detalle: `Receta #${rx.id}` }] });
    setMeds([{ nombre: "", dosis: "", via: "", frecuencia: "", duracion: "", indicaciones: "" }]); setModal(false);
  };

  const aplicarFirma = (dataUrl) => {
    const { recetaId, tipo } = firmandoPad;
    const campo = tipo === "medico" ? "firmaDigital" : "firmaPaciente";
    const nuevas = paciente.prescripciones.map(r => r.id === recetaId ? { ...r, [campo]: dataUrl } : r);
    onChange({ ...paciente, prescripciones: nuevas, bitacora: [...paciente.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "FIRMA_DIGITAL", detalle: `Receta #${recetaId} · ${tipo}` }] });
    setFirmandoPad(null);
  };

  const recetaImprimir = imprimiendo ? paciente.prescripciones.find(r => r.id === imprimiendo) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300">Hoja de Indicaciones / Recetas (NOM-004 §8.7)</h3>
        {usuarioActual.rol === "medico" && <button onClick={() => setModal(true)} className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg">+ Nueva receta</button>}
      </div>
      {paciente.prescripciones.length === 0 && <div className="text-center py-10 text-slate-600 text-sm">Sin prescripciones registradas.</div>}

      {paciente.prescripciones.map(rx => (
        <div key={rx.id} className="border border-slate-700 rounded-xl overflow-hidden mb-3">
          {/* Header receta */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-emerald-400">{rx.fecha}</span>
              <span className="text-xs text-slate-300 font-medium">{rx.medico}</span>
              <span className="text-[10px] text-slate-500">Céd: {rx.cedula}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {rx.firmada && <Badge label="✓ Firmada" color="green" />}
              {rx.firmaDigital && <Badge label="✍️ Médico" color="blue" />}
              {rx.firmaPaciente && <Badge label="✍️ Paciente" color="amber" />}
              {!rx.firmaDigital && usuarioActual.rol === "medico" && (
                <button onClick={() => setFirmandoPad({ recetaId: rx.id, tipo: "medico" })} className="text-[10px] bg-blue-900/50 hover:bg-blue-800/70 border border-blue-700 text-blue-300 px-2 py-0.5 rounded font-semibold">✍️ Firma médico</button>
              )}
              {!rx.firmaPaciente && (
                <button onClick={() => setFirmandoPad({ recetaId: rx.id, tipo: "paciente" })} className="text-[10px] bg-amber-900/50 hover:bg-amber-800/70 border border-amber-700 text-amber-300 px-2 py-0.5 rounded font-semibold">✍️ Firma paciente</button>
              )}
              <button onClick={() => setImprimiendo(rx.id)} className="text-[10px] bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 px-2 py-0.5 rounded font-semibold">🖨️ Imprimir</button>
            </div>
          </div>
          {/* Medicamentos */}
          <div className="p-4 flex flex-col gap-2">
            {rx.medicamentos.map((m, i) => (
              <div key={i} className="bg-slate-800/40 rounded-lg p-3 flex flex-wrap gap-3">
                <div className="min-w-[120px]"><p className="text-[10px] text-slate-500 uppercase">Medicamento</p><p className="text-sm text-white font-semibold">{m.nombre}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Dosis</p><p className="text-sm text-slate-200">{m.dosis}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Vía</p><p className="text-sm text-slate-200">{m.via}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Frecuencia</p><p className="text-sm text-slate-200">{m.frecuencia}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Duración</p><p className="text-sm text-slate-200">{m.duracion}</p></div>
                {m.indicaciones && <div className="w-full"><p className="text-[10px] text-slate-500 uppercase">Indicaciones</p><p className="text-xs text-slate-400 italic">{m.indicaciones}</p></div>}
              </div>
            ))}
            {/* Miniaturas firmas */}
            {(rx.firmaDigital || rx.firmaPaciente) && (
              <div className="flex gap-6 pt-2 mt-1 border-t border-slate-800">
                {rx.firmaDigital && <div><p className="text-[9px] text-slate-500 uppercase mb-1">Firma médico</p><img src={rx.firmaDigital} alt="firma médico" className="h-8 bg-white/5 rounded border border-slate-700 px-1" /></div>}
                {rx.firmaPaciente && <div><p className="text-[9px] text-slate-500 uppercase mb-1">Firma paciente</p><img src={rx.firmaPaciente} alt="firma paciente" className="h-8 bg-white/5 rounded border border-slate-700 px-1" /></div>}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Modal nueva receta */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700"><h3 className="font-bold text-white">Nueva Prescripción</h3><button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button></div>
            <div className="p-5 flex flex-col gap-4">
              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-3 py-2 text-xs text-emerald-300">NOM-004 §8.7 · Médico: <strong>{usuarioActual.nombre}</strong> · Cédula: {usuarioActual.cedula}</div>
              {meds.map((m, i) => (
                <div key={i} className="border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300">Medicamento {i + 1}</span>
                    {meds.length > 1 && <button onClick={() => setMeds(meds.filter((_, x) => x !== i))} className="text-red-400 text-xs">✕ Eliminar</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Nombre (DCI)" value={m.nombre} onChange={v => setMed(i, "nombre", v)} required className="col-span-2" />
                    <Campo label="Dosis" value={m.dosis} onChange={v => setMed(i, "dosis", v)} placeholder="500mg" />
                    <Campo label="Vía" value={m.via} onChange={v => setMed(i, "via", v)} options={[{ value: "VO", label: "Oral (VO)" }, { value: "IV", label: "IV" }, { value: "IM", label: "IM" }, { value: "SC", label: "SC" }, { value: "SL", label: "Sublingual" }, { value: "TOP", label: "Tópico" }, { value: "INH", label: "Inhalado" }]} />
                    <Campo label="Frecuencia" value={m.frecuencia} onChange={v => setMed(i, "frecuencia", v)} placeholder="c/8h" />
                    <Campo label="Duración" value={m.duracion} onChange={v => setMed(i, "duracion", v)} placeholder="7 días / SOS" />
                    <Campo label="Indicaciones" value={m.indicaciones} onChange={v => setMed(i, "indicaciones", v)} className="col-span-2" />
                  </div>
                </div>
              ))}
              <button onClick={addMed} className="text-xs text-sky-400 hover:text-sky-300 self-start">+ Agregar medicamento</button>
              <div className="flex gap-2 pt-2">
                <button onClick={guardar} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm">Guardar receta</button>
                <button onClick={() => setModal(false)} className="px-4 bg-slate-800 text-slate-300 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {firmandoPad && (
        <PadFirma
          titulo={firmandoPad.tipo === "medico" ? `Firma del médico · ${usuarioActual.nombre}` : `Firma del paciente · ${paciente.identificacion.nombre}`}
          onFirmar={aplicarFirma}
          onCancelar={() => setFirmandoPad(null)}
        />
      )}

      {recetaImprimir && <ModalImpresionReceta receta={recetaImprimir} paciente={paciente} onCerrar={() => setImprimiendo(null)} />}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: CONSENTIMIENTO INFORMADO (firma digital)
// ══════════════════════════════════════════════════════════════════
const TIPOS_C = [
  { value: "consulta_general", label: "Consulta y atención médica general" },
  { value: "procedimiento_menor", label: "Procedimiento médico menor" },
  { value: "cirugia", label: "Intervención quirúrgica" },
  { value: "anestesia", label: "Anestesia" },
  { value: "transfusion", label: "Transfusión sanguínea" },
];
const TEXTOS_C = {
  consulta_general: "Yo, el paciente identificado en el presente expediente, autorizo al personal médico y paramédico de esta unidad para que, bajo su criterio profesional, me otorguen atención médica, incluyendo el examen físico, toma de muestras para análisis clínicos y/o estudios de gabinete necesarios para el diagnóstico y tratamiento de mi padecimiento.\n\nDeclaro haber recibido información sobre los procedimientos a realizar, sus beneficios, riesgos y alternativas disponibles. Consiento el tratamiento de mis datos clínicos conforme a la NOM-004-SSA3-2012 y NOM-024-SSA3-2012. Esta autorización es libre y voluntaria, pudiendo ser revocada en cualquier momento.",
  procedimiento_menor: "Autorizo la realización del procedimiento médico menor indicado, habiendo sido informado(a) de los riesgos, beneficios y alternativas existentes. Declaro que la presente autorización es otorgada de forma libre, voluntaria y sin coacción alguna. Conforme a NOM-004-SSA3-2012 §8.8 y NOM-024-SSA3-2012.",
  cirugia: "Autorizo la intervención quirúrgica descrita en el plan terapéutico, habiendo sido informado(a) de los riesgos intraoperatorios, postoperatorios, posibles complicaciones y alternativas de tratamiento no quirúrgico. Comprendo la naturaleza del procedimiento y sus implicaciones. NOM-004-SSA3-2012 §8.8.",
  anestesia: "Autorizo la administración de anestesia por el especialista indicado, habiendo sido informado(a) de sus tipos, riesgos y alternativas, así como de las condiciones de seguridad bajo las cuales se aplicará. Conforme a NOM-004-SSA3-2012 §8.8.",
  transfusion: "Autorizo la transfusión de hemoderivados según criterio médico, habiendo sido informado(a) de las indicaciones médicas, los riesgos asociados, la verificación de compatibilidad y las alternativas disponibles. NOM-004-SSA3-2012 §8.8.",
};

const Consentimiento = ({ paciente, onChange, usuarioActual }) => {
  const [modal, setModal] = useState(false);
  const [tipo, setTipo] = useState("consulta_general");
  const [testigo, setTestigo] = useState("");
  const [firmandoPad, setFirmandoPad] = useState(null);

  const crear = () => {
    const c = { id: Date.now(), fecha: fechaHoraActual(), tipo, texto: TEXTOS_C[tipo] || TEXTOS_C.consulta_general, firmado: false, testigo, firmaDigital: null, firmaMedico: null };
    onChange({ ...paciente, consentimientos: [...paciente.consentimientos, c], bitacora: [...paciente.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "CONSENTIMIENTO_CREADO", detalle: tipo }] });
    setTestigo(""); setModal(false);
  };

  const aplicarFirma = (dataUrl, id, firmante) => {
    const campo = firmante === "paciente" ? "firmaDigital" : "firmaMedico";
    const nuevos = paciente.consentimientos.map(c => {
      if (c.id !== id) return c;
      const upd = { ...c, [campo]: dataUrl };
      if (upd.firmaDigital) upd.firmado = true;
      return upd;
    });
    onChange({ ...paciente, consentimientos: nuevos, bitacora: [...paciente.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "CONSENTIMIENTO_FIRMADO", detalle: `#${id} · ${firmante}` }] });
    setFirmandoPad(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300">Consentimiento Informado (NOM-004 §8.8)</h3>
        <button onClick={() => setModal(true)} className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg">+ Nuevo consentimiento</button>
      </div>
      {paciente.consentimientos.length === 0 && <div className="text-center py-10 text-slate-600 text-sm">Sin consentimientos registrados.</div>}

      {paciente.consentimientos.map(c => (
        <div key={c.id} className="border border-slate-700 rounded-xl overflow-hidden mb-3">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-amber-400">{c.fecha}</span>
              <span className="text-xs text-slate-300">{TIPOS_C.find(t => t.value === c.tipo)?.label}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {c.firmado ? <Badge label="✓ Firmado" color="amber" /> : <Badge label="Pendiente firma" color="red" />}
              {c.firmaMedico && <Badge label="✍️ Médico" color="blue" />}
              {!c.firmaMedico && usuarioActual.rol === "medico" && (
                <button onClick={() => setFirmandoPad({ id: c.id, firmante: "medico" })} className="text-[10px] bg-blue-900/50 hover:bg-blue-800/70 border border-blue-700 text-blue-300 px-2 py-0.5 rounded font-semibold">✍️ Firma médico</button>
              )}
              {!c.firmaDigital && (
                <button onClick={() => setFirmandoPad({ id: c.id, firmante: "paciente" })} className="text-[10px] bg-amber-900/50 hover:bg-amber-800/70 border border-amber-700 text-amber-300 px-2 py-0.5 rounded font-semibold">✍️ Firma paciente</button>
              )}
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line mb-3">{c.texto}</p>
            {c.testigo && <p className="text-xs text-slate-500">Testigo: <span className="text-slate-300">{c.testigo}</span></p>}
            {(c.firmaDigital || c.firmaMedico) && (
              <div className="flex gap-6 mt-3 pt-3 border-t border-slate-800">
                {c.firmaDigital && <div><p className="text-[9px] text-slate-500 uppercase mb-1">Firma del paciente</p><img src={c.firmaDigital} alt="firma paciente" className="h-10 bg-white/5 rounded border border-amber-800/40 px-1" /></div>}
                {c.firmaMedico && <div><p className="text-[9px] text-slate-500 uppercase mb-1">Firma del médico</p><img src={c.firmaMedico} alt="firma médico" className="h-10 bg-white/5 rounded border border-blue-800/40 px-1" /></div>}
              </div>
            )}
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700"><h3 className="font-bold text-white">Nuevo Consentimiento Informado</h3><button onClick={() => setModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button></div>
            <div className="p-5 flex flex-col gap-4">
              <Campo label="Tipo de consentimiento" value={tipo} onChange={setTipo} options={TIPOS_C} />
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-2">Texto del consentimiento</p>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">{TEXTOS_C[tipo] || TEXTOS_C.consulta_general}</div>
              </div>
              <Campo label="Nombre del testigo (opcional)" value={testigo} onChange={setTestigo} placeholder="Nombre completo del testigo" />
              <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-300">Al crear el documento, aparecerán los botones para capturar la firma digital del paciente y del médico. NOM-004 §8.8 · NOM-024-SSA3-2012.</div>
              <div className="flex gap-2">
                <button onClick={crear} className="flex-1 bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm">Crear consentimiento</button>
                <button onClick={() => setModal(false)} className="px-4 bg-slate-800 text-slate-300 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {firmandoPad && (
        <PadFirma
          titulo={firmandoPad.firmante === "paciente" ? `Firma del paciente · ${paciente.identificacion.nombre}` : `Firma del médico · ${usuarioActual.nombre}`}
          onFirmar={d => aplicarFirma(d, firmandoPad.id, firmandoPad.firmante)}
          onCancelar={() => setFirmandoPad(null)}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: BITÁCORA
// ══════════════════════════════════════════════════════════════════
const Bitacora = ({ paciente }) => {
  const col = { CREAR_EXPEDIENTE: "green", AGREGAR_NOTA: "blue", AGREGAR_RECETA: "green", CONSENTIMIENTO_CREADO: "amber", CONSENTIMIENTO_FIRMADO: "amber", FIRMA_DIGITAL: "blue", MODIFICAR_DATOS: "blue" };
  return (
    <div>
      <div className="mb-4"><h3 className="text-sm font-bold text-slate-300">Bitácora de Auditoría (NOM-024 §5.7)</h3><p className="text-xs text-slate-500 mt-1">Registro inmutable · usuario · acción · fecha/hora.</p></div>
      <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-800 text-[10px] text-slate-500 uppercase tracking-widest font-semibold"><span>Fecha / Hora</span><span>Usuario</span><span>Acción</span></div>
        {paciente.bitacora.length === 0 && <div className="text-center py-8 text-slate-600 text-xs">Sin registros.</div>}
        {[...paciente.bitacora].reverse().map((b, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 px-4 py-2.5 border-t border-slate-800 hover:bg-slate-800/30">
            <span className="text-xs text-slate-400 font-mono">{b.fecha}</span>
            <span className="text-xs text-slate-300">{b.usuario}</span>
            <div className="flex items-center gap-2 flex-wrap"><Badge label={b.accion.replace(/_/g, " ")} color={col[b.accion] || "slate"} /><span className="text-[10px] text-slate-500">{b.detalle}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MÓDULO: CONTROL DE ACCESO
// ══════════════════════════════════════════════════════════════════
const ControlAcceso = ({ usuarioActual }) => {
  const roles = { medico: { label: "Médico", permisos: ["Ver expediente completo", "Crear/editar historia clínica", "Agregar notas SOAP", "Emitir y firmar prescripciones", "Firmar consentimientos", "Ver bitácora completa"] }, enfermera: { label: "Enfermería", permisos: ["Ver datos de identificación", "Ver notas de evolución", "Registrar signos vitales"] }, recepcion: { label: "Recepción", permisos: ["Registrar nuevo paciente", "Buscar expediente", "Ver datos de identificación"] } };
  const info = roles[usuarioActual.rol] || roles.recepcion;
  return (
    <div>
      <Seccion titulo="Sesión Activa (NOM-024 §5.4)" icono="🔐">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-lg p-3"><p className="text-[10px] text-slate-500 uppercase">Usuario</p><p className="text-sm text-white font-semibold">{usuarioActual.nombre}</p></div>
          <div className="bg-slate-800 rounded-lg p-3"><p className="text-[10px] text-slate-500 uppercase">Rol</p><p className="text-sm text-sky-400 font-semibold">{info.label}</p></div>
          <div className="bg-slate-800 rounded-lg p-3"><p className="text-[10px] text-slate-500 uppercase">Cédula</p><p className="text-sm text-slate-300 font-mono">{usuarioActual.cedula}</p></div>
        </div>
      </Seccion>
      <Seccion titulo="Permisos del Rol (RBAC · NOM-024 §5.5)" icono="🛡️">
        <div className="flex flex-col gap-2">{info.permisos.map(p => <div key={p} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-3 py-2"><span className="text-emerald-400 text-xs">✓</span><span className="text-sm text-slate-300">{p}</span></div>)}</div>
      </Seccion>
      <Seccion titulo="Usuarios del sistema (NOM-024 §5.4)" icono="👥" colapsable>
        <div className="flex flex-col gap-2">
          {USUARIOS_MOCK.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2.5">
              <div><p className="text-sm text-slate-200 font-medium">{u.nombre}</p><p className="text-xs text-slate-500">{u.especialidad} · Céd: {u.cedula}</p></div>
              <div className="flex gap-1.5"><Badge label={roles[u.rol]?.label || u.rol} color="blue" /><Badge label={u.activo ? "Activo" : "Inactivo"} color={u.activo ? "green" : "red"} /></div>
            </div>
          ))}
        </div>
      </Seccion>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// VISTA EXPEDIENTE
// ══════════════════════════════════════════════════════════════════
const VistaExpediente = ({ paciente, setPaciente, usuarioActual, onVolver }) => {
  const [tab, setTab] = useState("identificacion");
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(paciente);
  const tabs = [{ id: "identificacion", label: "Identificación", icono: "👤" }, { id: "historia", label: "Historia Clínica", icono: "📋" }, { id: "notas", label: "Notas", icono: "🩺" }, { id: "prescripciones", label: "Recetas", icono: "💊" }, { id: "consentimientos", label: "Consentimientos", icono: "✍️" }, { id: "bitacora", label: "Bitácora", icono: "🔍" }];
  const guardar = () => { const u = { ...draft, bitacora: [...draft.bitacora, { fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "MODIFICAR_DATOS", detalle: `Módulo: ${tab}` }] }; setPaciente(u); setDraft(u); setEditando(false); };
  const soloLectura = !editando || (tab !== "identificacion" && tab !== "historia");
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 flex-wrap">
        <button onClick={onVolver} className="text-slate-400 hover:text-white text-sm">← Volver</button>
        <div className="w-px h-4 bg-slate-700" />
        <div><p className="text-sm font-bold text-white">{paciente.identificacion.nombre}</p><p className="text-[10px] text-slate-500 font-mono">{paciente.folio} · {calcEdad(paciente.identificacion.fechaNacimiento)} · Creado: {paciente.fechaCreacion}</p></div>
        {paciente.identificacion.alergias && <div className="ml-auto flex items-center gap-1 bg-red-900/40 border border-red-700/50 rounded-lg px-2 py-1"><span className="text-xs">⚠️</span><span className="text-xs text-red-300 font-semibold">Alergias: {paciente.identificacion.alergias}</span></div>}
      </div>
      <div className="flex gap-1 px-4 py-2 bg-slate-900/60 border-b border-slate-800 overflow-x-auto">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}><span>{t.icono}</span>{t.label}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {(tab === "identificacion" || tab === "historia") && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">{editando ? "Modo edición" : "Modo lectura"}</span>
            {editando ? <div className="flex gap-2"><button onClick={guardar} className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Guardar</button><button onClick={() => { setDraft(paciente); setEditando(false); }} className="bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg">Cancelar</button></div> : <button onClick={() => setEditando(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg">✎ Editar</button>}
          </div>
        )}
        {tab === "identificacion" && <RegistroPaciente paciente={draft} onChange={setDraft} soloLectura={soloLectura} />}
        {tab === "historia" && <HistoriaClinica paciente={draft} onChange={setDraft} soloLectura={soloLectura} />}
        {tab === "notas" && <NotasEvolucion paciente={paciente} onChange={p => { setPaciente(p); setDraft(p); }} usuarioActual={usuarioActual} />}
        {tab === "prescripciones" && <Prescripciones paciente={paciente} onChange={p => { setPaciente(p); setDraft(p); }} usuarioActual={usuarioActual} />}
        {tab === "consentimientos" && <Consentimiento paciente={paciente} onChange={p => { setPaciente(p); setDraft(p); }} usuarioActual={usuarioActual} />}
        {tab === "bitacora" && <Bitacora paciente={paciente} />}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// LISTA PACIENTES
// ══════════════════════════════════════════════════════════════════
const ListaPacientes = ({ pacientes, onSeleccionar, onNuevo, usuarioActual }) => {
  const [busqueda, setBusqueda] = useState("");
  const filtrados = pacientes.filter(p => p.identificacion.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.folio.toLowerCase().includes(busqueda.toLowerCase()) || p.identificacion.curp.toLowerCase().includes(busqueda.toLowerCase()));
  const puedeCrear = pacientes.length < LIMITE_DEMO;
  const pct = Math.round((pacientes.length / LIMITE_DEMO) * 100);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div><h2 className="text-lg font-black text-white">Expedientes Clínicos</h2><p className="text-xs text-slate-500">{pacientes.length} de {LIMITE_DEMO} registros en modo demo</p></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#0ea5e9" }} /></div>
            <span className="text-[10px] text-slate-400">{pacientes.length}/{LIMITE_DEMO}</span>
          </div>
          {(usuarioActual.rol === "medico" || usuarioActual.rol === "recepcion") && (
            <button onClick={onNuevo} disabled={!puedeCrear} className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">
              {puedeCrear ? "+ Nuevo expediente" : "Límite alcanzado"}
            </button>
          )}
        </div>
      </div>

      {!puedeCrear && (
        <div className="mb-4 bg-amber-900/30 border border-amber-700/50 rounded-xl px-4 py-3 text-xs text-amber-300">⚠️ Límite demo de {LIMITE_DEMO} expedientes alcanzado. Para producción sin restricciones, migre a Flask + PostgreSQL.</div>
      )}

      <div className="relative mb-4">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, folio o CURP…" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 pl-9" />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
      </div>

      {filtrados.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No se encontraron expedientes.</div>}
      <div className="flex flex-col gap-2">
        {filtrados.map(p => (
          <button key={p.id} onClick={() => onSeleccionar(p)} className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-sky-600/50 rounded-xl p-4 transition-all group">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">{p.identificacion.nombre}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500 font-mono">{p.folio}</span>
                  <span className="text-slate-600">·</span><span className="text-xs text-slate-500">{calcEdad(p.identificacion.fechaNacimiento)}</span>
                  <span className="text-slate-600">·</span><span className="text-xs text-slate-500">CURP: {p.identificacion.curp || "—"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.identificacion.alergias && <Badge label="Alergias" color="red" />}
                <Badge label={`${p.notas.length} nota(s)`} color="slate" />
                <Badge label={`${p.prescripciones.length} receta(s)`} color="green" />
                <span className="text-slate-600 group-hover:text-sky-400 transition-colors">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// NUEVO EXPEDIENTE
// ══════════════════════════════════════════════════════════════════
const NuevoExpediente = ({ onGuardar, onCancelar, usuarioActual }) => {
  const [paciente, setPaciente] = useState(() => { const p = PLANTILLA(); p.folio = generarFolio(); p.id = p.folio; return p; });
  const [tab, setTab] = useState("identificacion");
  const guardar = () => {
    if (!paciente.identificacion.nombre || !paciente.identificacion.fechaNacimiento || !paciente.identificacion.sexo) { alert("Complete los campos obligatorios: nombre, fecha de nacimiento y sexo."); return; }
    onGuardar({ ...paciente, bitacora: [{ fecha: fechaHoraActual(), usuario: usuarioActual.nombre, accion: "CREAR_EXPEDIENTE", detalle: "Expediente creado" }] });
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button onClick={onCancelar} className="text-slate-400 hover:text-white text-sm">← Cancelar</button>
        <div className="w-px h-4 bg-slate-700" />
        <div><h2 className="text-base font-black text-white">Nuevo Expediente</h2><p className="text-[10px] text-slate-500 font-mono">{paciente.folio}</p></div>
        <button onClick={guardar} className="ml-auto bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl">Crear expediente</button>
      </div>
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {[{ id: "identificacion", label: "Identificación" }, { id: "historia", label: "Historia Clínica" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-sky-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "identificacion" && <RegistroPaciente paciente={paciente} onChange={setPaciente} soloLectura={false} />}
      {tab === "historia" && <HistoriaClinica paciente={paciente} onChange={setPaciente} soloLectura={false} />}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState(PACIENTES_MOCK);
  const [vista, setVista] = useState("lista");
  const [pacienteActivo, setPacienteActivo] = useState(null);

  const handleLogin = u => setUsuario(u);
  const handleLogout = () => { setUsuario(null); setPacienteActivo(null); setVista("lista"); };
  const abrirExpediente = p => { setPacienteActivo(p); setVista("expediente"); };
  const actualizarPaciente = p => { setPacientes(prev => prev.map(x => x.id === p.id ? p : x)); setPacienteActivo(p); };
  const crearExpediente = nuevo => { if (pacientes.length >= LIMITE_DEMO) { alert(`Límite demo de ${LIMITE_DEMO} expedientes alcanzado.`); return; } setPacientes(prev => [nuevo, ...prev]); setVista("lista"); };

  if (!usuario) return <Login onLogin={handleLogin} />;

  return (
    <div className="h-screen bg-slate-950 flex flex-col" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <button onClick={() => setVista("lista")} className="text-sm font-black text-white hover:text-sky-300 transition-colors" style={{ fontFamily: "Georgia, serif" }}>Mexpediente</button>
          <div className="hidden sm:flex items-center gap-1"><Badge label="NOM-004" color="blue" /><Badge label="NOM-024" color="green" /></div>
          <div className="hidden sm:block bg-amber-900/30 border border-amber-700/50 rounded px-2 py-0.5"><span className="text-[10px] text-amber-300">Demo · {pacientes.length}/{LIMITE_DEMO}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right"><p className="text-xs font-semibold text-slate-200">{usuario.nombre}</p><p className="text-[10px] text-slate-500">{usuario.especialidad}</p></div>
          <button onClick={() => setVista("acceso")} className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${vista === "acceso" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>🔐</button>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all">Salir</button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {vista === "lista" && <ListaPacientes pacientes={pacientes} onSeleccionar={abrirExpediente} onNuevo={() => setVista("nuevo")} usuarioActual={usuario} />}
        {vista === "expediente" && pacienteActivo && <VistaExpediente paciente={pacienteActivo} setPaciente={actualizarPaciente} usuarioActual={usuario} onVolver={() => setVista("lista")} />}
        {vista === "nuevo" && <NuevoExpediente onGuardar={crearExpediente} onCancelar={() => setVista("lista")} usuarioActual={usuario} />}
        {vista === "acceso" && <div className="p-4 max-w-3xl mx-auto"><ControlAcceso usuarioActual={usuario} /></div>}
      </div>
    </div>
  );
}
