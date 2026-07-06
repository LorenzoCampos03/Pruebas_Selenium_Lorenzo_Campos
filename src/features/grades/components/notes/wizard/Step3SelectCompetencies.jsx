import { useState } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'

export default function Step3SelectCompetencies({
  selectedCourses,
  competenciesByCourse,
  selectedCompetencies,
  onSelectCompetencies,
  availableCourses
}) {
  const [expandedCourses, setExpandedCourses] = useState(selectedCourses)

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const toggleCompetency = (courseId, competencyId) => {
    const current = selectedCompetencies[courseId] || []
    
    if (current.includes(competencyId)) {
      // Deseleccionar
      const updated = { ...selectedCompetencies }
      updated[courseId] = current.filter(id => id !== competencyId)
      if (updated[courseId].length === 0) {
        delete updated[courseId]
      }
      onSelectCompetencies(updated)
    } else {
      // Seleccionar
      if (current.length >= 3) {
        return // Máximo 3 por curso
      }
      onSelectCompetencies({
        ...selectedCompetencies,
        [courseId]: [...current, competencyId]
      })
    }
  }

  const getCourseName = (courseId) => {
    const course = availableCourses.find(c => c.id === courseId)
    return course?.name || course?.courseName || courseId
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Seleccionar Competencias</h3>
        <p className="text-sm text-gray-500">
          Selecciona entre 1 y 3 competencias por cada curso
        </p>
      </div>

      <div className="space-y-3">
        {selectedCourses.map(courseId => {
          const competencies = competenciesByCourse[courseId] || []
          const isExpanded = expandedCourses.includes(courseId)
          const selectedCount = (selectedCompetencies[courseId] || []).length

          return (
            <div key={courseId} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Course Header */}
              <button
                onClick={() => toggleCourse(courseId)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{selectedCount}</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">{getCourseName(courseId)}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedCount}/3 competencias seleccionadas
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {/* Competencies List */}
              {isExpanded && (
                <div className="p-4 space-y-2">
                  {competencies.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No hay competencias disponibles para este curso
                    </p>
                  ) : (
                    competencies.map(comp => {
                      const isSelected = (selectedCompetencies[courseId] || []).includes(comp.id)
                      const isDisabled = !isSelected && selectedCount >= 3

                      return (
                        <button
                          key={comp.id}
                          onClick={() => !isDisabled && toggleCompetency(courseId, comp.id)}
                          disabled={isDisabled}
                          className={`
                            w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : isDisabled
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5
                            ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}
                          `}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {comp.name || comp.competencyName}
                            </p>
                            {comp.description && (
                              <p className="text-xs text-gray-500 mt-1">{comp.description}</p>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                  {selectedCount >= 3 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mt-3">
                      ⚠️ Máximo 3 competencias por curso
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
