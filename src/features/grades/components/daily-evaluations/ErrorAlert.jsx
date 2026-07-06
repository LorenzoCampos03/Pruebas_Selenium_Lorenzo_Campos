export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
      <span>⚠️</span>
      <div>
        <strong>Error:</strong> {error}
        <button
          onClick={onRetry}
          className="ml-3 underline text-red-600 hover:text-red-800"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
