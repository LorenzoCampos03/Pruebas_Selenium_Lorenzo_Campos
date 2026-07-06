export const COLOR = {
     PRIMARY: [29, 78, 216],       // primary-700 #1d4ed8
     PRIMARY_DARK: [30, 58, 138],  // primary-900 #1e3a8a
     SECONDARY: [59, 130, 246],    // primary-500 #3b82f6
     ACCENT: [37, 99, 235],        // primary-600 #2563eb
     DARK: [30, 30, 40],
     GRAY: [120, 125, 135],
     LIGHT_GRAY: [239, 246, 255],  // primary-50 #eff6ff
     WHITE: [255, 255, 255],
     TABLE_HDR: [30, 64, 175],     // primary-800 #1e40af
     ROW_ODD: [239, 246, 255],     // primary-50 #eff6ff
     ROW_EVEN: [255, 255, 255],
     LINE: [191, 219, 254],        // primary-200 #bfdbfe
     MUTED: [160, 165, 175],
};

export const FONT = {
     INST_NAME: 12,
     TITLE: 11,
     SECTION: 9,
     BODY: 8,
     SMALL: 7,
     TINY: 6.5,
};

export const MARGIN = { left: 15, right: 15 };

function hexToRgb(hex) {
     if (!hex || !/^#([0-9A-Fa-f]{6})$/.test(hex)) return null;
     const r = parseInt(hex.slice(1, 3), 16);
     const g = parseInt(hex.slice(3, 5), 16);
     const b = parseInt(hex.slice(5, 7), 16);
     return [r, g, b];
}

function darken([r, g, b], factor = 0.3) {
     return [Math.round(r * (1 - factor)), Math.round(g * (1 - factor)), Math.round(b * (1 - factor))];
}

function getColors(institution = {}) {
     const base = hexToRgb(institution.colorInstitution);
     if (!base) return COLOR;
     return {
          ...COLOR,
          PRIMARY: darken(base, 0.15),
          PRIMARY_DARK: darken(base, 0.35),
          SECONDARY: base,
          ACCENT: base,
          TABLE_HDR: darken(base, 0.15),
     };
}

export { getColors };

function drawRect(doc, x, y, w, h, color) {
     doc.setFillColor(...color);
     doc.rect(x, y, w, h, "F");
}

export async function loadLogoBase64(url) {
     if (!url) return null;
     return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
               try {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    const maxSize = 60;
                    if (width > maxSize || height > maxSize) {
                         const ratio = Math.min(maxSize / width, maxSize / height);
                         width *= ratio;
                         height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");

                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    let quality = 0.85;
                    let dataUrl = canvas.toDataURL("image/jpeg", quality);

                    while (dataUrl.length > 20000 && quality > 0.1) {
                         quality -= 0.1;
                         dataUrl = canvas.toDataURL("image/jpeg", quality);
                    }

                    resolve(dataUrl);
               } catch (err) {
                    resolve(null);
               }
          };
          img.onerror = async () => {
               try {
                    const res = await fetch(url);
                    const blob = await res.blob();

                    const localImg = new Image();
                    localImg.onload = () => {
                         try {
                              const canvas = document.createElement("canvas");
                              let width = localImg.width;
                              let height = localImg.height;

                              const maxSize = 60;
                              if (width > maxSize || height > maxSize) {
                                   const ratio = Math.min(maxSize / width, maxSize / height);
                                   width *= ratio;
                                   height *= ratio;
                              }

                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext("2d");

                              ctx.fillStyle = "#FFFFFF";
                              ctx.fillRect(0, 0, width, height);
                              ctx.drawImage(localImg, 0, 0, width, height);

                              let quality = 0.85;
                              let dataUrl = canvas.toDataURL("image/jpeg", quality);

                              while (dataUrl.length > 20000 && quality > 0.1) {
                                   quality -= 0.1;
                                   dataUrl = canvas.toDataURL("image/jpeg", quality);
                              }
                              resolve(dataUrl);
                         } catch (e) {
                              resolve(null);
                         }
                    };
                    localImg.onerror = () => {
                         const reader = new FileReader();
                         reader.onload = () => resolve(reader.result);
                         reader.onerror = () => resolve(null);
                         reader.readAsDataURL(blob);
                    };
                    localImg.src = URL.createObjectURL(blob);
               } catch (e) {
                    resolve(null);
               }
          };

          const isSignedUrl = url.includes("X-Amz-Signature") || url.includes("token") || url.includes("Signature") || url.includes("sig=");
          if (isSignedUrl) {
               img.src = url;
          } else {
               const bust = url.includes("?") ? "&" : "?";
               img.src = url + bust + "t=" + new Date().getTime();
          }
     });
}

export function drawHeader(doc, institution = {}, reportTitle = "", reportSubtitle = "", logoBase64 = null) {
     const pageW = doc.internal.pageSize.getWidth();
     const hdrH = 30;
     const C = getColors(institution);

     drawRect(doc, 0, 0, pageW, hdrH, C.PRIMARY_DARK);
     drawRect(doc, 0, hdrH, pageW, 1.2, C.SECONDARY);

     const logoSize = 20;
     const textX = MARGIN.left + (logoBase64 ? logoSize + 5 : 0);

     if (logoBase64) {
          try {
               doc.addImage(logoBase64, "JPEG", MARGIN.left + 1, 5, logoSize, logoSize);
          } catch {
               try {
                    doc.addImage(logoBase64, "PNG", MARGIN.left + 1, 5, logoSize, logoSize);
               } catch {
                    //
               }
          }
     }

     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.INST_NAME);
     doc.setTextColor(...COLOR.WHITE);
     const instName = institution.name || "Institución Educativa";
     const maxNameW = pageW - MARGIN.right - 50 - textX;
     const nameLines = doc.splitTextToSize(instName, maxNameW);
     let nameY = nameLines.length > 1 ? 8 : 11;
     nameLines.slice(0, 2).forEach((line) => {
          doc.text(line, textX, nameY);
          nameY += 5;
     });

     const ugel = institution.ugel ? `UGEL: ${institution.ugel}` : "";
     const dre = institution.dre ? `DRE: ${institution.dre}` : "";
     const addr = institution.address?.district
          ? `${institution.address.district}${institution.address.province ? ", " + institution.address.province : ""}`
          : "";
     const infoLine = [ugel, dre, addr].filter(Boolean).join("  |  ");

     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(200, 210, 230);
     if (infoLine) doc.text(infoLine, textX, 21);

     const meta = [
          institution.modularCode ? `Cód. Modular: ${institution.modularCode}` : "",
          institution.level ? `Nivel: ${institution.level}` : "",
          institution.institutionType || "",
     ].filter(Boolean).join("  ·  ");
     if (meta) doc.text(meta, textX, 26);

     doc.setFont("helvetica", "bold");
     doc.setFontSize(8);
     doc.setTextColor(200, 210, 230);
     doc.text("SIGEI", pageW - MARGIN.right, 11, { align: "right" });
     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.text("Sistema de Gestión", pageW - MARGIN.right, 16, { align: "right" });
     doc.text("Educación Inicial", pageW - MARGIN.right, 20, { align: "right" });

     const titleY = 39;
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.TITLE);
     doc.setTextColor(...C.PRIMARY_DARK);
     doc.text(reportTitle.toUpperCase(), MARGIN.left, titleY);

     const now = new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" });
     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.MUTED);
     doc.text(`Generado: ${now}`, pageW - MARGIN.right, titleY, { align: "right" });

     if (reportSubtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONT.SMALL);
          doc.setTextColor(...COLOR.GRAY);
          doc.text(reportSubtitle, MARGIN.left, titleY + 5);
     }

     doc.setDrawColor(...COLOR.LINE);
     doc.setLineWidth(0.3);
     doc.line(MARGIN.left, titleY + 8, pageW - MARGIN.right, titleY + 8);

     return titleY + 13;
}

export function drawFooter(doc, institution = {}, pageNum = 1, totalPages = 1) {
     const pageW = doc.internal.pageSize.getWidth();
     const pageH = doc.internal.pageSize.getHeight();
     const y = pageH - 10;

     doc.setDrawColor(...COLOR.LINE);
     doc.setLineWidth(0.3);
     doc.line(MARGIN.left, y - 2, pageW - MARGIN.right, y - 2);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.MUTED);
     doc.text(institution.name || "SIGEI", MARGIN.left, y + 2);
     doc.text(`Página ${pageNum} de ${totalPages}`, pageW / 2, y + 2, { align: "center" });
     doc.text("Generado por SIGEI", pageW - MARGIN.right, y + 2, { align: "right" });
}

export function drawTable(doc, headers, colWidths, rows, startY, institution, reportTitle, reportSubtitle, logoBase64 = null) {
     const pageH = doc.internal.pageSize.getHeight();
     const rowH = 7;
     const hdrH = 9;
     const footH = 20;
     let y = startY;
     let pageNum = 1;
     const tableW = colWidths.reduce((s, w) => s + w, 0);
     const tableX = MARGIN.left;
     const C = getColors(institution);

     function renderHeader(yPos) {
          drawRect(doc, tableX, yPos, tableW, hdrH, C.TABLE_HDR);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(FONT.BODY);
          doc.setTextColor(...COLOR.WHITE);
          let x = tableX;
          headers.forEach((h, i) => {
               doc.text(h, x + 3, yPos + 6);
               x += colWidths[i];
          });
          return yPos + hdrH;
     }

     y = renderHeader(y);

     rows.forEach((row, rowIdx) => {
          // Calcular altura de fila basada en el contenido
          let maxLines = 1;
          row.forEach((cell, i) => {
               const text = String(cell ?? "");
               const maxW = colWidths[i] - 5;
               const lines = doc.splitTextToSize(text, maxW);
               maxLines = Math.max(maxLines, Math.min(lines.length, 3)); // Máximo 3 líneas
          });
          const currentRowH = Math.max(rowH, maxLines * 4 + 2);

          if (y + currentRowH > pageH - footH) {
               drawFooter(doc, institution, pageNum, "?");
               doc.addPage();
               pageNum++;
               y = drawHeader(doc, institution, reportTitle, reportSubtitle, logoBase64);
               y = renderHeader(y);
          }

          const bg = rowIdx % 2 === 0 ? COLOR.ROW_ODD : COLOR.ROW_EVEN;
          drawRect(doc, tableX, y, tableW, currentRowH, bg);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONT.BODY);
          doc.setTextColor(...COLOR.DARK);

          let x = tableX;
          row.forEach((cell, i) => {
               const text = String(cell ?? "");
               const maxW = colWidths[i] - 5;
               const lines = doc.splitTextToSize(text, maxW);
               const linesToShow = lines.slice(0, 3); // Mostrar hasta 3 líneas
               linesToShow.forEach((line, lineIdx) => {
                    doc.text(line, x + 3, y + 4.8 + (lineIdx * 3.5));
               });
               x += colWidths[i];
          });

          doc.setDrawColor(...COLOR.LINE);
          doc.setLineWidth(0.1);
          doc.line(tableX, y + currentRowH, tableX + tableW, y + currentRowH);

          y += currentRowH;
     });

     doc.setDrawColor(...C.PRIMARY);
     doc.setLineWidth(0.3);
     doc.rect(tableX, startY, tableW, y - startY, "S");

     drawFooter(doc, institution, pageNum, pageNum);

     return y;
}

export function drawField(doc, label, value, x, y, labelW = 38) {
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.BODY);
     doc.setTextColor(...COLOR.PRIMARY);
     doc.text(`${label}:`, x, y);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.BODY);
     doc.setTextColor(...COLOR.DARK);
     const pageW = doc.internal.pageSize.getWidth();
     const maxW = pageW / 2 - labelW - 8;
     const lines = doc.splitTextToSize(String(value ?? "—"), maxW);
     doc.text(lines[0], x + labelW, y);
}

export function drawSectionTitle(doc, title, y, institution = {}) {
     const pageW = doc.internal.pageSize.getWidth();
     const C = getColors(institution);
     drawRect(doc, MARGIN.left, y - 4, pageW - MARGIN.left - MARGIN.right, 7, COLOR.LIGHT_GRAY);
     doc.setFillColor(...C.PRIMARY);
     doc.rect(MARGIN.left, y - 4, 2.5, 7, "F");
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.SECTION);
     doc.setTextColor(...C.PRIMARY_DARK);
     doc.text(title, MARGIN.left + 6, y + 0.5);
     return y + 8;
}

export function drawBadge(doc, text, x, y) {
     const colors = {
          Activo: [34, 139, 34],
          ACTIVE: [34, 139, 34],
          Inactivo: [160, 60, 60],
          INACTIVE: [160, 60, 60],
          Transferido: [160, 120, 30],
          TRANSFERRED: [160, 120, 30],
          Eliminado: [160, 60, 60],
          DELETED: [160, 60, 60],
     };
     const c = colors[text] || COLOR.GRAY;
     const tw = doc.getTextWidth(text) + 6;
     doc.setFillColor(...c);
     doc.roundedRect(x, y - 4, tw, 5.5, 1, 1, "F");
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.WHITE);
     doc.text(text, x + 3, y);
}

export function drawListEntry(doc, num, title, subtitle, meta, badge, y, alt = false) {
     const pageW = doc.internal.pageSize.getWidth();
     const entryH = 16;
     const x = MARGIN.left;
     const usableW = pageW - MARGIN.left - MARGIN.right;

     if (alt) drawRect(doc, x, y, usableW, entryH, COLOR.ROW_ODD);

     doc.setDrawColor(...COLOR.LINE);
     doc.setLineWidth(0.1);
     doc.line(x, y + entryH, x + usableW, y + entryH);

     const numW = 9;
     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.MUTED);
     doc.text(String(num), x + 3, y + 6);

     const contentX = x + numW;
     const badgeW = badge ? doc.getTextWidth(badge) + 8 : 0;
     const maxTitleW = usableW - numW - badgeW - 4;

     doc.setFont("helvetica", "bold");
     doc.setFontSize(FONT.BODY);
     doc.setTextColor(...COLOR.PRIMARY_DARK);
     const titleLines = doc.splitTextToSize(title, maxTitleW);
     doc.text(titleLines[0], contentX, y + 6);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.GRAY);
     if (subtitle) doc.text(subtitle, contentX, y + 11);

     doc.setFont("helvetica", "normal");
     doc.setFontSize(FONT.TINY);
     doc.setTextColor(...COLOR.MUTED);
     if (meta) {
          const maxMetaW = usableW - numW - badgeW - 4;
          const metaLines = doc.splitTextToSize(meta, maxMetaW);
          doc.text(metaLines[0], contentX, y + 14.5);
     }

     if (badge) {
          const badgeColors = {
               Activo: [34, 139, 34],
               Inactivo: [160, 60, 60],
               Transferido: [160, 120, 30],
               Eliminado: [160, 60, 60],
               ACTIVE: [34, 139, 34],
               INACTIVE: [160, 60, 60],
               Generada: [34, 139, 34],
               Pendiente: [29, 78, 216],
               Finalizado: [34, 139, 34],
               "En Proceso": [37, 99, 235],
               Cancelado: [160, 60, 60],
          };
          const bc = badgeColors[badge] || COLOR.GRAY;
          const bx = x + usableW - badgeW;
          const by = y + 4;
          const bh = 5.5;
          doc.setFillColor(...bc);
          doc.roundedRect(bx, by, badgeW, bh, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(FONT.TINY);
          doc.setTextColor(...COLOR.WHITE);
          doc.text(badge, bx + 4, by + 4);
     }

     return y + entryH;
}
