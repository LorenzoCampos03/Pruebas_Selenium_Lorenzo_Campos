import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/core/hooks/useDebounce";

export default function SearchInput({ value = "", onChange, placeholder = "Buscar...", delay = 300, className = "" }) {
     const [internal, setInternal] = useState(value);
     const debounced = useDebounce(internal, delay);
     const isFirstRender = useRef(true);
     const onChangeRef = useRef(onChange);

     useEffect(() => {
          onChangeRef.current = onChange;
     }, [onChange]);

     const stableOnChange = useCallback((val) => {
          onChangeRef.current?.(val);
     }, []);

     useEffect(() => {
          if (isFirstRender.current) {
               isFirstRender.current = false;
               return;
          }
          stableOnChange(debounced);
     }, [debounced, stableOnChange]);

     useEffect(() => {
          setInternal(value);
     }, [value]);

     return (
          <div className={`relative ${className}`}>
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input
                    type="text"
                    value={internal}
                    onChange={(e) => setInternal(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
               />
               {internal && (
                    <button
                         onClick={() => { setInternal(""); onChange?.(""); }}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                         <X className="w-4 h-4" />
                    </button>
               )}
          </div>
     );
}
