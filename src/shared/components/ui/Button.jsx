import { motion } from "framer-motion";

export default function Button({
     children,
     variant = "primary",
     size = "md",
     icon: Icon,
     loading = false,
     disabled = false,
     className = "",
     ...props
}) {
     const variants = {
          primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25",
          secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
          danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25",
          success: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25",
          ghost: "bg-transparent hover:bg-gray-100 text-gray-600",
          outline: "border border-gray-200 hover:bg-gray-50 text-gray-700",
     };

     const sizes = {
          sm: "px-3 py-1.5 text-xs",
          md: "px-4 py-2.5 text-sm",
          lg: "px-6 py-3 text-base",
     };

     return (
          <motion.button
               whileTap={{ scale: 0.97 }}
               disabled={disabled || loading}
               className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
               {...props}
          >
               {loading ? (
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
               ) : Icon ? (
                    <Icon className="w-4 h-4" />
               ) : null}
               {children}
          </motion.button>
     );
}
