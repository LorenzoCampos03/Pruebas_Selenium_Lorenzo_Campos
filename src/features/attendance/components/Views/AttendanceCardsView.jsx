import { useState, useMemo } from "react";
import { Calendar, Users, ChevronRight, ArrowLeft } from "lucide-react";
import { ATTENDANCE_STATUS_LABELS, toLocalDateFromYmd, formatYmdToLocaleDate } from "../../models/attendanceModel";

function StatusBadge({ status }) {
     const colors = {
          PRESENT: "bg-green-500 text-white",
          ABSENT: "bg-red-500 text-white",
          LATE: "bg-yellow-500 text-white",
          JUSTIFIED: "bg-blue-500 text-white",
          EXCUSED: "bg-gray-500 text-white",
     };

     return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-500 text-white"}`}>
               {ATTENDANCE_STATUS_LABELS[status] || status}
          </span>
     );
}

export default function AttendanceCardsView({ attendances }) {
     const [selectedDate, setSelectedDate] = useState(null);
     const [selectedClassroom, setSelectedClassroom] = useState(null);

     // Agrupar asistencias por fecha
     const attendancesByDate = useMemo(() => {
          const grouped = {};
          attendances.forEach(attendance => {
               const date = attendance.attendanceDate;
               if (!grouped[date]) {
                    grouped[date] = [];
               }
               grouped[date].push(attendance);
          });
          return grouped;
     }, [attendances]);

     // Agrupar por aula dentro de una fecha
     const attendancesByClassroom = useMemo(() => {
          if (!selectedDate) return {};
          
          const grouped = {};
          attendancesByDate[selectedDate]?.forEach(attendance => {
               const classroomId = attendance.classroomId;
               if (!grouped[classroomId]) {
                    grouped[classroomId] = {
                         classroomName: attendance.classroomName,
                         students: []
                    };
               }
               grouped[classroomId].students.push(attendance);
          });
          return grouped;
     }, [selectedDate, attendancesByDate]);

     // Obtener estudiantes de un aula específica
     const studentsInClassroom = useMemo(() => {
          if (!selectedClassroom) return [];
          return attendancesByClassroom[selectedClassroom]?.students || [];
     }, [selectedClassroom, attendancesByClassroom]);

     // Contar estados por fecha
     const getStatusCounts = (date) => {
          const records = attendancesByDate[date] || [];
          const counts = {
               PRESENT: 0,
               ABSENT: 0,
               LATE: 0,
               JUSTIFIED: 0,
               EXCUSED: 0
          };
          records.forEach(r => {
               if (counts[r.status] !== undefined) {
                    counts[r.status]++;
               }
          });
          return counts;
     };

     // Vista: Lista de fechas
     if (!selectedDate) {
          return (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {Object.keys(attendancesByDate)
                         .sort((a, b) => (toLocalDateFromYmd(b)?.getTime() || 0) - (toLocalDateFromYmd(a)?.getTime() || 0))
                         .map(date => {
                         const count = attendancesByDate[date].length;
                         const statusCounts = getStatusCounts(date);
                         const dateObj = toLocalDateFromYmd(date);
                         const day = dateObj.getDate();
                         const month = dateObj.toLocaleDateString("es-PE", { month: "short" });

                         return (
                              <button
                                   key={date}
                                   onClick={() => setSelectedDate(date)}
                                   className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-400 hover:shadow-md transition-all text-left group"
                              >
                                   <div className="flex flex-col items-center mb-3">
                                        <div className="text-3xl font-bold text-gray-900">{day}</div>
                                        <div className="text-xs text-gray-500 uppercase">{month}</div>
                                   </div>
                                   
                                   <div className="text-center mb-2">
                                        <div className="text-sm font-medium text-gray-700">{count} registro(s)</div>
                                   </div>
                                   
                                   <div className="flex flex-col gap-1">
                                        {statusCounts.PRESENT > 0 && (
                                             <div className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-600">Presentes</span>
                                                  <span className="font-semibold text-green-600">{statusCounts.PRESENT}</span>
                                             </div>
                                        )}
                                        {statusCounts.ABSENT > 0 && (
                                             <div className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-600">Ausentes</span>
                                                  <span className="font-semibold text-red-600">{statusCounts.ABSENT}</span>
                                             </div>
                                        )}
                                        {statusCounts.LATE > 0 && (
                                             <div className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-600">Tardes</span>
                                                  <span className="font-semibold text-yellow-600">{statusCounts.LATE}</span>
                                             </div>
                                        )}
                                   </div>
                              </button>
                         );
                    })}
               </div>
          );
     }

     // Vista: Lista de aulas en la fecha seleccionada
     if (selectedDate && !selectedClassroom) {
          const formattedDate = formatYmdToLocaleDate(selectedDate, "es-PE", { day: "numeric", month: "long", year: "numeric" });

          return (
               <div className="space-y-4">
                    <button
                         onClick={() => setSelectedDate(null)}
                         className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                         <ArrowLeft className="w-4 h-4" />
                         {formattedDate}
                    </button>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                         {Object.entries(attendancesByClassroom).map(([classroomId, data]) => (
                              <button
                                   key={classroomId}
                                   onClick={() => setSelectedClassroom(classroomId)}
                                   className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-400 hover:shadow-md transition-all text-center group"
                              >
                                   <div className="flex justify-center mb-3">
                                        <div className="p-3 bg-blue-50 rounded-full">
                                             <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                   </div>
                                   <div className="text-sm font-semibold text-gray-900 mb-1">{data.classroomName}</div>
                                   <div className="text-xs text-gray-500">{data.students.length} estudiante(s)</div>
                              </button>
                         ))}
                    </div>
               </div>
          );
     }

     // Vista: Lista de estudiantes en el aula seleccionada
     if (selectedDate && selectedClassroom) {
          const classroomName = attendancesByClassroom[selectedClassroom]?.classroomName;
          const formattedDate = formatYmdToLocaleDate(selectedDate, "es-PE");

          return (
               <div className="space-y-4">
                    <button
                         onClick={() => setSelectedClassroom(null)}
                         className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                         <ArrowLeft className="w-4 h-4" />
                         {classroomName}
                    </button>

                    <div className="bg-white rounded-lg overflow-hidden">
                         <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                              <h3 className="text-sm font-bold text-gray-900">Estudiantes Registrados</h3>
                              <p className="text-xs text-gray-600 mt-0.5">{studentsInClassroom.length} estudiante(s)</p>
                         </div>
                         <div className="overflow-x-auto">
                              <table className="min-w-full">
                                   <thead>
                                        <tr className="border-b border-gray-200">
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Fecha
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Estudiante
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Aula
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Estado
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Llegada
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Salida
                                             </th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                  Recogido Por
                                             </th>
                                        </tr>
                                   </thead>
                                   <tbody className="bg-white">
                                        {studentsInClassroom.map((attendance) => (
                                             <tr key={attendance.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                  <td className="px-6 py-4 text-sm text-gray-900">
                                                       {formattedDate}
                                                  </td>
                                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                       {attendance.studentName}
                                                  </td>
                                                  <td className="px-6 py-4 text-sm text-gray-600">
                                                       {attendance.classroomName}
                                                  </td>
                                                  <td className="px-6 py-4">
                                                       <StatusBadge status={attendance.status} />
                                                  </td>
                                                  <td className="px-6 py-4 text-sm text-gray-900">
                                                       {attendance.arrivalTime || "-"}
                                                  </td>
                                                  <td className="px-6 py-4 text-sm text-gray-900">
                                                       {attendance.departureTime || "-"}
                                                  </td>
                                                  <td className="px-6 py-4 text-sm text-gray-600">
                                                       {attendance.pickedUpByName || "-"}
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    </div>
               </div>
          );
     }

     return null;
}
