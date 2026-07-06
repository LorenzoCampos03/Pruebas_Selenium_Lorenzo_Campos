export function ProgressBar({ current, total }) {
  if (total === 0) return null

  const progresoWidth = Math.round((current / total) * 100) + '%'

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex justify-between text-sm text-blue-700 mb-2">
        <span>Generando boletas...</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: progresoWidth }} 
        />
      </div>
    </div>
  )
}
