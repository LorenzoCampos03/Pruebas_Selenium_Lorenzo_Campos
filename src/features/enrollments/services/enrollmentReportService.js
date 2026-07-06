import { jsPDF } from "jspdf";
import {
  drawHeader,
  drawFooter,
  drawTable,
  drawField,
  drawSectionTitle,
  drawListEntry,
  loadLogoBase64,
} from "@/core/utils/reportGenerator";
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_TYPE_LABELS } from "../models/enrollmentModel";

/**
 * Servicio para generar reportes PDF de matrículas (enrollments)
 * Reutiliza las funciones de reportGenerator.js para mantener consistencia
 */

// ── Funciones auxiliares ─────────────────────────────────────────────────────

function statusLabel(s) {
  return ENROLLMENT_STATUS_LABELS[s] || s || "—";
}

function typeLabel(t) {
  return ENROLLMENT_TYPE_LABELS[t] || t || "—";
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

function truncate(text, maxLen = 60) {
  if (!text) return "—";
  return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

// ── PDF Report: Lista de Matrículas ──────────────────────────────────────────

/**
 * Genera un reporte PDF con la lista de matrículas
 * @param {Array} enrollments - Lista de matrículas
 * @param {Object} institution - Datos de la institución
 * @param {Object} filters - Filtros aplicados (opcional)
 */
export async function generateEnrollmentsListReport(enrollments, institution, filters = {}) {
  console.log("📊 Generando reporte de lista de matrículas");
  console.log("📊 Total de matrículas:", enrollments.length);
  console.log("🏫 Institución:", institution);
  console.log("🖼️ Logo URL de institución:", institution?.logoUrl);
  
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);
  
  console.log("🖼️ Logo Base64 cargado:", logoBase64 ? "SÍ" : "NO");

  // Construir subtítulo con filtros
  let subtitle = `Total: ${enrollments.length} matrícula(s) registrada(s)`;
  if (filters.academicYear) subtitle += ` | Año: ${filters.academicYear}`;
  if (filters.status) subtitle += ` | Estado: ${statusLabel(filters.status)}`;
  if (filters.ageGroup) subtitle += ` | Edad: ${filters.ageGroup}`;

  const title = "Reporte de Matrículas";
  const y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Preparar datos para la tabla
  const headers = ["#", "Código", "Estudiante", "Aula", "Edad", "Turno", "Sección", "Estado"];
  const colWidths = [10, 25, 55, 35, 20, 25, 20, 25];

  const rows = enrollments.map((enrollment, i) => [
    String(i + 1),
    truncate(enrollment.enrollmentCode || "Sin código", 20),
    truncate(enrollment.studentFullName || "Sin nombre", 45),
    truncate(enrollment.classroomName || "—", 30),
    enrollment.ageGroup || "—",
    enrollment.shift || "—",
    enrollment.section || "—",
    statusLabel(enrollment.enrollmentStatus),
  ]);

  drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

  const fileName = `reporte_matriculas_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Reporte generado exitosamente");
}

// ── PDF Report: Ficha de Matrícula Individual ───────────────────────────────

/**
 * Genera un reporte PDF detallado de una matrícula específica
 * con formato de Ficha Única de Matrícula (MINEDU)
 * @param {Object} enrollment - Datos de la matrícula
 * @param {Object} student - Datos del estudiante
 * @param {Object} institution - Datos de la institución
 * @param {Object} classroom - Datos del aula (opcional)
 * @param {Object} academicPeriod - Datos del período académico (opcional)
 */
export async function generateEnrollmentDetailReport(
  enrollment,
  student,
  institution,
  classroom = null,
  academicPeriod = null
) {
  console.log("📄 Generando ficha de matrícula individual");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;
  const usableW = pageW - M * 2;
  const C = {
    DARK: [30, 30, 40], GRAY: [130, 135, 145], MID: [70, 75, 85],
    LIGHT: [245, 246, 250], LINE: [210, 215, 222], WHITE: [255, 255, 255],
    BG: [249, 250, 252], BLACK: [0, 0, 0],
    GREEN: [34, 139, 34],
  };

  let y = M;

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  // ── Helpers ─────────────────────────────────────────────────────────────
  function drawSectionBar(yPos, title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.DARK);
    doc.text(title, M, yPos + 3);
  }

  function drawDataRow(fields, startY, opts = {}) {
    const rowH = opts.rowH || 7.5;
    const cols = fields.length;
    const colW = usableW / cols;
    for (let i = 0; i < cols; i++) {
      const f = fields[i];
      const fx = M + i * colW;
      const fy = startY;
      doc.setDrawColor(...C.LINE);
      doc.setLineWidth(0.3);
      doc.rect(fx, fy, colW, rowH, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...C.DARK);
      doc.text(f.label, fx + 2, fy + 2.8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.DARK);
      const valStr = String(f.value ?? "—");
      const maxVW = colW - 4;
      const vLines = doc.splitTextToSize(valStr, maxVW);
      doc.text(vLines[0], fx + 2, fy + rowH - 1.2);
    }
    return startY + rowH;
  }

  // ── Header: MINEDU branding + Logo ─────────────────────────────────────
  const logoSize = 21;
  const logoX = M;
  const logoY = y - 3;
  const textLeftX = logoBase64 ? M + logoSize + 4 : M;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize);
    } catch {
      try {
        doc.addImage(logoBase64, "JPEG", logoX, logoY, logoSize, logoSize);
      } catch {
        //
      }
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.GRAY);
  doc.text("Ministerio de Educación", pageW / 2, y - 3, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Sistema de Gestión de la Educación Inicial - SIGEI", pageW - M, y, { align: "right" });
  y += 6;

  doc.setDrawColor(0, 0, 0);
  y += 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.DARK);
  doc.text("FICHA ÚNICA DE MATRÍCULA", pageW / 2, y, { align: "center" });
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.GRAY);
  doc.text(`Código: ${enrollment.enrollmentCode || "—"}`, pageW / 2, y, { align: "center" });
  y += 5;

  // ── Institution data box ───────────────────────────────────────────────
  const ieH = 15;
  const instColor = institution?.colorInstitution;
  let bgColor = C.BG;
  if (instColor && /^#[0-9A-Fa-f]{6}$/.test(instColor)) {
    const r = parseInt(instColor.slice(1, 3), 16);
    const g = parseInt(instColor.slice(3, 5), 16);
    const b = parseInt(instColor.slice(5, 7), 16);
    bgColor = [...[r, g, b].map(c => c + Math.round((255 - c) * 0.7))];
  }
  doc.setFillColor(...bgColor);
  doc.rect(M, y, usableW, ieH, "F");
  doc.setDrawColor(...C.LINE);
  doc.rect(M, y, usableW, ieH, "S");
  const ieInner = y + 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.DARK);
  const ieName = (institution?.name || "—").toUpperCase();
  doc.text(`INSTITUCIÓN EDUCATIVA: ${ieName}`, pageW / 2, ieInner + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.MID);
  const ieMeta = [institution?.modularCode ? `Cód. Modular: ${institution.modularCode}` : "",
    institution?.ugel ? `UGEL: ${institution.ugel}` : ""].filter(Boolean).join("  |  ");
  if (ieMeta) doc.text(ieMeta, pageW / 2, ieInner + 9.5, { align: "center" });
  const addr = [];
  if (institution?.address?.district) addr.push(institution.address.district);
  if (institution?.address?.province) addr.push(institution.address.province);
  if (institution?.address?.department) addr.push(institution.address.department);
  if (addr.length) {
    doc.setFontSize(9);
    doc.setTextColor(...C.GRAY);
    doc.text(`Ubicación: ${addr.join(", ")}`, pageW / 2, ieInner + 13.5, { align: "center" });
  }
  y += ieH + 4;

  // ════════════════════════════════════════════════════════════════════════
  // I. DATOS PERSONALES
  // ════════════════════════════════════════════════════════════════════════
  drawSectionBar(y, "I.  DATOS PERSONALES DEL ESTUDIANTE");
  y += 7;

  const stu = student || {};
  const genderLabel = stu.gender === "M" ? "Masculino" : stu.gender === "F" ? "Femenino" : "—";

  y = drawDataRow([
    { label: "APELLIDO PATERNO", value: stu.lastName },
    { label: "APELLIDO MATERNO", value: stu.motherLastName },
    { label: "NOMBRES", value: stu.firstName },
  ], y);

  y = drawDataRow([
    { label: "TIPO DOC.", value: stu.documentType || "—" },
    { label: "N° DOCUMENTO", value: stu.documentNumber || "—" },
    { label: "SEXO", value: genderLabel },
  ], y);

  y = drawDataRow([
    { label: "FECHA DE NACIMIENTO", value: stu.dateOfBirth || "—" },
    { label: "EDAD", value: enrollment.studentAge ? `${enrollment.studentAge} años` : "—" },
    { label: "CUI", value: stu.cui || "—" },
  ], y);

  y += 3;

  // ════════════════════════════════════════════════════════════════════════
  // II. DATOS ACADÉMICOS
  // ════════════════════════════════════════════════════════════════════════
  drawSectionBar(y, "II.  DATOS ACADÉMICOS");
  y += 7;

  y = drawDataRow([
    { label: "AÑO ACADÉMICO", value: enrollment.academicYear || "—" },
    { label: "PERÍODO", value: academicPeriod?.periodName || enrollment.academicPeriodId || "—" },
    { label: "CÓD. MATRÍCULA", value: enrollment.enrollmentCode || "—" },
  ], y);

  y = drawDataRow([
    { label: "TURNO", value: enrollment.shift || "—" },
    { label: "MODALIDAD", value: enrollment.modality || "—" },
    { label: "GRUPO DE EDAD", value: enrollment.ageGroup || "—" },
  ], y);

  y = drawDataRow([
    { label: "TIPO", value: typeLabel(enrollment.enrollmentType) },
    { label: "ESTADO", value: statusLabel(enrollment.enrollmentStatus) },
    { label: "FECHA DE MATRÍCULA", value: enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString("es-PE") : "—" },
  ], y);

  y += 3;

  // ════════════════════════════════════════════════════════════════════════
  // III. AULA
  // ════════════════════════════════════════════════════════════════════════
  drawSectionBar(y, "III.  INFORMACIÓN DEL AULA");
  y += 7;

  y = drawDataRow([
    { label: "AULA", value: classroom?.classroomName || enrollment.classroomName || "—" },
    { label: "GRADO / EDAD", value: classroom?.classroomGrade || classroom?.classroomAge || "—" },
    { label: "INSTITUCIÓN", value: institution?.name || enrollment.institutionName || "—" },
  ], y);

  y = drawDataRow([
    { label: "CÓD. MODULAR", value: institution?.modularCode || "—" },
    { label: "CÓD. INSTITUCIÓN", value: enrollment.institutionCode || institution?.code || "—" },
    { label: "INSTITUCIÓN ANTERIOR", value: enrollment.previousInstitution || "—" },
  ], y);

  y += 3;

  // ════════════════════════════════════════════════════════════════════════
  // IV. DOCUMENTOS PRESENTADOS
  // ════════════════════════════════════════════════════════════════════════
  drawSectionBar(y, "IV.  DOCUMENTOS PRESENTADOS");
  y += 6.5;

  const DOCS = [
    { key: "birthCertificate", label: "Certificado de Nacimiento" },
    { key: "studentDni", label: "DNI del Estudiante" },
    { key: "guardianDni", label: "DNI del Apoderado" },
    { key: "vaccinationCard", label: "Carné de Vacunación" },
    { key: "disabilityCertificate", label: "Certificado de Discapacidad" },
    { key: "utilityBill", label: "Recibo de Servicios" },
    { key: "psychologicalReport", label: "Informe Psicológico" },
    { key: "studentPhoto", label: "Foto del Estudiante" },
    { key: "healthRecord", label: "Ficha de Salud" },
    { key: "signedEnrollmentForm", label: "Formulario Firmado" },
    { key: "dniVerification", label: "Verificación de DNI" },
  ];

  const docCols = 3;
  const docColW = usableW / docCols;
  const docRowH = 6;

  for (let i = 0; i < DOCS.length; i++) {
    const ci = i % docCols;
    const ri = Math.floor(i / docCols);
    const dx = M + ci * docColW;
    const dy2 = y + ri * docRowH;
    const presented = enrollment[DOCS[i].key];

    doc.setDrawColor(...C.LINE);
    doc.setLineWidth(0.2);
    doc.rect(dx, dy2, docColW, docRowH, "S");

    // Checkbox square
    const cbX = dx + 2.5;
    const cbY = dy2 + (docRowH - 3.2) / 2;
    const cbS = 3.2;
    doc.setDrawColor(...C.DARK);
    doc.setLineWidth(0.4);
    doc.rect(cbX, cbY, cbS, cbS, presented ? "F" : "S");
    if (presented) {
      doc.setFillColor(...C.GREEN);
      doc.rect(cbX, cbY, cbS, cbS, "F");
      doc.setFillColor(...C.WHITE);
      doc.setDrawColor(...C.WHITE);
      doc.setLineWidth(0.6);
      const cx = cbX + cbS / 2;
      const cy = cbY + cbS / 2;
      doc.line(cx - 1.2, cy + 0.3, cx - 0.3, cy + 1.2);
      doc.line(cx - 0.3, cy + 1.2, cx + 1.4, cy - 1);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.DARK);
    doc.text(DOCS[i].label, dx + 7.5, dy2 + docRowH - 1.8);
  }

  y += Math.ceil(DOCS.length / docCols) * docRowH + 3;

  // ════════════════════════════════════════════════════════════════════════
  // V. OBSERVACIONES
  // ════════════════════════════════════════════════════════════════════════
  if (enrollment.observations) {
    drawSectionBar(y, "V.  OBSERVACIONES");
    y += 6.5;

    const obsBoxH = 16;
    doc.setDrawColor(...C.LINE);
    doc.setLineWidth(0.3);
    doc.rect(M, y, usableW, obsBoxH, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.DARK);
    const obsLines = doc.splitTextToSize(enrollment.observations, usableW - 8);
    obsLines.slice(0, 5).forEach((line, i) => {
      doc.text(line, M + 4, y + 4 + i * 3.5);
    });
    y += obsBoxH + 4;
  } else {
    y += 2;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Signatures
  // ════════════════════════════════════════════════════════════════════════
  const signTop = pageH - 32;
  if (y > signTop) {
    doc.addPage();
    y = M + 2;
  } else {
    y = signTop;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  y += 2.5;

  const half = (usableW - 12) / 2;
  const lineY2 = y + 7;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(M, lineY2, M + half, lineY2);
  doc.line(M + half + 12, lineY2, M + half * 2 + 12, lineY2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.MID);
  doc.text("Firma del Apoderado", M + half / 2, y + 12, { align: "center" });
  doc.text("Firma del Director / Secretario", M + half + 12 + half / 2, y + 12, { align: "center" });

  // ── Disclaimer (justo arriba del footer) ────────────────────────────────
  const dcY = pageH - 11;
  doc.setDrawColor(...C.LINE);
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...C.GRAY);
  doc.text(
    "Este documento es una ficha única de matrícula emitida por el Sistema de Gestión de la Educación Inicial - SIGEI",
    pageW / 2, dcY, { align: "center" }
  );

  // ── Footer ─────────────────────────────────────────────────────────────
  const fY = pageH - 8;
  doc.setDrawColor(...C.LINE);
  doc.setLineWidth(0.3);
  doc.line(M, fY - 1, pageW - M, fY - 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.GRAY);
  const now = new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" });
  doc.text(`Generado: ${now}`, M, fY + 2.5);
  doc.text(institution?.name || "SIGEI", pageW / 2, fY + 2.5, { align: "center" });
  doc.text("SIGEI", pageW - M, fY + 2.5, { align: "right" });

  const fileName = `ficha_matricula_${enrollment.enrollmentCode || buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Ficha de matrícula generada exitosamente");
}

/**
 * Genera un reporte consolidado de matrículas por aula
 * @param {Array} enrollments - Lista de matrículas
 * @param {Object} classroom - Datos del aula
 * @param {Object} institution - Datos de la institución
 */
export async function generateClassroomEnrollmentsReport(enrollments, classroom, institution) {
  console.log("📊 Generando reporte de aula");
  console.log("🏫 Aula:", classroom);
  console.log("👥 Total estudiantes:", enrollments.length);
  
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const subtitle = `Aula: ${classroom.classroomName} | Edad: ${classroom.classroomAge} | Total: ${enrollments.length} estudiantes`;
  let y = drawHeader(
    doc,
    institution,
    "Lista de Estudiantes por Aula",
    subtitle,
    logoBase64
  );

  y += 5;

  // Información del aula
  y = drawSectionTitle(doc, "Información del Aula", y, institution);
  y += 2;

  const col1X = 15;
  const col2X = 110;

  drawField(doc, "Nombre del Aula", classroom.classroomName, col1X, y);
  drawField(doc, "Capacidad", `${enrollments.length}/${classroom.capacity}`, col2X, y);
  y += 6;

  drawField(doc, "Grupo de Edad", classroom.classroomAge, col1X, y);
  drawField(doc, "Estado", classroom.status === "ACTIVE" ? "Activo" : "Inactivo", col2X, y);
  y += 10;

  // Lista de estudiantes
  y = drawSectionTitle(doc, "Estudiantes Matriculados", y, institution);
  y += 2;

  enrollments.forEach((enrollment, index) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 30) {
      drawFooter(doc, institution, "?", "?");
      doc.addPage();
      y = drawHeader(doc, institution, "Lista de Estudiantes por Aula", subtitle, logoBase64);
      y += 5;
    }

    const num = index + 1;
    const title = enrollment.studentFullName || "Sin nombre";
    const subtitleText = `CUI: ${enrollment.student?.cui || "—"} | DNI: ${enrollment.student?.documentNumber || "—"}`;
    const meta = `Turno: ${enrollment.shift} | Sección: ${enrollment.section} | Código: ${enrollment.enrollmentCode || "—"}`;
    const badge = statusLabel(enrollment.enrollmentStatus);

    y = drawListEntry(doc, num, title, subtitleText, meta, badge, y, index % 2 === 0);
  });

  drawFooter(doc, institution, 1, 1);

  const fileName = `lista_aula_${classroom.classroomName}_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Reporte de aula generado exitosamente");
}

/**
 * Genera un reporte estadístico de matrículas
 * @param {Object} stats - Estadísticas de matrículas
 * @param {Object} institution - Datos de la institución
 */
export async function generateEnrollmentStatsReport(stats, institution) {
  console.log("📊 Generando reporte de estadísticas");
  console.log("📊 Stats:", stats);
  
  const doc = new jsPDF();
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const subtitle = `Período: ${stats.academicYear || "Todos"} | Generado: ${new Date().toLocaleDateString("es-PE")}`;
  let y = drawHeader(
    doc,
    institution,
    "Estadísticas de Matrículas",
    subtitle,
    logoBase64
  );

  y += 5;

  // Resumen General
  y = drawSectionTitle(doc, "Resumen General", y, institution);
  y += 2;

  const col1X = 15;
  const col2X = 110;

  drawField(doc, "Total Matrículas", stats.totalEnrollments || 0, col1X, y);
  drawField(doc, "Matrículas Activas", stats.activeEnrollments || 0, col2X, y);
  y += 6;

  drawField(doc, "Matrículas Pendientes", stats.pendingEnrollments || 0, col1X, y);
  drawField(doc, "Matrículas Canceladas", stats.cancelledEnrollments || 0, col2X, y);
  y += 10;

  // Por Grupo de Edad
  if (stats.byAgeGroup && stats.byAgeGroup.length > 0) {
    y = drawSectionTitle(doc, "Distribución por Edad", y, institution);
    y += 2;

    const headers = ["Grupo de Edad", "Cantidad", "Porcentaje"];
    const colWidths = [60, 40, 40];
    const rows = stats.byAgeGroup.map((item) => [
      item.ageGroup,
      item.count,
      `${item.percentage}%`,
    ]);

    y = drawTable(
      doc,
      headers,
      colWidths,
      rows,
      y,
      institution,
      "Estadísticas de Matrículas",
      subtitle,
      logoBase64
    );
  }

  drawFooter(doc, institution, 1, 1);

  const fileName = `estadisticas_matriculas_${buildFileStamp()}.pdf`;
  console.log("💾 Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("✅ Reporte de estadísticas generado exitosamente");
}

// ── Funciones auxiliares eliminadas (ya no son necesarias) ──────────────────
// getStatusLabel y getEnrollmentTypeLabel se eliminan porque ya usamos
// statusLabel y typeLabel definidas al inicio del archivo
