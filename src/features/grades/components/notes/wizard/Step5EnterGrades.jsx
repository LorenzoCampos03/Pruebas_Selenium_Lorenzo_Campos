export default function Step5EnterGrades({
  students,
  selectedCourses,
  selectedCompetencies,
  selectedCapacities,
  competenciesByCourse,
  capacitiesByCompetency,
  availableCourses,
  grades,
  onGradeChange
}) {
  const GRADE_OPTIONS = ['AD', 'A', 'B', 'C']

  const handleGradeChange = (studentId, competencyId, capacityId, value) => {
    const key = `${studentId}-${competencyId}-${capacityId}`
    onGradeChange({
      ...grades,
      [key]: value || null
    })
  }

  const getCourseName = (courseId) => {
    const course = availableCourses.find(c => String(c.id) === String(courseId))
    return course?.name || course?.courseName || courseId
  }

  const getCompetencyName = (compId) => {
    for (const comps of Object.values(competenciesByCourse)) {
      const comp = comps.find(c => String(c.id) === String(compId))
      if (comp) return comp.name || comp.competencyName || compId
    }
    return compId
  }

  const getCapacityName = (capId) => {
    // Buscar en todas las capacidades cargadas
    for (const caps of Object.values(capacitiesByCompetency)) {
      const cap = caps.find(c => String(c.id) === String(capId))
      if (cap) {
        const name = cap.name || cap.capacityName || cap.description
        console.log('Capacidad encontrada:', { id: capId, name, cap })
        return name || capId
      }
    }
    console.warn('Capacidad no encontrada:', capId)
    return capId
  }

  // Build table structure
  const tableStructure = []
  selectedCourses.forEach(courseId => {
    const competencyIds = selectedCompetencies[courseId] || []
    competencyIds.forEach(compId => {
      const capacityId = selectedCapacities[compId]
      if (capacityId) {
        tableStructure.push({
          courseId,
          courseName: getCourseName(courseId),
          competencyId: compId,
          competencyName: getCompetencyName(compId),
          capacityId,
          capacityName: getCapacityName(capacityId)
        })
      }
    })
  })

  // Group by course for header
  const courseGroups = {}
  tableStructure.forEach(item => {
    if (!courseGroups[item.courseId]) {
      courseGroups[item.courseId] = []
    }
    courseGroups[item.courseId].push(item)
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingresar Notas</h3>
        <p className="text-sm text-gray-500">
          Ingresa las calificaciones para cada estudiante
        </p>
      </div>

      {/* Restricciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-yellow-900 mb-2">
          ⚠ Restricciones de esta evaluación:
        </p>
        <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
          <li>Máximo 5 cursos por evaluación</li>
          <li>Máximo 3 competencias por curso</li>
          <li>1 sola capacidad por competencia</li>
          <li>Notas permitidas: AD, A, B, C</li>
        </ul>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            {/* Header - 3 niveles */}
            <thead>
              {/* Nivel 1: Cursos */}
              <tr className="bg-blue-900 text-white">
                <th rowSpan={3} className="sticky left-0 z-20 bg-blue-900 px-3 py-2 text-xs font-semibold border-r border-blue-800 w-12">
                  N°
                </th>
                <th rowSpan={3} className="sticky left-12 z-20 bg-blue-900 px-4 py-2 text-xs font-semibold text-left border-r border-blue-800 min-w-[200px]">
                  Apellidos y Nombres
                </th>
                {Object.entries(courseGroups).map(([courseId, items]) => (
                  <th
                    key={courseId}
                    colSpan={items.length}
                    className="px-4 py-2 text-xs font-semibold border-r border-blue-800"
                  >
                    {items[0].courseName}
                  </th>
                ))}
              </tr>

              {/* Nivel 2: Competencias */}
              <tr className="bg-blue-700 text-white">
                {tableStructure.map((item, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-xs font-medium border-r border-blue-600 min-w-[120px]"
                  >
                    <div className="truncate" title={item.competencyName}>
                      {item.competencyName.length > 20
                        ? item.competencyName.substring(0, 20) + '...'
                        : item.competencyName}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Nivel 3: Capacidades */}
              <tr className="bg-blue-500 text-white">
                {tableStructure.map((item, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-xs font-normal border-r border-blue-400"
                  >
                    <div className="truncate" title={item.capacityName}>
                      {item.capacityName.length > 20
                        ? item.capacityName.substring(0, 20) + '...'
                        : item.capacityName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {students.map((student, idx) => (
                <tr
                  key={student.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {/* Número */}
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-xs text-center border-r border-gray-200">
                    {idx + 1}
                  </td>

                  {/* Nombre */}
                  <td className="sticky left-12 z-10 bg-inherit px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                    {student.lastName} {student.firstName}
                  </td>

                  {/* Notas */}
                  {tableStructure.map((item, colIdx) => {
                    const key = `${student.id}-${item.competencyId}-${item.capacityId}`
                    const value = grades[key] || ''

                    return (
                      <td
                        key={colIdx}
                        className="px-2 py-2 border-r border-gray-200"
                      >
                        <select
                          value={value}
                          onChange={(e) => handleGradeChange(
                            student.id,
                            item.competencyId,
                            item.capacityId,
                            e.target.value
                          )}
                          className={`
                            w-full px-2 py-1.5 text-xs text-center rounded border focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            ${value === 'AD' ? 'bg-green-50 border-green-300 text-green-800 font-bold' :
                              value === 'A' ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold' :
                              value === 'B' ? 'bg-yellow-50 border-yellow-300 text-yellow-800 font-bold' :
                              value === 'C' ? 'bg-red-50 border-red-300 text-red-800 font-bold' :
                              'bg-white border-gray-300 text-gray-500'}
                          `}
                        >
                          <option value="">-</option>
                          {GRADE_OPTIONS.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Leyenda:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-green-100 border border-green-300 rounded flex items-center justify-center font-bold text-green-800">
              AD
            </div>
            <span className="text-gray-600">Logro destacado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-blue-100 border border-blue-300 rounded flex items-center justify-center font-bold text-blue-800">
              A
            </div>
            <span className="text-gray-600">Logro previsto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center font-bold text-yellow-800">
              B
            </div>
            <span className="text-gray-600">En proceso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 bg-red-100 border border-red-300 rounded flex items-center justify-center font-bold text-red-800">
              C
            </div>
            <span className="text-gray-600">En inicio</span>
          </div>
        </div>
      </div>
    </div>
  )
}
