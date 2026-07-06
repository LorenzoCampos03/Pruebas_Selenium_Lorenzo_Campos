import { useState } from "react";
import PropTypes from "prop-types";
import { FileText, Download, Loader2 } from "lucide-react";
import {
  generatePeriodsListReport,
  generatePeriodDetailReport,
} from "../../services/academicPeriodReportService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Botón para generar reportes PDF de períodos académicos
 * @param {string} type - Tipo de reporte: "list", "detail"
 * @param {Object} data - Datos necesarios según el tipo de reporte
 * @param {Object} institution - Datos de la institución
 * @param {string} label - Texto del botón (opcional)
 * @param {string} variant - Variante del botón: "primary", "secondary", "outline"
 */
export function AcademicPeriodReportButton({
  type = "list",
  data = {},
  institution = {},
  label,
  variant = "primary",
  className = "",
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      switch (type) {
        case "list":
          await generatePeriodsListReport(
            data.periods || [],
            institution,
            data.filters || {}
          );
          break;

        case "detail":
          await generatePeriodDetailReport(
            data.period,
            institution,
            data.enrollmentCount || 0
          );
          break;

        default:
          console.error("Tipo de reporte no válido:", type);
      }
    } catch (error) {
      console.error("Error al generar reporte:", error);
      alert("Error al generar el reporte. Por favor, intente nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonLabel = () => {
    if (label) return label;
    switch (type) {
      case "list":
        return "Exportar Lista";
      case "detail":
        return "Exportar Ficha";
      default:
        return "Generar PDF";
    }
  };

  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (variant) {
      case "primary":
        return `${baseStyles} text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
      case "secondary":
        return `${baseStyles} text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`;
      case "outline":
        return `${baseStyles} text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
      default:
        return baseStyles;
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerateReport}
      disabled={isGenerating}
      className={`${getButtonStyles()} ${className}`}
      title={`Generar reporte PDF - ${getButtonLabel()}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          {getButtonLabel()}
        </>
      )}
    </button>
  );
}

AcademicPeriodReportButton.propTypes = {
  type: PropTypes.oneOf(["list", "detail"]).isRequired,
  data: PropTypes.object.isRequired,
  institution: PropTypes.object.isRequired,
  label: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary", "outline"]),
  className: PropTypes.string,
};

/**
 * Botón simple para exportar lista de períodos académicos
 */
export function ExportPeriodsButton({ periods, institution, filters, className = "" }) {
  return (
    <AcademicPeriodReportButton
      type="list"
      data={{ periods, filters }}
      institution={institution}
      variant="outline"
      className={className}
    />
  );
}

ExportPeriodsButton.propTypes = {
  periods: PropTypes.array.isRequired,
  institution: PropTypes.object.isRequired,
  filters: PropTypes.object,
  className: PropTypes.string,
};

/**
 * Botón para exportar ficha de período académico individual (solo icono)
 */
export function ExportPeriodDetailButton({
  period,
  institution,
  enrollmentCount = 0,
  className = "",
  iconOnly = true,
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      console.log("📄 Generando reporte individual de período académico");
      console.log("📄 Institución recibida:", institution);
      console.log("🖼️ Logo URL en institución:", institution?.logoUrl);
      
      // Si la institución no tiene logoUrl, cargar la institución completa
      let fullInstitution = institution;
      
      if (!institution?.logoUrl && period?.institutionId) {
        console.log("🔄 Institución sin logoUrl, cargando datos completos...");
        console.log("🔄 institutionId:", period.institutionId);
        
        try {
          const response = await institutionService.getById(period.institutionId);
          const data = isSuccessResponse(response) ? extractData(response) : response;
          fullInstitution = data;
          console.log("✅ Institución completa cargada:", fullInstitution);
          console.log("🖼️ Logo URL cargado:", fullInstitution?.logoUrl);
          console.log("🎨 Color institucional:", fullInstitution?.colorInstitution);
        } catch (error) {
          console.error("❌ Error al cargar institución completa:", error);
          // Continuar con la institución original si falla
        }
      } else {
        console.log("✅ Institución ya tiene logoUrl, usando datos existentes");
      }
      
      await generatePeriodDetailReport(
        period,
        fullInstitution,
        enrollmentCount
      );
    } catch (error) {
      console.error("❌ Error al generar reporte:", error);
      alert("Error al generar el reporte. Por favor, intente nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className={`p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Descargar ficha de período académico (PDF)"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <AcademicPeriodReportButton
      type="detail"
      data={{ period, enrollmentCount }}
      institution={institution}
      label=""
      variant="primary"
      className={className}
    />
  );
}

ExportPeriodDetailButton.propTypes = {
  period: PropTypes.object.isRequired,
  institution: PropTypes.object.isRequired,
  enrollmentCount: PropTypes.number,
  className: PropTypes.string,
  iconOnly: PropTypes.bool,
};
