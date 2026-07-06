import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function EnDesarrollo({ titulo }) {
     return (
          <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
               <div className="w-20 h-20 bg-warning-500/10 rounded-full flex items-center justify-center mb-6">
                    <Construction className="w-10 h-10 text-warning-500" />
               </div>
               <h2 className="text-2xl font-bold text-gray-800 mb-2">{titulo || "En Desarrollo"}</h2>
               <p className="text-gray-500 max-w-md">
                    Esta sección se encuentra en desarrollo. Pronto estará disponible.
               </p>
          </motion.div>
     );
}
