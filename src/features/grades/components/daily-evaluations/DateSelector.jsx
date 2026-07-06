import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { DAILY_EVALUATION_STATUS } from '../../models/dailyEvaluation.model'

export default function DateSelector({
  evaluationDate,
  status,
  onConfirm,
  onBack,
}) {
  const [date, setDate] = useState(evaluationDate)
  const [selectedStatus, setSelectedStatus] = useState(status)

  const handleConfirm = () => {
    onConfirm(date, selectedStatus)
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
        <h2 className="text-2xl font-bold text-gray-900">Paso 4: Fecha de Evaluación</h2>
      </div>

      <div className="space-y-6">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Evaluación Diaria
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estado de la Evaluación
          </label>
          <div className="space-y-2">
            {Object.entries(DAILY_EVALUATION_STATUS).map(([key, value]) => (
              <label key={value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={selectedStatus === value}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-gray-900 font-medium">
                  {value === DAILY_EVALUATION_STATUS.EN_PROCESO ? 'En Proceso' : 'Finalizado'}
                </span>
                <span className="text-sm text-gray-500">
                  {value === DAILY_EVALUATION_STATUS.EN_PROCESO
                    ? 'Puedes seguir editando'
                    : 'No se puede modificar después'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Botón Continuar */}
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Continuar
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}