import { useState, useEffect } from "react";
import { ClipboardCheck, AlertCircle, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "@/features/attendance/hooks/useAttendance";
import { attendanceService } from "@/features/attendance/services/attendanceService";
import { useNavigate } from "react-router-dom";

export default function AuxiliarDashboard() {
     const { user } = useAuth();
     const navigate = useNavigate();
     const { classrooms, loading: loadingAttendance, fetchAll } = useAttendance(user);
     const [loading, setLoading] = useState(true);
     const [dashboardData, setDashboardData] = useState({
          classroomsInProgress: 0,
          classroomsNotStarted: 0,
          totalClassrooms: 0,
          unjustifiedAbsences: 0,
          lateRecords: 0,
          classroomProgress: []
     });

     useEffect(() => {
          fetchAll();
          const interval = setInterval(() => fetchAll(), 30000);
          return () => clearInterval(interval);
     }, [fetchAll]);

     useEffect(() => {
          if (!loadingAttendance && classrooms.length >= 0) {
               loadDashboardData();
          }
     }, [classrooms, loadingAttendance]);

     const loadDashboardData = async () => {
          try {
               setLoading(true);
               const today = new Date().toISOString().split('T')[0];
               
               const todayAttendancesResponse = await attendanceService.getByDate(today);
               const todayAttendances = Array.isArray(todayAttendancesResponse) 
                    ? todayAttendancesResponse 
                    : (todayAttendancesResponse?.data || []);
               
               const studentsResponse = user?.institutionId
                    ? await attendanceService.getStudentsByInstitution(user.institutionId)
                    : { data: [] };
               const allStudents = studentsResponse?.data || [];

               const classroomProgress = classrooms.map(classroom => {
                    const classroomAttendances = todayAttendances.filter(
                         att => att.classroomId === classroom.id
                    );
                    
                    const totalStudents = allStudents.filter(
                         student => student.classroomId === classroom.id
                    ).length;
                    
                    const withEntryCount = classroomAttendances.filter(
                         att => att.status === 'PRESENT' || att.status === 'LATE'
                    ).length;
                    
                    const withExitCount = classroomAttendances.filter(
                         att => (att.status === 'PRESENT' || att.status === 'LATE') && att.departureTime
                    ).length;
                    
                    const entryProgress = totalStudents > 0 ? (withEntryCount / totalStudents) * 50 : 0;
                    const exitProgress = totalStudents > 0 ? (withExitCount / totalStudents) * 50 : 0;
                    const percentage = Math.round(entryProgress + exitProgress);

                    const lastUpdate = classroomAttendances.length > 0
                         ? new Date(Math.max(...classroomAttendances.map(a => new Date(a.updatedAt || a.createdAt))))
                         : null;

                    return {
                         id: classroom.id,
                         name: classroom.classroomName || classroom.name,
                         withEntryCount,
                         withExitCount,
                         totalStudents,
                         percentage,
                         lastUpdate,
                         hasData: classroomAttendances.length > 0
                    };
               });

               const classroomsInProgress = classroomProgress.filter(c => c.hasData).length;
               const classroomsNotStarted = classroomProgress.filter(c => !c.hasData).length;
               const unjustifiedAbsences = todayAttendances.filter(
                    att => att.status === 'ABSENT' && !att.isJustified
               ).length;
               const lateRecords = todayAttendances.filter(
                    att => att.status === 'LATE'
               ).length;

               setDashboardData({
                    classroomsInProgress,
                    classroomsNotStarted,
                    totalClassrooms: classrooms.length,
                    unjustifiedAbsences,
                    lateRecords,
                    classroomProgress: classroomProgress
                         .filter(c => c.hasData)
                         .sort((a, b) => b.percentage - a.percentage)
               });
          } catch (error) {
               console.error("Error loading dashboard data:", error);
          } finally {
               setLoading(false);
          }
     };

     const formatTimeAgo = (date) => {
          if (!date) return "";
          const now = new Date();
          const diff = Math.floor((now - date) / 1000 / 60);
          if (diff < 1) return "Ahora";
          if (diff < 60) return `Hace ${diff} min`;
          const hours = Math.floor(diff / 60);
          return `Hace ${hours}h`;
     };

     if (loading) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
               </div>
          );
     }

     return (
          <div className="p-6 bg-gray-50 min-h-screen">
               {/* Tarjetas superiores */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-6 border-l-4 border-blue-500 shadow-sm">
                         <div className="flex items-start justify-between mb-4">
                              <div className="p-3 bg-blue-100 rounded-xl">
                                   <ClipboardCheck className="w-6 h-6 text-blue-600" />
                              </div>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                   En Curso
                              </span>
                         </div>
                         <p className="text-gray-600 text-sm mb-1">Aulas en Proceso</p>
                         <p className="text-3xl font-bold text-gray-900">
                              {dashboardData.classroomsInProgress}/{dashboardData.totalClassrooms}
                         </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border-l-4 border-red-500 shadow-sm">
                         <div className="flex items-start justify-between mb-4">
                              <div className="p-3 bg-red-100 rounded-xl">
                                   <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                   Pendiente
                              </span>
                         </div>
                         <p className="text-gray-600 text-sm mb-1">Faltas sin Justificar</p>
                         <p className="text-3xl font-bold text-gray-900">{dashboardData.unjustifiedAbsences}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border-l-4 border-yellow-500 shadow-sm">
                         <div className="flex items-start justify-between mb-4">
                              <div className="p-3 bg-yellow-100 rounded-xl">
                                   <Clock className="w-6 h-6 text-yellow-600" />
                              </div>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                   Crítico
                              </span>
                         </div>
                         <p className="text-gray-600 text-sm mb-1">Registros Tardíos</p>
                         <p className="text-3xl font-bold text-gray-900">{dashboardData.lateRecords}</p>
                    </div>
               </div>

               {/* Contenido principal */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Acciones Pendientes */}
                    <div className="lg:col-span-1">
                         <div className="bg-white rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center gap-2 mb-6">
                                   <CheckCircle className="w-5 h-5 text-blue-600" />
                                   <h2 className="text-lg font-semibold text-gray-800">Acciones Pendientes</h2>
                              </div>

                              <div className="space-y-3">
                                   {dashboardData.unjustifiedAbsences > 0 && (
                                        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-red-200 transition-colors cursor-pointer">
                                             <div className="flex items-start justify-between mb-2">
                                                  <p className="font-semibold text-gray-900">Revisar Justificantes</p>
                                                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                       {dashboardData.unjustifiedAbsences} nuevos
                                                  </span>
                                             </div>
                                             <p className="text-sm text-gray-500 mb-3">
                                                  Hay certificados médicos que requieren validación manual.
                                             </p>
                                             <div className="flex items-center text-blue-600 text-sm font-medium">
                                                  <ArrowRight className="w-4 h-4" />
                                             </div>
                                        </div>
                                   )}

                                   {dashboardData.classroomsNotStarted > 0 && (
                                        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-yellow-200 transition-colors cursor-pointer">
                                             <div className="flex items-start justify-between mb-2">
                                                  <p className="font-semibold text-gray-900">Aulas Retrasadas</p>
                                                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                                                       {dashboardData.classroomsNotStarted} aulas
                                                  </span>
                                             </div>
                                             <p className="text-sm text-gray-500 mb-3">
                                                  Sala Amarilla no ha iniciado toma de asistencia (15 min tarde).
                                             </p>
                                             <div className="flex items-center text-blue-600 text-sm font-medium">
                                                  <ArrowRight className="w-4 h-4" />
                                             </div>
                                        </div>
                                   )}

                                   <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                             <p className="font-semibold text-gray-900">Reporte Diario</p>
                                             <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                  Cierra 17:00
                                             </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-3">
                                             Exportación de datos para administración central.
                                        </p>
                                        <div className="flex items-center text-blue-600 text-sm font-medium">
                                             <ArrowRight className="w-4 h-4" />
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Progreso de Asistencia por Aula */}
                    <div className="lg:col-span-2">
                         <div className="bg-white rounded-2xl p-6 shadow-sm">
                              <div className="flex items-center justify-between mb-6">
                                   <h2 className="text-lg font-semibold text-gray-800">Progreso de Asistencia por Aula</h2>
                                   <button 
                                        onClick={() => navigate('/auxiliar/asistencia')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                                   >
                                        Ver detalle completo
                                   </button>
                              </div>

                              <div className="space-y-4">
                                   {dashboardData.classroomProgress.length === 0 ? (
                                        <div className="text-center py-12">
                                             <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                             <p className="text-gray-500 font-medium">Sin registros del día</p>
                                             <p className="text-sm text-gray-400 mt-1">
                                                  {dashboardData.classroomsNotStarted} aulas sin iniciar
                                             </p>
                                        </div>
                                   ) : (
                                        dashboardData.classroomProgress.map((classroom) => {
                                             const getColor = () => {
                                                  if (classroom.percentage >= 90) return { bg: 'bg-green-100', icon: 'text-green-600', bar: 'bg-green-500', text: 'text-green-600' };
                                                  if (classroom.percentage >= 75) return { bg: 'bg-blue-100', icon: 'text-blue-600', bar: 'bg-blue-500', text: 'text-blue-600' };
                                                  if (classroom.percentage >= 50) return { bg: 'bg-yellow-100', icon: 'text-yellow-600', bar: 'bg-yellow-500', text: 'text-yellow-600' };
                                                  return { bg: 'bg-red-100', icon: 'text-red-600', bar: 'bg-red-500', text: 'text-red-600' };
                                             };
                                             const colors = getColor();

                                             return (
                                                  <div
                                                       key={classroom.id}
                                                       onClick={() => navigate(`/auxiliar/asistencia/aula/${classroom.id}`)}
                                                       className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                                                  >
                                                       <div className="flex items-center gap-4 mb-3">
                                                            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                                 <CheckCircle className={`w-6 h-6 ${colors.icon}`} />
                                                            </div>
                                                            <div className="flex-1">
                                                                 <div className="flex items-center justify-between mb-1">
                                                                      <p className="font-semibold text-gray-900">{classroom.name}</p>
                                                                      <span className={`text-sm font-bold ${colors.text}`}>
                                                                           {classroom.percentage}% completo
                                                                      </span>
                                                                 </div>
                                                                 <div className="flex items-center justify-between text-xs text-gray-500">
                                                                      <span>{classroom.withEntryCount} de {classroom.totalStudents} presentes</span>
                                                                      {classroom.lastUpdate && <span>{formatTimeAgo(classroom.lastUpdate)}</span>}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                 className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
                                                                 style={{ width: `${classroom.percentage}%` }}
                                                            />
                                                       </div>
                                                  </div>
                                             );
                                        })
                                   )}
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
}
