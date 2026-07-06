import { jsPDF } from "jspdf";
import {
     loadLogoBase64,
     drawHeader,
     drawFooter,
     drawTable,
     drawField,
     drawSectionTitle,
     drawListEntry,
} from "@/core/utils/reportGenerator";
import {
     ASSIGNMENT_STATUS_LABELS,
     formatAssignmentType,
     formatDayOfWeek,
     formatSessionType,
} from "../models/teacherModel";

const MARGIN = { left: 14, right: 14 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
     if (!d) return "—";
     try {
          return new Intl.DateTimeFormat("es-PE", {
               day: "2-digit",
               month: "2-digit",
               year: "numeric",
          }).format(new Date(d));
     } catch {
          return d;
     }
}

function assignmentStatusLabel(s) {
     return ASSIGNMENT_STATUS_LABELS[s] || s || "—";
}

function fullName(t) {
     return t.fullName || [t.firstName, t.lastName, t.motherLastName].filter(Boolean).join(" ");
}

export async function generateTeachersListReport(teachers, assignments = [], institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const logoBase64 = await loadLogoBase64(institution.logoUrl);
     const pageH = doc.internal.pageSize.getHeight();
     const title = "Reporte de Personal Docente";
     const subtitle = `Total: ${teachers.length} docente(s) registrado(s) · Año académico ${new Date().getFullYear()}`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);
     let pageNum = 1;

     const assignMap = {};
     assignments.forEach((a) => {
          if (!assignMap[a.teacherUserId]) assignMap[a.teacherUserId] = [];
          assignMap[a.teacherUserId].push(a);
     });

     teachers.forEach((t, i) => {
          if (y + 16 > pageH - 18) {
               drawFooter(doc, institution, pageNum, "?");
               doc.addPage();
               pageNum++;
               y = drawHeader(doc, institution, title, subtitle, logoBase64);
          }

          const tAssignments = assignMap[t.id] || [];
          const activeAssign = tAssignments.find((a) => a.status === "ACTIVE") || tAssignments[0];
          const statusText = t.status === "ACTIVE" || t.status === "A" ? "Activo" : "Inactivo";
          const name = fullName(t);
          const sub = `${t.documentType || "DNI"}: ${t.documentNumber || "—"}  |  ${t.phone || "—"}`;
          const meta = [
               t.email || t.userName || "",
               activeAssign ? `Asignación: ${formatAssignmentType(activeAssign.assignmentType)} · ${activeAssign.academicYear || "—"}` : "Sin asignación",
          ].filter(Boolean).join("   ");

          y = drawListEntry(doc, i + 1, name, sub, meta, statusText, y, i % 2 !== 0);
     });

     drawFooter(doc, institution, pageNum, pageNum);
     doc.save(`reporte_docentes_${Date.now()}.pdf`);
}

export async function generateTeacherScheduleReport(teacher, schedules = [], classrooms = [], institution = {}, assignmentClassroomId = "") {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const pageH = doc.internal.pageSize.getHeight();
     const logoBase64 = await loadLogoBase64(institution.logoUrl);

     const name = fullName(teacher);
     const title = "Horario del Docente";
     const subtitle = name;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     const MARGIN_L = 15;
     const MARGIN_R = 15;
     const usableW = pageW - MARGIN_L - MARGIN_R;

     y = drawSectionTitle(doc, "Datos del docente", y);

     const col2X = pageW / 2 + 4;
     drawField(doc, "Nombres y Apellidos", name, MARGIN_L, y);
     drawField(doc, "Documento", `${teacher.documentType || "DNI"}: ${teacher.documentNumber || "—"}`, col2X, y);
     y += 6;
     drawField(doc, "Teléfono", teacher.phone || "—", MARGIN_L, y);
     drawField(doc, "Correo", teacher.email || "—", col2X, y);
     y += 10;

     if (schedules.length === 0) {
          y = drawSectionTitle(doc, "Horario semanal", y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 125, 135);
          doc.text("El docente no tiene horarios registrados.", MARGIN_L, y + 4);
          drawFooter(doc, institution, 1, 1);
          doc.save(`horario_docente_${teacher.documentNumber || Date.now()}.pdf`);
          return;
     }

     const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
     const dayGroups = {};
     DAY_ORDER.forEach((d) => { dayGroups[d] = []; });
     schedules.forEach((s) => {
          const d = s.dayOfWeek || "MONDAY";
          if (!dayGroups[d]) dayGroups[d] = [];
          dayGroups[d].push(s);
     });
     dayGroups[Object.keys(dayGroups)[0]]?.forEach?.(() => { });

     const activeDays = DAY_ORDER.filter((d) => dayGroups[d].length > 0);

     y = drawSectionTitle(doc, "Horario semanal", y);

     const cardH = 9;
     const dayLabelW = 28;
     const scheduleAreaW = usableW - dayLabelW;

     activeDays.forEach((dayKey) => {
          const daySched = dayGroups[dayKey].slice().sort((a, b) => {
               return (a.startTime || "").localeCompare(b.startTime || "");
          });

          const dayH = Math.max(10, daySched.length * cardH + 4);

          if (y + dayH > pageH - 18) {
               drawFooter(doc, institution, 1, 1);
               doc.addPage();
               y = drawHeader(doc, institution, title, subtitle, logoBase64);
               y = drawSectionTitle(doc, "Horario semanal (cont.)", y);
          }

          doc.setFillColor(31, 56, 100);
          doc.rect(MARGIN_L, y, dayLabelW - 2, dayH, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text(formatDayOfWeek(dayKey), MARGIN_L + 1, y + dayH / 2 + 1, { maxWidth: dayLabelW - 4 });

          daySched.forEach((s, si) => {
               const sy = y + si * cardH + 2;
               const cx = MARGIN_L + dayLabelW;
               const cw = scheduleAreaW;
               const bg = si % 2 === 0 ? [248, 250, 253] : [255, 255, 255];
               doc.setFillColor(...bg);
               doc.rect(cx, sy, cw, cardH - 1, "F");

               const classroom = classrooms.find((c) => c.id === (s.classroomId || assignmentClassroomId));
               const classroomLabel = classroom
                    ? (classroom.classroomName || classroom.name || "Aula")
                    : s.classroomName || (s.classroomId ? "Aula asignada" : "Sin aula");
               const timeLabel = `${s.startTime || "—"} – ${s.endTime || "—"}`;
               const sessionLabel = formatSessionType(s.sessionType);

               doc.setFont("helvetica", "bold");
               doc.setFontSize(8);
               doc.setTextColor(31, 56, 100);
               doc.text(timeLabel, cx + 3, sy + 5);

               doc.setFont("helvetica", "normal");
               doc.setFontSize(7);
               doc.setTextColor(120, 125, 135);
               doc.text(`${classroomLabel}  ·  ${sessionLabel}`, cx + 36, sy + 5);
          });

          doc.setDrawColor(215, 220, 230);
          doc.setLineWidth(0.2);
          doc.rect(MARGIN_L, y, usableW, dayH, "S");

          y += dayH + 3;
     });

     drawFooter(doc, institution, 1, 1);
     doc.save(`horario_docente_${teacher.documentNumber || Date.now()}.pdf`);
}

// ─── Reporte Individual de Docente ─────────────────────────────────────────────

/**
 * @param {object}   teacher     Datos del docente
 * @param {object[]} assignments Asignaciones del docente
 * @param {object[]} schedules   Horarios de las asignaciones
 * @param {object[]} classrooms  Aulas asignadas
 * @param {object}   institution
 */
export async function generateTeacherDetailReport(
     teacher,
     assignments = [],
     schedules = [],
     institution = {}
) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const pageH = doc.internal.pageSize.getHeight();
     const logoBase64 = await loadLogoBase64(institution.logoUrl);

     const name = fullName(teacher);
     const title = "Ficha Individual del Docente";
     const subtitle = `${name}`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     const col1X = MARGIN.left;
     const col2X = pageW / 2 + 4;

     y = drawSectionTitle(doc, "I. Datos Personales", y);

     drawField(doc, "Nombres", teacher.firstName, col1X, y);
     drawField(doc, "Apellidos", `${teacher.lastName || ""} ${teacher.motherLastName || ""}`.trim(), col2X, y);
     y += 6;
     drawField(doc, "Tipo Doc.", teacher.documentType, col1X, y);
     drawField(doc, "N° Documento", teacher.documentNumber, col2X, y);
     y += 6;
     drawField(doc, "Teléfono", teacher.phone || "—", col1X, y);
     drawField(doc, "Correo", teacher.email || "—", col2X, y);
     y += 6;
     drawField(doc, "Usuario", teacher.userName || "—", col1X, y);
     drawField(doc, "Estado", teacher.status === "ACTIVE" || teacher.status === "A" ? "Activo" : "Inactivo", col2X, y);
     y += 8;

     if (assignments.length > 0) {
          y = drawSectionTitle(doc, "II. Asignaciones Académicas", y);

          const aHeaders = ["Tipo", "Año Acad.", "F. Inicio", "F. Fin", "Estado", "Notas"];
          const aColWidths = [28, 22, 26, 26, 24, 56];

          const aRows = assignments.map((a) => [
               formatAssignmentType(a.assignmentType),
               a.academicYear || "—",
               fmtDate(a.startDate),
               fmtDate(a.endDate),
               assignmentStatusLabel(a.status),
               a.notes || "—",
          ]);

          y = drawTable(doc, aHeaders, aColWidths, aRows, y, institution, title, subtitle, logoBase64) + 4;
     }

     // ── Horarios ──────────────────────────────────────────────────────────────
     if (schedules.length > 0) {
          if (y > pageH - 60) {
               drawFooter(doc, institution, 1, 1);
               doc.addPage();
               y = drawHeader(doc, institution, title, subtitle, logoBase64);
          }

          y = drawSectionTitle(doc, "III. Horarios Asignados", y);

          const sHeaders = ["Día", "Hora Inicio", "Hora Fin", "Tipo Sesión", "Aula"];
          const sColWidths = [30, 28, 28, 32, 64];

          const sRows = schedules.map((s) => [
               formatDayOfWeek(s.dayOfWeek),
               s.startTime || "—",
               s.endTime || "—",
               formatSessionType(s.sessionType),
               s.classroomName || (s.classroomId ? "Asignada" : "—"),
          ]);

          y = drawTable(doc, sHeaders, sColWidths, sRows, y, institution, title, subtitle, logoBase64) + 4;
     }

     drawFooter(doc, institution, 1, 1);

     doc.save(`ficha_docente_${teacher.documentNumber || Date.now()}.pdf`);
}
