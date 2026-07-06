export default function EvaluationFormFields({
  classroom,
  course,
  courses,
  competency,
  competencies,
  evaluationDate,
  loadingCompetencies,
  onCourseChange,
  onCompetencyChange,
  onDateChange
}) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            🏫 Aula
          </label>
          <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-700">
            {classroom?.classroomName || '—'}
            {classroom?.classroomAge && (
              <span className="ml-2 text-xs text-gray-400">
                ({classroom.classroomAge})
              </span>
            )}
          </div>
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
            onChange={e => onCourseChange(e.target.value)}
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
            onChange={e => onCompetencyChange(e.target.value)}
            disabled={loadingCompetencies || !competencies.length}
            className="px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
          >
            {loadingCompetencies && <option value="">Cargando...</option>}
            {!loadingCompetencies && !competencies.length && (
              <option value="">Sin competencias</option>
            )}
            {!loadingCompetencies &&
              competencies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
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
            onChange={e => onDateChange(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

      </div>
    </div>
  )
}
