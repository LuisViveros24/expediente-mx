/**
 * Utilidades generales del sistema Mexpediente
 * NOM-004-SSA3-2012 / NOM-024-SSA3-2012
 */

export const calcIMC = (peso, talla) => {
  const p = parseFloat(peso)
  const t = parseFloat(talla)
  if (!p || !t) return ""
  return (p / (t * t)).toFixed(1)
}

export const generarFolio = () => {
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 9000) + 1000)
  return `EXP-${year}-${num}`
}

export const fechaHoraActual = () => {
  const now = new Date()
  const fecha = now.toLocaleDateString("es-MX")
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  return `${fecha} ${hora}`
}

export const calcEdad = (fechaNac) => {
  if (!fechaNac) return "—"
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--
  }
  return `${edad} años`
}

export const plantillaPaciente = () => ({
  id: "",
  folio: "",
  fechaCreacion: new Date().toISOString().split("T")[0],
  identificacion: {
    nombre: "", fechaNacimiento: "", sexo: "", curp: "", rfc: "",
    estadoCivil: "", escolaridad: "", ocupacion: "", nacionalidad: "Mexicana",
    religion: "", lugarNacimiento: "", domicilio: "", telefono: "",
    telefonoEmergencia: "", contactoEmergencia: "", grupoSanguineo: "", alergias: "",
  },
  historiaClinica: {
    motivoConsulta: "", padecimientoActual: "",
    antecedentesHeredoFamiliares: "", antecedentesPersonalesPatologicos: "",
    antecedentesPersonalesNoPatologicos: "", antecedentesGinecoObstetricos: "",
    antecedentesPediatricos: "",
    exploFisica: { talla: "", peso: "", imc: "", ta: "", fc: "", fr: "", temp: "", sao2: "", notasExploracion: "" },
  },
  notas: [],
  prescripciones: [],
  consentimientos: [],
  bitacora: [],
})
