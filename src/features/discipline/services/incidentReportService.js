import { jsPDF } from "jspdf";
import {
     drawHeader,
     drawFooter,
     drawTable,
     drawSectionTitle,
     drawField,
     loadLogoBase64,
} from "@/core/utils/reportGenerator";
import {
     INCIDENT_STATUS_LABELS,
     INCIDENT_TYPE_LABELS,
     SEVERITY_LEVEL_LABELS,
} from "../models/disciplineModel";

function statusLabel(s) {
     return INCIDENT_STATUS_LABELS[s] || s || "—";
}

function typeLabel(t) {
     return INCIDENT_TYPE_LABELS[t] || t || "—";
}

function severityLabel(s) {
     return SEVERITY_LEVEL_LABELS[s] || s || "—";
}

function fmtDate(d) {
     if (!d) return "—";
     try {
          return new Intl.DateTimeFormat("es-PE", {
               day: "2-digit",
               month: "2-digit",
               year: "numeric",
          }).format(new Date(`${d}T00:00:00`));
     } catch {
          return d;
     }
}

function sanitizeCsvValue(value) {
     const raw = value == null ? "" : String(value);
     return `"${raw.replace(/"/g, '""')}"`;
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

function downloadBlob(blob, fileName) {
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = fileName;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
}

function truncate(text, maxLen = 60) {
     if (!text) return "—";
     return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

// ── PDF Report ────────────────────────────────────────────────────────────────

export async function generateIncidentsListReport(incidents, institution = {}) {
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

     const title = `Reporte de Incidencias Disciplinarias`;
     const subtitle = `Total: ${incidents.length} incidencia(s) registrada(s)`;

     const y = drawHeader(doc, institution, title, subtitle, null);

     const headers = ["#", "Fecha", "Tipo", "Severidad", "Alumno", "Ubicación", "Descripción", "Reportado", "Estado"];
     const colWidths = [8, 20, 26, 22, 42, 30, 58, 30, 20];

     const rows = incidents.map((inc, i) => [
          String(i + 1),
          fmtDate(inc.incidentDate),
          typeLabel(inc.incidentType),
          severityLabel(inc.severityLevel),
          inc.studentName || inc.studentId || "—",
          truncate(inc.location, 30),
          truncate(inc.description),
          inc.reportedBy || "—",
          statusLabel(inc.status),
     ]);

     drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, null);

     doc.save(`reporte_incidencias_${buildFileStamp()}.pdf`);
}

export async function generateIncidentDetailReport(incident, institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const logoBase64 = await loadLogoBase64(institution?.logoUrl);

     const title = "Ficha Individual de Incidencia";
     const subtitle = `Reporte Disciplinario`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     y = drawSectionTitle(doc, "I. Detalles del Incidente", y, institution);

     const col1X = 14;
     const col2X = pageW / 2 + 4;

     drawField(doc, "Fecha", fmtDate(incident.incidentDate), col1X, y);
     drawField(doc, "Hora", incident.incidentTime || "—", col2X, y);
     y += 6;
     drawField(doc, "Tipo", typeLabel(incident.incidentType), col1X, y);
     drawField(doc, "Severidad", severityLabel(incident.severityLevel), col2X, y);
     y += 6;
     drawField(doc, "Estado", incident.invalidated ? "Invalidada" : statusLabel(incident.status), col1X, y);
     drawField(doc, "Año Académico", incident.academicYear || "—", col2X, y);
     y += 8;

     y = drawSectionTitle(doc, "II. Involucrados", y, institution);
     drawField(doc, "Estudiante Principal", incident.studentName || incident.studentId || "—", col1X, y, 40);
     y += 6;
     
     if (incident.otherStudentNames && incident.otherStudentNames.length > 0) {
         drawField(doc, "Otros Involucrados", incident.otherStudentNames.join(", "), col1X, y, 40);
         y += 6;
     }

     drawField(doc, "Testigos", incident.witnesses || "—", col1X, y, 40);
     y += 8;

     y = drawSectionTitle(doc, "III. Descripción y Ubicación", y, institution);
     drawField(doc, "Ubicación", incident.location || "—", col1X, y, 40);
     y += 6;
     
     doc.setFont("helvetica", "bold");
     doc.setFontSize(8);
     doc.setTextColor(30, 58, 138);
     doc.text("Descripción:", col1X, y);
     
     doc.setFont("helvetica", "normal");
     doc.setTextColor(30, 30, 40);
     const maxW = pageW - col1X - 14;
     const descLines = doc.splitTextToSize(incident.description || "—", maxW);
     doc.text(descLines, col1X, y + 4);
     y += 4 + (descLines.length * 4) + 4;

     if (incident.immediateAction) {
         doc.setFont("helvetica", "bold");
         doc.setTextColor(30, 58, 138);
         doc.text("Acción Inmediata:", col1X, y);
         doc.setFont("helvetica", "normal");
         doc.setTextColor(30, 30, 40);
         const actLines = doc.splitTextToSize(incident.immediateAction, maxW);
         doc.text(actLines, col1X, y + 4);
         y += 4 + (actLines.length * 4) + 4;
     }

     y = drawSectionTitle(doc, "IV. Seguimiento y Resolución", y, institution);
     drawField(doc, "Reportado por", incident.reporterName || incident.reportedBy || "—", col1X, y, 40);
     drawField(doc, "Fecha Reporte", incident.reportedAt ? new Date(incident.reportedAt).toLocaleString("es-PE") : "—", col2X, y, 40);
     y += 6;

     drawField(doc, "Padres Notificados", incident.parentsNotified ? "Sí" : "No", col1X, y, 40);
     drawField(doc, "Req. Seguimiento", incident.followUpRequired ? "Sí" : "No", col2X, y, 40);
     y += 6;

     if (incident.resolvedBy) {
         drawField(doc, "Asumido por", incident.resolverName || incident.resolvedBy || "—", col1X, y, 40);
         drawField(doc, "Resolución", incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString("es-PE") : "—", col2X, y, 40);
         y += 6;
     }

     if (incident.invalidated) {
         y += 4;
         y = drawSectionTitle(doc, "V. Invalidación", y, institution);
         drawField(doc, "Invalidado por", incident.invalidatedBy || "—", col1X, y, 40);
         drawField(doc, "Fecha", incident.invalidatedAt ? new Date(incident.invalidatedAt).toLocaleString("es-PE") : "—", col2X, y, 40);
         y += 6;
         doc.setFont("helvetica", "bold");
         doc.setTextColor(160, 60, 60);
         doc.text("Motivo:", col1X, y);
         doc.setFont("helvetica", "normal");
         const motLines = doc.splitTextToSize(incident.invalidationReason || "—", maxW);
         doc.text(motLines, col1X, y + 4);
         y += 4 + (motLines.length * 4);
     }

     drawFooter(doc, institution, 1, 1);
     doc.save(`incidencia_ficha_${incident.id || buildFileStamp()}.pdf`);
}

// ── CSV Report ────────────────────────────────────────────────────────────────

export function generateIncidentsCsvReport(incidents) {
     const lines = [];

     lines.push("Fecha,Hora,Tipo,Severidad,Estado,Alumno,Ubicacion,Reportado por,Responsable,Descripcion");

     incidents.forEach((inc) => {
          lines.push(
               [
                    sanitizeCsvValue(fmtDate(inc.incidentDate)),
                    sanitizeCsvValue(inc.incidentTime || ""),
                    sanitizeCsvValue(typeLabel(inc.incidentType)),
                    sanitizeCsvValue(severityLabel(inc.severityLevel)),
                    sanitizeCsvValue(statusLabel(inc.status)),
                    sanitizeCsvValue(inc.studentName || inc.studentId || ""),
                    sanitizeCsvValue(inc.location || ""),
                    sanitizeCsvValue(inc.reportedBy || ""),
                    sanitizeCsvValue(inc.resolvedBy || "—"),
                    sanitizeCsvValue(inc.description || ""),
               ].join(",")
          );
     });

     const csv = lines.join("\n");
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     downloadBlob(blob, `reporte_incidencias_${buildFileStamp()}.csv`);
}

// ── Legacy wrapper (backward compatibility) ──────────────────────────────────

export const incidentReportService = {
     async generatePdfReport({ incidents, institution }) {
          await generateIncidentsListReport(incidents, institution);
     },
     generateCsvReport({ incidents }) {
          generateIncidentsCsvReport(incidents);
     },
};