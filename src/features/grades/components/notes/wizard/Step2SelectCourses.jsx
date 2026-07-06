import { BookOpen, Check } from 'lucide-react'

export default function Step2SelectCourses({ courses, selectedCourses, onSelectCourses }) {
  const toggleCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      onSelectCourses(selectedCourses.filter(id => id !== courseId))
    } else {
      if (selectedCourses.length >= 5) {
        return // No permitir más de 5
      }
      onSelectCourses([...selectedCourses, courseId])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Seleccionar Cursos</h3>
        <p className="text-sm text-gray-500 mb-1">
          Selecciona entre 1 y 5 cursos para evaluar
        </p>
        <p className="text-xs text-amber-600">
          {selectedCourses.length}/5 cursos seleccionados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(course => {
          const isSelected = selectedCourses.includes(course.id)
          const isDisabled = !isSelected && selectedCourses.length >= 5

          return (
            <button
              key={course.id}
              onClick={() => !isDisabled && toggleCourse(course.id)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}
                `}>
                  {isSelected ? (
                    <Check size={20} className="text-white" />
                  ) : (
                    <BookOpen size={20} className="text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{course.name || course.courseName}</h4>
                  {course.description && (
                    <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selectedCourses.length >= 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          ⚠️ Has alcanzado el máximo de 5 cursos permitidos
        </div>
      )}
    </div>
  )
}
