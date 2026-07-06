import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: "text-emerald-600",
    title: "text-emerald-900",
    desc: "text-emerald-700",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-300",
    icon: "text-red-600",
    title: "text-red-900",
    desc: "text-red-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: "text-amber-600",
    title: "text-amber-900",
    desc: "text-amber-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: "text-blue-600",
    title: "text-blue-900",
    desc: "text-blue-700",
  },
};

export default function PsyToast({ type, message, visible }) {
  const Icon = ICONS[type] || Info;
  const s = STYLES[type] || STYLES.info;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 ${s.bg} ${s.border} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
      style={{ minWidth: 340, maxWidth: 480 }}
    >
      <div className={`flex-shrink-0 ${s.icon}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <p className={`text-sm font-semibold ${s.title}`}>{message}</p>
    </div>
  );
}
