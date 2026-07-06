import { useState } from "react";
import {
  generateSupportGeneralReport,
  generateSupportIndividualReport,
  generateSupportSummaryReport,
} from "../services/specialNeedsSupportReportService";
import { toastError } from "../utils/notifications";

export function useSpecialNeedsSupportReport() {
  const [generating, setGenerating] = useState(false);

  const generateGeneral = async (supports, institution) => {
    setGenerating(true);
    try {
      await generateSupportGeneralReport(supports, institution);
    } catch (err) {
      console.error("Error al generar reporte general:", err);
      toastError("Error al generar el reporte general");
    } finally {
      setGenerating(false);
    }
  };

  const generateIndividual = async (support, institution) => {
    setGenerating(true);
    try {
      await generateSupportIndividualReport(support, institution);
    } catch (err) {
      console.error("Error al generar ficha individual:", err);
      toastError("Error al generar la ficha individual");
    } finally {
      setGenerating(false);
    }
  };

  const generateSummary = async (supports, institution) => {
    setGenerating(true);
    try {
      await generateSupportSummaryReport(supports, institution);
    } catch (err) {
      console.error("Error al generar reporte resumen:", err);
      toastError("Error al generar el reporte resumen");
    } finally {
      setGenerating(false);
    }
  };

  return { generating, generateGeneral, generateIndividual, generateSummary };
}
