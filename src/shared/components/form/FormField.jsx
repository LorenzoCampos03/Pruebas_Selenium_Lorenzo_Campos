export default function FormField({ label, error, required, children, className = "" }) {
     return (
          <div className={`space-y-1.5 ${className}`}>
               {label && (
                    <label className="block text-sm font-medium text-gray-700">
                         {label}
                         {required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
               )}
               {children}
               {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
     );
}
