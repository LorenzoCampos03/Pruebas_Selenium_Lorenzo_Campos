import { DAILY_EVALUATION_STATUS_OPTIONS } from '../../models/dailyEvaluation.model'

export function EvaluationFilters({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  onRefresh 
}) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar por curso, fecha..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="flex-1 min-w-[220px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      >
        <option value="">Todos los estados</option>
        {DAILY_EVALUATION_STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={onRefresh}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
      >
        Actualizar
      </button>
    </div>
  )
}
