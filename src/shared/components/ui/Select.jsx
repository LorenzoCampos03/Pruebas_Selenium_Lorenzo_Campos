import { forwardRef } from "react";

const Select = forwardRef(function Select(
     { label, error, options = [], placeholder, className = "", ...props },
     ref
) {
     return (
          <div className="space-y-1.5">
               {label && (
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
               )}
               <select
                    ref={ref}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"
                         } ${className}`}
                    {...props}
               >
                    {placeholder && (
                         <option value="" disabled>
                              {placeholder}
                         </option>
                    )}
                    {options.map((opt) => (
                         <option key={opt.value} value={opt.value}>
                              {opt.label}
                         </option>
                    ))}
               </select>
               {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
     );
});

export default Select;
