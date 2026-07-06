import { CheckCircle, XCircle, AlertTriangle, Info, ScanLine } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  scan: ScanLine,
};

const STYLES = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: "text-emerald-600",
    title: "text-emerald-900",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "text-red-600",
    title: "text-red-900",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: "text-amber-600",
    title: "text-amber-900",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: "text-blue-600",
    title: "text-blue-900",
  },
  scan: {
    bg: "bg-indigo-50",
    border: "border-indigo-300",
    icon: "text-indigo-600",
    title: "text-indigo-900",
  },
};

export default function AsistenciaToast({ type, message, visible, sub }) {
  const Icon = ICONS[type] || Info;
  const s = STYLES[type] || STYLES.info;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg transition-all duration-300 ${s.bg} ${s.border} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
      style={{ minWidth: 340, maxWidth: 480 }}
    >
      <div className={`flex-shrink-0 mt-0.5 ${s.icon}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${s.title}`}>{message}</p>
        {sub && <p className={`text-xs mt-0.5 opacity-80 ${s.title}`}>{sub}</p>}
      </div>
    </div>
  );
}
