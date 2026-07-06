const variants = {
     primary: "bg-blue-100 text-blue-700",
     success: "bg-green-100 text-green-700",
     danger: "bg-red-100 text-red-700",
     warning: "bg-yellow-100 text-yellow-700",
     info: "bg-cyan-100 text-cyan-700",
     gray: "bg-gray-100 text-gray-700",
     purple: "bg-purple-100 text-purple-700",
};

const sizes = {
     sm: "px-2 py-0.5 text-xs",
     md: "px-2.5 py-1 text-xs",
     lg: "px-3 py-1.5 text-sm",
};

export default function Badge({ children, variant = "gray", size = "md", dot = false, className = "" }) {
     return (
          <span
               className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
          >
               {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
               {children}
          </span>
     );
}
