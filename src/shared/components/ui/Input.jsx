import { forwardRef, useCallback } from "react";

const Input = forwardRef(function Input(
     { label, error, icon: Icon, className = "", filter, onChange, ...props },
     ref
) {
     const handleChange = useCallback(
          (e) => {
               if (filter) {
                    const filtered = filter(e.target.value);
                    if (filtered !== e.target.value) {
                         const nativeEvent = { ...e, target: { ...e.target, value: filtered } };
                         onChange?.(nativeEvent);
                         return;
                    }
               }
               onChange?.(e);
          },
          [filter, onChange]
     );

     return (
          <div className="space-y-1.5">
               {label && (
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
               )}
               <div className="relative">
                    {Icon && (
                         <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <input
                         ref={ref}
                         className={`w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${Icon ? "pl-10" : ""
                              } ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"} ${className}`}
                         onChange={handleChange}
                         {...props}
                    />
               </div>
               {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
     );
});

export default Input;
