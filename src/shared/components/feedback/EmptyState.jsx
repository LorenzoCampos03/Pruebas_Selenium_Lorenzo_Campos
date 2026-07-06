import { motion } from "framer-motion";
import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "Sin resultados", description = "No se encontraron datos.", action }) {
     return (
          <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center py-16 text-center"
          >
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
               <p className="text-sm text-gray-400 max-w-sm mb-4">{description}</p>
               {action && action}
          </motion.div>
     );
}
