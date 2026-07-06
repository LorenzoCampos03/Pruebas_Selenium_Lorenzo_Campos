import { useState, useEffect } from 'react'
import { BookOpen, ChevronLeft, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { useAuth } from '@/core/auth/AuthContext'
import { dailyEvaluationService } from '../../services/DailyEvaluation.service'

export default function CourseSelector({ classroom, onSelect, onBack }) {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        // Usar el endpoint correcto del backend
        const courseIds = await dailyEvaluationService.getCoursesByTeacherAndClassroom(
          user.userId,
          classroom.id
        )
        
        if (!courseIds || courseIds.length === 0) {
          setCourses([])
          toast.info('No hay cursos asignados para esta aula')
          return
        }

        // Obtener detalles de los cursos desde el microservicio académico
        const courseDetailsPromises = courseIds.map(courseId =>
          apiClient.get(`/api/v1/courses/${courseId}`).catch(() => null)
        )
        
        const responses = await Promise.all(courseDetailsPromises)
        const allCourses = responses
          .filter(r => r !== null)
          .map(r => r.data)
        
        // Filtrar cursos por nivel de edad del aula
        const classroomAge = classroom.classroomAge || classroom.age || classroom.ageLevel
        const filteredCourses = classroomAge
          ? allCourses.filter(course => course.ageLevel === classroomAge)
          : allCourses
        
        setCourses(filteredCourses)
        
        if (filteredCourses.length === 0 && allCourses.length > 0) {
          toast.info(`No hay cursos para el nivel "${classroomAge}" en esta aula`)
        }
      } catch (error) {
        toast.error('Error al cargar cursos')
        console.error(error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    if (user?.userId && classroom?.id) {
      fetchCourses()
    }
  }, [classroom.id, classroom.ageLevel, user?.userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4 transition-colors"
        >
          <ChevronLeft size={20} />
          Volver
        </button>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Selecciona el Curso</h2>
          <p className="text-indigo-100">
            Aula: <span className="font-semibold">{classroom.name}</span>
            {classroom.ageLevel && <span className="ml-3 px-3 py-1 bg-white/20 rounded-full text-sm">Nivel: {classroom.ageLevel} años</span>}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <BookOpen size={40} className="text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium">No hay cursos disponibles</p>
          <p className="text-gray-500 text-sm mt-2">
            {classroom.ageLevel ? `No se encontraron cursos para ${classroom.ageLevel} años` : 'No hay cursos asignados a esta aula'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => onSelect(course)}
              className="group p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all text-left transform hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <BookOpen className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{course.code}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-1">{course.areaCurricular}</p>
                  {course.ageLevel && (
                    <span className="inline-block mt-2 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                      {course.ageLevel} años
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}