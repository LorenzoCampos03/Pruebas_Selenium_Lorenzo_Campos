import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items = [] }) {
     return (
          <nav className="flex items-center gap-1 text-sm mb-4">
               {items.map((item, index) => (
                    <div key={item.path || index} className="flex items-center gap-1">
                         {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                         {index === items.length - 1 ? (
                              <span className="text-gray-600 font-medium">{item.label}</span>
                         ) : (
                              <Link to={item.path} className="text-gray-400 hover:text-primary-600 transition-colors">
                                   {item.label}
                              </Link>
                         )}
                    </div>
               ))}
          </nav>
     );
}
