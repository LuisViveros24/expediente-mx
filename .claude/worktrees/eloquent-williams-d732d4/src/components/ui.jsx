import { useState } from "react"

export const Badge = ({ label, color = "blue" }) => {
  const colors = {
    blue:  "bg-sky-900/60 text-sky-300 border-sky-700",
    green: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    amber: "bg-amber-900/60 text-amber-300 border-amber-700",
    red:   "bg-red-900/60 text-red-300 border-red-700",
    slate: "bg-slate-700/60 text-slate-300 border-slate-600",
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wider uppercase ${colors[color]}`}>
      {label}
    </span>
  )
}

export const Campo = ({ label, value, onChange, type = "text", required, options, rows, readOnly, placeholder, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {options ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={readOnly}
        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
      >
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : rows ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        readOnly={readOnly}
        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
      />
    )}
  </div>
)

export const Seccion = ({ titulo, icono, children, colapsable = false }) => {
  const [abierto, setAbierto] = useState(true)
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-4">
      <div
        className={`flex items-center justify-between px-4 py-3 bg-slate-800/80 ${colapsable ? "cursor-pointer select-none" : ""}`}
        onClick={() => colapsable && setAbierto(!abierto)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sky-400">{icono}</span>
          <span className="text-sm font-bold text-slate-100">{titulo}</span>
        </div>
        {colapsable && <span className="text-slate-400 text-xs">{abierto ? "▲" : "▼"}</span>}
      </div>
      {abierto && <div className="p-4 bg-slate-900/40">{children}</div>}
    </div>
  )
}
