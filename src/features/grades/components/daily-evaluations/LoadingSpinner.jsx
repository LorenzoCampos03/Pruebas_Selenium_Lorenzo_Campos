export default function LoadingSpinner({ message = 'Cargando datos...' }) {
  return (
    <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-40">
      <div className="text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}
