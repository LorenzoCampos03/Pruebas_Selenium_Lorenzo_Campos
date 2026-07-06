import { Target } from 'lucide-react'

export default function Step4SelectCapacities({
  selectedCompetencies,
  capacitiesByCompetency,
  selectedCapacities,
  onSelectCapacities,
  availableCourses
}) {
  const handleSelectCapacity = (competencyId, capacityId) => {
    onSelectCapacities({
      ...selectedCapacities,
      [competencyId]: capacityId
    })
  }

  const getCourseName = (courseId) => {
    const course = availableCourses.find(c => c.id === courseId)
    return course?.name || course?.courseName || courseId
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Seleccionar Capacidades</h3>
        <p className="text-sm text-gray-500">
          Selecciona exactamente 1 capacidad por cada competencia
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(selectedCompetencies).map(([courseId, competencyIds]) => (
          <div key={courseId} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {getCourseName(courseId)}
            </h4>

            <div className="space-y-4 pl-4">
              {competencyIds.map(compId => {
                const capacities = capacitiesByCompetency[compId] || []
                const selectedCapacity = selectedCapacities[compId]

                return (
                  <div key={compId} className="border-l-2 border-gray-200 pl-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Competencia: {compId}
                    </p>

                    {capacities.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">
                        No hay capacidades disponibles
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {capacities.map(capacity => {
                          const isSelected = selectedCapacity === capacity.id
                          const isAlreadyEvaluated = capacity.alreadyEvaluated

                          return (
                            <button
                              key={capacity.id}
                              onClick={() => !isAlreadyEvaluated && handleSelectCapacity(compId, capacity.id)}
                              disabled={isAlreadyEvaluated}
                              className={`
                                w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3
                                ${isAlreadyEvaluated
                                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                }
                              `}
                            >
                              <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                                ${isAlreadyEvaluated
                                  ? 'border-gray-300 bg-gray-200'
                                  : isSelected
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                                }
                              `}>
                                {isAlreadyEvaluated ? (
                                  <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ) : isSelected ? (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                ) : null}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <Target size={16} className={`mt-0.5 flex-shrink-0 ${isAlreadyEvaluated ? 'text-gray-400' : 'text-gray-400'}`} />
                                  <div>
                                    <p className={`text-sm font-medium ${isAlreadyEvaluated ? 'text-gray-500' : 'text-gray-900'}`}>
                                      {capacity.name || capacity.capacityName}
                                      {isAlreadyEvaluated && (
                                        <span className="ml-2 text-xs font-semibold text-orange-600">
                                          (Ya evaluada)
                                        </span>
                                      )}
                                    </p>
                                    {capacity.description && (
                                      <p className={`text-xs mt-1 ${isAlreadyEvaluated ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {capacity.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Validation message */}
      {Object.keys(selectedCompetencies).length > 0 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            ℹ️ Debes seleccionar una capacidad por cada competencia antes de continuar
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            ⚠️ Las capacidades marcadas como "Ya evaluada" no se pueden seleccionar porque ya fueron evaluadas
          </div>
        </>
      )}
    </div>
  )
}
