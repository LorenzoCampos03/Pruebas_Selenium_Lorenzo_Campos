import { useState } from 'react'
import { generarBoletaIndividual, generarBoletasMasivas } from '../services/reportCardGenerator.service'
import { reportCardsService } from '../services/ReportCard.service'

export function useReportCardGenerator({ 
  classroom, 
  user, 
  institution, 
  periodNumber, 
  academicYear,
  getCursos,
  onComplete 
}) {
  const [generando, setGenerando] = useState(false)
  const [generandoId, setGenerandoId] = useState(null)
  const [progreso, setProgreso] = useState({ current: 0, total: 0 })

  const handleGenerarIndividual = async (student) => {
    try {
      setGenerando(true)
      setGenerandoId(student.id)
      const cursos = await getCursos()
      
      if (!classroom) { 
        alert('No se encontro el aula.')
        return 
      }
      
      if (!cursos.length) { 
        alert('No se pudieron cargar los cursos.')
        return 
      }
      
      await generarBoletaIndividual({
        student, 
        classroom, 
        user, 
        institution,
        cursosConCompetencias: cursos,
        periodNumber, 
        academicYear, 
        reportCardsService,
      })
      
      await onComplete()
    } catch (err) {
      console.error('[ReportCardGenerator] Error generando:', err)
      alert('Error: ' + err.message)
    } finally {
      setGenerando(false)
      setGenerandoId(null)
    }
  }

  const handleGenerarMasivo = async (students) => {
    if (!students.length) { 
      alert('No hay estudiantes')
      return 
    }
    
    if (!window.confirm('Generar boletas para ' + students.length + ' estudiantes?')) {
      return
    }
    
    try {
      setGenerando(true)
      setProgreso({ current: 0, total: students.length })
      const cursos = await getCursos()
      
      if (!cursos.length) { 
        alert('No se pudieron cargar los cursos.')
        return 
      }
      
      const res = await generarBoletasMasivas({
        students, 
        classroom, 
        user, 
        institution,
        cursosConCompetencias: cursos,
        periodNumber, 
        academicYear, 
        reportCardsService,
        onProgress: (c, t) => setProgreso({ current: c, total: t }),
      })
      
      const ok = res.filter(r => r.success).length
      const fail = res.filter(r => !r.success).length
      alert(ok + ' generadas, ' + fail + ' con error.')
      
      await onComplete()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGenerando(false)
      setProgreso({ current: 0, total: 0 })
    }
  }

  return {
    generando,
    generandoId,
    progreso,
    handleGenerarIndividual,
    handleGenerarMasivo
  }
}
