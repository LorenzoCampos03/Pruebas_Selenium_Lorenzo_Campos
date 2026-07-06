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

function estadoLabel(status) {
  const map = { FINALIZADO: "Finalizado", EN_PROCESO: "En Proceso", CANCELADO: "Cancelado" };
  return map[status] || status || "—";
}

function buildFileStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
}

function truncate(text, maxLen = 60) {
  if (!text) return "—";
  return text.length > maxLen ? text.substring(0, maxLen - 1) + "…" : text;
}

export async function generateDailyEvaluationsReport({
  evaluations,
  courses = {},
  competencies = {},
  capacities = {},
  institution = {},
  classroom = null,
  user = {},
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoBase64 = await loadLogoBase64(institution.logoUrl);

  const finalizadas = evaluations.filter(e => e.status === "FINALIZADO").length;
  const enProceso   = evaluations.filter(e => e.status === "EN_PROCESO").length;
  const aulaName    = classroom?.classroomName || classroom?.name || "—";

  const title    = "REPORTE DE EVALUACIONES DIARIAS";
  const subtitle = `Total: ${evaluations.length} evaluación(es)  ·  Finalizadas: ${finalizadas}  ·  En proceso: ${enProceso}  ·  Aula: ${aulaName}`;

  let y = drawHeader(doc, institution, title, subtitle, logoBase64);

  // Datos del aula
  y += 5;
  y = drawSectionTitle(doc, "Datos del Aula", y, institution);
  y += 4;
  drawField(doc, "Institución", institution.name || "—", 15, y, 25);
  drawField(doc, "Aula", aulaName, 105, y, 22);
  y += 7;
  drawField(doc, "Docente", user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—" : "—", 15, y, 25);
  drawField(doc, "Nivel", classroom?.classroomAge || "—", 105, y, 22);
  y += 12;

  // Agrupar evaluaciones por curso
  const grouped = {};
  evaluations.forEach(ev => {
    // El courseId viene en los detalles, no en la evaluación directamente
    const courseId = ev.details?.[0]?.courseId;
    // Solo agregar si tiene courseId válido
    if (courseId) {
      if (!grouped[courseId]) grouped[courseId] = [];
      grouped[courseId].push(ev);
    }
  });

  const headers   = ["#", "Fecha", "Competencia / Capacidades", "Calificados", "Estado"];
  const colWidths = [10, 25, 85, 25, 25];

  let globalIdx = 1;
  for (const [courseId, evs] of Object.entries(grouped)) {
    const courseName = courses[courseId] || "Sin curso asignado";
    y = drawSectionTitle(doc, courseName, y, institution);
    y += 4;

    const rows = evs.map(ev => {
      const competencyId   = ev.details?.[0]?.competencyId;
      const competencyName = competencyId ? (competencies[competencyId] || competencyId) : "—";
      
      // Obtener capacidades únicas de esta evaluación
      const capacityIds = [...new Set(ev.details?.map(d => d.capacityId).filter(Boolean) || [])];
      const capacityNames = capacityIds.map(id => capacities[id] || id);
      
      // Construir texto de competencia + capacidades en una sola línea
      let competencyText = competencyName;
      if (capacityNames.length > 0) {
        // Agregar capacidades separadas por " | "
        const capsText = capacityNames.map(c => truncate(c, 35)).join(' | ');
        competencyText = `${competencyName}\nCap: ${capsText}`;
      }
      
      const total      = ev.details?.length || 0;
      const calificados = ev.details?.filter(d => d.achievementLevel && d.achievementLevel !== "SIN_CALIFICAR").length || 0;
      return [
        String(globalIdx++),
        fmtDate(ev.evaluationDate),
        competencyText,
        `${calificados}/${total}`,
        estadoLabel(ev.status),
      ];
    });

    y = drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);
    y += 8;
  }

  doc.save(`reporte_evaluaciones_diarias_${buildFileStamp()}.pdf`);
}
