import jsPDF from 'jspdf'
import apiClient from '@/core/api/apiClient'
import { ENDPOINTS } from '@/core/api/endpoints'
import { uploadPdfToCloudinary } from '@/core/utils/cloudinaryUtils'
import { filtrarPorPeriodo, calcularNLporCompetencia, getConclusion } from '@/core/utils/reportCardUtils'
import { getPeriodDates } from '@/core/utils/periodUtils'

const ESCUDO_URL = '/SIGEI/EscudoNacional.png'

async function loadImageAsBase64(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.includes('image')) return null
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (_e) {
    return null
  }
}

async function calcularNLParaPeriodo({ evaluaciones, studentId, periodNumber, academicYear }) {
  const evsFiltradas = filtrarPorPeriodo(evaluaciones, periodNumber, academicYear)
  const detalles = []
  for (const ev of evsFiltradas) {
    try {
      const { data } = await apiClient.get(ENDPOINTS.GRADES.EVALUATIONS.DETAILS(ev.id))
      const arr = Array.isArray(data) ? data : []
      const delEstudiante = arr.filter(d =>
        String(d.studentId) === String(studentId) ||
        String(d.student_id) === String(studentId)
      )
      for (const d of delEstudiante) {
        const nivel = d.achievementLevel || d.achievement_level
        const compId = d.competencyId || d.competency_id
        if (compId && nivel) detalles.push({ competencyId: compId, achievementLevel: nivel })
      }
    } catch (_e) {}
  }
  return calcularNLporCompetencia(detalles)
}

async function calcularAsistenciaPorBimestre({ studentId, academicYear }) {
  const result = {}
  for (let b = 1; b <= 4; b++) {
    result[b] = { faltasJustificadas: 0, faltasInjustificadas: 0, tardiasJustificadas: 0, tardiasInjustificadas: 0 }
  }
  try {
    const { data } = await apiClient.get(ENDPOINTS.ATTENDANCE.BY_STUDENT(studentId))
    const registros = Array.isArray(data) ? data : (data?.data || [])
    for (let b = 1; b <= 4; b++) {
      const period = getPeriodDates('BIMESTRE', b, academicYear)
      if (!period) continue
      const delBimestre = registros.filter(r => {
        if (!r.attendanceDate) return false
        const [y, m, d] = r.attendanceDate.slice(0, 10).split('-').map(Number)
        const fecha = new Date(y, m - 1, d)
        return fecha >= period.startDate && fecha <= period.endDate
      })
      for (const r of delBimestre) {
        const status = r.status
        const justified = r.isJustified
        if (status === 'ABSENT') {
          if (justified) result[b].faltasJustificadas++
          else result[b].faltasInjustificadas++
        } else if (status === 'LATE') {
          if (justified) result[b].tardiasJustificadas++
          else result[b].tardiasInjustificadas++
        } else if (status === 'JUSTIFIED' || status === 'EXCUSED') {
          result[b].faltasJustificadas++
        }
      }
    }
  } catch (_e) {}
  return result
}

export async function generarBoletaIndividual({
  student, classroom, user, institution,
  cursosConCompetencias,
  periodNumber, academicYear,
  observations = '', attendancePercentage = null,
  reportCardsService,
}) {
  // Leer comentarios del docente guardados en localStorage (por bimestre)
  let competencyComments = {}
  try {
    const stored = JSON.parse(localStorage.getItem('sigei_competency_comments') || '{}')
    // Filtrar solo los del estudiante actual, indexados por competencyId__bimestre
    Object.entries(stored).forEach(([key, val]) => {
      if (key.startsWith(student.id + '__')) {
        const rest = key.replace(student.id + '__', '') // competencyId__B1
        const parts = rest.split('__B')
        if (parts.length === 2) {
          const compId = parts[0]
          const b = Number(parts[1])
          if (!competencyComments[compId]) competencyComments[compId] = {}
          competencyComments[compId][b] = val
        }
      }
    })
  } catch (_e) {}
  const { data: evalsData } = await apiClient.get(
    ENDPOINTS.GRADES.EVALUATIONS.BY_TEACHER_CLASSROOM(user.userId, classroom.id)
  )
  const evaluaciones = Array.isArray(evalsData) ? evalsData : []

  const asistenciaPorBimestre = await calcularAsistenciaPorBimestre({ studentId: student.id, academicYear })

  const nlPorBimestre = {}
  for (let b = 1; b <= 4; b++) {
    nlPorBimestre[b] = await calcularNLParaPeriodo({
      evaluaciones, studentId: student.id, periodNumber: b, academicYear
    })
  }
  const nlPorCompetencia = (() => {
    // NL final solo se calcula en el 4° bimestre (promedio de los 4)
    if (periodNumber !== 4) return {}

    const resultado = {}
    const NL_TO_NUM = { AD: 4, A: 3, B: 2, C: 1 }
    const NUM_TO_NL = (avg) => avg >= 3.5 ? 'AD' : avg >= 2.5 ? 'A' : avg >= 1.5 ? 'B' : 'C'

    const allCompIds = new Set()
    for (let b = 1; b <= 4; b++) {
      Object.keys(nlPorBimestre[b] || {}).forEach(id => allCompIds.add(id))
    }

    allCompIds.forEach(compId => {
      const niveles = []
      for (let b = 1; b <= 4; b++) {
        const nl = nlPorBimestre[b]?.[compId]
        if (nl && NL_TO_NUM[nl]) niveles.push(NL_TO_NUM[nl])
      }
      if (niveles.length > 0) {
        const avg = niveles.reduce((a, b) => a + b, 0) / niveles.length
        resultado[compId] = NUM_TO_NL(avg)
      }
    })
    return resultado
  })()

  const escudoBase64 = await loadImageAsBase64(ESCUDO_URL)

  const pdfBlob = await generarPDF({
    student, classroom, user, institution,
    cursosConCompetencias,
    nlPorBimestre, nlPorCompetencia,
    periodNumber, academicYear,
    observations, attendancePercentage,
    escudoBase64,
    asistenciaPorBimestre,
    competencyComments,
  })

  const studentFullName = `${student.lastName || ''}${student.motherLastName ? '_' + student.motherLastName : ''}_${student.firstName || ''}`.replace(/\s+/g, '_').toUpperCase()
  const fileName = `boleta_${studentFullName}_B${periodNumber}_${academicYear}_${Date.now()}`
  const pdfUrl = await uploadPdfToCloudinary(pdfBlob, fileName)

  // Buscar si ya existe una boleta activa para este período
  let boletaExistenteId = null
  try {
    const existentes = await reportCardsService.getByStudentId(student.id)
    const arr = Array.isArray(existentes) ? existentes : []
    const anterior = arr.find(b =>
      b.periodNumber === periodNumber &&
      b.academicYear === academicYear &&
      b.status !== 'DELETED'
    )
    if (anterior?.id) boletaExistenteId = anterior.id
  } catch (_e) {}

  const payload = {
    studentId: student.id,
    classroomId: classroom.id,
    institutionId: user.institutionId,
    academicYear,
    periodType: 'BIMESTRE',
    periodNumber,
    attendancePercentage: attendancePercentage || null,
    generalObservations: observations || null,
    pdfUrl,
    status: 'DRAFT'
  }

  if (boletaExistenteId) {
    await reportCardsService.update(boletaExistenteId, payload)
  } else {
    await reportCardsService.create(payload)
  }
  return pdfUrl
}

export async function generarBoletasMasivas({
  students, classroom, user, institution,
  cursosConCompetencias, periodNumber, academicYear,
  reportCardsService, onProgress,
}) {
  const escudoBase64 = await loadImageAsBase64(ESCUDO_URL)
  const resultados = []
  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    if (onProgress) onProgress(i + 1, students.length)
    try {
      const pdfUrl = await generarBoletaIndividual({
        student, classroom, user, institution,
        cursosConCompetencias, periodNumber, academicYear,
        reportCardsService, escudoBase64,
      })
      resultados.push({ studentId: student.id, success: true, pdfUrl })
    } catch (err) {
      resultados.push({ studentId: student.id, success: false, error: err.message })
    }
  }
  return resultados
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERADOR PDF — FORMATO MINEDU — PORTRAIT A4
// ─────────────────────────────────────────────────────────────────────────────
async function generarPDF({
  student, classroom, user, institution,
  cursosConCompetencias,
  nlPorBimestre, nlPorCompetencia,
  periodNumber, academicYear,
  observations, attendancePercentage,
  escudoBase64,
  asistenciaPorBimestre = {},
  competencyComments = {},
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const M = 10          // margen
  const CW = PW - M * 2 // ancho útil = 190mm

  // ── utilidades ──────────────────────────────────────────────────────────────
  const setFont = (bold, size, color = [0, 0, 0]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }

  // Dibuja una celda con borde, relleno opcional y texto centrado/izquierda
  const cell = (txt, x, y, w, h, opts = {}) => {
    const { bold = false, size = 6.5, align = 'left', fill = null, color = [0,0,0], vpad = 1.5 } = opts
    doc.setDrawColor(80, 80, 80)
    if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'FD') }
    else doc.rect(x, y, w, h)
    setFont(bold, size, color)
    const lines = doc.splitTextToSize(String(txt ?? ''), w - 2)
    const lh = size * 0.38
    const totalTH = lines.length * lh
    const ty = y + h / 2 - totalTH / 2 + lh - 0.5
    lines.forEach((l, i) => {
      if (align === 'center') doc.text(l, x + w / 2, ty + i * lh, { align: 'center' })
      else doc.text(l, x + vpad + 1, ty + i * lh)
    })
    doc.setTextColor(0, 0, 0)
  }

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  let y = M

  // Escudo (izquierda)
  if (escudoBase64 && escudoBase64.startsWith('data:image')) {
    try {
      doc.addImage(escudoBase64, 'PNG', M, y, 18, 22)
    } catch (_e) {
      // fallback silencioso si la imagen falla
    }
  }

  // Bloque central de texto
  setFont(true, 7.5, [0, 0, 0])
  doc.text('MINISTERIO DE EDUCACIÓN', PW / 2, y + 5, { align: 'center' })
  setFont(false, 6.5)
  doc.text('REPÚBLICA DEL PERÚ', PW / 2, y + 9.5, { align: 'center' })
  setFont(true, 8.5)
  doc.text('INFORME DE PROGRESO DE LAS COMPETENCIAS', PW / 2, y + 15, { align: 'center' })
  doc.text('DEL ESTUDIANTE - ' + academicYear, PW / 2, y + 20, { align: 'center' })

  y += 26

  // ── DATOS INSTITUCIÓN ──────────────────────────────────────────────────────
  const rH = 6   // row height
  const lW = 28  // label width
  const vW = 67  // value width  (dos columnas → lW+vW+lW+vW = 190)

  // fila 1
  cell('DRE:', M, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(institution?.dre || '—', M + lW, y, vW, rH)
  cell('UGEL:', M + lW + vW, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(institution?.ugel || '—', M + lW * 2 + vW, y, vW, rH)
  y += rH

  // fila 2
  cell('Nivel:', M, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(institution?.institutionLevel || classroom?.classroomAge || '—', M + lW, y, vW, rH)
  cell('Código Modular:', M + lW + vW, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(institution?.modularCode || '—', M + lW * 2 + vW, y, vW, rH)
  y += rH

  // fila 3 — IE ocupa todo el ancho
  cell('Institución educativa:', M, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(institution?.name || '—', M + lW, y, CW - lW, rH)
  y += rH + 1

  // ── DATOS ESTUDIANTE ──────────────────────────────────────────────────────
  const studentName = [student?.lastName, student?.motherLastName].filter(Boolean).join(' ') + ', ' + (student?.firstName || '')
  const teacherName = [user?.lastName, user?.firstName].filter(Boolean).join(', ')
  const gradoVal = classroom?.classroomAge || '—'
  const seccionVal = classroom?.classroomName || '—'

  cell('Grado:', M, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(gradoVal, M + lW, y, vW, rH)
  cell('Sección:', M + lW + vW, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(seccionVal, M + lW * 2 + vW, y, vW, rH)
  y += rH

  cell('Apellidos y nombres del estudiante:', M, y, lW + 20, rH, { bold: true, fill: [235,240,250] })
  cell(studentName, M + lW + 20, y, CW - lW - 20, rH)
  y += rH

  cell('Código del estudiante:', M, y, lW, rH, { bold: true, fill: [235,240,250] })
  cell(student?.cui || '—', M + lW, y, vW - 10, rH)
  cell('DNI:', M + lW + vW - 10, y, 14, rH, { bold: true, fill: [235,240,250] })
  cell(student?.documentNumber || '—', M + lW + vW + 4, y, CW - lW - vW - 4, rH)
  y += rH

  cell('Apellidos y nombres del docente o tutor:', M, y, lW + 20, rH, { bold: true, fill: [235,240,250] })
  cell(teacherName, M + lW + 20, y, CW - lW - 20, rH)
  y += rH + 2

  // ── TABLA DE COMPETENCIAS ──────────────────────────────────────────────────
  // Ancho total = 190mm
  // Área(25) | Competencias(55) | [B1 NL(7) + B1 Conc(20)] × 4 | NL Final(8)
  // = 25 + 55 + 4×27 + 8 = 196 → ajustamos Competencias a 49
  const cA = 25   // área
  const cC = 49   // competencia
  const cNL = 7   // NL por bimestre
  const cD = 20   // conclusión por bimestre
  const cF = 8    // NL final
  // total = 25+49+4*(7+20)+8 = 25+49+108+8 = 190 ✓

  const hH1 = 7   // header fila 1
  const hH2 = 6   // header fila 2
  const hFill = [210, 225, 245]
  const hFill2 = [225, 235, 250]

  // Cabecera fila 1
  cell('Área\ncurricular', M, y, cA, hH1 + hH2, { bold: true, size: 6, align: 'center', fill: hFill })
  cell('Competencias', M + cA, y, cC, hH1 + hH2, { bold: true, size: 6, align: 'center', fill: hFill })

  let bx = M + cA + cC
  for (let b = 1; b <= 4; b++) {
    cell(b + '° BIMESTRE', bx, y, cNL + cD, hH1, { bold: true, size: 6, align: 'center', fill: hFill })
    cell('NL', bx, y + hH1, cNL, hH2, { bold: true, size: 5.5, align: 'center', fill: hFill2 })
    cell('Conclusión descriptiva', bx + cNL, y + hH1, cD, hH2, { bold: true, size: 5, align: 'center', fill: hFill2 })
    bx += cNL + cD
  }
  cell('NL\nfinal', bx, y, cF, hH1 + hH2, { bold: true, size: 5.5, align: 'center', fill: hFill })

  y += hH1 + hH2

  // ── FILAS ──────────────────────────────────────────────────────────────────
  const rHc = 7.5  // row height competencia
  const NL_COLOR = { AD: [0,120,0], A: [0,70,160], B: [160,100,0], C: [160,0,0] }

  const TRANSVERSAL_KW = ['tic', 'entornos virtuales', 'aprendizaje de manera autónoma', 'gestiona su aprendizaje']
  const cursosNorm = cursosConCompetencias
  const cursosTrans = []

  const checkPage = (needed) => {
    if (y + needed > PH - 50) { doc.addPage(); y = M }
  }

  const drawRows = (cursos) => {
    cursos.forEach((curso, ci) => {
      const comps = curso.competencies || []
      const rowCount = comps.length || 1
      checkPage(rowCount * rHc)
      const aH = rowCount * rHc
      const aFill = ci % 2 === 0 ? [245, 248, 255] : [255, 255, 255]
      cell(curso.name.toUpperCase(), M, y, cA, aH, { bold: true, size: 5, align: 'center', fill: aFill })

      if (!comps.length) {
        // Curso sin competencias — fila vacía
        const rFill = [250, 252, 255]
        cell('', M + cA, y, cC, rHc, { size: 5.5, fill: rFill })
        let cx = M + cA + cC
        for (let b = 1; b <= 4; b++) {
          cell('', cx, y, cNL, rHc, { fill: rFill })
          cell('', cx + cNL, y, cD, rHc, { fill: rFill })
          cx += cNL + cD
        }
        cell('', cx, y, cF, rHc, { fill: rFill })
        y += rHc
        return
      }

      comps.forEach((comp, idx) => {
        const ry = y + idx * rHc
        const rFill = idx % 2 === 0 ? [250, 252, 255] : [255, 255, 255]
        cell(comp.name, M + cA, ry, cC, rHc, { size: 5.5, fill: rFill })

        let cx = M + cA + cC
        for (let b = 1; b <= 4; b++) {
          const nl = nlPorBimestre[b]?.[comp.id] || ''
          const conc = competencyComments[comp.id]?.[b] || ''
          const nlCol = NL_COLOR[nl] || [0, 0, 0]
          cell(nl, cx, ry, cNL, rHc, { bold: true, size: 6.5, align: 'center', fill: rFill, color: nlCol })
          cell(conc, cx + cNL, ry, cD, rHc, { size: 4, fill: rFill })
          cx += cNL + cD
        }
        const nlF = nlPorCompetencia?.[comp.id] || ''
        const nlFCol = NL_COLOR[nlF] || [0, 0, 0]
        cell(nlF, cx, ry, cF, rHc, { bold: true, size: 6.5, align: 'center', fill: rFill, color: nlFCol })
      })
      y += aH
    })
  }

  drawRows(cursosNorm)

  // Competencias transversales
  if (cursosTrans.length) {
    const transComps = cursosTrans.flatMap(c => c.competencies || [])
    if (transComps.length) {
      checkPage(transComps.length * rHc + 4)
      const tH = transComps.length * rHc
      cell('Competencias transversales / No asociada(s) a área(s)', M, y, cA + cC, tH, { bold: true, size: 5, align: 'center', fill: [230, 238, 252] })
      transComps.forEach((comp, idx) => {
        const ry = y + idx * rHc
        const rFill = [242, 246, 255]
        let cx = M + cA + cC
        for (let b = 1; b <= 4; b++) {
          const nl = nlPorBimestre[b]?.[comp.id] || ''
          const conc = competencyComments[comp.id]?.[b] || ''
          const nlCol = NL_COLOR[nl] || [0, 0, 0]
          cell(nl, cx, ry, cNL, rHc, { bold: true, size: 6.5, align: 'center', fill: rFill, color: nlCol })
          cell(conc, cx + cNL, ry, cD, rHc, { size: 4, fill: rFill })
          cx += cNL + cD
        }
        const nlF = nlPorCompetencia?.[comp.id] || ''
        const nlFCol = NL_COLOR[nlF] || [0, 0, 0]
        cell(nlF, M + cA + cC + 4 * (cNL + cD), ry, cF, rHc, { bold: true, size: 6.5, align: 'center', fill: [242,246,255], color: nlFCol })
      })
      y += tH
    }
  }

  y += 4

  // ── LEYENDA ────────────────────────────────────────────────────────────────
  checkPage(20)
  const lvls = [
    { code: 'AD', label: 'LOGRO DESTACADO', desc: 'El estudiante evidencia un nivel superior a lo esperado respecto a la competencia. Demuestra aprendizajes que van más allá del nivel esperado.', col: [0,120,0] },
    { code: 'A',  label: 'LOGRO ESPERADO',  desc: 'El estudiante evidencia el nivel esperado respecto a la competencia, demostrando manejo satisfactorio en todas las tareas propuestas y en el tiempo programado.', col: [0,70,160] },
    { code: 'B',  label: 'EN PROCESO',      desc: 'El estudiante está próximo o cerca al nivel esperado respecto a la competencia, para lo cual requiere acompañamiento durante un tiempo razonable para lograrlo.', col: [160,100,0] },
    { code: 'C',  label: 'EN INICIO',       desc: 'El estudiante muestra progreso mínimo en una competencia de acuerdo al nivel esperado. Evidencia con frecuencia dificultades en el desarrollo de las tareas, por lo que necesita mayor tiempo de acompañamiento e intervención del docente.', col: [160,0,0] },
  ]
  const lW2 = CW / 4
  const lH = 16
  lvls.forEach((lv, i) => {
    const lx = M + i * lW2
    cell(lv.code, lx, y, 10, lH, { bold: true, size: 9, align: 'center', fill: [245,245,245], color: lv.col })
    cell(lv.label + '\n' + lv.desc, lx + 10, y, lW2 - 10, lH, { size: 4.5, fill: [252,252,252] })
  })
  y += lH + 3

  // ── ASISTENCIA ─────────────────────────────────────────────────────────────
  checkPage(30)
  const aCols = [18, 28, 28, 28, 28]
  const aHdr = ['Período', 'Inasistencias\nJustificadas', 'Inasistencias\nInjustificadas', 'Tardanzas\nJustificadas', 'Tardanzas\nInjustificadas']
  let ax = M
  aHdr.forEach((h, i) => {
    cell(h, ax, y, aCols[i], 10, { bold: true, size: 5.5, align: 'center', fill: [225,235,250] })
    ax += aCols[i]
  })
  y += 10
  for (let b = 1; b <= 4; b++) {
    const a = asistenciaPorBimestre[b] || {}
    ax = M
    const fmt = (n) => (n > 0 ? String(n) : '')
    ;[
      `B${b}`,
      fmt(a.faltasJustificadas),
      fmt(a.faltasInjustificadas),
      fmt(a.tardiasJustificadas),
      fmt(a.tardiasInjustificadas),
    ].forEach((v, i) => {
      cell(v, ax, y, aCols[i], 6, { size: 6, align: i === 0 ? 'center' : 'center' })
      ax += aCols[i]
    })
    y += 6
  }
  y += 3

  // ── COMENTARIO + SITUACIÓN ─────────────────────────────────────────────────
  checkPage(20)
  const halfW = CW / 2 - 1
  cell('Comentario General', M, y, halfW, 6, { bold: true, size: 6.5, fill: [235,240,250] })
  cell('Situación al finalizar el período lectivo', M + halfW + 2, y, halfW, 6, { bold: true, size: 6.5, fill: [235,240,250] })
  y += 6
  cell(observations || '', M, y, halfW, 12, { size: 6 })
  cell('', M + halfW + 2, y, halfW, 12)
  y += 16

  // ── FIRMAS — en flujo, debajo del contenido con espacio para firmar ─────────
  checkPage(30)
  y += 18
  doc.setDrawColor(0)
  doc.line(M + 10, y, M + 70, y)
  doc.line(PW - M - 70, y, PW - M - 10, y)
  setFont(false, 6.5)
  doc.text('Firma del Docente o Tutor(a)', M + 40, y + 4, { align: 'center' })
  doc.text('Firma y sello del Director(a)', PW - M - 40, y + 4, { align: 'center' })

  // ── PIE — anclado al fondo de la última página ──────────────────────────────
  setFont(false, 5.5, [130, 130, 130])
  const fecha = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  doc.text('Fecha de Emisión: ' + fecha, PW / 2, PH - 10, { align: 'center' })
  doc.text('Versión del SIGEI: ' + academicYear + '.1', PW / 2, PH - 6, { align: 'center' })

  return doc.output('blob')
}
