import { AlertTriangle, X, ScanLine, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STYLES = {
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: "text-amber-600",
    title: "text-amber-900",
    desc: "text-amber-700",
    confirmBg: "bg-slate-800 hover:bg-slate-900",
    confirmFocus: "focus:ring-slate-500",
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "text-red-600",
    title: "text-red-900",
    desc: "text-red-700",
    confirmBg: "bg-red-600 hover:bg-red-700",
    confirmFocus: "focus:ring-red-500",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: "text-emerald-600",
    title: "text-emerald-900",
    desc: "text-emerald-700",
    confirmBg: "bg-emerald-600 hover:bg-emerald-700",
    confirmFocus: "focus:ring-emerald-500",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: "text-blue-600",
    title: "text-blue-900",
    desc: "text-blue-700",
    confirmBg: "bg-blue-600 hover:bg-blue-700",
    confirmFocus: "focus:ring-blue-500",
  },
};

const ICONS = {
  warning: AlertTriangle,
  danger: AlertTriangle,
  success: CheckCircle,
  info: ScanLine,
};

export default function AsistenciaConfirmDialog({
  open, onConfirm, onCancel, title, message,
  confirmText, cancelText, type = "warning"
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(!!open));
  }, [open]);

  if (!open) return null;

  const s = STYLES[type] || STYLES.warning;
  const Icon = ICONS[type] || AlertTriangle;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative w-full max-w-md mx-4 rounded-xl border-2 shadow-2xl transition-all duration-300 ${s.bg} ${s.border} ${
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
        }`}
        style={{ minWidth: 340 }}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
          type="button"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center px-6 py-8">
          <div className={`p-3 rounded-full bg-white/80 shadow-sm mb-4 ${s.icon}`}>
            <Icon size={32} strokeWidth={2} />
          </div>
          {title && (
            <h3 className={`text-lg font-bold ${s.title} mb-2`}>{title}</h3>
          )}
          {message && (
            <p className={`text-sm leading-relaxed ${s.desc}`}>{message}</p>
          )}
        </div>

        <div className="flex justify-center gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            type="button"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all shadow-sm"
          >
            {cancelText || "Cancelar"}
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${s.confirmBg} ${s.confirmFocus}`}
          >
            {confirmText || "Sí"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
