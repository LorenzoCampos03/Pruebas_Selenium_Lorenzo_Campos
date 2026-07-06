import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

// ============= TOOLTIP COMPARTIDO =============
function FixedTooltip({ x, y, children, onClose }) {
     const ref = useRef(null);
     const [style, setStyle] = useState({ opacity: 0 });

     useEffect(() => {
          if (!ref.current) return;
          const w = ref.current.offsetWidth;
          const h = ref.current.offsetHeight;
          const left = Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8));
          const top = y - h - 10;
          setStyle({ left, top: top < 8 ? y + 24 : top, opacity: 1 });
     }, [x, y]);

     return (
          <div
               ref={ref}
               onMouseLeave={onClose}
               style={{ position: "fixed", zIndex: 9999, pointerEvents: "none", ...style }}
               className="w-56 bg-gray-900 rounded-xl px-3 py-2.5 shadow-2xl transition-opacity duration-100"
          >
               {children}
               <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-2.5 h-2.5 bg-gray-900 rotate-45 rounded-sm" />
          </div>
     );
}

// ============= STATUS BADGE =============
const STATUS_CONFIG = {
     ACTIVE: { label: "Activa", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
     INACTIVE: { label: "Inactiva", bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", border: "border-gray-200" },
     SCHEDULED: { label: "Programada", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" }
};

export function StatusBadge({ status }) {
     const c = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;
     return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
               <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
               {c.label}
          </span>
     );
}

// ============= RISK BADGE =============
const RISK_CONFIG = {
     high: { label: "Riesgo Alto", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
     medium: { label: "Riesgo Medio", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
     low: { label: "Riesgo Bajo", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
};

export function calcRiskLevel(evaluations) {
     if (!evaluations || evaluations.length === 0) return "low";
     const active = evaluations.filter(e => e.status === "ACTIVE");
     const hasFollowUp = active.some(e => e.requiresFollowUp);
     const hasDeriv = active.some(e => e.evaluationType === "DERIVACION");
     const hasEspecial = active.some(e => e.evaluationType === "ESPECIAL");
     const sessionCount = evaluations.length;

     if (hasDeriv || (hasFollowUp && sessionCount >= 4)) return "high";
     if (hasEspecial || (hasFollowUp && sessionCount >= 2)) return "medium";
     return "low";
}

function getRiskReason(evaluations) {
     if (!evaluations || evaluations.length === 0) return null;
     const active = evaluations.filter(e => e.status === "ACTIVE");
     const hasDeriv = active.some(e => e.evaluationType === "DERIVACION");
     const hasEspecial = active.some(e => e.evaluationType === "ESPECIAL");
     const sessionCount = evaluations.length;
     const level = calcRiskLevel(evaluations);

     if (level === "high") {
          if (hasDeriv) return "Tiene una evaluación de tipo Derivación, lo que indica que el caso fue escalado a un especialista externo.";
          return `Lleva ${sessionCount} sesiones con seguimiento activo requerido, indicando atención prolongada.`;
     }
     if (level === "medium") {
          if (hasEspecial) return "Tiene una evaluación de tipo Especial, que requiere atención diferenciada.";
          return `Tiene ${sessionCount} sesiones con seguimiento requerido, necesita monitoreo continuo.`;
     }
     return "Sin señales de alerta activas. El estudiante está en seguimiento rutinario.";
}

export function RiskBadge({ level, evaluations, showTooltip = true }) {
     const [pos, setPos] = useState(null);
     const ref = useRef(null);
     const c = RISK_CONFIG[level] || RISK_CONFIG.low;
     const reason = evaluations ? getRiskReason(evaluations) : null;
     const canShow = showTooltip && !!reason;

     function handleMouseEnter() {
          if (!canShow || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
     }

     useEffect(() => () => setPos(null), []);

     return (
          <>
               <span
                    ref={ref}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setPos(null)}
                    className={`relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border} ${canShow ? "cursor-help" : ""}`}
               >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                    {c.label}
                    {canShow && <Info className="w-3 h-3 opacity-50" />}
               </span>

               {pos && (
                    <FixedTooltip x={pos.x} y={pos.y} onClose={() => setPos(null)}>
                         <p className="text-xs font-semibold text-gray-300 mb-1">¿Por qué este nivel?</p>
                         <p className="text-xs text-gray-100 leading-relaxed font-normal">{reason}</p>
                    </FixedTooltip>
               )}
          </>
     );
}

// ============= INFO TOOLTIP =============
export function InfoTooltip({ children, title, content }) {
     const [pos, setPos] = useState(null);
     const ref = useRef(null);

     function handleMouseEnter() {
          if (!ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
     }

     useEffect(() => () => setPos(null), []);

     return (
          <>
               <span ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={() => setPos(null)} className="inline-flex">
                    {children}
               </span>

               {pos && (
                    <FixedTooltip x={pos.x} y={pos.y} onClose={() => setPos(null)}>
                         {title && <p className="text-xs font-semibold text-gray-300 mb-1">{title}</p>}
                         <p className="text-xs text-gray-100 leading-relaxed font-normal">{content}</p>
                    </FixedTooltip>
               )}
          </>
     );
}
