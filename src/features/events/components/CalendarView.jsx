import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/shared/components/ui";

export default function CalendarView({ 
     events,
     onEventClick
}) {
     const [currentMonth, setCurrentMonth] = useState(new Date());
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

     const currentYear = new Date().getFullYear();
     const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

     const handleMonthChange = (month) => {
          const newDate = new Date(currentMonth);
          newDate.setMonth(parseInt(month));
          setCurrentMonth(newDate);
     };

     const handleYearChange = (year) => {
          const newDate = new Date(currentMonth);
          newDate.setFullYear(parseInt(year));
          setCurrentMonth(newDate);
     };

     const navigateMonth = (direction) => {
          const newDate = new Date(currentMonth);
          newDate.setMonth(currentMonth.getMonth() + direction);
          setCurrentMonth(newDate);
     };

     const getDaysInMonth = (date) => {
          const year = date.getFullYear();
          const month = date.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const daysInMonth = lastDay.getDate();
          const startingDayOfWeek = firstDay.getDay();
          return { daysInMonth, startingDayOfWeek, year, month };
     };

     const getEventsForDay = (day) => {
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          return events.filter(event => {
               const eventStart = event.startDate?.split('T')[0];
               const eventEnd = event.endDate?.split('T')[0] || eventStart;
               return dateStr >= eventStart && dateStr <= eventEnd;
          });
     };

     const getTypeBadgeColor = (type) => {
          const colors = {
               CIVICO: "blue",
               CULTURAL: "purple",
               RELIGIOSO: "orange",
               INSTITUCIONAL: "green",
          };
          return colors[type] || "gray";
     };

     return (
          <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
          >
               {/* Header del Calendario */}
               <div className="p-2 md:p-4 border-b border-gray-100 bg-gray-50">
                    {/* Navegación y Filtros */}
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                         <button
                              onClick={() => navigateMonth(-1)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                         </button>
                         
                         <div className="flex items-center gap-1 md:gap-2 flex-1 justify-center">
                              <select
                                   value={currentMonth.getMonth()}
                                   onChange={(e) => handleMonthChange(e.target.value)}
                                   className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                   {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                   ))}
                              </select>
                              
                              <select
                                   value={currentMonth.getFullYear()}
                                   onChange={(e) => handleYearChange(e.target.value)}
                                   className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                              >
                                   {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                   ))}
                              </select>
                         </div>
                         
                         <button
                              onClick={() => navigateMonth(1)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                         >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                         </button>
                    </div>
               </div>
               
               {/* Calendario */}
               <div className="p-2 md:p-4 overflow-auto">
                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                         {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                              <div key={day} className="text-center text-[0.625rem] md:text-xs font-semibold text-gray-500 py-1 md:py-2">
                                   {day}
                              </div>
                         ))}
                    </div>
                    
                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                         {(() => {
                              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                              const days = [];
                              
                              // Celdas vacías antes del primer día
                              for (let i = 0; i < startingDayOfWeek; i++) {
                                   days.push(<div key={`empty-${i}`} className="aspect-square" />);
                              }
                              
                              // Días del mes
                              for (let day = 1; day <= daysInMonth; day++) {
                                   const dayEvents = getEventsForDay(day);
                                   const today = new Date();
                                   const isToday = 
                                        day === today.getDate() &&
                                        currentMonth.getMonth() === today.getMonth() &&
                                        currentMonth.getFullYear() === today.getFullYear();
                                   
                                   days.push(
                                        <div
                                             key={day}
                                             className={`aspect-square border rounded-md md:rounded-lg p-0.5 md:p-1 transition-all hover:shadow-md ${
                                                  isToday ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200'
                                             }`}
                                        >
                                             <div className={`text-[0.625rem] md:text-xs font-semibold mb-0.5 md:mb-1 ${
                                                  isToday ? 'text-primary-700' : 'text-gray-700'
                                             }`}>
                                                  {day}
                                             </div>
                                             <div className="space-y-0.5 overflow-y-auto max-h-12 md:max-h-16">
                                                  {dayEvents.slice(0, 2).map(event => (
                                                       <div
                                                            key={event.id}
                                                            onClick={() => onEventClick(event)}
                                                            className="text-[0.5rem] md:text-[0.625rem] px-0.5 md:px-1 py-0.5 rounded cursor-pointer truncate hover:opacity-80"
                                                            style={{
                                                                 backgroundColor: 
                                                                      getTypeBadgeColor(event.eventType) === 'blue' ? '#dbeafe' :
                                                                      getTypeBadgeColor(event.eventType) === 'purple' ? '#f3e8ff' :
                                                                      getTypeBadgeColor(event.eventType) === 'orange' ? '#fed7aa' :
                                                                      '#d1fae5',
                                                                 color:
                                                                      getTypeBadgeColor(event.eventType) === 'blue' ? '#1e40af' :
                                                                      getTypeBadgeColor(event.eventType) === 'purple' ? '#6b21a8' :
                                                                      getTypeBadgeColor(event.eventType) === 'orange' ? '#c2410c' :
                                                                      '#065f46'
                                                            }}
                                                            title={event.title}
                                                       >
                                                            {event.title}
                                                       </div>
                                                  ))}
                                                  {dayEvents.length > 2 && (
                                                       <div className="text-[0.5rem] md:text-[0.625rem] text-gray-500 px-0.5 md:px-1">
                                                            +{dayEvents.length - 2} más
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   );
                              }
                              
                              return days;
                         })()}
                    </div>
               </div>
          </motion.div>
     );
}
