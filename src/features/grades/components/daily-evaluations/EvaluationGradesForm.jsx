import { StudentChecklist } from './index'

export default function EvaluationGradesForm({
  classroom,
  course,
  competency,
  evaluationDate,
  details,
  onDetailUpdate,
  onSave,
  onBack,
  loading,
  user,
  institutionName
}) {
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

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">Resumen de la Evaluación</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-600">Aula:</span>
            <span className="ml-2 font-medium">{classroom?.classroomName}</span>
          </div>
          <div>
            <span className="text-gray-600">Curso:</span>
            <span className="ml-2 font-medium">{course?.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Competencia:</span>
            <span className="ml-2 font-medium">{competency?.name}</span>
          </div>
          <div>
            <span className="text-gray-600">Fecha:</span>
            <span className="ml-2 font-medium">{evaluationDate}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <StudentChecklist
          classroom={classroom}
          course={course}
          competency={competency}
          evaluationDate={evaluationDate}
          details={details}
          onDetailUpdate={onDetailUpdate}
          onBack={onBack}
          onSave={onSave}
          loading={loading}
        />
      </div>
    </div>
  )
}
