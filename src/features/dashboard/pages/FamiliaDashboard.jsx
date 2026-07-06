import { motion } from "framer-motion";
import { GraduationCap, FileText, MessageSquare, ClipboardList } from "lucide-react";
import StatCard from "../components/StatCard";
import { useAuth } from "@/core/auth/AuthContext";
import { getRoleLabel } from "@/core/utils/constants";

export default function FamiliaDashboard() {
     const { role } = useAuth();

     return (
          <div>
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
               >
                    <h1 className="text-2xl font-bold text-gray-800">Portal de {getRoleLabel(role)}</h1>
                    <p className="text-gray-500 text-sm mt-1">Seguimiento académico de tus hijos</p>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={GraduationCap} label="Mis Hijos" value="--" color="blue" delay={0.1} />
                    <StatCard icon={FileText} label="Calificaciones" value="--" color="green" delay={0.2} />
                    <StatCard icon={MessageSquare} label="Comunicados" value="--" color="purple" delay={0.3} />
                    <StatCard icon={ClipboardList} label="Asistencia" value="--" color="orange" delay={0.4} />
               </div>

               <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
               >
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenido</h2>
                    <p className="text-gray-500 text-sm">
                         Consulta calificaciones, asistencia y comunicados de tus hijos.
                    </p>
               </motion.div>
          </div>
     );
}
