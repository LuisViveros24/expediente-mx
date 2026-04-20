export const LIMITE_DEMO = 25

export const CLINICA_INFO = {
  nombre: "Consultorio Médico ExpedienteMX",
  direccion: "Av. Juárez 123, Col. Centro, Torreón, Coahuila",
  telefono: "871-000-0000",
  rfc: "CME240101ABC",
}

export const USUARIOS_MOCK = [
  { id: 1, nombre: "Dr. Alejandro Rivas", rol: "medico", especialidad: "Medicina General", cedula: "3891045", pin: "1234", activo: true },
  { id: 2, nombre: "Enf. Marisol Fuentes", rol: "enfermera", especialidad: "Enfermería", cedula: "5672310", pin: "5678", activo: true },
  { id: 3, nombre: "Recep. Carlos Domínguez", rol: "recepcion", especialidad: "Administración", cedula: "ADM001", pin: "9012", activo: true },
]

export const PACIENTES_MOCK = [
  {
    id: "EXP-2024-001",
    folio: "EXP-2024-001",
    fechaCreacion: "2024-01-15",
    identificacion: {
      nombre: "María Guadalupe Torres Hernández",
      fechaNacimiento: "1985-03-22",
      sexo: "F",
      curp: "TOHM850322MCOTRR09",
      rfc: "TOHM850322",
      estadoCivil: "casada",
      escolaridad: "licenciatura",
      ocupacion: "Maestra",
      nacionalidad: "Mexicana",
      religion: "Católica",
      lugarNacimiento: "Torreón, Coahuila",
      domicilio: "Av. Independencia 456, Col. Centro, Torreón, Coah.",
      telefono: "871-123-4567",
      telefonoEmergencia: "871-987-6543",
      contactoEmergencia: "Juan Torres (esposo)",
      grupoSanguineo: "O+",
      alergias: "Penicilina, AINES",
    },
    historiaClinica: {
      motivoConsulta: "Cefalea persistente y mareo de 3 días",
      padecimientoActual: "Cefalea holocraneana 7/10 EVA, mareo no rotatorio, fotofobia, náusea sin vómito.",
      antecedentesHeredoFamiliares: "Madre: HTA, DM2. Padre: IAM a los 60 años.",
      antecedentesPersonalesPatologicos: "HTA en control con Losartán 50mg. Migraña desde los 25 años.",
      antecedentesPersonalesNoPatologicos: "Tabaquismo: negado. Alcoholismo: ocasional.",
      antecedentesGinecoObstetricos: "G2P2A0. FUM: 10/01/2024. DIU.",
      antecedentesPediatricos: "",
      exploFisica: {
        talla: "1.62", peso: "68", imc: "25.9",
        ta: "145/90", fc: "78", fr: "16", temp: "36.6", sao2: "97",
        notasExploracion: "Consciente, orientada. Cráneo normocéfalo. Pupilas isocóricas. Sin rigidez de nuca.",
      },
    },
    notas: [
      {
        id: 1, fecha: "2024-01-15 10:30",
        autor: "Dr. Alejandro Rivas", cedula: "3891045", tipo: "evolucion",
        subjetivo: "Mejoría parcial de cefalea.",
        objetivo: "TA: 142/88 mmHg. FC: 76 lpm.",
        analisis: "Cefalea tipo migraña con probable componente hipertensivo.",
        plan: "Ajuste de Losartán a 100mg. Sumatriptán 50mg SOS.",
        firmado: true,
      },
    ],
    prescripciones: [
      {
        id: 1001, fecha: "15/01/2024",
        medico: "Dr. Alejandro Rivas", cedula: "3891045",
        medicamentos: [
          { nombre: "Losartán", dosis: "100mg", via: "VO", frecuencia: "c/24h", duracion: "30 días", indicaciones: "Tomar por la mañana con alimentos" },
          { nombre: "Sumatriptán", dosis: "50mg", via: "VO", frecuencia: "Al inicio de crisis, repetir c/2h", duracion: "SOS", indicaciones: "No más de 2 tabletas en 24h" },
        ],
        firmada: true, firmaDigital: null, firmaPaciente: null,
      },
    ],
    consentimientos: [
      {
        id: 2001, fecha: "2024-01-15 10:15", tipo: "consulta_general",
        texto: "Autorizo la atención médica y el manejo de mis datos conforme a la NOM-004-SSA3-2012 y NOM-024-SSA3-2012. Declaro haber recibido información sobre los procedimientos a realizar, sus beneficios y riesgos. Esta autorización es libre y voluntaria.",
        firmado: true, testigo: "Enf. Marisol Fuentes",
        firmaDigital: null, firmaMedico: null,
      },
    ],
    bitacora: [
      { fecha: "2024-01-15 10:15", usuario: "Dr. Alejandro Rivas", accion: "CREAR_EXPEDIENTE", detalle: "Expediente creado" },
      { fecha: "2024-01-15 10:30", usuario: "Dr. Alejandro Rivas", accion: "AGREGAR_NOTA", detalle: "Nota SOAP #1001" },
    ],
  },
]

export const TIPOS_CONSENTIMIENTO = [
  { value: "consulta_general",    label: "Consulta y atención médica general" },
  { value: "procedimiento_menor", label: "Procedimiento médico menor" },
  { value: "cirugia",             label: "Intervención quirúrgica" },
  { value: "anestesia",           label: "Anestesia" },
  { value: "transfusion",         label: "Transfusión sanguínea" },
]

export const TEXTOS_CONSENTIMIENTO = {
  consulta_general: `Yo, el paciente identificado en el presente expediente, autorizo al personal médico y paramédico de esta unidad para que, bajo su criterio profesional, me otorguen atención médica, incluyendo el examen físico, toma de muestras para análisis clínicos y/o estudios de gabinete necesarios para el diagnóstico y tratamiento de mi padecimiento.

Declaro haber recibido información sobre los procedimientos a realizar, sus beneficios, riesgos y alternativas disponibles. Consiento el tratamiento de mis datos clínicos conforme a la NOM-004-SSA3-2012 y NOM-024-SSA3-2012. Esta autorización es libre y voluntaria, pudiendo ser revocada en cualquier momento.`,
  procedimiento_menor: `Autorizo la realización del procedimiento médico menor indicado, habiendo sido informado(a) de los riesgos, beneficios y alternativas existentes. Declaro que la presente autorización es otorgada de forma libre, voluntaria y sin coacción alguna. Conforme a NOM-004-SSA3-2012 §8.8 y NOM-024-SSA3-2012.`,
  cirugia: `Autorizo la intervención quirúrgica descrita en el plan terapéutico, habiendo sido informado(a) de los riesgos intraoperatorios, postoperatorios, posibles complicaciones y alternativas de tratamiento no quirúrgico. NOM-004-SSA3-2012 §8.8.`,
  anestesia: `Autorizo la administración de anestesia por el especialista indicado, habiendo sido informado(a) de sus tipos, riesgos y alternativas. Conforme a NOM-004-SSA3-2012 §8.8.`,
  transfusion: `Autorizo la transfusión de hemoderivados según criterio médico, habiendo sido informado(a) de las indicaciones, riesgos y alternativas disponibles. NOM-004-SSA3-2012 §8.8.`,
}
