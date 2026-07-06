import { getPeriodDates } from './periodUtils'

const NL_TO_NUM = { AD: 4, A: 3, B: 2, C: 1 }

export function numToNL(avg) {
  if (avg >= 3.5) return 'AD'
  if (avg >= 2.5) return 'A'
  if (avg >= 1.5) return 'B'
  return 'C'
}

export function getConclusion(nl) {
  switch (nl) {
    case 'AD': return 'El estudiante evidencia un nivel superior a lo esperado respecto a la competencia.'
    case 'A':  return 'El estudiante evidencia el nivel esperado respecto a la competencia.'
    case 'B':  return 'El estudiante está próximo al nivel esperado, requiere acompañamiento.'
    case 'C':  return 'El estudiante muestra un progreso mínimo, necesita mayor tiempo de apoyo.'
    default:   return '—'
  }
}

export function calcularNL(achievementLevels) {
  const validos = achievementLevels
    .map(nl => NL_TO_NUM[nl])
    .filter(n => n !== undefined)
  if (!validos.length) return null
  const avg = validos.reduce((a, b) => a + b, 0) / validos.length
  return numToNL(avg)
}

export function filtrarPorPeriodo(evaluaciones, periodNumber, year) {
  const period = getPeriodDates('BIMESTRE', periodNumber, year)
  if (!period) return evaluaciones
  return evaluaciones.filter(ev => {
    const fecha = new Date(ev.evaluationDate)
    return fecha >= period.startDate && fecha <= period.endDate
  })
}

export function calcularNLporCompetencia(detalles) {
  const map = new Map()
  detalles.forEach(d => {
    if (!d.competencyId || !d.achievementLevel) return
    if (!map.has(d.competencyId)) map.set(d.competencyId, [])
    map.get(d.competencyId).push(d.achievementLevel)
  })
  const resultado = {}
  map.forEach((niveles, competencyId) => {
    resultado[competencyId] = calcularNL(niveles)
  })
  return resultado
}