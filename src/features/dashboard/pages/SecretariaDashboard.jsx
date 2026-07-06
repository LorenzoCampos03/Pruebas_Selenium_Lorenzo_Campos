import { motion } from "framer-motion";
import { ClipboardList, GraduationCap, CalendarDays, FileBarChart, TrendingUp, Clock, CheckCircle, AlertCircle, Users2, Calendar } from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "@/core/auth/AuthContext";
import { useSecretariaStats } from "../hooks/useDashboardStats";
import { getRoleLabel } from "@/core/utils/constants";

const QUICK_ACTIONS = [
     { label: "Nueva matrícula", icon: ClipboardList, color: "bg-blue-50 text-blue-600", href: "/matriculas/nueva" },
     { label: "Ver estudiantes", icon: GraduationCap, color: "bg-emerald-50 text-emerald-600", href: "/estudiantes" },
     { label: "Gestionar eventos", icon: CalendarDays, color: "bg-purple-50 text-purple-600", href: "/eventos" },
     { label: "Generar reportes", icon: FileBarChart, color: "bg-amber-50 text-amber-600", href: "/reportes" },
];

export default function SecretariaDashboard() {
     const { user, role } = useAuth();
     const roleLabel = getRoleLabel(role);
     const firstName = user?.firstName || user?.first_name || "";
     const stats = useSecretariaStats(user?.institutionId);

     return (
          <div className="space-y-6">
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
               >
                    <h1 className="text-xl font-bold text-gray-900">
                         {firstName ? `Hola, ${firstName}` : `Panel de ${roleLabel}`}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión administrativa y documentaria</p>
               </motion.div>

               {/* Estadísticas principales */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                         icon={ClipboardList}
                         label="Matrículas"
                         value={stats.loading ? "..." : stats.enrollments}
                         color="blue"
                         delay={0.05}
                         subtitle={stats.loading ? "" : `${stats.activeEnrollments || 0} activas`}
                    />
                    <StatCard
                         icon={GraduationCap}
                         label="Estudiantes"
                         value={stats.loading ? "..." : stats.students}
                         color="green"
                         delay={0.1}
                         subtitle={stats.loading ? "" : `${stats.totalStudents || 0} registrados`}
                    />
                    <StatCard
                         icon={CalendarDays}
                         label="Eventos"
                         value={stats.loading ? "..." : stats.events}
                         color="purple"
                         delay={0.15}
                         subtitle={stats.loading ? "" : `${stats.totalEvents || 0} programados`}
                    />
                    <StatCard
                         icon={FileBarChart}
                         label="Reportes"
                         value={stats.loading ? "..." : stats.reports}
                         color="orange"
                         delay={0.2}
                         subtitle="Generados este mes"
                    />
               </div>

               {/* Sección de accesos rápidos y actividad reciente */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Accesos rápidos */}
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

                    {/* Estado de matrículas */}
                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3 }}
                         className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                         <div className="px-5 py-4 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                   <Users2 className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Estado de matrículas</h2>
                              </div>
                         </div>
                         <div className="p-5 space-y-3">
                              {stats.loading ? (
                                   <div className="text-center py-4">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-xs text-gray-400 mt-2">Cargando...</p>
                                   </div>
                              ) : (
                                   <>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                                             <div className="flex items-center gap-2">
                                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                  <span className="text-sm font-medium text-emerald-700">Activas</span>
                                             </div>
                                             <span className="text-lg font-bold text-emerald-700">{stats.activeEnrollments || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100/50">
                                             <div className="flex items-center gap-2">
                                                  <AlertCircle className="w-4 h-4 text-amber-600" />
                                                  <span className="text-sm font-medium text-amber-700">Pendientes</span>
                                             </div>
                                             <span className="text-lg font-bold text-amber-700">{stats.pendingEnrollments || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100/50">
                                             <div className="flex items-center gap-2">
                                                  <ClipboardList className="w-4 h-4 text-blue-600" />
                                                  <span className="text-sm font-medium text-blue-700">Total</span>
                                             </div>
                                             <span className="text-lg font-bold text-blue-700">{stats.enrollments || 0}</span>
                                        </div>
                                   </>
                              )}
                         </div>
                    </motion.div>
               </div>

               {/* Sección de eventos próximos y matrículas recientes */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Eventos próximos */}
                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.35 }}
                         className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                         <div className="px-5 py-4 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                   <Calendar className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Próximos eventos</h2>
                              </div>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {stats.loading ? (
                                   <div className="text-center py-8">
                                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-xs text-gray-400 mt-2">Cargando eventos...</p>
                                   </div>
                              ) : stats.upcomingEvents && stats.upcomingEvents.length > 0 ? (
                                   stats.upcomingEvents.map((event, i) => {
                                        const eventDate = new Date(event.eventDate || event.startDate);
                                        const formattedDate = eventDate.toLocaleDateString("es-PE", {
                                             day: "2-digit",
                                             month: "short",
                                             year: "numeric",
                                        });
                                        return (
                                             <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex flex-col items-center justify-center shrink-0">
                                                       <span className="text-xs font-bold text-purple-600">{eventDate.getDate()}</span>
                                                       <span className="text-[10px] text-purple-500 uppercase">{eventDate.toLocaleDateString("es-PE", { month: "short" })}</span>
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-gray-700 truncate">{event.eventName || event.title || "Sin título"}</p>
                                                       <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
                                                       {event.eventType && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                                                                 {event.eventType}
                                                            </span>
                                                       )}
                                                  </div>
                                             </div>
                                        );
                                   })
                              ) : (
                                   <div className="text-center py-8">
                                        <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No hay eventos próximos</p>
                                   </div>
                              )}
                         </div>
                    </motion.div>

                    {/* Matrículas recientes */}
                    <motion.div
                         initial={{ opacity: 0, y: 16 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.4 }}
                         className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                         <div className="px-5 py-4 border-b border-gray-50">
                              <div className="flex items-center gap-2">
                                   <Clock className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Matrículas recientes</h2>
                              </div>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {stats.loading ? (
                                   <div className="text-center py-8">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-xs text-gray-400 mt-2">Cargando matrículas...</p>
                                   </div>
                              ) : stats.recentEnrollments && stats.recentEnrollments.length > 0 ? (
                                   stats.recentEnrollments.map((enrollment, i) => {
                                        const enrollmentDate = new Date(enrollment.enrollmentDate || enrollment.createdAt);
                                        const formattedDate = enrollmentDate.toLocaleDateString("es-PE", {
                                             day: "2-digit",
                                             month: "short",
                                        });
                                        const statusColors = {
                                             ACTIVE: "bg-emerald-100 text-emerald-700",
                                             PENDING: "bg-amber-100 text-amber-700",
                                             CANCELLED: "bg-red-100 text-red-700",
                                             INACTIVE: "bg-gray-100 text-gray-700",
                                        };
                                        const status = enrollment.enrollmentStatus || enrollment.status || "UNKNOWN";
                                        const statusColor = statusColors[status] || "bg-gray-100 text-gray-700";
                                        
                                        return (
                                             <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                       <GraduationCap className="w-4 h-4 text-blue-600" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-medium text-gray-700 truncate">
                                                            {enrollment.studentFullName || "Sin nombre"}
                                                       </p>
                                                       <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
                                                       <div className="flex items-center gap-2 mt-1">
                                                            <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColor}`}>
                                                                 {status}
                                                            </span>
                                                            {enrollment.classroomName && (
                                                                 <span className="text-[10px] text-gray-500">
                                                                      {enrollment.classroomName}
                                                                 </span>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>
                                        );
                                   })
                              ) : (
                                   <div className="text-center py-8">
                                        <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No hay matrículas recientes</p>
                                   </div>
                              )}
                         </div>
                    </motion.div>
               </div>
          </div>
     );
}
