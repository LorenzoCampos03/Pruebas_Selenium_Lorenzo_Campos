export default function Table({ columns, data, onRowClick, emptyMessage = "No hay datos" }) {
     return (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                              {data.length === 0 ? (
                                   <tr>
                                        <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-gray-400">
                                             {emptyMessage}
                                        </td>
                                   </tr>
                              ) : (
                                   data.map((row, i) => (
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
          </div>
     );
}
