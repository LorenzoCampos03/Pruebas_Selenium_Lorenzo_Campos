import { jsPDF } from "jspdf";
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "../models/eventModel";
import {
     loadLogoBase64,
     drawHeader,
     drawTable,
     drawSectionTitle,
     drawField,
     FONT,
     COLOR,
     MARGIN,
     getColors,
} from "@/core/utils/reportGenerator";

// Helpers compactos
function formatDate(value) {
     if (!value) return "";
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return "";
     return new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
     }).format(date);
}

function sanitizeCsv(value) {
     const raw = value == null ? "" : String(value);
     return `"${raw.replace(/"/g, '""')}"`;
}

function buildStamp() {
     const now = new Date();
     return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
}

function getTypeLabel(type) {
     return EVENT_TYPE_LABELS[type] || type || "Sin tipo";
}

function getStatusLabel(status) {
     return EVENT_STATUS_LABELS[status] || status || "Sin estado";
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

// Contar eventos por tipo y estado
function buildStats(events) {
     const byStatus = events.reduce((acc, e) => {
          const status = getStatusLabel(e.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
     }, {});
     return byStatus;
}

// Agrupar eventos por tipo
function groupByType(events) {
     return events.reduce((acc, e) => {
          const type = getTypeLabel(e.eventType);
          if (!acc[type]) acc[type] = [];
          acc[type].push(e);
          return acc;
     }, {});
}

// Tabla sin bordes (similar a drawTable pero sin rect final)
function drawTableNoBorder(doc, headers, colWidths, rows, startY, institution = {}) {
     const COLOR = {
          TABLE_HDR: [30, 64, 175],
          ROW_ODD: [239, 246, 255],
          ROW_EVEN: [255, 255, 255],
          WHITE: [255, 255, 255],
          DARK: [30, 30, 40],
          LINE: [191, 219, 254],
     };
     const FONT = { BODY: 8, TINY: 6.5 };
     const MARGIN = { left: 15, right: 15 };

     const pageH = doc.internal.pageSize.getHeight();
     const rowH = 7;
     const hdrH = 9;
     const footH = 20;
     let y = startY;
     const tableW = colWidths.reduce((s, w) => s + w, 0);
     const tableX = MARGIN.left;

     // Header
     doc.setFillColor(...COLOR.TABLE_HDR);
     doc.rect(tableX, y, tableW, hdrH, "F");
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.BODY);
     doc.setTextColor(...COLOR.WHITE);
     let x = tableX;
     headers.forEach((h, i) => {
          doc.text(h, x + 3, y + 6);
          x += colWidths[i];
     });
     y += hdrH;

     // Filas
     rows.forEach((row, rowIdx) => {
          const bg = rowIdx % 2 === 0 ? COLOR.ROW_ODD : COLOR.ROW_EVEN;
          doc.setFillColor(...bg);
          doc.rect(tableX, y, tableW, rowH, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONT.BODY);
          doc.setTextColor(...COLOR.DARK);

          x = tableX;
          row.forEach((cell, i) => {
               const text = String(cell ?? "");
               const maxW = colWidths[i] - 5;
               const lines = doc.splitTextToSize(text, maxW);
               const linesToShow = lines.slice(0, 2);
               linesToShow.forEach((line, lineIdx) => {
                    doc.text(line, x + 3, y + 4.8 + (lineIdx * 3));
               });
               x += colWidths[i];
          });

          y += rowH;
     });

     // SIN BORDES (no rect)
     return y;
}

// CSV: Ligero y directo
export async function generateEventsCsv({ events, calendar, filters, generatedBy }) {
     if (!events?.length) return;

     const generatedAt = new Date().toLocaleString("es-PE");
     const lines = [];

     // Metadatos compactos
     lines.push("METADATOS");
     lines.push("Campo,Valor");
     lines.push(`${sanitizeCsv("Año")},${sanitizeCsv(calendar?.academicYear || "N/A")}`);
     lines.push(`${sanitizeCsv("Rango")},${sanitizeCsv(`${formatDate(calendar?.startDate)} - ${formatDate(calendar?.endDate)}`)}`);
     lines.push(`${sanitizeCsv("Total eventos")},${sanitizeCsv(events.length)}`);
     lines.push(`${sanitizeCsv("Generado")},${sanitizeCsv(generatedAt)}`);
     lines.push(`${sanitizeCsv("Generado por")},${sanitizeCsv(generatedBy || "Sistema")}`);

     // Detalle
     lines.push("");
     lines.push("EVENTOS");
     lines.push("Título,Descripción,Fechas,Tipo,Estado");

     events.forEach((e) => {
          const startDate = formatDate(e.startDate);
          const endDate = formatDate(e.endDate);
          const dateRange = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;

          lines.push([
               sanitizeCsv(e.title || "—"),
               sanitizeCsv(e.description || ""),
               sanitizeCsv(dateRange),
               sanitizeCsv(getTypeLabel(e.eventType)),
               sanitizeCsv(getStatusLabel(e.status)),
          ].join(","));
     });

     const csv = lines.join("\n");
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     downloadBlob(blob, `eventos_${calendar?.academicYear || "general"}_${buildStamp()}.csv`);
}

// PDF: Ligero, agradable, estándar, con colores de institución
export async function generateEventsPdf({ events, calendar, institution, generatedBy }) {
     if (!events?.length) return;

     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const pageH = doc.internal.pageSize.getHeight();

     // Cargar logo (validar peso: si > 18KB, omitir)
     let logoBase64 = null;
     if (institution?.logoUrl) {
          logoBase64 = await loadLogoBase64(institution.logoUrl);
          if (logoBase64 && String(logoBase64).length > 18000) {
               logoBase64 = null;
          }
     }

     // Agrupar por tipo
     const byType = groupByType(events);

     // Header (sin subtitle)
     let y = drawHeader(
          doc,
          institution || {},
          "REPORTE DE EVENTOS",
          "",
          logoBase64
     );

     // Dibujar cada tipo como subtítulo separado (debajo de la línea del header)
     const titleY = 39;
     const subtitleStartY = titleY + 9;
     Object.entries(byType).forEach((entry, idx) => {
          const [type, typeEvents] = entry;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONT.SMALL);
          doc.setTextColor(...COLOR.GRAY);
          doc.text(
               `${type.toUpperCase()} (${typeEvents.length})`,
               MARGIN.left,
               subtitleStartY + (idx * 4)
          );
     });

     // Ajustar y después de los subtítulos
     const numTypes = Object.keys(byType).length;
     y = Math.max(y, subtitleStartY + (numTypes * 4) + 3);

     // INFORMACIÓN DEL REPORTE
     y = drawSectionTitle(doc, "INFORMACIÓN DEL REPORTE", y, institution);
     y += 3;

     drawField(doc, "Rango", `${formatDate(calendar?.startDate)} - ${formatDate(calendar?.endDate)}`, 15, y, 28);
     y += 6;

     drawField(doc, "Generado por", generatedBy || "Sistema", 15, y, 28);
     y += 6;

     drawField(doc, "Total eventos", String(events.length), 15, y, 28);
     y += 12;

     // Tablas por tipo (sin bordes)
     let rowNum = 1;

     Object.entries(byType).forEach(([type, typeEvents]) => {
          // Verificar si cabe la tabla en página actual
          const estimatedHeight = 12 + (typeEvents.length * 5);
          if (y + estimatedHeight > pageH - 20) {
               // Nueva página
               doc.addPage();
               y = drawHeader(
                    doc,
                    institution || {},
                    "REPORTE DE EVENTOS",
                    "",
                    logoBase64
               );
               rowNum = 1;
          }

          // Título de tipo (sin fondo, igual a REPORTE DE EVENTOS)
          const C = getColors(institution || {});
          doc.setFont("helvetica", "bold");
          doc.setFontSize(FONT.TITLE);
          doc.setTextColor(...C.PRIMARY_DARK);
          doc.text(`${type.toUpperCase()} (${typeEvents.length})`, MARGIN.left, y);
          y += 6;
          y += 1;

          // Tabla sin bordes: solo #, Título, Fechas
          const headers = ["#", "Título", "Fechas"];
          const colWidths = [12, 125, 48];

          const rows = typeEvents.map((e) => {
               const startDate = formatDate(e.startDate);
               const endDate = formatDate(e.endDate);
               const dateRange = endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;

               return [
                    String(rowNum++),
                    e.title || "—",
                    dateRange,
               ];
          });

          // Tabla sin bordes
          y = drawTableNoBorder(doc, headers, colWidths, rows, y, institution || {});

          y += 6;
     });

     // Guardar
     doc.save(`eventos_${calendar?.academicYear || "general"}_${buildStamp()}.pdf`);
}

// Backward compatibility (si hay código llamando a eventReportService)
export const eventReportService = {
     generateCsvReport: generateEventsCsv,
     generatePdfReport: generateEventsPdf,
};
