export function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  onPageChange 
}) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalItems <= pageSize) return null

  return (
    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-xs text-gray-500">
        Mostrando <span className="font-medium">{startItem}</span>–<span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> evaluaciones
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-xs text-gray-500 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-xs text-gray-500 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
