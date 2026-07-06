import { jsPDF } from "jspdf";
import {
  loadLogoBase64,
  drawHeader,
  drawTable,
  drawSectionTitle,
  drawField,
} from "@/core/utils/reportGenerator";

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(d));
  } catch { return d; }
}

function buildFileStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
}

function truncate(text, maxLen = 60) {
  if (!text) return "—";
  return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

export async function generateReportCardsReport({
  students,
  classroom,
  institution = {},
  boletasPorEstudiante = {},
  periodNumber,
  academicYear,
  periodLabel,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);

  const generadas  = students.filter(s => {
    const boletas = boletasPorEstudiante[s.id] || [];
    return boletas.some(b => b.periodNumber === periodNumber && b.academicYear === academicYear && b.status !== 'DELETED');
  }).length;
  const pendientes = students.length - generadas;

  const title    = "REPORTE DE LIBRETAS DE NOTAS";
  const subtitle = `${periodLabel} ${academicYear}  ·  Total: ${students.length} estudiante(s)  ·  Generadas: ${generadas}  ·  Pendientes: ${pendientes}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Datos del aula
  y += 5;
  y = drawSectionTitle(doc, "Datos del Aula", y, institution);
  y += 4;

  drawField(doc, "Institución", institution.name || "—", 15, y, 25);
  drawField(doc, "Aula", classroom?.classroomName || classroom?.name || "—", 105, y, 22);
  y += 7;
  drawField(doc, "Período", `${periodLabel} ${academicYear}`, 15, y, 25);
  drawField(doc, "Nivel", classroom?.classroomAge || "—", 105, y, 22);
  y += 12;

  // Tabla de estudiantes
  y = drawSectionTitle(doc, "Detalle de Estudiantes", y, institution);
  y += 4;

  const headers   = ["#", "Apellidos y Nombres", "CUI", "DNI", "Estado", "Fecha Generación"];
  const colWidths = [10, 65, 25, 25, 25, 30];

  const rows = students.map((s, i) => {
    const boletas     = boletasPorEstudiante[s.id] || [];
    const boletaActual = boletas.find(b => b.periodNumber === periodNumber && b.academicYear === academicYear && b.status !== 'DELETED');
    const nombre      = [s.lastName, s.motherLastName, s.firstName].filter(Boolean).join(" ");
    return [
      String(i + 1),
      truncate(nombre, 40),
      s.cui || "—",
      s.documentNumber || "—",
      boletaActual ? "Generada" : "Pendiente",
      boletaActual?.updatedAt ? fmtDate(boletaActual.updatedAt) : "—",
    ];
  });

  drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

  doc.save(`reporte_libretas_${classroom?.classroomName || "aula"}_${buildFileStamp()}.pdf`);
}
