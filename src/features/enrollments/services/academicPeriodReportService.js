import { jsPDF } from "jspdf";
import {
  drawHeader,
  drawFooter,
  drawTable,
  drawField,
  drawSectionTitle,
  loadLogoBase64,
} from "@/core/utils/reportGenerator";
import { PERIOD_STATUS_LABELS } from "../models/academicPeriodModel";

/**
 * Servicio para generar reportes PDF de períodos académicos
 * Reutiliza las funciones de reportGenerator.js para mantener consistencia
 */

// ── Funciones auxiliares ─────────────────────────────────────────────────────

function statusLabel(s) {
  return PERIOD_STATUS_LABELS[s] || s || "—";
}

function buildFileStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── PDF Report: Lista de Períodos Académicos ─────────────────────────────────

/**
 * Genera un reporte PDF con la lista de períodos académicos
 * @param {Array} periods - Lista de períodos académicos
 * @param {Object} institution - Datos de la institución
 * @param {Object} filters - Filtros aplicados (opcional)
 */
export async function generatePeriodsListReport(periods, institution, filters = {}) {
  console.log("📊 Generando reporte de lista de períodos académicos");
  console.log("📊 Total de períodos:", periods.length);
  console.log("🏫 Institución:", institution);
  
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  // Construir subtítulo con filtros
  let subtitle = `Total: ${periods.length} período(s) académico(s)`;
  if (filters.academicYear) subtitle += ` | Año: ${filters.academicYear}`;
  if (filters.status) subtitle += ` | Estado: ${statusLabel(filters.status)}`;

  const title = "Reporte de Períodos Académicos";
  const y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Preparar datos para la tabla
  const headers = ["#", "Nombre del Período", "Año", "Inicio", "Fin", "Matrícula Inicio", "Matrícula Fin", "Estado"];
  const colWidths = [10, 50, 20, 30, 30, 35, 35, 25];

  const rows = periods.map((period, i) => [
    String(i + 1),
    period.periodName || "—",
    period.academicYear || "—",
    formatDate(period.startDate),
    formatDate(period.endDate),
    formatDate(period.enrollmentPeriodStart),
    formatDate(period.enrollmentPeriodEnd),
    statusLabel(period.status),
  ]);

  drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

  const fileName = `reporte_periodos_academicos_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Reporte generado exitosamente");
}

// ── PDF Report: Ficha de Período Académico Individual ───────────────────────

/**
 * Genera un reporte PDF detallado de un período académico específico
 * @param {Object} period - Datos del período académico
 * @param {Object} institution - Datos de la institución
 * @param {number} enrollmentCount - Cantidad de matrículas asociadas
 */
export async function generatePeriodDetailReport(period, institution, enrollmentCount = 0) {
  console.log("📄 Generando ficha de período académico individual");
  console.log("📄 Período:", period);
  console.log("🏫 Institución:", institution);
  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const subtitle = `${period.periodName} | Año ${period.academicYear}`;
  const title = "Ficha de Período Académico";
  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  y += 5;

  // Información General
  y = drawSectionTitle(doc, "Información General", y, institution);
  y += 2;

  const col1X = 15;
  const col2X = 110;

  drawField(doc, "Nombre del Período", period.periodName || "—", col1X, y);
  drawField(doc, "Año Académico", period.academicYear || "—", col2X, y);
  y += 6;

  drawField(doc, "Estado", statusLabel(period.status), col1X, y);
  drawField(doc, "Matrículas", `${enrollmentCount} asociada(s)`, col2X, y);
  y += 10;

  // Fechas del Período Académico
  y = drawSectionTitle(doc, "Período Académico", y, institution);
  y += 2;

  drawField(doc, "Fecha de Inicio", formatDate(period.startDate), col1X, y);
  drawField(doc, "Fecha de Fin", formatDate(period.endDate), col2X, y);
  y += 6;

  const duration = Math.ceil(
    (new Date(period.endDate) - new Date(period.startDate)) / (1000 * 60 * 60 * 24)
  );
  drawField(doc, "Duración", `${duration} días`, col1X, y);
  y += 10;

  // Período de Matrícula
  y = drawSectionTitle(doc, "Período de Matrícula", y, institution);
  y += 2;

  drawField(doc, "Inicio de Matrícula", formatDate(period.enrollmentPeriodStart), col1X, y);
  drawField(doc, "Fin de Matrícula", formatDate(period.enrollmentPeriodEnd), col2X, y);
  y += 6;

  const enrollmentDuration = Math.ceil(
    (new Date(period.enrollmentPeriodEnd) - new Date(period.enrollmentPeriodStart)) /
      (1000 * 60 * 60 * 24)
  );
  drawField(doc, "Duración", `${enrollmentDuration} días`, col1X, y);
  y += 6;

  // Matrícula Tardía
  if (period.allowLateEnrollment && period.lateEnrollmentEndDate) {
    drawField(doc, "Matrícula Tardía", "Habilitada", col1X, y);
    drawField(doc, "Fecha Límite", formatDate(period.lateEnrollmentEndDate), col2X, y);
    y += 6;
  } else {
    drawField(doc, "Matrícula Tardía", "No habilitada", col1X, y);
    y += 6;
  }

  y += 4;

  // Información Técnica
  y = drawSectionTitle(doc, "Información Técnica", y, institution);
  y += 2;

  drawField(doc, "ID del Período", period.id || "—", col1X, y);
  drawField(doc, "ID de Institución", period.institutionId || "—", col2X, y);
  y += 6;

  if (period.createdAt) {
    drawField(doc, "Fecha de Creación", formatDate(period.createdAt), col1X, y);
  }
  if (period.updatedAt) {
    drawField(doc, "Última Actualización", formatDate(period.updatedAt), col2X, y);
  }

  drawFooter(doc, institution, 1, 1);

  const fileName = `ficha_periodo_${period.academicYear}_${period.periodName.replace(/\s+/g, '_')}_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Ficha de período académico generada exitosamente");
}
