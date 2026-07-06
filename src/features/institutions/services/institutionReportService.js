import { jsPDF } from "jspdf";
import {
     drawHeader,
     drawFooter,
     drawTable,
} from "@/core/utils/reportGenerator";
import { INSTITUTION_STATUS_LABELS } from "../models/institutionModel";

function statusLabel(s) {
     return INSTITUTION_STATUS_LABELS[s] || s || "—";
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

export async function generateInstitutionsListReport(institutions) {
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

     const title = `Reporte de Instituciones`;
     const subtitle = `Total: ${institutions.length} institución(es) registrada(s)`;

     const sigeiInstitution = { name: "SIGEI" };
     const y = drawHeader(doc, sigeiInstitution, title, subtitle, null);

     const headers = ["#", "Institución", "Tipo", "Nivel", "Estado", "Director", "Ubicación"];
     const colWidths = [12, 50, 30, 30, 25, 40, 65];

     const rows = institutions.map((inst, i) => [
          String(i + 1),
          truncate(inst.name || "Sin nombre", 40),
          inst.institutionType || "—",
          inst.level || "—",
          statusLabel(inst.status),
          truncate(inst.directorName || inst.director || "—", 30),
          truncate(
               [inst.address?.district, inst.address?.province].filter(Boolean).join(", ") || "—",
               50
          ),
     ]);

     drawTable(doc, headers, colWidths, rows, y, sigeiInstitution, title, subtitle, null);

     doc.save(`reporte_instituciones_${buildFileStamp()}.pdf`);
}

// ── Legacy wrapper (backward compatibility) ──────────────────────────────────

export const institutionReportService = {
     async generatePdfReport({ institutions }) {
          await generateInstitutionsListReport(institutions);
     },
};