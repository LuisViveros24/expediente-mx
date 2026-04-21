import { useRef, useState } from "react"

/**
 * Pad de firma digital usando HTML5 Canvas
 * Cumple NOM-024-SSA3-2012 §5.6 — Firma electrónica simple
 */
export default function PadFirma({ titulo, onFirmar, onCancelar }) {
  const canvasRef = useRef(null)
  const dibujando = useRef(false)
  const [tieneFirma, setTieneFirma] = useState(false)

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width
    const sy = canvas.height / r.height
    if (e.touches) {
      return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy }
    }
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy }
  }

  const iniciar = e => {
    e.preventDefault()
    const c = canvasRef.current
    const ctx = c.getContext("2d")
    const p = getPos(e, c)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    dibujando.current = true
    setTieneFirma(true)
  }

  const dibujar = e => {
    e.preventDefault()
    if (!dibujando.current) return
    const c = canvasRef.current
    const ctx = c.getContext("2d")
    const p = getPos(e, c)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = "#1e3a8a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  const terminar = e => { e?.preventDefault(); dibujando.current = false }

  const limpiar = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, 480, 180)
    setTieneFirma(false)
  }

  const confirmar = () => {
    if (tieneFirma) onFirmar(canvasRef.current.toDataURL("image/png"))
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{titulo}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Firme con el dedo o el ratón</p>
          </div>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-4">
          <div
            className="border-2 border-dashed border-blue-300 rounded-xl overflow-hidden bg-blue-50/20 relative"
            style={{ touchAction: "none" }}
          >
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              className="w-full block cursor-crosshair"
              onMouseDown={iniciar}
              onMouseMove={dibujar}
              onMouseUp={terminar}
              onMouseLeave={terminar}
              onTouchStart={iniciar}
              onTouchMove={dibujar}
              onTouchEnd={terminar}
            />
            {!tieneFirma && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-blue-300 text-sm font-medium select-none">✍️ Firme aquí</p>
              </div>
            )}
          </div>
          <div className="border-t border-gray-300 mx-2 mt-1" />
          <p className="text-[10px] text-gray-400 text-center mt-0.5">Línea de firma</p>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={limpiar}
            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onClick={confirmar}
            disabled={!tieneFirma}
            className="flex-1 bg-blue-800 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Confirmar firma
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center pb-3">
          Firma electrónica simple · NOM-024-SSA3-2012 §5.6
        </p>
      </div>
    </div>
  )
}
