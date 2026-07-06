import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Building } from "lucide-react";
import { classroomService } from "@/features/institutions/services/classroomService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Selector de aulas filtrado por institución
 */
export function ClassroomSelector({ value, onChange, institutionId, disabled = false }) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (institutionId) {
      fetchClassrooms(institutionId);
    } else {
      setClassrooms([]);
    }
  }, [institutionId]);

  const fetchClassrooms = async (instId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await classroomService.getAll(instId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      setClassrooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar las aulas");
      console.error("Error fetching classrooms:", err);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedClassroom = classrooms.find(classroom => classroom.id === value);

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || !institutionId}
        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
      >
        <option value="">
          {loading ? "Cargando aulas..." : 
           !institutionId ? "Seleccione una institución primero" : 
           classrooms.length === 0 ? "No hay aulas disponibles" :
           "Seleccione un aula"}
        </option>
        {classrooms.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>
            {classroom.classroomName} - {classroom.classroomAge} (Cap: {classroom.capacity})
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>

      {/* Mostrar información del aula seleccionada */}
      {selectedClassroom && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: selectedClassroom.color || "#3B82F6" }}
            ></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{selectedClassroom.classroomName}</p>
              <p className="text-xs text-gray-600">
                Edad: {selectedClassroom.classroomAge} • Capacidad: {selectedClassroom.capacity} estudiantes
              </p>
            </div>
            <Building className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

ClassroomSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  institutionId: PropTypes.string,
  disabled: PropTypes.bool,
};