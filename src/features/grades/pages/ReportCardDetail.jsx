import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reportCardsService } from '../services/ReportCard.service'
import { REPORT_CARD_STATUS_OPTIONS } from '../models/reportcards.model'

export function ReportCardDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [reportCard, setReportCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { if (id) loadReportCard(id) }, [id])

  const loadReportCard = async (reportCardId) => {
    try {
      setLoading(true)
      const data = await reportCardsService.getById(reportCardId)
      setReportCard(data)
    } catch {
      setError('Error al cargar la libreta de notas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta libreta de notas?')) return
    try {
      await reportCardsService.delete(id)
      navigate('/docente/BoletasNotas')
    } catch {
      setError('Error al eliminar la libreta de notas')
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'DRAFT':    return 'bg-gray-100 text-gray-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'SENT':     return 'bg-blue-100 text-blue-800'
      default:         return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) =>
    REPORT_CARD_STATUS_OPTIONS.find(o => o.value === status)?.label || status

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  if (error || !reportCard) return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error || 'Libreta no encontrada'}</p>
        <button onClick={() => navigate('/docente/BoletasNotas')} className="mt-3 px-4 py-2 text-white bg-red-600 rounded-md">Volver</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Libreta de Notas</h1>
          <button onClick={() => navigate('/docente/BoletasNotas')}
            className="px-4 py-2 text-gray-700 bg-white rounded-lg hover:bg-gray-50 shadow-sm flex items-center">
            ← Volver
          </button>
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={() => navigate(`/docente/BoletasNotas/editar/${id}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            Editar
          </button>
          <button onClick={handleDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
            Eliminar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2"></div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Estudiante</h3>
                <p className="text-sm text-gray-900 font-mono">{reportCard.studentId}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Institución</h3>
                <p className="text-sm text-gray-900 font-mono">{reportCard.institutionId}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Aula</h3>
                <p className="text-sm text-gray-900 font-mono">{reportCard.classroomId}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Matrícula</h3>
                <p className="text-sm text-gray-900 font-mono">{reportCard.enrollmentId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Período</p>
                <p className="text-lg font-bold text-gray-900">
                  {reportCard.periodType === 'BIMESTRE' ? 'Bim.' : 'Trim.'} {reportCard.periodNumber}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Año</p>
                <p className="text-lg font-bold text-gray-900">{reportCard.academicYear}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Asistencia</p>
                <p className="text-lg font-bold text-gray-900">
                  {reportCard.attendancePercentage ? `${reportCard.attendancePercentage}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">Estado</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(reportCard.status)}`}>
                  {getStatusLabel(reportCard.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2"></div>
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Observaciones Generales</h2>
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <p className="text-gray-800 leading-relaxed">
                {reportCard.generalObservations || 'No hay observaciones registradas'}
              </p>
            </div>
          </div>
        </div>

        {reportCard.pdfUrl && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 h-2"></div>
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">PDF de la Boleta</h2>
              <a href={reportCard.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                📄 Ver PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}