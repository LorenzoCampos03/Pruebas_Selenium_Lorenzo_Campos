import { useState } from "react";

export default function StatusSwitch({ active, onToggle, disabled = false, size = "md" }) {
     const [toggling, setToggling] = useState(false);

     const sizes = {
          sm: { track: "w-8 h-4", dot: "w-3 h-3", translate: "translate-x-4" },
          md: { track: "w-11 h-6", dot: "w-5 h-5", translate: "translate-x-5" },
     };

     const s = sizes[size] || sizes.md;

     async function handleToggle() {
          if (disabled || toggling) return;
          setToggling(true);
          try {
               await onToggle();
          } finally {
               setToggling(false);
          }
     }

     return (
          <button
               type="button"
               role="switch"
               aria-checked={active}
               disabled={disabled || toggling}
               onClick={handleToggle}
               className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${s.track} ${active ? "bg-emerald-500" : "bg-gray-300"}`}
          >
               <span
                    className={`inline-block rounded-full bg-white shadow transform transition-transform duration-200 ${s.dot} ${active ? s.translate : "translate-x-0.5"}`}
               />
          </button>
     );
}
