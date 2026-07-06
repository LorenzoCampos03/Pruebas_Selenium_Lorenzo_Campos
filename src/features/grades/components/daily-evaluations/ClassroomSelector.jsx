import { useState, useEffect } from 'react'
import { Building2, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/core/api/apiClient'
import { useAuth } from '@/core/auth/AuthContext'

export default function ClassroomSelector({ onSelect }) {
  const { user } = useAuth()
  const [classrooms, setClassrooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setLoading(true)
        const { data } = await apiClient.get(`/api/classrooms/teacher/${user.userId}`)
        setClassrooms(data.data || data)
        if ((data.data || data).length === 0) {
          toast.info('No hay aulas asignadas')
        }
      } catch (error) {
        toast.error('Error al cargar aulas')
        console.error(error)
        setClassrooms([])
      } finally {
        setLoading(false)
      }
    }

    if (user?.userId) {
      fetchClassrooms()
    }
  }, [user?.userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Paso 1: Selecciona el Aula</h2>
      
      {classrooms.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay aulas disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classrooms.map(classroom => (
            <button
              key={classroom.id}
              onClick={() => onSelect(classroom)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Building2 className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{classroom.name || classroom.classroomName}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Edad: {classroom.classroomAge || classroom.age || 'Sin nivel'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}