/**
 * PsychologyCharts - Gráficos SVG/CSS puros (sin librerías externas)
 * Incluye: BarChart mensual, DonutChart por tipo, TopStudentsChart
 */

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data, color = "#3b82f6" }) {
     const max = Math.max(...data.map(d => d.value), 1);
     return (
          <div className="flex items-end gap-1 h-24">
               {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                         <span className="text-xs text-gray-500 font-medium">{d.value > 0 ? d.value : ""}</span>
                         <div
                              className="w-full rounded-t-sm transition-all duration-500"
                              style={{ height: `${Math.max((d.value / max) * 72, d.value > 0 ? 4 : 0)}px`, backgroundColor: color, opacity: 0.85 }}
                              title={`${d.label}: ${d.value}`}
                         />
                         <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
                    </div>
               ))}
          </div>
     );
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, size = 100 }) {
     const total = segments.reduce((s, seg) => s + seg.value, 0);
     if (total === 0) return <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin datos</div>;

     const r = 38, cx = 50, cy = 50, stroke = 14;
     const circ = 2 * Math.PI * r;
     let offset = 0;

     return (
          <svg width={size} height={size} viewBox="0 0 100 100">
               <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
               {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circ;
                    const gap  = circ - dash;
                    const el = (
                         <circle
                              key={i}
                              cx={cx} cy={cy} r={r}
                              fill="none"
                              stroke={seg.color}
                              strokeWidth={stroke}
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="butt"
                              transform="rotate(-90 50 50)"
                         />
                    );
                    offset += dash;
                    return el;
               })}
               <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{total}</text>
               <text x={cx} y={cy + 13} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#94a3b8">total</text>
          </svg>
     );
}

// ── Horizontal bar for top students ──────────────────────────────────────────
function HBar({ label, value, max, color }) {
     const pct = max > 0 ? (value / max) * 100 : 0;
     return (
          <div className="flex items-center gap-2">
               <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{label}</span>
               <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
               </div>
               <span className="text-xs font-bold text-gray-700 w-5 text-right flex-shrink-0">{value}</span>
          </div>
     );
}

// ── Main export ───────────────────────────────────────────────────────────────
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const TYPE_COLORS_MAP = {
     INICIAL:     "#3b82f6",
     SEGUIMIENTO: "#8b5cf6",
     ESPECIAL:    "#f59e0b",
     DERIVACION:  "#ef4444",
};

export default function PsychologyCharts({ evaluations }) {
     const active = evaluations.filter(e => e.status === "ACTIVE");

     // Evaluaciones por mes (últimos 6 meses)
     const now = new Date();
     const monthData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const count = active.filter(ev => {
               if (!ev.evaluationDate) return false;
               const ed = new Date(ev.evaluationDate);
               return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
          }).length;
          return { label: MONTHS_ES[d.getMonth()], value: count };
     });

     // Por tipo
     const typeSegments = Object.entries(TYPE_COLORS_MAP).map(([type, color]) => ({
          label: type,
          value: active.filter(e => e.evaluationType === type).length,
          color,
     })).filter(s => s.value > 0);

     // Top 5 estudiantes por sesiones
     const studentMap = {};
     evaluations.forEach(ev => {
          if (!studentMap[ev.studentId]) studentMap[ev.studentId] = { name: ev.studentName, count: 0 };
          studentMap[ev.studentId].count++;
     });
     const topStudents = Object.values(studentMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
     const maxSessions = topStudents[0]?.count || 1;

     return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Evaluaciones por mes */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Evaluaciones por mes</p>
                    <BarChart data={monthData} color="#3b82f6" />
               </div>

               {/* Distribución por tipo */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Por tipo de evaluación</p>
                    <div className="flex items-center gap-4">
                         <DonutChart segments={typeSegments} size={90} />
                         <div className="space-y-1.5 flex-1">
                              {typeSegments.map(s => (
                                   <div key={s.label} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                        <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                                        <span className="text-xs font-bold text-gray-800">{s.value}</span>
                                   </div>
                              ))}
                              {typeSegments.length === 0 && <p className="text-xs text-gray-400">Sin datos</p>}
                         </div>
                    </div>
               </div>

               {/* Top estudiantes */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Más sesiones</p>
                    <div className="space-y-2.5">
                         {topStudents.length === 0
                              ? <p className="text-xs text-gray-400">Sin datos</p>
                              : topStudents.map((s, i) => (
                                   <HBar key={i} label={s.name} value={s.count} max={maxSessions} color={i === 0 ? "#3b82f6" : "#93c5fd"} />
                              ))
                         }
                    </div>
               </div>
          </div>
     );
}
