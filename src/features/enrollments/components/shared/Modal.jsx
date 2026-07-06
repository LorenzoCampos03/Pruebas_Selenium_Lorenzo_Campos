import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  "4xl": "max-w-6xl",
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function Modal({ isOpen, onClose, title, subtitle, children, size = "xl", icon: Icon }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size] || sizeClasses.xl} w-full max-h-[90vh] overflow-hidden`}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <div className="p-2 bg-gray-900 rounded-xl flex-shrink-0">
                    <Icon className="text-white" size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 truncate">{title}</h2>
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "2xl", "4xl"]),
  icon: PropTypes.elementType,
};
