import { useState, useEffect } from 'react'
import { Users, ChevronLeft, Save, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { ACHIEVEMENT_LEVELS } from '../../models/dailyEvaluation.model'

export default function StudentChecklist({
  classroom,
  course,
  competency,
  evaluationDate,
  details,
  onDetailUpdate,
  onBack,
  onSave,
  loading,
  isEditMode = false,
}) {
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classroom?.id) {
        console.warn('[StudentChecklist] No classroom ID available')
        return
      }
      
      try {
        setLoadingStudents(true)
        const { data } = await apiClient.get(`/api/students/classroom/${classroom.id}`)
        setStudents(data.data || data)
      } catch (error) {
        toast.error('Error al cargar estudiantes')
        console.error(error)
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [classroom?.id])

  if (loadingStudents) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  const evaluatedCount = details.size
  const totalStudents = students.length

  return (
    <div>
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ChevronLeft size={20} />
            Atrás
          </button>
        )}
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Editar Evaluación de Estudiantes' : 'Paso 5: Evaluar Estudiantes'}
        </h2>
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          <p>Aula: {classroom?.name || classroom?.classroomName}</p>
          <p>Curso: {course?.name}</p>
          <p>Competencia: {competency?.name}</p>
          <p>Fecha: {new Date(evaluationDate).toLocaleDateString('es-PE')}</p>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso de Evaluación</span>
          <span className="text-sm font-bold text-indigo-600">
            {evaluatedCount} de {totalStudents}
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${(evaluatedCount / totalStudents) * 100}%` }}
          />
        </div>
      </div>

      {/* Lista de Estudiantes */}
      {students.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay estudiantes en esta aula</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {students.map(student => {
            const detailKey = `${student.id}-${competency.id}`
            const detail = details.get(detailKey)
            return (
              <StudentEvaluationRow
                key={student.id}
                student={student}
                competencyId={competency.id}
                detail={detail}
                onUpdate={onDetailUpdate}
              />
            )
          })}
        </div>
      )}

      {/* Botón Guardar */}
      <div className="mt-8 flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {isEditMode ? 'Cancelar' : 'Atrás'}
          </button>
        )}
        <button
          onClick={onSave}
          disabled={loading || evaluatedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              {isEditMode ? 'Actualizando...' : 'Guardando...'}
            </>
          ) : (
            <>
              <Save size={20} />
              {isEditMode ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function StudentEvaluationRow({ student, competencyId, detail, onUpdate }) {
  const [observation, setObservation] = useState(detail?.observation || '')
  const [achievementLevel, setAchievementLevel] = useState(detail?.achievementLevel || '')

  // Actualizar el estado cuando cambie el detalle (importante para modo edición)
  useEffect(() => {
    setObservation(detail?.observation || '')
    setAchievementLevel(detail?.achievementLevel || '')
  }, [detail])

  const handleLevelChange = (level) => {
    setAchievementLevel(level)
    onUpdate(student.id, competencyId, level, observation)
  }

  const handleObservationChange = (e) => {
    const newObservation = e.target.value
    setObservation(newObservation)
    onUpdate(student.id, competencyId, achievementLevel, newObservation)
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
      <div className="mb-3">
        <h4 className="font-medium text-gray-900">
          {student.lastName} {student.motherLastName}, {student.firstName}
        </h4>
        <p className="text-xs text-gray-500">CUI: {student.cui}</p>
      </div>

      {/* Niveles de Logro */}
      <div className="mb-3 flex gap-2 flex-wrap">
        {Object.entries(ACHIEVEMENT_LEVELS).map(([key, level]) => (
          <button
            key={level}
            onClick={() => handleLevelChange(level)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              achievementLevel === level
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Observación */}
      <input
        type="text"
        placeholder="Observación (opcional)"
        value={observation}
        onChange={handleObservationChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  )
}