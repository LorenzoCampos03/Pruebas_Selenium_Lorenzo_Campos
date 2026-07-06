import { Calendar, School } from 'lucide-react'

export default function Step1DateClassroom({
  evaluationDate,
  setEvaluationDate,
  classrooms,
  selectedClassroom,
  onSelectClassroom
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Generales</h3>
        <p className="text-sm text-gray-500 mb-6">
          Selecciona la fecha y el aula para la evaluación
        </p>
      </div>

      {/* Fecha de evaluación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar size={16} className="inline mr-2" />
          Fecha de Evaluación *
        </label>
        <input
          type="date"
          value={evaluationDate}
          onChange={(e) => setEvaluationDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Aula */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <School size={16} className="inline mr-2" />
          Aula *
        </label>
        {classrooms.length <= 1 || selectedClassroom ? (
          <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
            {selectedClassroom
              ? `${selectedClassroom.classroomName || selectedClassroom.name} - ${selectedClassroom.classroomAge}`
              : 'Sin aula asignada'}
          </div>
        ) : (
          <select
            value={selectedClassroom?.id || ''}
            onChange={(e) => {
              const classroom = classrooms.find(c => c.id === e.target.value)
              onSelectClassroom(classroom)
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona un aula</option>
            {classrooms.map(classroom => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.classroomName || classroom.name} - {classroom.classroomAge}
              </option>
            ))}
          </select>
        )}
      </div>

    </div>
  )
}
