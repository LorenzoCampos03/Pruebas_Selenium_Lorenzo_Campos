import { useState } from "react";
import { generateGeneralReport, generateIndividualReport, generateSummaryReport, generateStudentFullReport } from "../services/psychologyReportService";
import { toastError } from "../utils/notifications";

export function usePsychologyReport() {
  const [generating, setGenerating] = useState(false);

  const generateGeneral = async (evaluations, institution) => {
    setGenerating(true);
    try {
      await generateGeneralReport(evaluations, institution);
    } catch (err) {
      console.error("Error al generar reporte general:", err);
      toastError("Error al generar el reporte general");
    } finally {
      setGenerating(false);
    }
  };

  const generateIndividual = async (evaluation, institution) => {
    setGenerating(true);
    try {
      await generateIndividualReport(evaluation, institution);
    } catch (err) {
      console.error("Error al generar reporte individual:", err);
      toastError("Error al generar la ficha individual");
    } finally {
      setGenerating(false);
    }
  };

  const generateSummary = async (evaluations, institution) => {
    setGenerating(true);
    try {
      await generateSummaryReport(evaluations, institution);
    } catch (err) {
      console.error("Error al generar reporte resumen:", err);
      toastError("Error al generar el reporte resumen");
    } finally {
      setGenerating(false);
    }
  };

  const generateStudentReport = async (evaluations, institution) => {
    setGenerating(true);
    try {
      await generateStudentFullReport(evaluations, institution);
    } catch (err) {
      console.error("Error al generar reporte del estudiante:", err);
      toastError("Error al generar el reporte del estudiante");
    } finally {
      setGenerating(false);
    }
  };

  return { generating, generateGeneral, generateSummary, generateIndividual, generateStudentReport };
}
