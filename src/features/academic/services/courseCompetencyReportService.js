import { jsPDF } from "jspdf";
import {
  loadLogoBase64,
  drawHeader,
  drawFooter,
  drawSectionTitle,
} from "@/core/utils/reportGenerator";
import apiClient from "@/core/api/apiClient";

function truncate(text, maxLen = 80) {
  if (!text) return "—";
  return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

function buildFileStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
}

export async function generateCourseCompetencyReport({ courses = [], institution = {}, ageLevel = "" }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const ML = 15, MR = 15;
  const usableW = pageW - ML - MR;

  const title    = "REPORTE DE CURSOS — COMPETENCIAS Y CAPACIDADES";
  const subtitle = `Nivel: ${ageLevel}  ·  ${courses.length} curso(s)`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);
  let pageNum = 1;

  const checkPage = (needed) => {
    if (y + needed > pageH - 18) {
      drawFooter(doc, institution, pageNum, "?");
      doc.addPage();
      pageNum++;
      y = drawHeader(doc, institution, title, subtitle, logoBase64);
    }
  };

  for (const course of courses) {
    // Cargar competencias del curso
    let competencies = [];
    try {
      const { data } = await apiClient.get(`/api/v1/competencies/course/${course.id}/active`);
      competencies = Array.isArray(data) ? data : (data?.data || []);
    } catch {}

    // Cargar capacidades por competencia
    for (const comp of competencies) {
      try {
        const { data } = await apiClient.get(`/api/v1/capacities/competency/${comp.id}/active`);
        comp.capacities = Array.isArray(data) ? data : (data?.data || []);
      } catch { comp.capacities = []; }
    }

    checkPage(20);

    // Encabezado del curso
    y = drawSectionTitle(doc, `${course.code ? course.code + " — " : ""}${course.name}`, y, institution);
    y += 3;

    if (competencies.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(160, 165, 175);
      doc.text("Sin competencias registradas", ML + 4, y);
      y += 8;
      continue;
    }

    for (const comp of competencies) {
      checkPage(14);

      // Fila competencia
      doc.setFillColor(239, 246, 255);
      doc.rect(ML, y, usableW, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      const compLabel = `${comp.code ? comp.code + "  " : ""}${comp.name}`;
      doc.text(truncate(compLabel, 55), ML + 4, y + 5.5);
      // Descripción a la derecha
      if (comp.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(truncate(comp.description, 45), ML + usableW * 0.55, y + 5.5);
      }
      y += 9;

      if (!comp.capacities?.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(160, 165, 175);
        doc.text("Sin capacidades", ML + 10, y + 4);
        y += 7;
        continue;
      }

      for (const cap of comp.capacities) {
        checkPage(7);
        doc.setFillColor(255, 255, 255);
        doc.rect(ML, y, usableW, 6.5, "F");
        doc.setDrawColor(191, 219, 254);
        doc.setLineWidth(0.1);
        doc.line(ML, y + 6.5, ML + usableW, y + 6.5);

        // Bullet
        doc.setFillColor(59, 130, 246);
        doc.circle(ML + 7, y + 3.3, 1, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 40);
        const capLabel = `${cap.code ? cap.code + "  " : ""}${cap.name}`;
        doc.text(truncate(capLabel, 55), ML + 11, y + 4.5);
        // Descripción a la derecha
        if (cap.description) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(truncate(cap.description, 45), ML + usableW * 0.55, y + 4.5);
        }
        y += 7;
      }
      y += 2;
    }
    y += 4;
  }

  drawFooter(doc, institution, pageNum, pageNum);
  doc.save(`reporte_cursos_competencias_${buildFileStamp()}.pdf`);
}
