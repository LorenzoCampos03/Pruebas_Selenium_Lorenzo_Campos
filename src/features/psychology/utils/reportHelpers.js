import { FONT, COLOR } from "@/core/utils/reportGenerator";

export function renderMultiLineText(doc, text, x, y, maxW, font = "normal", fontSize = FONT.BODY, color = COLOR.DARK) {
  if (!text || !String(text).trim()) return y;
  doc.setFont("helvetica", font);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(String(text), maxW);
  const lineH = fontSize * 0.5 + 1;
  lines.forEach((line) => { doc.text(line, x, y); y += lineH; });
  return y;
}

export function buildFileStamp() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const find = (t) => parts.find((p) => p.type === t).value;
  return `${find("year")}${find("month")}${find("day")}_${find("hour")}${find("minute")}`;
}

export function formatDatePE(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("es-PE", { timeZone: "America/Lima", year: "numeric", month: "long", day: "numeric" });
}
