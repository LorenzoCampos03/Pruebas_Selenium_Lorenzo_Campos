import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { institutionService } from "@/features/institutions";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Componente para seleccionar una institución
 * Consumo de endpointsdesde el frontend (feature institutions)
 * 
 * @param {Object} props - Props del componente
 * @param {string} props.value - ID de la institución seleccionada
 * @param {Function} props.onChange - Función callback cuando cambia la selección
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 */
export function InstitutionSelector({ value, onChange, disabled = false }) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar instituciones al montar el componente
  useEffect(() => {
    loadInstitutions();
  }, []);

  // Cargar instituciones activas desde el frontend
  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await institutionService.getAll();
      const data = isSuccessResponse(response) ? extractData(response) : response;
      
      // Procesar respuesta
      let institutionsList = Array.isArray(data) ? data : [];
      
      console.log("[ENROLLMENT-INSTITUTION-SELECTOR] Instituciones cargadas:", institutionsList);
      setInstitutions(institutionsList);
    } catch (err) {
      console.error("[ENROLLMENT-INSTITUTION-SELECTOR] Error al cargar instituciones:", err);
      setError("Error al cargar instituciones. Por favor, intente nuevamente.");
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos de la institución seleccionada
  const loadSelectedInstitution = useCallback(
    async (institutionId) => {
      if (institutionId && !selectedInstitution) {
        try {
          const response = await institutionService.getById(institutionId);
          const institution = isSuccessResponse(response) ? extractData(response) : response;
          setSelectedInstitution(institution);
        } catch (err) {
          console.error("[ENROLLMENT-INSTITUTION-SELECTOR] Error al cargar institución:", err);
        }
      }
    },
    [selectedInstitution]
  );

  // Efecto para cargar institución seleccionada
  useEffect(() => {
    if (value && !selectedInstitution) {
      loadSelectedInstitution(value);
    }
  }, [value, selectedInstitution, loadSelectedInstitution]);

  // Filtrar instituciones por término de búsqueda
  const filteredInstitutions = institutions.filter((institution) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = institution.name?.toLowerCase() || "";
    const code = institution.codeInstitution?.toLowerCase() || "";
    const modularCode = institution.modularCode?.toLowerCase() || "";
    return name.includes(term) || code.includes(term) || modularCode.includes(term);
  });

  const handleSelect = (institution) => {
    setSelectedInstitution(institution);
    onChange(institution.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedInstitution(null);
    onChange("");
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      {/* Campo de selección */}
      <div className="relative">
        <input
          type="text"
          value={selectedInstitution ? selectedInstitution.name || "" : ""}
          placeholder="Seleccione una institución"
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
      {selectedInstitution && !disabled && (
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

      {/* Dropdown con lista de instituciones */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-red-600 text-sm">{error}</span>
                <button
                  type="button"
                  onClick={loadInstitutions}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Lista de instituciones */}
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando instituciones...</div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No se encontraron instituciones</div>
            ) : (
              filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => handleSelect(institution)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {institution.name || "Sin nombre"}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="mr-4">Código: {institution.codeInstitution || "N/A"}</span>
                    {institution.modularCode && (
                      <span className="mr-4">Código Modular: {institution.modularCode}</span>
                    )}
                    <span>Tipo: {institution.institutionType || "N/A"}</span>
                  </div>
                  {institution.address && (
                    <div className="text-xs text-gray-400 mt-1">
                      {institution.address.district && `${institution.address.district}, `}
                      {institution.address.province}
                    </div>
                  )}
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

InstitutionSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
