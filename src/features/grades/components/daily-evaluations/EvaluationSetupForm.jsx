import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { dailyEvaluationService } from '../../services/DailyEvaluation.service'

export default function EvaluationSetupForm({ 
  classrooms, 
  classroom, 
  setClassroom,
  courses,
  course,
  setCourse,
  competencies,
  competency,
  setCompetency,
  evaluationDate,
  setEvaluationDate,
  institutionName,
  user,
  loadingCompetencies,
  onContinue,
  onBack
}) {
  const [validatingCompetency, setValidatingCompetency] = useState(false)
  const [competencyError, setCompetencyError] = useState(null)

  const checkIfCompetencyEvaluated = async (competencyId) => {
    if (!classroom?.id || !course?.id || !competencyId) return false
    
    setValidatingCompetency(true)
    setCompetencyError(null)
    
    try {
      // Obtener todas las evaluaciones
      const evaluations = await dailyEvaluationService.list()
      
      // Filtrar evaluaciones que coincidan con aula y curso (sin importar fecha)
      const matchingEvaluations = evaluations.filter(
        e => e.classroomId === classroom.id && e.courseId === course.id
      )
      
      // Verificar si la competencia ya fue evaluada
      for (const evaluation of matchingEvaluations) {
        const details = await dailyEvaluationService.getDetails(evaluation.id)
        const hasCompetency = details.some(detail => detail.competencyId === competencyId)
        
        if (hasCompetency) {
          return true
        }
      }
      
      return false
    } catch (err) {
      console.error('[EvaluationSetup] Error verificando competencia:', err)
      return false
    } finally {
      setValidatingCompetency(false)
    }
  }

  const handleCompetencyChange = async (competencyId) => {
    const selected = competencies.find(c => c.id === competencyId)
    if (!selected) return
    
    setCompetency(selected)
    setCompetencyError(null)
    
    // Validar si ya fue evaluada
    const isEvaluated = await checkIfCompetencyEvaluated(competencyId)
    
    if (isEvaluated) {
      setCompetencyError('Esta competencia ya ha sido evaluada para este aula y curso')
      toast.error('Esta competencia ya ha sido evaluada')
    }
  }

  const handleContinue = () => {
    if (!classroom) {
      toast.error('Debes seleccionar un aula')
      return
    }
    if (!course) {
      toast.error('Debes seleccionar un curso')
      return
    }
    if (!competency) {
      toast.error('Debes seleccionar una competencia')
      return
    }
    if (competencyError) {
      toast.error('No puedes continuar con una competencia ya evaluada')
      return
    }
    if (!evaluationDate) {
      toast.error('Debes seleccionar una fecha')
      return
    }
    
    onContinue()
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm flex flex-wrap gap-6">
        <span>
          👤 Profesor: <strong>{user?.firstName} {user?.lastName}</strong>
        </span>
        <span>
          🏫 Institución: <strong>{institutionName || '—'}</strong>
        </span>
      </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Configuración de la Evaluación</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="classroom-select"
              className="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              🏫 Aula
            </label>
            <select
              id="classroom-select"
              value={classroom?.id || ''}
              onChange={e => setClassroom(classrooms.find(c => c.id === e.target.value))}
              disabled={!classrooms.length}
              className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {!classrooms.length && (
                <option value="">Sin aulas disponibles</option>
              )}
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>
                  {c.classroomName}{c.classroomAge ? ` (${c.classroomAge})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="course-select"
              className="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              📚 Curso
            </label>
            <select
              id="course-select"
              value={course?.id || ''}
              onChange={e => setCourse(courses.find(c => c.id === e.target.value))}
              disabled={!courses.length}
              className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {!courses.length && (
                <option value="">Sin cursos para este nivel</option>
              )}
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="competency-select"
              className="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              🎯 Competencia
            </label>
            <select
              id="competency-select"
              value={competency?.id || ''}
              onChange={e => handleCompetencyChange(e.target.value)}
              disabled={loadingCompetencies || !competencies.length || validatingCompetency}
              className={`px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400 ${
                competencyError ? 'border-red-500' : ''
              }`}
            >
              {loadingCompetencies && <option value="">Cargando...</option>}
              {validatingCompetency && <option value="">Validando...</option>}
              {!loadingCompetencies && !validatingCompetency && !competencies.length && (
                <option value="">Sin competencias</option>
              )}
              {!loadingCompetencies && !validatingCompetency &&
                competencies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {competencyError && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                {competencyError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="evaluation-date"
              className="text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              📅 Fecha de evaluación
            </label>
            <input
              id="evaluation-date"
              type="date"
              value={evaluationDate}
              onChange={e => setEvaluationDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Volver al listado
          </button>
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={!classroom || !course || !competency || !evaluationDate || !!competencyError || validatingCompetency}
            className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  )
}
