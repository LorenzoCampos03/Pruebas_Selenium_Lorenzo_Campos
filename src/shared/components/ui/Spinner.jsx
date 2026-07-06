const sizes = {
     sm: "w-4 h-4 border-2",
     md: "w-8 h-8 border-2",
     lg: "w-12 h-12 border-3",
     xl: "w-16 h-16 border-4",
};

const colors = {
     primary: "border-blue-600",
     white: "border-white",
     gray: "border-gray-600",
};

export default function Spinner({ size = "md", color = "primary", className = "" }) {
     return (
          <div
               className={`rounded-full border-t-transparent animate-spin ${sizes[size]} ${colors[color]} ${className}`}
               role="status"
               aria-label="Cargando"
          />
     );
}
