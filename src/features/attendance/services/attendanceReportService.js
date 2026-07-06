import { jsPDF } from "jspdf";
import { drawHeader, drawTable, loadLogoBase64 } from "@/core/utils/reportGenerator";

function unwrap(responseData) {
  return responseData?.data ?? responseData;
}

function statusEs(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PRESENT") return "PRESENTE";
  if (s === "JUSTIFIED") return "JUSTIFICADO";
  if (s === "ABSENT") return "AUSENTE";
  return s || "";
}

function getDateLabel(ymd) {
  if (!ymd) return "";
  const d = String(ymd).slice(0, 10);
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

function toCsvRow(values, delimiter = ";") {
  return values
    .map((v) => {
      const s = String(v ?? "");
      const escaped = s.replaceAll('"', '""');
      return `"${escaped}"`;
    })
    .join(delimiter);
}

export async function exportAttendancePdf({
  institutionResponse,
  classroomName = "",
  dateYmd,
  students = [],
  attendances = [],
}) {
  const institution = unwrap(institutionResponse) || {};
  // El logo (imagen) suele ser lo que más pesa en el PDF. Si es grande, se omite.
  let logoBase64 = await loadLogoBase64(institution.logoUrl);
  if (logoBase64 && String(logoBase64).length > 18000) {
    logoBase64 = null;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const subtitle = `${classroomName} · Fecha: ${getDateLabel(dateYmd)}`;
  const startY = drawHeader(doc, institution, "Reporte de Asistencia", subtitle, logoBase64);

  const headers = ["N°", "DNI", "Estudiante", "Estado", "Ingreso", "Salida", "Justificación"];
  const colWidths = [10, 24, 58, 20, 18, 18, 36];

  const byStudent = new Map(attendances.map((a) => [String(a.studentId), a]));
  const rows = students.map((s, idx) => {
    const a = byStudent.get(String(s.id)) || {};
    return [
      idx + 1,
      s.documentNumber || "",
      `${s.lastName || ""} ${s.firstName || ""}`.trim(),
      statusEs(a.status || "ABSENT"),
      a.arrivalTime || "",
      a.departureTime || "",
      a.justificationReason || "",
    ];
  });

  drawTable(doc, headers, colWidths, rows, startY, institution, "Reporte de Asistencia", subtitle, logoBase64);
  doc.save(`asistencia_${String(classroomName || "aula").replaceAll(" ", "_")}_${dateYmd}.pdf`);
}

export async function exportAttendancePdfAllDays({
  institutionResponse,
  classroomName = "",
  dateColumns = [],
  students = [],
  getCell, // (studentId, ymd) -> attendance|null
}) {
  const days = (dateColumns || []).map((d) => String(d).slice(0, 10)).filter(Boolean);
  if (days.length === 0) return;

  const institution = unwrap(institutionResponse) || {};
  // El logo (imagen) suele ser lo que más pesa en el PDF. Si es grande, se omite.
  let logoBase64 = await loadLogoBase64(institution.logoUrl);
  if (logoBase64 && String(logoBase64).length > 18000) {
    logoBase64 = null;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  const headers = ["N°", "DNI", "Estudiante", "Estado", "Ingreso", "Salida", "Justificación"];
  const colWidths = [10, 24, 58, 20, 18, 18, 36];

  for (let i = 0; i < days.length; i++) {
    const dateYmd = days[i];
    if (i > 0) doc.addPage();

    const subtitle = `${classroomName} · Fecha: ${getDateLabel(dateYmd)}`;
    const startY = drawHeader(doc, institution, "Reporte de Asistencia", subtitle, logoBase64);

    const rows = (students || []).map((s, idx) => {
      const a = getCell?.(s.id, dateYmd) || {};
      return [
        idx + 1,
        s.documentNumber || "",
        `${s.lastName || ""} ${s.firstName || ""}`.trim(),
        statusEs(a.status || "ABSENT"),
        a.arrivalTime || "",
        a.departureTime || "",
        a.justificationReason || "",
      ];
    });

    drawTable(doc, headers, colWidths, rows, startY, institution, "Reporte de Asistencia", subtitle, logoBase64);
  }

  doc.save(`asistencia_${String(classroomName || "aula").replaceAll(" ", "_")}_todos_${days[0]}_${days[days.length - 1]}.pdf`);
}

export function exportAttendanceCsv({
  classroomName = "",
  dateColumns = [],
  students = [],
  getCell, // (studentId, ymd) -> attendance|null
}) {
  const header = ["DNI", "Estudiante", ...dateColumns.flatMap((d) => [`${getDateLabel(d)} Estado`, `${getDateLabel(d)} Ingreso`, `${getDateLabel(d)} Salida`])];
  // Excel en configuración ES suele requerir ';' para separar columnas.
  const delimiter = ";";
  const lines = [toCsvRow(header, delimiter)];

  for (const s of students) {
    const name = `${s.lastName || ""} ${s.firstName || ""}`.trim();
    const row = [s.documentNumber || "", name];
    for (const d of dateColumns) {
      const a = getCell(s.id, d) || {};
      row.push(statusEs(a.status || ""));
      row.push(a.arrivalTime || "");
      row.push(a.departureTime || "");
    }
    lines.push(toCsvRow(row, delimiter));
  }

  const csv = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const file = `asistencia_${String(classroomName || "aula").replaceAll(" ", "_")}.csv`;
  downloadBlob(blob, file);
}

