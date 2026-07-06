import { forwardRef } from "react";
import { Calendar } from "lucide-react";

const DatePicker = forwardRef(function DatePicker({ label, error, value, onChange, ...props }, ref) {
     return (
          <div className="space-y-1.5">
               {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
               <div className="relative">
                    <input
                         ref={ref}
                         type="date"
                         value={value || ""}
                         onChange={onChange}
                         className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white ${error ? "border-red-300" : "border-gray-200"
                              }`}
                         {...props}
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
               </div>
               {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
     );
});

export default DatePicker;
