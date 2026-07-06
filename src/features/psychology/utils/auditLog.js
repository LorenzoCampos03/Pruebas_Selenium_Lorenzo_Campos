/**
 * Auditoría de vistas de evaluaciones — almacenada en localStorage
 * Registra quién vio qué evaluación y cuándo
 */
const KEY = "psych_audit_log";
const MAX = 200;

export function logView(evaluationId, studentName, viewerName) {
     try {
          const log = getLog();
          log.unshift({
               evaluationId,
               studentName,
               viewerName: viewerName || "Usuario desconocido",
               action: "VIEW",
               timestamp: new Date().toISOString(),
          });
          localStorage.setItem(KEY, JSON.stringify(log.slice(0, MAX)));
     } catch { /* silent */ }
}

export function getLog() {
     try {
          return JSON.parse(localStorage.getItem(KEY) || "[]");
     } catch { return []; }
}

export function getLogByEvaluation(evaluationId) {
     return getLog().filter(e => e.evaluationId === evaluationId);
}

export function clearLog() {
     localStorage.removeItem(KEY);
}
