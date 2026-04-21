import { CLINICA_INFO } from "../data/mock"
import { calcEdad } from "../utils/helpers"
import { Badge } from "./ui"

/**
 * Modal de vista previa e impresión de receta médica
 * Genera ventana nueva para impresión/PDF
 * NOM-004-SSA3-2012 §8.7
 */
export default function ModalImpresionReceta({ receta, paciente, onCerrar }) {
  const printId = `receta-print-${receta.id}`

  const imprimir = () => {
    const contenido = document.getElementById(printId).innerHTML
    const ventana = window.open("", "_blank", "width=850,height=650")
    ventana.document.write(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Receta RX-${receta.id} · ${paciente.identificacion.nombre}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; color: #111; padding: 32px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0A2540; padding-bottom: 16px; margin-bottom: 20px; }
  .clinica-nombre { font-size: 18px; font-weight: 900; color: #0A2540; }
  .clinica-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .folio { text-align: right; }
  .folio-num { font-family: monospace; font-size: 15px; font-weight: bold; color: #0A2540; }
  .folio-sub { font-size: 11px; color: #6b7280; }
  .medico-box { background: #eff6ff; border-radius: 8px; padding: 10px 14px; margin-bottom: 18px; }
  .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; display: block; margin-bottom: 2px; }
  .medico-nombre { font-size: 14px; font-weight: 700; color: #0A2540; }
  .medico-cedula { font-size: 11px; color: #6b7280; }
  .paciente-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .campo-val { font-size: 13px; font-weight: 600; }
  .alergia { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 10px; margin-top: 8px; font-size: 11px; font-weight: 700; color: #b91c1c; }
  .rx-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .rx-symbol { font-size: 38px; font-weight: 900; color: #0A2540; line-height: 1; }
  .rx-line { flex: 1; height: 1px; background: #bfdbfe; }
  .med { border-left: 4px solid #0A2540; padding: 4px 0 4px 14px; margin-bottom: 18px; }
  .med-nombre { font-size: 15px; font-weight: 900; color: #0A2540; margin-bottom: 5px; }
  .med-datos { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #374151; }
  .med-ind { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 4px; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .firma-box { text-align: center; }
  .firma-img { height: 56px; display: block; margin: 0 auto 4px; object-fit: contain; }
  .firma-linea { height: 56px; border-bottom: 1px solid #9ca3af; margin-bottom: 4px; }
  .firma-nombre { font-size: 11px; color: #374151; font-weight: 600; }
  .firma-sub { font-size: 9px; color: #9ca3af; }
  .pie { margin-top: 28px; padding-top: 10px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 9px; color: #9ca3af; line-height: 1.6; }
  @media print { body { padding: 20px; } }
</style>
</head><body>${contenido}</body></html>`)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => ventana.print(), 500)
  }

  const { identificacion } = paciente

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 overflow-hidden">

        {/* Barra controles */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-bold">Vista previa · Receta RX-{receta.id}</span>
            {receta.firmaDigital && <Badge label="✍️ Médico" color="blue" />}
            {receta.firmaPaciente && <Badge label="✍️ Paciente" color="amber" />}
          </div>
          <div className="flex gap-2">
            <button
              onClick={imprimir}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              🖨️ Imprimir / PDF
            </button>
            <button
              onClick={onCerrar}
              className="text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido imprimible */}
        <div id={printId} className="p-8 bg-white text-gray-900" style={{ fontFamily: "Georgia, serif" }}>

          {/* Encabezado */}
          <div className="header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"3px solid #0A2540", paddingBottom:"16px", marginBottom:"20px" }}>
            <div>
              <div className="clinica-nombre" style={{ fontSize:"18px", fontWeight:900, color:"#0A2540" }}>{CLINICA_INFO.nombre}</div>
              <div className="clinica-sub" style={{ fontSize:"11px", color:"#6b7280", marginTop:"3px" }}>{CLINICA_INFO.direccion}</div>
              <div className="clinica-sub" style={{ fontSize:"11px", color:"#6b7280" }}>Tel: {CLINICA_INFO.telefono} · RFC: {CLINICA_INFO.rfc}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>Folio de receta</p>
              <p style={{ fontFamily:"monospace", fontSize:"15px", fontWeight:"bold", color:"#0A2540", margin:0 }}>RX-{receta.id}</p>
              <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>{receta.fecha}</p>
            </div>
          </div>

          {/* Médico */}
          <div style={{ background:"#eff6ff", borderRadius:"8px", padding:"10px 14px", marginBottom:"18px" }}>
            <span style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"0.08em", color:"#9ca3af", display:"block", marginBottom:"2px" }}>Médico responsable</span>
            <p style={{ fontSize:"14px", fontWeight:700, color:"#0A2540", margin:0 }}>{receta.medico}</p>
            <p style={{ fontSize:"11px", color:"#6b7280", margin:0 }}>Cédula Profesional: {receta.cedula}</p>
          </div>

          {/* Paciente */}
          <div style={{ marginBottom:"14px" }}>
            <span style={{ fontSize:"9px", textTransform:"uppercase", letterSpacing:"0.08em", color:"#9ca3af", display:"block", marginBottom:"6px" }}>Paciente</span>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"12px" }}>
              <div><p style={{ fontSize:"9px", color:"#9ca3af", margin:0 }}>Nombre completo</p><p style={{ fontSize:"13px", fontWeight:600, margin:0 }}>{identificacion.nombre}</p></div>
              <div><p style={{ fontSize:"9px", color:"#9ca3af", margin:0 }}>Edad</p><p style={{ fontSize:"13px", fontWeight:600, margin:0 }}>{calcEdad(identificacion.fechaNacimiento)}</p></div>
              <div><p style={{ fontSize:"9px", color:"#9ca3af", margin:0 }}>Folio expediente</p><p style={{ fontSize:"13px", fontWeight:600, fontFamily:"monospace", margin:0 }}>{paciente.folio}</p></div>
            </div>
            {identificacion.alergias && (
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:"6px", padding:"6px 10px", marginTop:"8px" }}>
                <p style={{ fontSize:"11px", fontWeight:700, color:"#b91c1c", margin:0 }}>⚠️ ALERGIAS: {identificacion.alergias}</p>
              </div>
            )}
          </div>

          {/* Símbolo Rx */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
            <span style={{ fontSize:"38px", fontWeight:900, color:"#0A2540", lineHeight:1 }}>℞</span>
            <div style={{ flex:1, height:"1px", background:"#bfdbfe" }} />
          </div>

          {/* Medicamentos */}
          {receta.medicamentos.map((m, i) => (
            <div key={i} style={{ borderLeft:"4px solid #0A2540", paddingLeft:"14px", marginBottom:"18px" }}>
              <p style={{ fontSize:"15px", fontWeight:900, color:"#0A2540", marginBottom:"5px" }}>{i + 1}. {m.nombre}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", fontSize:"12px", color:"#374151" }}>
                <span><b>Dosis:</b> {m.dosis}</span>
                <span><b>Vía:</b> {m.via}</span>
                <span><b>Frecuencia:</b> {m.frecuencia}</span>
                <span><b>Duración:</b> {m.duracion}</span>
              </div>
              {m.indicaciones && <p style={{ fontSize:"11px", color:"#6b7280", fontStyle:"italic", marginTop:"4px" }}>Indicaciones: {m.indicaciones}</p>}
            </div>
          ))}

          {/* Firmas */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"48px", marginTop:"36px", paddingTop:"16px", borderTop:"1px solid #e5e7eb" }}>
            <div style={{ textAlign:"center" }}>
              {receta.firmaDigital
                ? <img src={receta.firmaDigital} alt="Firma médico" style={{ height:"56px", display:"block", margin:"0 auto 4px", objectFit:"contain" }} />
                : <div style={{ height:"56px", borderBottom:"1px solid #9ca3af", marginBottom:"4px" }} />}
              <p style={{ fontSize:"11px", color:"#374151", fontWeight:600 }}>{receta.medico}</p>
              <p style={{ fontSize:"9px", color:"#9ca3af" }}>Médico responsable · Cédula: {receta.cedula}</p>
            </div>
            <div style={{ textAlign:"center" }}>
              {receta.firmaPaciente
                ? <img src={receta.firmaPaciente} alt="Firma paciente" style={{ height:"56px", display:"block", margin:"0 auto 4px", objectFit:"contain" }} />
                : <div style={{ height:"56px", borderBottom:"1px solid #9ca3af", marginBottom:"4px" }} />}
              <p style={{ fontSize:"11px", color:"#374151", fontWeight:600 }}>{identificacion.nombre}</p>
              <p style={{ fontSize:"9px", color:"#9ca3af" }}>Paciente / Representante legal</p>
            </div>
          </div>

          {/* Pie */}
          <div style={{ marginTop:"28px", paddingTop:"10px", borderTop:"1px solid #f3f4f6", textAlign:"center" }}>
            <p style={{ fontSize:"9px", color:"#9ca3af", lineHeight:1.6 }}>
              Documento generado por MedpedienteX · NOM-004-SSA3-2012 §8.7 · NOM-024-SSA3-2012<br />
              Válido únicamente con firma del médico responsable
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
