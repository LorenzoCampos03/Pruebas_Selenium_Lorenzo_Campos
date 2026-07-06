import { useRef, useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";

export default function FileUpload({ label, accept, onChange, maxSize = 5, error }) {
     const inputRef = useRef(null);
     const [file, setFile] = useState(null);
     const [localError, setLocalError] = useState("");

     const handleChange = (e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;

          if (selected.size > maxSize * 1024 * 1024) {
               setLocalError(`El archivo no debe superar ${maxSize}MB`);
               return;
          }

          setLocalError("");
          setFile(selected);
          onChange?.(selected);
     };

     const handleRemove = () => {
          setFile(null);
          setLocalError("");
          if (inputRef.current) inputRef.current.value = "";
          onChange?.(null);
     };

     return (
          <div className="space-y-1.5">
               {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
               <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />

               {!file ? (
                    <button
                         type="button"
                         onClick={() => inputRef.current?.click()}
                         className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer"
                    >
                         <Upload className="w-5 h-5" />
                         Seleccionar archivo
                    </button>
               ) : (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                         <div className="flex items-center gap-2 min-w-0">
                              <FileIcon className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                         </div>
                         <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 cursor-pointer shrink-0">
                              <X className="w-4 h-4" />
                         </button>
                    </div>
               )}

               {(error || localError) && <p className="text-xs text-red-500">{error || localError}</p>}
          </div>
     );
}
