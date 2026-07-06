import { jsPDF } from "jspdf";
import {
  drawHeader,
  drawFooter,
  drawSectionTitle,
  drawField,
  drawTable,
  loadLogoBase64,
  FONT,
  MARGIN,
  COLOR,
} from "@/core/utils/reportGenerator";
import { SUPPORT_TYPE_LABELS } from "../models/specialNeedsSupportModel";
import {
  renderMultiLineText,
  buildFileStamp,
  formatDatePE,
} from "../utils/reportHelpers";

const supportTypeLabel = (t) => SUPPORT_TYPE_LABELS[t] || t || "—";
const statusLabel = (s) => {
  if (s === "ACTIVE") return "Activo";
  if (s === "INACTIVE") return "Inactivo";
  return s || "—";
};

function renderArrayField(doc, label, arr, col1, y, maxW) {
  if (!arr || arr.length === 0) return y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.PRIMARY);
  doc.text(`${label}:`, col1, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.DARK);
  arr.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, maxW - 4);
    lines.forEach((line) => { doc.text(line, col1 + 4, y); y += 4; });
  });
  return y + 1;
}

// ── Core renderer: one support record full page ───────────────────────────────

function renderSupportSections(doc, support, institution, logoBase64) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const title = "Ficha de Soporte de Necesidades Especiales";
  const subtitle = `Estudiante: ${support.studentName || "—"}`;
  const ensure = (y, space = 50) => {
    if (y <= pageH - space) return y;
    drawFooter(doc, institution, "?", "?");
    doc.addPage();
    return drawHeader(doc, institution, title, subtitle, logoBase64);
  };
  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  const col1 = MARGIN.left;
  const maxW = pageW - MARGIN.left - MARGIN.right;
  const labelW = 42;
  const midX = 110;

  y = drawSectionTitle(doc, "Datos Generales", y, institution);
  y += 2;
  drawField(doc, "Estudiante",      support.studentName  || "—", col1, y, labelW);
  drawField(doc, "Tipo de Soporte", supportTypeLabel(support.supportType), midX, y, labelW);
  y += 6;
  drawField(doc, "Aula",            support.classroomName   || "—", col1, y, labelW);
  drawField(doc, "Institución",     support.institutionName || "—", midX, y, labelW);
  y += 6;
  drawField(doc, "Año Académico",   String(support.academicYear || "—"), col1, y, labelW);
  drawField(doc, "Estado",          statusLabel(support.status),  midX, y, labelW);
  y += 8;

  y = ensure(y);
  y = drawSectionTitle(doc, "Diagnóstico", y, institution);
  y += 2;
  drawField(doc, "Diagnóstico",       support.diagnosis       || "—", col1, y, labelW);
  drawField(doc, "Diagnosticado por", support.diagnosedBy     || "—", midX, y, labelW);
  y += 6;
  drawField(doc, "Fecha diagnóstico", formatDatePE(support.diagnosisDate), col1, y, labelW);
  drawField(doc, "Especialista",      support.specialistInvolved || "—", midX, y, labelW);
  y += 6;
  drawField(doc, "Última revisión",   formatDatePE(support.lastReviewDate), col1, y, labelW);
  drawField(doc, "Próxima revisión",  formatDatePE(support.nextReviewDate), midX, y, labelW);
  y += 8;

  y = ensure(y);
  y = drawSectionTitle(doc, "Descripción del Soporte", y, institution);
  y += 3;
  y = renderMultiLineText(
    doc,
    support.description?.trim() ? support.description : "Sin descripción registrada.",
    col1, y, maxW, "normal", FONT.BODY,
    support.description?.trim() ? COLOR.DARK : COLOR.GRAY
  );
  y += 5;

  const adaptations = support.adaptationsRequired || [];
  const materials   = support.supportMaterials    || [];
  if (adaptations.length > 0 || materials.length > 0) {
    y = ensure(y, 60);
    y = drawSectionTitle(doc, "Recursos y Adaptaciones", y, institution);
    y += 3;
    if (adaptations.length > 0) y = renderArrayField(doc, "Adaptaciones requeridas", adaptations, col1, y, maxW);
    if (materials.length > 0) {
      y = ensure(y, 40);
      y = renderArrayField(doc, "Materiales de soporte", materials, col1, y, maxW);
    }
    y += 2;
  }

  y = ensure(y);
  y = drawSectionTitle(doc, "Notas de Progreso", y, institution);
  y += 3;
  renderMultiLineText(
    doc,
    support.progressNotes?.trim() ? support.progressNotes : "Sin notas de progreso registradas.",
    col1, y, maxW, "normal", FONT.BODY,
    support.progressNotes?.trim() ? COLOR.DARK : COLOR.GRAY
  );

  drawFooter(doc, institution, "?", "?");
}

// ── General Report (ficha completa por cada registro) ────────────────────────

export async function generateSupportGeneralReport(supports, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  supports.forEach((sup, i) => {
    if (i > 0) doc.addPage();
    renderSupportSections(doc, sup, institution, logoBase64);
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(doc, institution, p, totalPages); }

  doc.save(`reporte_soporte_necesidades_especiales_${buildFileStamp()}.pdf`);
}

// ── Individual Report ─────────────────────────────────────────────────────────

export async function generateSupportIndividualReport(support, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  renderSupportSections(doc, support, institution, logoBase64);

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(doc, institution, p, totalPages); }

  const studentName = (support.studentName || "soporte").replace(/\s+/g, "_");
  doc.save(`ficha_soporte_${studentName}_${buildFileStamp()}.pdf`);
}

// ── Summary Report (tabla consolidada) ───────────────────────────────────────

export async function generateSupportSummaryReport(supports, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const title    = "Reporte Resumen — Soporte de Necesidades Especiales";
  const subtitle = `Total de registros: ${supports.length}`;
  const startY = drawHeader(doc, institution, title, subtitle, logoBase64);

  const headers   = ["N°", "Estudiante", "Tipo", "Diagnóstico", "Especialista", "Próx. Revisión", "Estado"];
  const colWidths = [8, 45, 26, 45, 32, 26, 15];

  const rows = supports.map((sup, idx) => [
    String(idx + 1),
    sup.studentName             || "—",
    supportTypeLabel(sup.supportType),
    sup.diagnosis               || "—",
    sup.specialistInvolved      || "—",
    formatDatePE(sup.nextReviewDate),
    statusLabel(sup.status),
  ]);

  drawTable(doc, headers, colWidths, rows, startY, institution, title, subtitle, logoBase64);

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) { doc.setPage(p); drawFooter(doc, institution, p, totalPages); }

  doc.save(`reporte_resumen_soportes_${buildFileStamp()}.pdf`);
}
