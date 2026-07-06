import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { reportCardsService } from '../services/ReportCard.service'
import { PERIOD_TYPE_OPTIONS } from '../models/reportcards.model'
import { getCurrentPeriodNumber, getPeriodLabel, getPeriodDateRange } from '@/core/utils/periodUtils'
import apiClient from '@/core/api/apiClient'
import { ENDPOINTS } from '@/core/api/endpoints'

export function ReportCardForm({ isEditing = false }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    studentId: '',
    classroomId: '',
    academicYear: new Date().getFullYear(),
    periodType: 'BIMESTRE',
    periodNumber: getCurrentPeriodNumber('BIMESTRE'), 
    attendancePercentage: '',
    generalObservations: '',
  })

  const [classrooms, setClassrooms] = useState([])
  const [students, setStudents] = useState([])
  const [institutionName, setInstitutionName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.institutionId) {
      loadClassrooms(user.institutionId)
      loadInstitutionName(user.institutionId)
    }
  }, [user])

  useEffect(() => {
    if (isEditing && id) loadReportCard(id)
  }, [isEditing, id])

  useEffect(() => {
    if (formData.classroomId) {
      loadStudents(formData.classroomId)
      if (!isEditing) {
        setFormData(prev => ({ ...prev, studentId: '' }))
      }
    }
  }, [formData.classroomId])

  // ✅ Cuando cambia el tipo de período, recalcula el número automáticamente
  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        periodNumber: getCurrentPeriodNumber(prev.periodType)
      }))
    }
  }, [formData.periodType])

  const loadInstitutionName = async (institutionId) => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.INSTITUTIONS.BY_ID(institutionId))
      const institution = data?.data || data
      setInstitutionName(institution?.name || institution?.institutionName || institutionId)
    } catch {
      setInstitutionName(institutionId)
    }
  }

  const loadClassrooms = async (institutionId) => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_INSTITUTION(institutionId))
      const list = data?.data || data || []
      setClassrooms(Array.isArray(list) ? list : [])
      if (list.length === 1) {
        setFormData(prev => ({ ...prev, classroomId: list[0].id }))
      }
    } catch {
      setError('Error al cargar las aulas')
    }
  }

  const loadStudents = async (classroomId) => {
    try {
      setLoadingStudents(true)
      const { data } = await apiClient.get(ENDPOINTS.STUDENTS.BY_CLASSROOM(classroomId))
      const list = data?.data || data || []
      setStudents(Array.isArray(list) ? list : [])
      if (list.length === 1) {
        setFormData(prev => ({ ...prev, studentId: list[0].id }))
      }
    } catch {
      setError('Error al cargar los estudiantes')
    } finally {
      setLoadingStudents(false)
    }
  }

  const loadReportCard = async (reportCardId) => {
    try {
      setLoading(true)
      const data = await reportCardsService.getById(reportCardId)
      setFormData({
        studentId: data.studentId || '',
        classroomId: data.classroomId || '',
        academicYear: data.academicYear || new Date().getFullYear(),
        periodType: data.periodType || 'BIMESTRE',
        periodNumber: data.periodNumber || 1,
        attendancePercentage: data.attendancePercentage || '',
        generalObservations: data.generalObservations || '',
      })
      if (data.classroomId) await loadStudents(data.classroomId)
    } catch {
      setError('Error al cargar la libreta de notas')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        studentId: formData.studentId,
        classroomId: formData.classroomId,
        academicYear: formData.academicYear,
        periodType: formData.periodType,
        periodNumber: formData.periodNumber,
        attendancePercentage: formData.attendancePercentage || null,
        generalObservations: formData.generalObservations || null,
      }
      if (isEditing && id) {
        await reportCardsService.update(id, payload)
      } else {
        await reportCardsService.create(payload)
      }
      navigate('/docente/BoletasNotas')
    } catch (err) {
      setError(err.message || 'Error al guardar la libreta de notas')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
  const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1"

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="mb-6 border-b border-gray-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Libreta de Notas' : 'Nueva Libreta de Notas'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? 'Modifica los datos de la libreta' : 'Completa los datos para registrar una nueva libreta'}
          </p>
        </div>
        <button type="button" onClick={() => navigate('/docente/BoletasNotas')}
          className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver al listado
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex gap-6">
        <span>👤 Profesor: <strong>{user?.firstName} {user?.lastName}</strong></span>
        <span>🏫 Institución: <strong>{institutionName || user?.institutionId}</strong></span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Datos del Estudiante */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h2 className="text-sm font-semibold text-gray-700">Datos del Estudiante</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Aula *</label>
              <select name="classroomId" value={formData.classroomId}
                onChange={handleChange} required className={inputClass}>
                <option value="">Selecciona un aula</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.classroomName} — {c.classroomAge}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estudiante *</label>
              <select name="studentId" value={formData.studentId}
                onChange={handleChange} required
                disabled={!formData.classroomId || loadingStudents}
                className={inputClass}>
                <option value="">
                  {loadingStudents ? 'Cargando...' : !formData.classroomId ? 'Primero selecciona un aula' : 'Selecciona un estudiante'}
                </option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.motherLastName}, {s.firstName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Período */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h2 className="text-sm font-semibold text-gray-700">Información del Período</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className={labelClass}>Año Académico *</label>
              <input type="number" name="academicYear" value={formData.academicYear}
                onChange={handleChange} required min="2000" max="2100" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Tipo de Período *</label>
              <select name="periodType" value={formData.periodType}
                onChange={handleChange} required className={inputClass}>
                {PERIOD_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* ✅ Número de período automático + indicador visual */}
            <div>
              <label className={labelClass}>Número de Período *</label>
              <input type="number" name="periodNumber" value={formData.periodNumber}
                onChange={handleChange} required min="1"
                max={formData.periodType === 'BIMESTRE' ? 4 : 3}
                className={inputClass} />
              <p className="mt-1 text-xs text-indigo-600 font-medium">
                📅 {getPeriodLabel(formData.periodType, formData.periodNumber)} — {getPeriodDateRange(formData.periodType, formData.periodNumber)}
              </p>
            </div>

            <div>
              <label className={labelClass}>Porcentaje de Asistencia (%)</label>
              <input type="number" name="attendancePercentage" value={formData.attendancePercentage}
                onChange={handleChange} min="0" max="100" step="0.1"
                className={inputClass} placeholder="Ej: 95.5" />
            </div>

          </div>
        </div>

        {/* Observaciones */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h2 className="text-sm font-semibold text-gray-700">Observaciones</h2>
          </div>
          <div className="p-4">
            <label className={labelClass}>Observaciones Generales</label>
            <textarea name="generalObservations" value={formData.generalObservations}
              onChange={handleChange} rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Observaciones generales del estudiante..." />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/docente/BoletasNotas')}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium disabled:opacity-50">
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Libreta'}
          </button>
        </div>

      </form>
    </div>
  )
}