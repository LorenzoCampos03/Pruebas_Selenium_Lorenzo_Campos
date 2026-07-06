import { motion } from "framer-motion";

const COLOR_MAP = {
     blue: {
          bg: "bg-blue-50",
          icon: "text-blue-600",
          accent: "bg-blue-500",
     },
     purple: {
          bg: "bg-purple-50",
          icon: "text-purple-600",
          accent: "bg-purple-500",
     },
     green: {
          bg: "bg-emerald-50",
          icon: "text-emerald-600",
          accent: "bg-emerald-500",
     },
     orange: {
          bg: "bg-amber-50",
          icon: "text-amber-600",
          accent: "bg-amber-500",
     },
     red: {
          bg: "bg-red-50",
          icon: "text-red-600",
          accent: "bg-red-500",
     },
     cyan: {
          bg: "bg-cyan-50",
          icon: "text-cyan-600",
          accent: "bg-cyan-500",
     },
};

export default function StatCard({ icon: Icon, label, value, color, delay = 0, subtitle }) {
     const c = COLOR_MAP[color] || COLOR_MAP.blue;

     return (
          <motion.div
               initial={{ opacity: 0, y: 16 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay, duration: 0.35, ease: "easeOut" }}
               className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
          >
               <div className={["absolute top-0 left-0 w-1 h-full rounded-r-full", c.accent].join(" ")} />

               <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                         <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                         <p className="text-2xl font-bold text-gray-900 mt-2 leading-none">{value}</p>
                         {subtitle && (
                              <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
                         )}
                    </div>
                    <div className={["w-10 h-10 rounded-lg flex items-center justify-center shrink-0", c.bg].join(" ")}>
                         <Icon className={["w-5 h-5", c.icon].join(" ")} strokeWidth={1.8} />
                    </div>
               </div>
          </motion.div>
     );
}
