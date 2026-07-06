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
import {
  EVALUATION_STATUS_LABELS,
  EVAL_TYPE_LABELS,
  FREQ_LABELS,
} from "../models/psychologyModel";
import {
  renderMultiLineText,
  buildFileStamp,
  formatDatePE,
} from "../utils/reportHelpers";

const typeLabel = (t) => EVAL_TYPE_LABELS[t] || t || "\u2014";
const statusLabel = (s) => EVALUATION_STATUS_LABELS[s] || s || "\u2014";

// ── Shared renderer: renders one evaluation's full content on the current doc ──

function renderEvaluationSections(doc, evaluation, institution, logoBase64) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const isLandscape = pageW > pageH;
  const ensure = (y, space = 45) => {
    if (y <= pageH - space) return y;
    drawFooter(doc, institution, "?", "?");
    doc.addPage();
    return drawHeader(doc, institution, title, subtitle, logoBase64);
  };

  const subtitle = `Estudiante: ${evaluation.studentName || "\u2014"}`;
  const title = "Ficha de Evaluaci\u00f3n Psicol\u00f3gica";
  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  const col1 = MARGIN.left;
  const maxW = pageW - MARGIN.left - MARGIN.right;

  const labelW = isLandscape ? 55 : 42;
  const midX = isLandscape ? pageW / 2 + 5 : 110;

  y = drawSectionTitle(doc, "Datos Generales", y, institution);
  y += 2;

  drawField(doc, "Estudiante", evaluation.studentName || "\u2014", col1, y, labelW);
  drawField(doc, "Tipo", typeLabel(evaluation.evaluationType), midX, y, labelW);
  y += 6;

  drawField(doc, "N\u00b0 Sesi\u00f3n", evaluation.sessionNumber ? `#${evaluation.sessionNumber}` : "\u2014", col1, y, labelW);
  drawField(doc, "Aula", evaluation.classroomName || "\u2014", midX, y, labelW);
  y += 6;

  drawField(doc, "Evaluador", evaluation.evaluatorName || "\u2014", col1, y, labelW);
  drawField(doc, "A\u00f1o Acad\u00e9mico", String(evaluation.academicYear || "\u2014"), midX, y, labelW);
  y += 6;

  drawField(doc, "Estado", statusLabel(evaluation.status), col1, y, labelW);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.PRIMARY);
  doc.text("Motivo:", col1, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.DARK);
  y = renderMultiLineText(doc, evaluation.evaluationReason || "\u2014", col1 + 14, y, maxW - 14);
  y += 4;

  y = ensure(y);
  y = drawSectionTitle(doc, "Seguimiento", y, institution);
  y += 2;
  const followUpText = evaluation.requiresFollowUp
    ? `S\u00ed \u2014 ${FREQ_LABELS[evaluation.followUpFrequency] || evaluation.followUpFrequency || "Sin frecuencia"}`
    : "No requiere seguimiento";
  drawField(doc, "Requiere seguimiento", followUpText, col1, y, labelW);
  y += 8;

  y = ensure(y);
  y = drawSectionTitle(doc, "\u00c1reas de Desarrollo", y, institution);
  y += 3;

  const areas = [
    { label: "Emocional", value: evaluation.emotionalDevelopment },
    { label: "Social", value: evaluation.socialDevelopment },
    { label: "Cognitivo", value: evaluation.cognitiveDevelopment },
    { label: "Motor", value: evaluation.motorDevelopment },
  ];

  const labelColW = isLandscape ? 30 : 26;
  const tableX = col1;
  let isFirstAreaRow = true;

  areas.forEach(({ label, value }) => {
    const text = (value && value.trim()) ? value : "\u2014";
    const lines = doc.splitTextToSize(text, maxW - labelColW - 6);
    const rowH = Math.max(10, lines.length * 4.2 + 6);
    const rowBot = y + rowH;

    if (rowBot > pageH - 25) {
      drawFooter(doc, institution, "?", "?");
      doc.addPage();
      y = drawHeader(doc, institution, title, subtitle, logoBase64);
      isFirstAreaRow = true;
    }

    doc.setFillColor(...COLOR.LIGHT_GRAY);
    doc.rect(tableX, y, labelColW, rowH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.PRIMARY_DARK);
    doc.text(label, tableX + 3, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.DARK);
    lines.forEach((line, li) => {
      doc.text(line, tableX + labelColW + 3, y + 6 + li * 4.2);
    });

    doc.setDrawColor(...COLOR.LINE);
    doc.setLineWidth(0.25);

    if (isFirstAreaRow) {
      doc.line(tableX, y, tableX + maxW, y);
      isFirstAreaRow = false;
    }

    doc.line(tableX, rowBot, tableX + maxW, rowBot);
    doc.line(tableX, y, tableX, rowBot);
    doc.line(tableX + maxW, y, tableX + maxW, rowBot);

    doc.setLineWidth(0.15);
    doc.line(tableX + labelColW, y, tableX + labelColW, rowBot);

    y = rowBot;
  });
  y += 2;

  y = ensure(y, 50);
  y = drawSectionTitle(doc, "Observaciones", y, institution);
  y += 3;
  y = renderMultiLineText(
    doc,
    (evaluation.observations && evaluation.observations.trim()) ? evaluation.observations : "Sin observaciones registradas.",
    col1, y, maxW, "normal", FONT.BODY, evaluation.observations?.trim() ? COLOR.DARK : COLOR.GRAY
  );
  y += 5;

  y = ensure(y, 50);
  y = drawSectionTitle(doc, "Recomendaciones", y, institution);
  y += 3;
  y = renderMultiLineText(
    doc,
    (evaluation.recommendations && evaluation.recommendations.trim()) ? evaluation.recommendations : "Sin recomendaciones registradas.",
    col1, y, maxW, "normal", FONT.BODY, evaluation.recommendations?.trim() ? COLOR.DARK : COLOR.GRAY
  );

  drawFooter(doc, institution, "?", "?");
}

// ── Helper: render session detail block (reused by general & student reports) ──

function renderSessionDetail(doc, ev, idx, institution, logoBase64, title, subtitle, pageW, pageH, y, footH) {
  const col1 = MARGIN.left;
  const maxW = pageW - MARGIN.left - MARGIN.right;
  const ensure = (y, space = 55) => {
    if (y <= pageH - space) return y;
    drawFooter(doc, institution, "?", "?");
    doc.addPage();
    return drawHeader(doc, institution, title, subtitle, logoBase64);
  };

  const sessionLabel = `Sesi\u00f3n #${idx + 1} \u2014 ${typeLabel(ev.evaluationType)} \u2014 ${formatDatePE(ev.evaluationDate)}`;

  y = ensure(y);
  doc.setDrawColor(...COLOR.PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(col1, y, col1 + maxW, y);
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.BODY + 1);
  doc.setTextColor(...COLOR.PRIMARY_DARK);
  doc.text(sessionLabel, col1, y);
  y += 6;

  if (ev.evaluationReason && ev.evaluationReason.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text("Motivo:", col1, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.DARK);
    y = renderMultiLineText(doc, ev.evaluationReason, col1 + 14, y, maxW - 14);
    y += 3;
  }

  const areas = [
    { label: "Emocional", value: ev.emotionalDevelopment },
    { label: "Social", value: ev.socialDevelopment },
    { label: "Cognitivo", value: ev.cognitiveDevelopment },
    { label: "Motor", value: ev.motorDevelopment },
  ];
  const hasAnyArea = areas.some(a => a.value && a.value.trim());
  if (hasAnyArea) {
    y = ensure(y, 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text("\u00c1reas de Desarrollo:", col1, y);
    y += 4;

    const halfW = (maxW - 4) / 2;
    const areaRows = [
      [{ label: "Emocional", value: ev.emotionalDevelopment }, { label: "Social", value: ev.socialDevelopment }],
      [{ label: "Cognitivo", value: ev.cognitiveDevelopment }, { label: "Motor", value: ev.motorDevelopment }],
    ];

    areaRows.forEach((row) => {
      const rh = Math.max(6, ...row.map(a => {
        const t = (a.value && a.value.trim()) ? a.value : "\u2014";
        return doc.splitTextToSize(t, halfW - 6).length * 3.8 + 4;
      }));

      if (y + rh > pageH - footH) {
        drawFooter(doc, institution, "?", "?");
        doc.addPage();
        y = drawHeader(doc, institution, title, subtitle, logoBase64);
      }

      row.forEach((a, ci) => {
        const x = col1 + (ci === 0 ? 0 : halfW + 4);
        const text = (a.value && a.value.trim()) ? a.value : "\u2014";
        const lines = doc.splitTextToSize(text, halfW - 6);

        doc.setFillColor(...COLOR.LIGHT_GRAY);
        doc.rect(x, y, halfW, rh, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLOR.PRIMARY_DARK);
        doc.text(a.label, x + 2, y + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.BODY);
        doc.setTextColor(...COLOR.DARK);
        lines.forEach((line, li) => {
          doc.text(line, x + 16, y + 4 + li * 3.8);
        });

        doc.setDrawColor(...COLOR.LINE);
        doc.setLineWidth(0.1);
        doc.rect(x, y, halfW, rh);
      });

      y += rh;
    });
    y += 3;
  }

  if (ev.observations && ev.observations.trim()) {
    y = ensure(y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text("Observaciones:", col1, y);
    y = renderMultiLineText(doc, ev.observations, col1 + 22, y, maxW - 22);
    y += 3;
  }

  if (ev.recommendations && ev.recommendations.trim()) {
    y = ensure(y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text("Recomendaciones:", col1, y);
    y = renderMultiLineText(doc, ev.recommendations, col1 + 28, y, maxW - 28);
    y += 4;
  }

  if (ev.requiresFollowUp) {
    y = ensure(y, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT.BODY);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text("Seguimiento:", col1, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR.DARK);
    const freq = FREQ_LABELS[ev.followUpFrequency] || ev.followUpFrequency || "\u2014";
    doc.text(freq, col1 + 22, y);
    y += 6;
  }

  y += 2;
  return y;
}

// ── Helper: render a single session on its own page ───────────────────────────

function renderSessionPage(doc, ev, sessionIdx, institution, logoBase64, pageTitle, pageSubtitle) {
  drawFooter(doc, institution, "?", "?");
  doc.addPage();
  const y = drawHeader(doc, institution, pageTitle, pageSubtitle, logoBase64);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const footH = 20;
  return renderSessionDetail(doc, ev, sessionIdx, institution, logoBase64, pageTitle, pageSubtitle, pageW, pageH, y, footH);
}

// ── General Report ────────────────────────────────────────────────────────────

export async function generateGeneralReport(evaluations, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  evaluations.forEach((ev, i) => {
    if (i > 0) doc.addPage();
    renderEvaluationSections(doc, ev, institution, logoBase64);
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, institution, p, totalPages);
  }

  const fileName = `reporte_evaluaciones_psicologicas_${buildFileStamp()}.pdf`;
  doc.save(fileName);
}

// ── Individual Report ─────────────────────────────────────────────────────────

export async function generateIndividualReport(evaluation, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  renderEvaluationSections(doc, evaluation, institution, logoBase64);

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, institution, p, totalPages);
  }

  const studentName = (evaluation.studentName || "evaluacion").replace(/\s+/g, "_");
  const fileName = `ficha_evaluacion_${studentName}_${buildFileStamp()}.pdf`;
  doc.save(fileName);
}

// ── Summary Report (grouped by student) ───────────────────────────────────────

export async function generateSummaryReport(evaluations, institution) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);

  const title = "Reporte Resumen de Evaluaciones Psicol\u00f3gicas";
  const subtitle = `Total de evaluaciones: ${evaluations.length} | Total de estudiantes: ${new Set(evaluations.map(e => e.studentId)).size}`;
  const startY = drawHeader(doc, institution, title, subtitle, logoBase64);

  const studentMap = {};
  evaluations.forEach(ev => {
    const sid = ev.studentId;
    if (!studentMap[sid]) {
      studentMap[sid] = { studentName: ev.studentName || "\u2014", institutionName: ev.institutionName || "\u2014", classroomName: ev.classroomName || "\u2014", evaluations: [] };
    }
    studentMap[sid].evaluations.push(ev);
  });

  const studentGroups = Object.values(studentMap).sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""));

  const headers = ["N\u00b0", "Estudiante", "Instituci\u00f3n", "Aula", "Sesiones", "Tipos", "\u00daltima sesi\u00f3n", "Estado"];
  const colWidths = [8, 48, 40, 32, 14, 40, 28, 20];

  const rows = studentGroups.map((group, idx) => {
    const evs = group.evaluations;
    const sortedEvs = [...evs].sort((a, b) => new Date(a.evaluationDate || 0) - new Date(b.evaluationDate || 0));
    const lastDate = sortedEvs.length > 0 ? formatDatePE(sortedEvs[sortedEvs.length - 1].evaluationDate) : "\u2014";

    const typeCounts = {};
    evs.forEach(ev => { const t = ev.evaluationType || "OTRO"; typeCounts[t] = (typeCounts[t] || 0) + 1; });
    const typesStr = Object.entries(typeCounts).map(([t, c]) => `${typeLabel(t)} (${c})`).join(", ");

    const activeCount = evs.filter(e => e.status === "ACTIVE").length;
    const inactiveCount = evs.filter(e => e.status === "INACTIVE").length;
    let statusStr = "";
    if (activeCount > 0 && inactiveCount > 0) statusStr = `${activeCount} Activa(s) / ${inactiveCount} Inactiva(s)`;
    else if (activeCount > 0) statusStr = `${activeCount} Activa(s)`;
    else statusStr = `${inactiveCount} Inactiva(s)`;

    return [String(idx + 1), group.studentName, group.institutionName, group.classroomName, String(evs.length), typesStr, lastDate, statusStr];
  });

  drawTable(doc, headers, colWidths, rows, startY, institution, title, subtitle, logoBase64);

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, institution, p, totalPages);
  }

  const fileName = `reporte_resumen_evaluaciones_${buildFileStamp()}.pdf`;
  doc.save(fileName);
}

// ── Student Full Report (all sessions of one student) ─────────────────────────

export async function generateStudentFullReport(evaluations, institution) {
  if (!evaluations || evaluations.length === 0) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const logoBase64 = await loadLogoBase64(institution?.logoUrl);
  const col1 = MARGIN.left;

  const studentName = evaluations[0]?.studentName || "Estudiante";
  const subtitle = `${evaluations.length} sesi\u00f3n${evaluations.length !== 1 ? "es" : ""}`;
  const title = `Reporte de ${studentName}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // ── Datos Generales ──
  const first = evaluations[0];
  y = drawSectionTitle(doc, "Datos Generales", y, institution);
  y += 2;

  const labelW = 42;
  drawField(doc, "Estudiante", studentName, col1, y, labelW);
  drawField(doc, "Instituci\u00f3n", first?.institutionName || "\u2014", 110, y, labelW);
  y += 6;

  drawField(doc, "Aula", first?.classroomName || "\u2014", col1, y, labelW);
  drawField(doc, "Evaluador", first?.evaluatorName || "\u2014", 110, y, labelW);
  y += 6;

  drawField(doc, "A\u00f1o Acad\u00e9mico", String(first?.academicYear || "\u2014"), col1, y, labelW);
  y += 8;

  // ── Sessions summary ──
  const sorted = [...evaluations].sort((a, b) => new Date(a.evaluationDate || 0) - new Date(b.evaluationDate || 0));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.PRIMARY);
  doc.text("Resumen de Sesiones:", col1, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT.BODY);
  doc.setTextColor(...COLOR.DARK);
  sorted.forEach((ev, idx) => {
    const line = `Sesi\u00f3n #${idx + 1} \u2014 ${typeLabel(ev.evaluationType)} \u2014 ${formatDatePE(ev.evaluationDate)}`;
    doc.text(`\u2022 ${line}`, col1 + 4, y);
    y += 5;
  });

  // ── Each session on its own page ──
  sorted.forEach((ev, idx) => {
    y = renderSessionPage(doc, ev, idx, institution, logoBase64, title, subtitle);
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, institution, p, totalPages);
  }

  const safeName = studentName.replace(/\s+/g, "_");
  const fileName = `historial_${safeName}_${buildFileStamp()}.pdf`;
  doc.save(fileName);
}
