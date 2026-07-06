const BIMESTRE_RANGES = {
  1: { startMonth: 3, startDay: 16, endMonth: 5,  endDay: 15,  label: '16 Mar - 15 May' },
  2: { startMonth: 5, startDay: 25, endMonth: 7,  endDay: 24,  label: '25 May - 24 Jul' },
  3: { startMonth: 8, startDay: 10, endMonth: 10, endDay: 9,   label: '10 Ago - 09 Oct' },
  4: { startMonth: 10, startDay: 19, endMonth: 12, endDay: 18, label: '19 Oct - 18 Dic' },
}

const TRIMESTRE_RANGES = {
  1: { startMonth: 3, startDay: 16, endMonth: 6,  endDay: 13,  label: '16 Mar - 13 Jun' },
  2: { startMonth: 6, startDay: 23, endMonth: 9,  endDay: 11,  label: '23 Jun - 11 Sep' },
  3: { startMonth: 9, startDay: 21, endMonth: 12, endDay: 18,  label: '21 Sep - 18 Dic' },
}

export function getCurrentPeriodNumber(periodType) {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES

  for (const [num, range] of Object.entries(ranges)) {
    const start = new Date(now.getFullYear(), range.startMonth - 1, range.startDay)
    const end = new Date(now.getFullYear(), range.endMonth - 1, range.endDay)
    if (now >= start && now <= end) return Number(num)
  }

  // Si estamos antes del inicio del año escolar → Bloque 1
  if (month < 3 || (month === 3 && day < 16)) return 1

  // Buscar el período más cercano (entre períodos o después del último)
  // Retornar el siguiente período que aún no ha comenzado, o el último si ya pasaron todos
  const numPeriods = periodType === 'BIMESTRE' ? 4 : 3
  for (const [num, range] of Object.entries(ranges)) {
    const start = new Date(now.getFullYear(), range.startMonth - 1, range.startDay)
    if (now < start) return Number(num)
  }
  return numPeriods
}

export function getPeriodLabel(periodType, periodNumber) {
  const prefix = periodType === 'BIMESTRE' ? 'Bimestre' : 'Trimestre'
  const ordinals = ['', '1°', '2°', '3°', '4°']
  return `${ordinals[periodNumber] || ''} ${prefix}`
}

export function getPeriodDateRange(periodType, periodNumber) {
  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES
  return ranges[periodNumber]?.label || ''
}

// Días antes del fin del bimestre en que se habilita generar boletas
const DIAS_HABILITACION_BOLETAS = 5

// Ventana temporal especial habilitada por solicitud del docente
const VENTANA_ESPECIAL_START = new Date(2026, 5, 11)  // 11 de junio 2026
const VENTANA_ESPECIAL_END   = new Date(2026, 6, 20, 23, 59, 59) // 20 de junio 2026

/**
 * Retorna si hoy está dentro de la ventana permitida para generar boletas.
 * Se habilita DIAS_HABILITACION_BOLETAS días antes del fin del bimestre
 * y hasta el último día del mismo.
 * También se habilita durante la ventana especial del 21 al 23 de abril 2026.
 */
export function isBoletaGenerationAllowed(periodType, periodNumber, year = new Date().getFullYear()) {
  const now = new Date()

  // Ventana especial temporal (solicitud docente)
  if (now >= VENTANA_ESPECIAL_START && now <= VENTANA_ESPECIAL_END) return true

  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES
  const range = ranges[periodNumber]
  if (!range) return false

  const endDate = new Date(year, range.endMonth - 1, range.endDay)
  const startWindow = new Date(endDate)
  startWindow.setDate(startWindow.getDate() - DIAS_HABILITACION_BOLETAS)

  return now >= startWindow && now <= endDate
}

/**
 * Retorna la fecha desde la que se podrá generar boletas (para mostrar al usuario).
 */
export function getBoletaWindowStart(periodType, periodNumber, year = new Date().getFullYear()) {
  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES
  const range = ranges[periodNumber]
  if (!range) return null

  const endDate = new Date(year, range.endMonth - 1, range.endDay)
  const startWindow = new Date(endDate)
  startWindow.setDate(startWindow.getDate() - DIAS_HABILITACION_BOLETAS)
  return startWindow
}

/**
 * Retorna todas las ventanas de generación de boletas para el año dado.
 * Útil para mostrar al docente cuándo estará habilitada cada período.
 */
export function getAllBoletaWindows(periodType, year = new Date().getFullYear()) {
  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES
  return Object.entries(ranges).map(([num, range]) => {
    const endDate = new Date(year, range.endMonth - 1, range.endDay)
    const startWindow = new Date(endDate)
    startWindow.setDate(startWindow.getDate() - DIAS_HABILITACION_BOLETAS)
    const ordinals = ['', '1°', '2°', '3°', '4°']
    const prefix = periodType === 'BIMESTRE' ? 'Bimestre' : 'Trimestre'
    return {
      periodNumber: Number(num),
      label: `${ordinals[num] || ''} ${prefix}`,
      dateRange: range.label,
      windowStart: startWindow,
      windowEnd: endDate,
    }
  })
}

export function getPeriodDates(periodType, periodNumber, year = new Date().getFullYear()) {
  const ranges = periodType === 'BIMESTRE' ? BIMESTRE_RANGES : TRIMESTRE_RANGES
  const range = ranges[periodNumber]
  if (!range) return null
  return {
    startDate: new Date(year, range.startMonth - 1, range.startDay),
    endDate: new Date(year, range.endMonth - 1, range.endDay),
    startStr: `${year}-${String(range.startMonth).padStart(2,'0')}-${String(range.startDay).padStart(2,'0')}`,
    endStr: `${year}-${String(range.endMonth).padStart(2,'0')}-${String(range.endDay).padStart(2,'0')}`,
  }
}