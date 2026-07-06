import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useStudents } from "@/features/students/hooks/useStudents";

/**
 * Componente para seleccionar un estudiante
 * @param {Object} props - Props del componente
 * @param {string} props.value - ID del estudiante seleccionado
 * @param {Function} props.onChange - Función callback cuando cambia la selección
 * @param {string} props.institutionId - ID de la institución para filtrar estudiantes
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 */
export function StudentSelector({ value, onChange, institutionId, disabled = false }) {
  const { students, loading, fetchByInstitution, fetchById } = useStudents();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar estudiantes cuando se abre el selector
  const handleOpen = useCallback(async () => {
    if (!isOpen && institutionId) {
      await fetchByInstitution(institutionId);
    }
    setIsOpen(!isOpen);
  }, [isOpen, institutionId, fetchByInstitution]);

  // Cargar datos del estudiante seleccionado
  const loadSelectedStudent = useCallback(
    async (studentId) => {
      if (studentId && !selectedStudent) {
        try {
          const student = await fetchById(studentId);
          setSelectedStudent(student);
        } catch (err) {
          console.error("Error al cargar estudiante:", err);
        }
      }
    },
    [selectedStudent, fetchById]
  );

  // Efecto para cargar estudiante seleccionado
  if (value && !selectedStudent) {
    loadSelectedStudent(value);
  }

  // Filtrar estudiantes por término de búsqueda
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const cui = student.cui?.toLowerCase() || "";
    const documentNumber = student.documentNumber?.toLowerCase() || "";
    return fullName.includes(term) || cui.includes(term) || documentNumber.includes(term);
  });

  const handleSelect = (student) => {
    setSelectedStudent(student);
    onChange(student.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedStudent(null);
    onChange("");
  };

  return (
    <div className="relative">
      {/* Campo de selección */}
      <div className="relative">
        <input
          type="text"
          value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ""}
          placeholder="Seleccione un estudiante"
          readOnly
          onClick={handleOpen}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Botón para limpiar selección */}
      {selectedStudent && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Dropdown con lista de estudiantes */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, CUI o DNI..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Lista de estudiantes */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando estudiantes...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No se encontraron estudiantes</div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="mr-4">CUI: {student.cui || "N/A"}</span>
                    <span>DNI: {student.documentNumber || "N/A"}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Botón para cerrar */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

StudentSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  institutionId: PropTypes.string,
  disabled: PropTypes.bool,
};
