import { useRef } from "react";
import { User, Lock, Download, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import Modal from "./Modal";
import Button from "./Button";

export default function CredentialsModal({ isOpen, onClose, credentials }) {
  const [copied, setCopied] = useState(null);
  const cardRef = useRef(null);

  if (!credentials) return null;

  const { fullName, username, password, role, institutionName } = credentials;

  function handleCopy(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleDownloadPDF() {
    const doc = new jsPDF({ unit: "mm", format: "a5" });

    const pageW = doc.internal.pageSize.getWidth();

    // Fondo azul oscuro encabezado
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 38, "F");

    // Logo / nombre sistema
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SIGEI", pageW / 2, 14, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestión Educativa Institucional", pageW / 2, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CREDENCIALES DE ACCESO", pageW / 2, 30, { align: "center" });

    // Tarjeta blanca
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, 44, pageW - 20, 110, 3, 3, "FD");

    // Nombre completo
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(fullName || "Usuario", pageW / 2, 56, { align: "center" });

    if (role) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(role, pageW / 2, 62, { align: "center" });
    }

    if (institutionName) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(institutionName, pageW / 2, 68, { align: "center" });
    }

    // Separador
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 73, pageW - 14, 73);

    // Usuario
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, 78, pageW - 28, 18, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(96, 165, 250);
    doc.setFont("helvetica", "bold");
    doc.text("USUARIO", 18, 85);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(username || "", 18, 92);

    // Contraseña
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, 100, pageW - 28, 18, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(74, 222, 128);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRASEÑA INICIAL", 18, 107);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(password || "", 18, 114);

    // Nota
    doc.setFontSize(8);
    doc.setTextColor(239, 68, 68);
    doc.setFont("helvetica", "bolditalic");
    doc.text("* Cambiar la contraseña en el primer inicio de sesión.", pageW / 2, 126, { align: "center" });

    // Pie
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    const pageH = doc.internal.pageSize.getHeight();
    doc.rect(0, pageH - 16, pageW, 16, "F");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    const fecha = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`Generado el ${fecha} | Sistema SIGEI - Valle Grande`, pageW / 2, pageH - 6, { align: "center" });

    const safeName = (fullName || "usuario").replace(/\s+/g, "_").toLowerCase();
    doc.save(`credenciales_${safeName}.pdf`);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credenciales de Acceso" size="sm">
      <div className="space-y-5">
        {/* Encabezado */}
        <div className="text-center space-y-1 pb-2">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <p className="font-semibold text-gray-800 text-base mt-2">{fullName || "Usuario"}</p>
          {role && <p className="text-xs text-gray-500">{role}</p>}
          {institutionName && <p className="text-xs text-gray-400">{institutionName}</p>}
        </div>

        {/* Credenciales */}
        <div className="space-y-3" ref={cardRef}>
          {/* Username */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Usuario</p>
                  <p className="text-sm font-mono font-medium text-gray-800 break-all">{username || "—"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(username, "username")}
                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 transition-colors shrink-0"
                title="Copiar"
              >
                {copied === "username" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">Contraseña inicial</p>
                  <p className="text-sm font-mono font-medium text-gray-800">{password || "—"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(password, "password")}
                className="p-1.5 rounded-lg hover:bg-green-100 text-green-500 transition-colors shrink-0"
                title="Copiar"
              >
                {copied === "password" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Nota */}
        <p className="text-xs text-center text-orange-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          Entregue estas credenciales al usuario. Debe cambiar su contraseña en el primer inicio de sesión.
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleDownloadPDF}
            className="flex-1"
          >
            Descargar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
