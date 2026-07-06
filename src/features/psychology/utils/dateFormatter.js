const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

function parseDate(date) {
  if (!date) return null;
  if (typeof date !== "string") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  // Date-only "YYYY-MM-DD" — never apply timezone shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt._dateOnly = true;
    return dt;
  }
  // Timestamp from DB (UTC) — normalize to ISO with Z marker
  let normalized = date.replace(/(\.\d{3})\d+/, "$1").trim();
  let iso = normalized.includes("T") ? normalized : normalized.replace(" ", "T");
  if (!iso.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    iso += "Z";
  }
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

function peruParts(dateObj) {
  if (dateObj._dateOnly) {
    return {
      day: String(dateObj.getDate()).padStart(2, "0"),
      month: MONTHS[dateObj.getMonth()],
      year: String(dateObj.getFullYear()),
      dayNum: String(dateObj.getDate()).padStart(2, "0"),
      monthNum: String(dateObj.getMonth() + 1).padStart(2, "0"),
    };
  }
  const fmt = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric", month: "long", year: "numeric",
  });
  const parts = fmt.formatToParts(dateObj);
  const find = (t) => parts.find((p) => p.type === t)?.value || "";
  return {
    day: find("day").padStart(2, "0"),
    month: find("month"),
    year: find("year"),
  };
}

export function formatDateToSpanish(date) {
  const dt = parseDate(date);
  if (!dt) return "";
  const p = peruParts(dt);
  const monthCap = p.month.charAt(0).toUpperCase() + p.month.slice(1);
  return `${p.day} de ${monthCap} del ${p.year}`;
}

export function formatDateShort(date) {
  const dt = parseDate(date);
  if (!dt) return "";
  const p = peruParts(dt);
  return `${p.day}/${p.monthNum !== undefined ? p.monthNum : "??"}/${p.year}`;
}
