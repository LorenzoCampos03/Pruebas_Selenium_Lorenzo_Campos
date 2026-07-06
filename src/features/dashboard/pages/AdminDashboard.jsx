import { motion } from "framer-motion";
import { Building2, Users, Shield, Settings, Activity, Server, Database, Globe } from "lucide-react";
import StatCard from "../components/StatCard";
import { useAdminStats } from "../hooks/useDashboardStats";

const SERVICES = [
     { name: "API Gateway", port: 8888, icon: Globe, status: "Operativo", color: "bg-emerald-500" },
     { name: "Auth Service", port: 9082, icon: Shield, status: "Operativo", color: "bg-emerald-500" },
     { name: "User Management", port: 9083, icon: Users, status: "Operativo", color: "bg-emerald-500" },
];

export default function AdminDashboard() {
     const stats = useAdminStats();

     return (
          <div className="space-y-6">
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
               >
                    <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
                    <p className="text-gray-400 text-sm mt-1">Gestión global del sistema SIGEI</p>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                         icon={Building2}
                         label="Instituciones"
                         value={stats.loading ? "..." : stats.institutions}
                         color="blue"
                         delay={0.05}
                         subtitle="Registradas en el sistema"
                    />
                    <StatCard
                         icon={Users}
                         label="Usuarios"
                         value={stats.loading ? "..." : stats.users}
                         color="green"
                         delay={0.1}
                         subtitle={stats.loading ? "" : `${stats.activeUsers} activos`}
                    />
                    <StatCard icon={Shield} label="Roles activos" value="10" color="purple" delay={0.15} subtitle="Configurados" />
                    <StatCard icon={Settings} label="Servicios" value="3" color="orange" delay={0.2} subtitle="Microservicios activos" />
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
                                   <Activity className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Estado de servicios</h2>
                              </div>
                         </div>
                         <div className="divide-y divide-gray-50">
                              {SERVICES.map((svc) => (
                                   <div key={svc.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                                             <svc.icon className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                             <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                                             <p className="text-xs text-gray-400">Puerto {svc.port}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <span className={["w-2 h-2 rounded-full", svc.color].join(" ")} />
                                             <span className="text-xs font-medium text-emerald-600">{svc.status}</span>
                                        </div>
                                   </div>
                              ))}
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
                                   <Server className="w-4 h-4 text-gray-400" />
                                   <h2 className="text-sm font-semibold text-gray-800">Infraestructura</h2>
                              </div>
                         </div>
                         <div className="p-5 space-y-4">
                              <div>
                                   <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500">CPU</span>
                                        <span className="text-xs font-medium text-gray-700">23%</span>
                                   </div>
                                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "23%" }} />
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500">Memoria</span>
                                        <span className="text-xs font-medium text-gray-700">45%</span>
                                   </div>
                                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: "45%" }} />
                                   </div>
                              </div>
                              <div>
                                   <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-gray-500">Almacenamiento</span>
                                        <span className="text-xs font-medium text-gray-700">31%</span>
                                   </div>
                                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "31%" }} />
                                   </div>
                              </div>
                              <div className="pt-3 border-t border-gray-50">
                                   <div className="flex items-center gap-2">
                                        <Database className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500">Base de datos</span>
                                        <span className="ml-auto flex items-center gap-1.5">
                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                             <span className="text-xs font-medium text-emerald-600">Conectada</span>
                                        </span>
                                   </div>
                              </div>
                         </div>
                    </motion.div>
               </div>
          </div>
     );
}
