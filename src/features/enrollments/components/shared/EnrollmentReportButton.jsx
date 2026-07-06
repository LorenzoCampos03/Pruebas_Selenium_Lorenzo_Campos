import { useState } from "react";
import PropTypes from "prop-types";
import { FileText, Download, Loader2 } from "lucide-react";
import {
  generateEnrollmentsListReport,
  generateEnrollmentDetailReport,
  generateClassroomEnrollmentsReport,
  generateEnrollmentStatsReport,
} from "../../services/enrollmentReportService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { academicPeriodService } from "@/features/enrollments/services/academicPeriodService";
import { studentService } from "@/features/students/services/studentService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

/**
 * Botón para generar reportes PDF de matrículas
 * @param {string} type - Tipo de reporte: "list", "detail", "classroom", "stats"
 * @param {Object} data - Datos necesarios según el tipo de reporte
 * @param {Object} institution - Datos de la institución
 * @param {string} label - Texto del botón (opcional)
 * @param {string} variant - Variante del botón: "primary", "secondary", "outline"
 */
export function EnrollmentReportButton({
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
          await generateEnrollmentsListReport(
            data.enrollments || [],
            institution,
            data.filters || {}
          );
          break;

        case "detail":
          await generateEnrollmentDetailReport(
            data.enrollment,
            data.student,
            institution,
            data.classroom,
            data.academicPeriod
          );
          break;

        case "classroom":
          await generateClassroomEnrollmentsReport(
            data.enrollments || [],
            data.classroom,
            institution
          );
          break;

        case "stats":
          await generateEnrollmentStatsReport(data.stats, institution);
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
      case "classroom":
        return "Lista de Aula";
      case "stats":
        return "Estadísticas";
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

EnrollmentReportButton.propTypes = {
  type: PropTypes.oneOf(["list", "detail", "classroom", "stats"]).isRequired,
  data: PropTypes.object.isRequired,
  institution: PropTypes.object.isRequired,
  label: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary", "outline"]),
  className: PropTypes.string,
};

/**
 * Botón simple para exportar lista de matrículas
 */
export function ExportEnrollmentsButton({ enrollments, institution, filters, className = "" }) {
  return (
    <EnrollmentReportButton
      type="list"
      data={{ enrollments, filters }}
      institution={institution}
      variant="outline"
      className={className}
    />
  );
}

ExportEnrollmentsButton.propTypes = {
  enrollments: PropTypes.array.isRequired,
  institution: PropTypes.object.isRequired,
  filters: PropTypes.object,
  className: PropTypes.string,
};

/**
 * Botón para exportar ficha de matrícula individual (solo icono)
 */
export function ExportEnrollmentDetailButton({
  enrollment,
  student,
  institution,
  classroom,
  academicPeriod,
  className = "",
  iconOnly = true,
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      console.log("📄 Generando reporte individual de matrícula");
      
      const fetches = [];
      const needsInstitution = !institution?.logoUrl && enrollment?.institutionId;
      const needsAcademicPeriod = !academicPeriod?.periodName && enrollment?.academicPeriodId;
      const needsStudent = (!student?.firstName || !student?.lastName) && enrollment?.studentId;

      if (needsInstitution) fetches.push(
        institutionService.getById(enrollment.institutionId)
          .then(res => ({ type: "institution", data: isSuccessResponse(res) ? extractData(res) : res }))
      );
      if (needsAcademicPeriod) fetches.push(
        academicPeriodService.getById(enrollment.academicPeriodId)
          .then(res => ({ type: "academicPeriod", data: isSuccessResponse(res) ? extractData(res) : res }))
      );
      if (needsStudent) fetches.push(
        studentService.getById(enrollment.studentId)
          .then(res => ({ type: "student", data: isSuccessResponse(res) ? extractData(res) : res }))
      );

      const results = await Promise.all(fetches);
      const resultMap = {};
      results.forEach(r => { resultMap[r.type] = r.data; });

      const fullInstitution = resultMap.institution || institution;
      const fullAcademicPeriod = resultMap.academicPeriod || academicPeriod;
      const fullStudent = resultMap.student || student;
      
      await generateEnrollmentDetailReport(
        enrollment,
        fullStudent,
        fullInstitution,
        classroom,
        fullAcademicPeriod
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
        title="Descargar ficha de matrícula (PDF)"
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
    <EnrollmentReportButton
      type="detail"
      data={{ enrollment, student, classroom, academicPeriod }}
      institution={institution}
      label=""
      variant="primary"
      className={className}
    />
  );
}

ExportEnrollmentDetailButton.propTypes = {
  enrollment: PropTypes.object.isRequired,
  student: PropTypes.object,
  institution: PropTypes.object.isRequired,
  classroom: PropTypes.object,
  academicPeriod: PropTypes.object,
  className: PropTypes.string,
  iconOnly: PropTypes.bool,
};
