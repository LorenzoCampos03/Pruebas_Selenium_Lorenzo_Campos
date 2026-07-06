import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, FileText, CalendarDays } from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "@/core/auth/AuthContext";
import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";

export default function DocenteDashboard() {
     const { user } = useAuth();
     const [stats, setStats] = useState({ cursos: "--", asistencia: "--", calificaciones: "--", evaluaciones: "--" });
     const [loading, setLoading] = useState(true);
     const [bienvenida, setBienvenida] = useState({ aula: null });

     useEffect(() => {
          if (!user?.userId) return;
          loadStats();
     }, [user]);

     async function loadStats() {
          setLoading(true);
          try {
               // Asignación del docente → obtener classroomId
               const assignRes = await apiClient.get(ENDPOINTS.TEACHER_ASSIGNMENTS.BY_TEACHER(user.userId));
               const assignments = assignRes.data?.data || assignRes.data || [];
               const assignment = Array.isArray(assignments) ? assignments[0] : null;
               const classroomId = assignment?.classroomId;

               // Cursos activos de la institución
               let cursos = "--";
               if (user.institutionId) {
                    try {
                         const res = await apiClient.get(ENDPOINTS.ACADEMIC.COURSES.ACTIVE_BY_INSTITUTION(user.institutionId));
                         const lista = res.data?.data || res.data || [];
                         cursos = Array.isArray(lista) ? lista.length : "--";
                    } catch { /* silent */ }
               }

               // Asistencia de hoy en el aula
               let asistencia = "--";
               if (classroomId) {
                    try {
                         const today = new Date().toISOString().split("T")[0];
                         const res = await apiClient.get(`${ENDPOINTS.ATTENDANCE.BY_CLASSROOM(classroomId)}?date=${today}`);
                         const lista = res.data?.data || res.data || [];
                         asistencia = Array.isArray(lista) ? lista.length : "--";
                    } catch { /* silent */ }
               }

               // Boletas generadas en el aula
               let calificaciones = "--";
               if (classroomId) {
                    try {
                         const res = await apiClient.get(ENDPOINTS.REPORT_CARDS.BY_CLASSROOM(classroomId));
                         const lista = res.data?.data || res.data || [];
                         calificaciones = Array.isArray(lista) ? lista.length : "--";
                    } catch { /* silent */ }
               }

               // Evaluaciones diarias del docente en el aula
               let evaluaciones = "--";
               if (classroomId) {
                    try {
                         const res = await apiClient.get(ENDPOINTS.EVALUATIONS.BY_TEACHER_CLASSROOM(user.userId, classroomId));
                         const lista = res.data?.data || res.data || [];
                         evaluaciones = Array.isArray(lista) ? lista.length : "--";
                    } catch { /* silent */ }
               }

               // Nombre del aula para bienvenida
               if (classroomId) {
                    try {
                         const res = await apiClient.get(ENDPOINTS.CLASSROOMS.BY_ID(classroomId));
                         const aula = res.data?.data || res.data;
                         setBienvenida({ aula: aula?.classroomName || null });
                    } catch { /* silent */ }
               }

               setStats({ cursos, asistencia, calificaciones, evaluaciones });
          } catch (err) {
               console.error("[DocenteDashboard]", err);
          } finally {
               setLoading(false);
          }
     }

     return (
          <div>
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
               >
                    <h1 className="text-2xl font-bold text-gray-800">Panel Docente</h1>
                    <p className="text-gray-500 text-sm mt-1">Gestión de cursos, asistencia y calificaciones</p>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={BookOpen} label="Mis Cursos" value={loading ? "..." : stats.cursos} color="blue" delay={0.1} />
                    <StatCard icon={ClipboardList} label="Asistencia Hoy" value={loading ? "..." : stats.asistencia} color="green" delay={0.2} />
                    <StatCard icon={FileText} label="Boletas" value={loading ? "..." : stats.calificaciones} color="purple" delay={0.3} />
                    <StatCard icon={CalendarDays} label="Evaluaciones" value={loading ? "..." : stats.evaluaciones} color="orange" delay={0.4} />
               </div>

               <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
               >
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                         Bienvenido{user?.firstName ? `, ${user.firstName}` : ""}
                    </h2>
                    <p className="text-gray-500 text-sm">
                         {bienvenida.aula
                              ? `Estás asignado al aula ${bienvenida.aula}. Administra tus cursos, toma de asistencia y registro de calificaciones.`
                              : "Administra tus cursos, toma de asistencia y registro de calificaciones."
                         }
                    </p>
               </motion.div>
          </div>
     );
}
