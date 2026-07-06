import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
     const sizes = {
          sm: "max-w-md",
          md: "max-w-lg",
          lg: "max-w-2xl",
          xl: "max-w-4xl",
     };

     return (
          <AnimatePresence>
               {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                         <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/50"
                              onClick={onClose}
                         />
                         <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}
                         >
                              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                   <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                                   <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                   >
                                        <X className="w-5 h-5" />
                                   </button>
                              </div>
                              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                   {children}
                              </div>
                         </motion.div>
                    </div>
               )}
          </AnimatePresence>
     );
}
