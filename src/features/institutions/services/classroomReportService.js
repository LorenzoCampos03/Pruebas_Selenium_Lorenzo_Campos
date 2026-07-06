import { jsPDF } from "jspdf";
import {
     drawHeader,
     drawTable,
     drawSectionTitle,
     drawField,
     loadLogoBase64,
} from "@/core/utils/reportGenerator";
import { CLASSROOM_STATUS_LABELS } from "../models/classroomModel";

function statusLabel(s) {
     return CLASSROOM_STATUS_LABELS[s] || s || "—";
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

// ── PDF Report ────────────────────────────────────────────────────────────────

export async function generateClassroomsListReport(classrooms, institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const logoBase64 = await loadLogoBase64(institution?.logoUrl);

     const title = `REPORTE GENERAL DE AULAS`;
     const subtitle = `Total: ${classrooms.length} aula(s) registrada(s)`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     y += 5;
     y = drawSectionTitle(doc, "Datos de la Institución", y, institution);
     y += 4;
     
     drawField(doc, "Institución", institution.name || "—", 15, y, 25);
     drawField(doc, "Director(a)", institution.directorName || institution.director || "—", 105, y, 22);
     y += 7;
     
     drawField(doc, "Cód. Modular", institution.modularCode || "—", 15, y, 25);
     drawField(doc, "Nivel", institution.level || "—", 105, y, 22);
     y += 7;
     
     drawField(doc, "Tipo", institution.institutionType || "—", 15, y, 25);
     drawField(doc, "Código Inst.", institution.codeInstitution || "—", 105, y, 22);
     y += 7;

     const address = [institution.address?.district, institution.address?.province].filter(Boolean).join(", ") || "—";
     drawField(doc, "Ubicación", address, 15, y, 25);
     y += 12;

     y = drawSectionTitle(doc, "Detalle de Aulas Registradas", y, institution);
     y += 4;

     const headers = ["#", "Nombre del Aula", "Edad/Grado", "Capacidad", "Estado"];
     const colWidths = [12, 85, 30, 25, 28]; // Total 180 (A4 W=210, margins 15)

     const rows = classrooms.map((cls, i) => [
          String(i + 1),
          truncate(cls.name || "Sin nombre", 50),
          cls.age || "—",
          String(cls.capacity || "—"),
          statusLabel(cls.status),
     ]);

     drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

     doc.save(`reporte_aulas_${buildFileStamp()}.pdf`);
}

// ── Legacy wrapper (backward compatibility) ──────────────────────────────────

export const classroomReportService = {
     async generatePdfReport({ classrooms, institution }) {
          await generateClassroomsListReport(classrooms, institution);
     },
};