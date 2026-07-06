import { jsPDF } from "jspdf";
import {
     loadLogoBase64,
     drawHeader,
     drawFooter,
     drawField,
     drawSectionTitle,
     drawListEntry,
} from "@/core/utils/reportGenerator";
import { STUDENT_STATUS_LABELS } from "../models/studentModel";

const MARGIN = { left: 14, right: 14 };

function genderLabel(g) {
     if (!g) return "—";
     return g === "M" ? "Masculino" : g === "F" ? "Femenino" : g;
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

function statusLabel(s) {
     return STUDENT_STATUS_LABELS[s] || s || "—";
}

function fullName(s) {
     return [s.firstName, s.lastName, s.motherLastName].filter(Boolean).join(" ");
}

export async function generateStudentsListReport(students, institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const logoBase64 = await loadLogoBase64(institution.logoUrl);
     const pageH = doc.internal.pageSize.getHeight();

     const title = "Reporte de Estudiantes";
     const subtitle = `Total: ${students.length} estudiante(s) registrado(s)`;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);
     let pageNum = 1;

     students.forEach((s, i) => {
          if (y + 16 > pageH - 18) {
               drawFooter(doc, institution, pageNum, "?");
               doc.addPage();
               pageNum++;
               y = drawHeader(doc, institution, title, subtitle, logoBase64);
          }

          const name = fullName(s);
          const sub = `CUI: ${s.cui || "—"}  |  ${s.documentType || "DNI"}: ${s.documentNumber || "—"}  |  ${genderLabel(s.gender)}`;
          const meta = [
               fmtDate(s.dateOfBirth) !== "—" ? `Nacimiento: ${fmtDate(s.dateOfBirth)}` : "",
               s.classroomName ? `Aula: ${s.classroomName}` : "",
          ].filter(Boolean).join("   ");

          y = drawListEntry(doc, i + 1, name, sub, meta, statusLabel(s.status), y, i % 2 !== 0);
     });

     drawFooter(doc, institution, pageNum, pageNum);
     doc.save(`reporte_estudiantes_${Date.now()}.pdf`);
}

export async function generateStudentDetailReport(student, institution = {}) {
     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
     const pageW = doc.internal.pageSize.getWidth();
     const pageH = doc.internal.pageSize.getHeight();
     const logoBase64 = await loadLogoBase64(institution.logoUrl);
     const studentPhotoBase64 = await loadLogoBase64(student.photoUrl);

     const name = fullName(student);
     const title = "Ficha Individual del Estudiante";
     const subtitle = name;

     let y = drawHeader(doc, institution, title, subtitle, logoBase64);

     y = drawSectionTitle(doc, "I. Datos Personales", y);

     const col1X = MARGIN.left;
     const col2X = pageW / 2 + 4;

     if (studentPhotoBase64) {
          const photoSize = 28;
          const photoX = pageW - MARGIN.right - photoSize;
          doc.addImage(studentPhotoBase64, "JPEG", photoX, y - 2, photoSize, photoSize);
          const col2XWithPhoto = col2X;
          drawField(doc, "CUI", student.cui, col1X, y);
          drawField(doc, "Apellidos", `${student.lastName} ${student.motherLastName || ""}`.trim(), col2XWithPhoto, y);
          y += 6;
          drawField(doc, "Nombres", student.firstName, col1X, y);
          drawField(doc, "Género", genderLabel(student.gender), col2XWithPhoto, y);
          y += 6;
          drawField(doc, "Tipo Doc.", student.documentType, col1X, y);
          drawField(doc, "N° Documento", student.documentNumber, col2XWithPhoto, y);
          y += 6;
          drawField(doc, "Fecha Nacimiento", fmtDate(student.dateOfBirth), col1X, y);
          drawField(doc, "Estado", statusLabel(student.status), col2XWithPhoto, y);
          y += 6;
          drawField(doc, "Dirección", student.address || "—", col1X, y, 26);
          y = Math.max(y + 8, y - 6 + photoSize + 4);
     } else {
          drawField(doc, "CUI", student.cui, col1X, y);
          drawField(doc, "Apellidos", `${student.lastName} ${student.motherLastName || ""}`.trim(), col2X, y);
          y += 6;
          drawField(doc, "Nombres", student.firstName, col1X, y);
          drawField(doc, "Género", genderLabel(student.gender), col2X, y);
          y += 6;
          drawField(doc, "Tipo Doc.", student.documentType, col1X, y);
          drawField(doc, "N° Documento", student.documentNumber, col2X, y);
          y += 6;
          drawField(doc, "Fecha Nacimiento", fmtDate(student.dateOfBirth), col1X, y);
          drawField(doc, "Estado", statusLabel(student.status), col2X, y);
          y += 6;
          drawField(doc, "Dirección", student.address || "—", col1X, y, 26);
          y += 8;
     }

     y = drawSectionTitle(doc, "II. Datos Académicos", y);
     drawField(doc, "Institución", institution.name || "—", col1X, y);
     y += 6;
     if (student.classroomId) {
          drawField(doc, "Aula", student.classroomName || "Asignada", col1X, y);
          y += 6;
     }

     y = drawSectionTitle(doc, "III. Datos de Salud", y);
     drawField(doc, "Grupo Sanguíneo", student.bloodType || "—", col1X, y);
     y += 6;
     drawField(doc, "Alergias", student.allergies || "—", col1X, y, 26);
     y += 6;
     drawField(doc, "Medicamentos", student.medications || "—", col1X, y, 26);
     y += 6;
     drawField(doc, "Condiciones", student.conditions || "—", col1X, y, 26);
     y += 6;
     if (student.emergencyNotes) {
          drawField(doc, "Notas emergencia", student.emergencyNotes, col1X, y, 34);
          y += 6;
     }
     y += 2;

     const hasDevData = student.motorDevelopment || student.languageDevelopment || student.socialDevelopment;
     if (hasDevData) {
          y = drawSectionTitle(doc, "IV. Desarrollo", y);
          drawField(doc, "Motor", student.motorDevelopment || "—", col1X, y, 28);
          y += 6;
          drawField(doc, "Lenguaje", student.languageDevelopment || "—", col1X, y, 28);
          y += 6;
          drawField(doc, "Social", student.socialDevelopment || "—", col1X, y, 28);
          y += 8;
     }

     const guardians = student.guardians || [];
     if (guardians.length > 0) {
          if (y > pageH - 60) {
               drawFooter(doc, institution, 1, 1);
               doc.addPage();
               y = drawHeader(doc, institution, title, subtitle, logoBase64);
          }

          y = drawSectionTitle(doc, "V. Datos del Apoderado / Familia", y);

          guardians.forEach((g, idx) => {
               const cardH = 40;
               if (y + cardH > pageH - 20) {
                    drawFooter(doc, institution, idx + 1, guardians.length + 1);
                    doc.addPage();
                    y = drawHeader(doc, institution, title, subtitle, logoBase64);
               }

               doc.setFillColor(248, 250, 253);
               doc.roundedRect(col1X, y - 2, pageW - col1X - MARGIN.right, cardH - 2, 2, 2, "F");
               doc.setDrawColor(31, 56, 100);
               doc.setLineWidth(0.3);
               doc.roundedRect(col1X, y - 2, pageW - col1X - MARGIN.right, cardH - 2, 2, 2, "S");

               if (g.isEmergencyContact) {
                    const badgeW = 36;
                    doc.setFillColor(180, 30, 30);
                    doc.roundedRect(pageW - MARGIN.right - badgeW, y - 2, badgeW, 5.5, 1, 1, "F");
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(6);
                    doc.setTextColor(255, 255, 255);
                    doc.text("CONTACTO EMERGENCIA", pageW - MARGIN.right - badgeW + 2, y + 2);
               }

               const gNameParts = [g.firstName, g.lastName, g.motherLastName].filter(Boolean);
               const gName = gNameParts.join(" ");
               doc.setFont("helvetica", "bold");
               doc.setFontSize(8.5);
               doc.setTextColor(31, 56, 100);
               doc.text(gName || "Sin nombre", col1X + 4, y + 4);

               doc.setFont("helvetica", "normal");
               doc.setFontSize(7.5);
               doc.setTextColor(30, 30, 40);

               const rel = g.relationship || "Sin especificar";
               doc.text(`Relación: ${rel}`, col1X + 4, y + 10);
               doc.text(`${g.documentType || "DNI"}: ${g.documentNumber || "—"}`, col1X + 4, y + 16);

               doc.text(`Tel: ${g.phone || "—"}`, col2X, y + 10);
               doc.text(`WhatsApp: ${g.whatsapp || "—"}`, col2X, y + 16);
               doc.text(`Correo: ${g.email || "—"}`, col1X + 4, y + 22);

               y += cardH + 4;
          });
     }

     drawFooter(doc, institution, 1, 1);

     doc.save(`ficha_estudiante_${student.cui || student.id || Date.now()}.pdf`);
}
