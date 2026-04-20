import { useState } from "react";
import { generarReporteGeneral } from "../utils/reportGenerator";

export default function ModalReporteGeneral({ pacientes, usuarioActual, onCerrar }) {
  const [seleccionados, setSeleccionados] = useState([]);

  const toggleTodos = () => {
    setSeleccionados(seleccionados.length === pacientes.length ? [] : pacientes.map(p => p.id));
  };

  const toggleUno = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const generar = () => {
    const filtrados = pacientes.filter(p => seleccionados.includes(p.id));
    const html = generarReporteGeneral(filtrados, usuarioActual);
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
    onCerrar();
  };

  const todosSeleccionados = seleccionados.length === pacientes.length && pacientes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-sm font-black text-white">Reporte General de Expedientes</h2>
            <p className="text-xs text-slate-400 mt-0.5">NOM-004-SSA3-2012 · NOM-024-SSA3-2012</p>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Seleccionar todos */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={toggleTodos}
              className="w-4 h-4 accent-sky-500"
            />
            <span className="text-xs font-semibold text-slate-300">Seleccionar todos</span>
          </label>
          <span className="text-xs text-slate-500">
            {seleccionados.length} de {pacientes.length} seleccionado{seleccionados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1.5">
          {pacientes.map(p => (
            <label key={p.id} className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={seleccionados.includes(p.id)}
                onChange={() => toggleUno(p.id)}
                className="w-4 h-4 accent-sky-500 shrink-0"
              />
              <div className="flex-1 bg-slate-800/50 group-hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 transition-all">
                <p className="text-xs font-semibold text-slate-200">{p.identificacion.nombre}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.folio} · {p.notas.length} nota(s) · {p.prescripciones.length} receta(s)</p>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between gap-3">
          {seleccionados.length < 2 && (
            <p className="text-[10px] text-amber-400">Selecciona al menos 2 expedientes.</p>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onCerrar}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={generar}
              disabled={seleccionados.length < 2}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
            >
              📊 Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
