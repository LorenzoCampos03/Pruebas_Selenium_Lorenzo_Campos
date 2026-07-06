import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const STATUS_FILTERS = [
     { value: "all", label: "Todos" },
     { value: "A", label: "Activos" },
     { value: "I", label: "Inactivos" },
];

export default function PaginatedTable({
     columns,
     data,
     onRowClick,
     emptyMessage = "No hay datos",
     pageSize = 10,
     pageSizeOptions = [5, 10, 20, 50],
     statusField = "status",
     statusFilters = STATUS_FILTERS,
     showStatusFilter = true,
     onStatusFilterChange,
     externalStatus,
}) {
     const [currentPage, setCurrentPage] = useState(1);
     const [internalPageSize, setInternalPageSize] = useState(pageSize);
     const [internalStatus, setInternalStatus] = useState("all");

     const activeStatus = externalStatus !== undefined ? externalStatus : internalStatus;

     const filteredData = useMemo(() => {
          if (!showStatusFilter || activeStatus === "all") return data;
          return data.filter((row) => row[statusField] === activeStatus);
     }, [data, activeStatus, statusField, showStatusFilter]);

     const totalItems = filteredData.length;
     const totalPages = Math.max(1, Math.ceil(totalItems / internalPageSize));
     const safePage = Math.min(currentPage, totalPages);

     const paginatedData = useMemo(() => {
          const start = (safePage - 1) * internalPageSize;
          return filteredData.slice(start, start + internalPageSize);
     }, [filteredData, safePage, internalPageSize]);

     const startItem = totalItems === 0 ? 0 : (safePage - 1) * internalPageSize + 1;
     const endItem = Math.min(safePage * internalPageSize, totalItems);

     function handleStatusChange(newStatus) {
          setCurrentPage(1);
          if (onStatusFilterChange) {
               onStatusFilterChange(newStatus);
          } else {
               setInternalStatus(newStatus);
          }
     }

     function handlePageSizeChange(newSize) {
          setInternalPageSize(Number(newSize));
          setCurrentPage(1);
     }

     function getPageNumbers() {
          const pages = [];
          const maxVisible = 5;
          let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
          let end = Math.min(totalPages, start + maxVisible - 1);

          if (end - start + 1 < maxVisible) {
               start = Math.max(1, end - maxVisible + 1);
          }

          for (let i = start; i <= end; i++) {
               pages.push(i);
          }
          return pages;
     }

     return (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
               {showStatusFilter && (
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                         <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">Estado:</span>
                         {statusFilters.map((filter) => (
                              <button
                                   key={filter.value}
                                   onClick={() => handleStatusChange(filter.value)}
                                   className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeStatus === filter.value
                                        ? "bg-indigo-500 text-white shadow-sm"
                                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                        }`}
                              >
                                   {filter.label}
                              </button>
                         ))}
                         {totalItems > 0 && (
                              <span className="ml-auto text-xs text-gray-400">
                                   {totalItems} resultado{totalItems !== 1 ? "s" : ""}
                              </span>
                         )}
                    </div>
               )}

               <div className="overflow-x-auto">
                    <table className="w-full">
                         <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                   {columns.map((col) => (
                                        <th
                                             key={col.key}
                                             className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                             style={{ width: col.width }}
                                        >
                                             {col.label}
                                        </th>
                                   ))}
                              </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                              {paginatedData.length === 0 ? (
                                   <tr>
                                        <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-400">
                                             {emptyMessage}
                                        </td>
                                   </tr>
                              ) : (
                                   paginatedData.map((row, i) => (
                                        <tr
                                             key={row.id || i}
                                             onClick={() => onRowClick?.(row)}
                                             className={`transition-colors hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                                        >
                                             {columns.map((col) => (
                                                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                                                       {col.render ? col.render(row) : row[col.key]}
                                                  </td>
                                             ))}
                                        </tr>
                                   ))
                              )}
                         </tbody>
                    </table>
               </div>

               {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                         <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                   Mostrando {startItem}-{endItem} de {totalItems}
                              </span>
                              <select
                                   value={internalPageSize}
                                   onChange={(e) => handlePageSizeChange(e.target.value)}
                                   className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                   {pageSizeOptions.map((size) => (
                                        <option key={size} value={size}>
                                             {size} por página
                                        </option>
                                   ))}
                              </select>
                         </div>

                         <div className="flex items-center gap-1">
                              <button
                                   onClick={() => setCurrentPage(1)}
                                   disabled={safePage === 1}
                                   className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                   <ChevronsLeft size={16} />
                              </button>
                              <button
                                   onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                   disabled={safePage === 1}
                                   className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                   <ChevronLeft size={16} />
                              </button>

                              {getPageNumbers().map((page) => (
                                   <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-8 h-8 text-xs font-medium rounded-lg transition-all ${safePage === page
                                             ? "bg-indigo-500 text-white shadow-sm"
                                             : "text-gray-600 hover:bg-gray-200"
                                             }`}
                                   >
                                        {page}
                                   </button>
                              ))}

                              <button
                                   onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                   disabled={safePage === totalPages}
                                   className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                   <ChevronRight size={16} />
                              </button>
                              <button
                                   onClick={() => setCurrentPage(totalPages)}
                                   disabled={safePage === totalPages}
                                   className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                   <ChevronsRight size={16} />
                              </button>
                         </div>
                    </div>
               )}
          </div>
     );
}
