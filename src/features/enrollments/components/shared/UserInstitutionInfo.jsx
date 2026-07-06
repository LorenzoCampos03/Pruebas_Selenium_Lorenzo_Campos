import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Building2, CheckCircle, Loader2 } from "lucide-react";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Componente para mostrar información de la institución del usuario autenticado
 */
export function UserInstitutionInfo({ institutionId, className = "" }) {
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (institutionId) {
      fetchInstitution(institutionId);
    }
  }, [institutionId]);

  const fetchInstitution = async (instId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("🏫 Cargando información de institución:", instId);
      const response = await institutionService.getById(instId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      console.log("✅ Institución cargada:", data);
      setInstitution(data);
    } catch (err) {
      console.error("❌ Error al cargar institución:", err);
      setError("Error al cargar la información de la institución");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">
              Cargando información de la institución...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-blue-900">
              Institución Asignada
            </p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-base font-bold text-blue-900 mt-1">
            {institution?.name || "Sin nombre"}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            La matrícula se creará automáticamente en su institución asignada
          </p>
          {institution?.modularCode && (
            <p className="text-xs text-blue-600 mt-1">
              Código Modular: {institution.modularCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

UserInstitutionInfo.propTypes = {
  institutionId: PropTypes.string.isRequired,
  className: PropTypes.string,
};