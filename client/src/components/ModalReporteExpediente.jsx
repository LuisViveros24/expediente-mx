import { generarReporteExpediente } from "../utils/reportGenerator";

export default function ModalReporteExpediente({ paciente, usuarioActual }) {
  const imprimir = () => {
    const html = generarReporteExpediente(paciente, usuarioActual);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  return (
    <button
      onClick={imprimir}
      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
      title="Imprimir expediente completo (NOM-004 / NOM-024)"
    >
      🖨 Imprimir Expediente
    </button>
  );
}
