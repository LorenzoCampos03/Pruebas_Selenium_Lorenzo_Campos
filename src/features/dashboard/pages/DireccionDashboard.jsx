import { motion } from "framer-motion";
import { Users, GraduationCap, BarChart3, Bell, TrendingUp, CalendarDays, Clock, BookOpen } from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "@/core/auth/AuthContext";
import { getRoleLabel } from "@/core/utils/constants";
import { useDireccionStats } from "../hooks/useDashboardStats";

const QUICK_ACTIONS = [
     { label: "Gestionar personal", icon: Users, color: "bg-blue-50 text-blue-600" },
     { label: "Ver estudiantes", icon: GraduationCap, color: "bg-emerald-50 text-emerald-600" },
     { label: "Generar reportes", icon: BarChart3, color: "bg-purple-50 text-purple-600" },
     { label: "Calendario", icon: CalendarDays, color: "bg-amber-50 text-amber-600" },
];

const RECENT_ACTIVITY = [
     { text: "Nuevo estudiante matriculado", time: "Hace 2 horas", dot: "bg-emerald-500" },
     { text: "Reporte mensual generado", time: "Hace 5 horas", dot: "bg-blue-500" },
     { text: "Actualización de horarios", time: "Ayer", dot: "bg-purple-500" },
     { text: "Comunicado enviado a padres", time: "Hace 2 días", dot: "bg-amber-500" },
];

export default function DireccionDashboard() {
     const { role, user } = useAuth();
     const roleLabel = getRoleLabel(role);
     const firstName = user?.firstName || user?.first_name || "";
     const stats = useDireccionStats(user?.institutionId);

     return (
          <div className="space-y-6">
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
               >
                    <h1 className="text-xl font-bold text-gray-900">
                         {firstName ? `Hola, ${firstName}` : `Panel de ${roleLabel}`}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión institucional y supervisión académica</p>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                         icon={Users}
                         label="Personal"
                         value={stats.loading ? "..." : stats.staff}
                         color="blue"
                         delay={0.05}
                         subtitle={stats.loading ? "" : `${stats.totalStaff} registrados`}
                    />
                    <StatCard
                         icon={GraduationCap}
                         label="Estudiantes"
                         value={stats.loading ? "..." : stats.students}
                         color="green"
                         delay={0.1}
                         subtitle={stats.loading ? "" : `${stats.totalStudents} registrados`}
                    />
                    <StatCard icon={BarChart3} label="Reportes" value="--" color="purple" delay={0.15} subtitle="Generados este mes" />
                    <StatCard icon={Bell} label="Comunicados" value="--" color="orange" delay={0.2} subtitle="Pendientes de envío" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.25 }}
                         className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                         <div className="px-5 py-4 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                   <TrendingUp className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Accesos rápidos</h2>
                              </div>
                         </div>
                         <div className="p-5">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                   {QUICK_ACTIONS.map((action) => (
                                        <button
                                             key={action.label}
                                             className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer group"
                                        >
                                             <div className={["w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105", action.color].join(" ")}>
                                                  <action.icon className="w-5 h-5" strokeWidth={1.8} />
                                             </div>
                                             <span className="text-xs font-medium text-gray-600 text-center leading-tight">{action.label}</span>
                                        </button>
                                   ))}
                              </div>
                         </div>
                    </motion.div>

                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3 }}
                         className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                         <div className="px-5 py-4 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                   <Clock className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Actividad reciente</h2>
                              </div>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {RECENT_ACTIVITY.map((item, i) => (
                                   <div key={i} className="flex items-start gap-3 px-5 py-3">
                                        <span className={["w-2 h-2 rounded-full mt-1.5 shrink-0", item.dot].join(" ")} />
                                        <div className="flex-1 min-w-0">
                                             <p className="text-sm text-gray-700">{item.text}</p>
                                             <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </motion.div>
               </div>

               <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
               >
                    <div className="px-5 py-4 border-b border-gray-50">
                         <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <h2 className="text-sm font-semibold text-gray-800">Resumen académico</h2>
                         </div>
                    </div>
                    <div className="p-5">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                   <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Asistencia promedio</p>
                                   <p className="text-2xl font-bold text-blue-700 mt-2">--%</p>
                                   <p className="text-xs text-blue-400 mt-1">Mes actual</p>
                              </div>
                              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                                   <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Rendimiento</p>
                                   <p className="text-2xl font-bold text-emerald-700 mt-2">--</p>
                                   <p className="text-xs text-emerald-400 mt-1">Promedio general</p>
                              </div>
                              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100/50">
                                   <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Aulas activas</p>
                                   <p className="text-2xl font-bold text-purple-700 mt-2">--</p>
                                   <p className="text-xs text-purple-400 mt-1">En periodo vigente</p>
                              </div>
                         </div>
                    </div>
               </motion.div>
          </div>
     );
}
