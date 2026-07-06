/**
 * Exporta evaluaciones a CSV
 */
export function exportEvaluationsCSV(evaluations, filename = "evaluaciones") {
     const headers = [
          "Sesión", "Estudiante", "Institución", "Aula", "Tipo", "Fecha",
          "Evaluador", "Motivo", "Desarrollo Emocional", "Desarrollo Social",
          "Desarrollo Cognitivo", "Desarrollo Motor", "Observaciones",
          "Recomendaciones", "Requiere Seguimiento", "Frecuencia Seguimiento",
          "Estado", "Año Académico"
     ];

     const escape = (val) => {
          const s = String(val ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
               ? `"${s.replace(/"/g, '""')}"`
               : s;
     };

     // Excel en configuración ES suele requerir ';' como separador de columnas.
     const delimiter = ";";

     const rows = evaluations.map(ev => [
          ev.sessionNumber ?? "",
          ev.studentName ?? "",
          ev.institutionName ?? "",
          ev.classroomName ?? "",
          ev.evaluationType ?? "",
          ev.evaluationDate ?? "",
          ev.evaluatorName ?? "",
          ev.evaluationReason ?? "",
          ev.emotionalDevelopment ?? "",
          ev.socialDevelopment ?? "",
          ev.cognitiveDevelopment ?? "",
          ev.motorDevelopment ?? "",
          ev.observations ?? "",
          ev.recommendations ?? "",
          ev.requiresFollowUp ? "Sí" : "No",
          ev.followUpFrequency ?? "",
          ev.status === "ACTIVE" ? "Activa" : "Inactiva",
          ev.academicYear ?? "",
     ].map(escape).join(delimiter));

     const bom = "\uFEFF"; // UTF-8 BOM para Excel
     const csv = bom + [headers.map(escape).join(delimiter), ...rows].join("\n");
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     const url  = URL.createObjectURL(blob);
     const a    = document.createElement("a");
     a.href     = url;
     a.download = `${filename}-${Date.now()}.csv`;
     a.click();
     URL.revokeObjectURL(url);
}
