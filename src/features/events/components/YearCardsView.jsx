import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { EVENT_TYPE_LABELS, EVENT_STATUS } from "../models/eventModel";
import { Badge } from "@/shared/components/ui";
import { formatDate } from "@/core/utils/formatters";

export default function YearCardsView({ 
     events,
     onEventClick
}) {
     const [expandedYears, setExpandedYears] = useState({});
     const [selectedMonthByYear, setSelectedMonthByYear] = useState({});

     const months = [
          { value: 0, label: 'Enero' },
          { value: 1, label: 'Febrero' },
          { value: 2, label: 'Marzo' },
          { value: 3, label: 'Abril' },
          { value: 4, label: 'Mayo' },
          { value: 5, label: 'Junio' },
          { value: 6, label: 'Julio' },
          { value: 7, label: 'Agosto' },
          { value: 8, label: 'Septiembre' },
          { value: 9, label: 'Octubre' },
          { value: 10, label: 'Noviembre' },
          { value: 11, label: 'Diciembre' }
     ];

     const getTypeBadgeColor = (type) => {
          const colors = {
               CIVICO: "blue",
               CULTURAL: "purple",
               RELIGIOSO: "orange",
               INSTITUCIONAL: "green",
          };
          return colors[type] || "gray";
     };

     // Agrupar eventos por año
     const eventsByYear = events.reduce((acc, event) => {
          const year = new Date(event.startDate).getFullYear();
          if (!acc[year]) {
               acc[year] = [];
          }
          acc[year].push(event);
          return acc;
     }, {});

     const years = Object.keys(eventsByYear).sort((a, b) => b - a);

     const toggleYear = (year) => {
          setExpandedYears(prev => ({
               ...prev,
               [year]: !prev[year]
          }));
     };

     const handleMonthFilter = (year, month) => {
          setSelectedMonthByYear(prev => ({
               ...prev,
               [year]: month
          }));
     };

     const getFilteredEventsByMonth = (year) => {
          const selectedMonth = selectedMonthByYear[year];
          const yearEvents = eventsByYear[year] || [];
          
          if (selectedMonth === undefined || selectedMonth === '') {
               return yearEvents.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          }
          
          return yearEvents.filter(event => {
               const eventMonth = new Date(event.startDate).getMonth();
               return eventMonth === parseInt(selectedMonth);
          }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
     };

     const getEventTypeCount = (yearEvents) => {
          return yearEvents.reduce((acc, event) => {
               acc[event.eventType] = (acc[event.eventType] || 0) + 1;
               return acc;
          }, {});
     };

     return (
          <div className="space-y-4">
               {years.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                         <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                         <p className="text-gray-400">No se encontraron eventos</p>
                    </div>
               ) : (
                    years.map(year => {
                         const yearEvents = eventsByYear[year];
                         const isExpanded = expandedYears[year];
                         const typeCounts = getEventTypeCount(yearEvents);
                         const filteredMonthEvents = getFilteredEventsByMonth(year);

                         return (
                              <motion.div
                                   key={year}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                              >
                                   {/* Card Header */}
                                   <div className="p-4 md:p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                             <div className="flex items-center gap-3 md:gap-4 flex-1">
                                                  <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary-600 rounded-xl text-white flex-shrink-0">
                                                       <Calendar className="w-6 h-6 md:w-8 md:h-8" />
                                                  </div>
                                                  <div>
                                                       <h2 className="text-xl md:text-2xl font-bold text-gray-800">{year}</h2>
                                                       <p className="text-xs md:text-sm text-gray-600 mt-1">
                                                            {yearEvents.length} {yearEvents.length === 1 ? 'evento' : 'eventos'} programados
                                                       </p>
                                                  </div>
                                             </div>
                                             
                                             <button
                                                  onClick={() => toggleYear(year)}
                                                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium text-gray-700 flex-shrink-0"
                                             >
                                                  {isExpanded ? (
                                                       <>
                                                            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                            <span className="hidden md:inline">Ocultar</span>
                                                       </>
                                                  ) : (
                                                       <>
                                                            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                            <span className="hidden md:inline">Ver más</span>
                                                       </>
                                                  )}
                                             </button>
                                        </div>
                                        
                                        {/* Resumen por tipo */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                             {Object.entries(typeCounts).map(([type, count]) => (
                                                  <Badge key={type} color={getTypeBadgeColor(type)} size="sm">
                                                       {EVENT_TYPE_LABELS[type]}: {count}
                                                  </Badge>
                                             ))}
                                        </div>
                                   </div>

                                   {/* Expanded Content */}
                                   <AnimatePresence>
                                        {isExpanded && (
                                             <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.3 }}
                                                  className="overflow-hidden"
                                             >
                                                  <div className="p-4 md:p-6 bg-gray-50">
                                                       {/* Filtro por mes */}
                                                       <div className="mb-4">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                 Filtrar por mes
                                                            </label>
                                                            <select
                                                                 value={selectedMonthByYear[year] || ''}
                                                                 onChange={(e) => handleMonthFilter(year, e.target.value)}
                                                                 className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                            >
                                                                 <option value="">Todos los meses</option>
                                                                 {months.map(month => (
                                                                      <option key={month.value} value={month.value}>
                                                                           {month.label}
                                                                      </option>
                                                                 ))}
                                                            </select>
                                                       </div>

                                                       {/* Lista de eventos */}
                                                       {filteredMonthEvents.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-400">
                                                                 No hay eventos para el filtro seleccionado
                                                            </div>
                                                       ) : (
                                                            <div className="space-y-3">
                                                                 {filteredMonthEvents.map((event) => (
                                                                      <motion.div
                                                                           key={event.id}
                                                                           initial={{ opacity: 0, x: -20 }}
                                                                           animate={{ opacity: 1, x: 0 }}
                                                                           className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-md transition-all"
                                                                      >
                                                                           <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
                                                                                <div className="flex-1 min-w-0">
                                                                                     <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                                          <h3 className="font-semibold text-sm md:text-base text-gray-900">{event.title}</h3>
                                                                                          <Badge color={getTypeBadgeColor(event.eventType)} size="sm">
                                                                                               {EVENT_TYPE_LABELS[event.eventType]}
                                                                                          </Badge>
                                                                                     </div>
                                                                                     
                                                                                     {event.description && (
                                                                                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                                                                     )}
                                                                                     
                                                                                     <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-500">
                                                                                          <span className="flex items-center gap-1">
                                                                                               <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                                                               {formatDate(event.startDate)}
                                                                                               {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                                                                                          </span>
                                                                                          {event.isHoliday && (
                                                                                               <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                                                                    Feriado
                                                                                               </span>
                                                                                          )}
                                                                                          {event.affectsClasses && (
                                                                                               <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                                                                                    Afecta clases
                                                                                               </span>
                                                                                          )}
                                                                                     </div>
                                                                                </div>
                                                                                
                                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                                     <button
                                                                                          onClick={() => onEventClick(event)}
                                                                                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                                          title="Ver detalles"
                                                                                     >
                                                                                          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                                                     </button>
                                                                                </div>
                                                                           </div>
                                                                      </motion.div>
                                                                 ))}
                                                            </div>
                                                       )}
                                                  </div>
                                             </motion.div>
                                        )}
                                   </AnimatePresence>
                              </motion.div>
                         );
                    })
               )}
          </div>
     );
}
