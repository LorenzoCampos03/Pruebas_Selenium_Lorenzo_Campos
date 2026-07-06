import { jsPDF } from "jspdf";
import {
  loadLogoBase64,
  drawHeader,
  drawTable,
  drawSectionTitle,
} from "@/core/utils/reportGenerator";

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

const AGE_ORDER = { "3 años": 1, "4 años": 2, "5 años": 3 };

export async function generateCoursesReport({ courses = [], institution = {} }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);

  const activos   = courses.filter(c => c.status === "ACTIVE").length;
  const inactivos = courses.filter(c => c.status === "INACTIVE").length;

  const title    = "REPORTE GENERAL DE CURSOS";
  const subtitle = `Total: ${courses.length} curso(s)  ·  Activos: ${activos}  ·  Inactivos: ${inactivos}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);
  y += 8;

  // Ordenar por nivel de edad
  const sorted = [...courses].sort((a, b) => {
    const oa = AGE_ORDER[a.ageLevel] ?? 99;
    const ob = AGE_ORDER[b.ageLevel] ?? 99;
    return oa !== ob ? oa - ob : (a.name || "").localeCompare(b.name || "");
  });

  // Agrupar por ageLevel
  const groups = {};
  sorted.forEach(c => {
    const key = c.ageLevel || "Sin nivel";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  const headers   = ["#", "Código", "Nombre del Curso", "Área Curricular", "Estado"];
  const colWidths = [10, 20, 65, 55, 30];

  let globalIdx = 1;
  for (const [age, list] of Object.entries(groups)) {
    y = drawSectionTitle(doc, `Cursos — ${age}`, y, institution);
    y += 4;

    const rows = list.map(c => [
      String(globalIdx++),
      c.code || "—",
      truncate(c.name || "—", 40),
      truncate(c.areaCurricular || "—", 35),
      c.status === "ACTIVE" ? "Activo" : "Inactivo",
    ]);

    y = drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);
    y += 8;
  }

  doc.save(`reporte_cursos_${buildFileStamp()}.pdf`);
}
