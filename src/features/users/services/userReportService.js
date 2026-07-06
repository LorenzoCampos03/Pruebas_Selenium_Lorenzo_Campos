import { jsPDF } from "jspdf";
import {
     loadLogoBase64,
     drawHeader,
     drawFooter,
     drawTable,
     drawField,
     drawSectionTitle,
} from "@/core/utils/reportGenerator";
import { USER_STATUS_LABELS } from "../models/userModel";
import { ROLE_LABELS } from "@/core/utils/constants";

const MARGIN = { left: 14, right: 14 };

function statusLabel(s) {
     return USER_STATUS_LABELS[s] || s || "—";
}

function roleLabel(r) {
     return ROLE_LABELS[r] || r || "—";
}

function fmtDate(d) {
     if (!d) return "—";
     try {
          return new Intl.DateTimeFormat("es-PE", {
               day: "2-digit",
               month: "2-digit",
               year: "numeric",
          }).format(new Date(d));
     } catch {
          return d;
     }
}

function fullName(u) {
     return [u.firstName, u.lastName, u.motherLastName].filter(Boolean).join(" ");
}

export async function generateUsersListReport(users, role = null, institution = {}) {
     const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
     const logoBase64 = await loadLogoBase64(institution.logoUrl);

     const roleText = role ? roleLabel(role) : "Todos los Roles";
     const title = `Reporte de Usuarios — ${roleText}`;
     const subtitle = `Total: ${users.length} usuario(s) registrado(s)`;

     const y = drawHeader(doc, institution, title, subtitle, logoBase64);

     const headers = ["#", "Apellidos y Nombres", "Usuario", "Documento", "Teléfono", "Rol", "Correo", "Estado"];
     const colWidths = [8, 58, 34, 28, 24, 28, 52, 18];

     const rows = users.map((u, i) => [
          String(i + 1),
          fullName(u),
          u.username || u.userName || "—",
          `${u.documentType || "DNI"}: ${u.documentNumber || "—"}`,
          u.phone || "—",
          roleLabel(u.role),
          u.email || "—",
          statusLabel(u.status),
     ]);

     drawTable(doc, headers, colWidths, rows, y, institution, title, subtitle, logoBase64);

     const safeName = (role || "todos").toLowerCase().replace(/\s+/g, "_");
     doc.save(`reporte_usuarios_${safeName}_${Date.now()}.pdf`);
}

export async function generateUserDetailReport(user, institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const logoBase64 = await loadLogoBase64(institution.logoUrl);

     const name = fullName(user);
     const title = "Ficha Individual de Usuario";
     const subtitle = `${roleLabel(user.role)} — ${name}`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     const col1X = MARGIN.left;
     const col2X = pageW / 2 + 4;

     // ── Datos Personales ──────────────────────────────────────────────────────
     y = drawSectionTitle(doc, "I. Datos Personales", y);

     drawField(doc, "Nombres", user.firstName, col1X, y);
     drawField(doc, "Apellidos", `${user.lastName || ""} ${user.motherLastName || ""}`.trim(), col2X, y);
     y += 6;
     drawField(doc, "Tipo Doc.", user.documentType, col1X, y);
     drawField(doc, "N° Documento", user.documentNumber, col2X, y);
     y += 6;
     drawField(doc, "Teléfono", user.phone || "—", col1X, y);
     drawField(doc, "Correo", user.email || "—", col2X, y);
     y += 8;

     y = drawSectionTitle(doc, "II. Datos del Sistema", y);

     drawField(doc, "Nombre de usuario", user.username || user.userName || "—", col1X, y);
     drawField(doc, "Rol", roleLabel(user.role), col2X, y);
     y += 6;
     drawField(doc, "Estado", statusLabel(user.status), col1X, y);
     drawField(doc, "Institución", institution.name || "—", col2X, y);
     y += 6;
     if (user.createdAt) {
          drawField(doc, "Fecha registro", fmtDate(user.createdAt), col1X, y);
          y += 6;
     }
     if (user.updatedAt) {
          drawField(doc, "Última actualización", fmtDate(user.updatedAt), col1X, y);
          y += 6;
     }

     drawFooter(doc, institution, 1, 1);

     doc.save(`ficha_usuario_${user.documentNumber || user.id || Date.now()}.pdf`);
}
