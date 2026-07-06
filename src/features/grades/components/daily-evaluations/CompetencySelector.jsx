import { useState, useEffect } from 'react'
import { Target, ChevronLeft, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { useAuth } from '@/core/auth/AuthContext'
import { dailyEvaluationService } from '../../services/DailyEvaluation.service'

export default function CompetencySelector({ classroom, course, onSelect, onBack }) {
  const { user } = useAuth()
  const [competencies, setCompetencies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompetencies = async () => {
      try {
        setLoading(true)
        // Usar el endpoint correcto del backend
        const competencyIds = await dailyEvaluationService.getCompetenciesByTeacherAndCourse(
          user.userId,
          course.id
        )
        
        if (!competencyIds || competencyIds.length === 0) {
          setCompetencies([])
          toast.info('No hay competencias disponibles')
          return
        }

        // Obtener detalles de las competencias desde el microservicio académico
        const competencyDetailsPromises = competencyIds.map(competencyId =>
          apiClient.get(`/api/v1/competencies/${competencyId}`).catch(() => null)
        )
        
        const responses = await Promise.all(competencyDetailsPromises)
        const competencies = responses
          .filter(r => r !== null)
          .map(r => r.data)
        
        setCompetencies(competencies)
      } catch (error) {
        toast.error('Error al cargar competencias')
        console.error(error)
        setCompetencies([])
      } finally {
        setLoading(false)
      }
    }

    if (user?.userId && course?.id) {
      fetchCompetencies()
    }
  }, [course.id, user?.userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
        >
          <ChevronLeft size={20} />
          Atrás
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Paso 3: Selecciona la Competencia</h2>
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          <p>Aula: {classroom.name}</p>
          <p>Curso: {course.name}</p>
        </div>
      </div>

      {competencies.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay competencias disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competencies.map(competency => (
            <button
              key={competency.id}
              onClick={() => onSelect(competency)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Target className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{competency.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Código: {competency.code}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}