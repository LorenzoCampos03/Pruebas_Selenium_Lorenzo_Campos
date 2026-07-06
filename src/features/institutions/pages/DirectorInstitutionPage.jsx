import { useState, useEffect } from "react";
import { Plus, GraduationCap, RefreshCw, FileDown } from "lucide-react";
import { Button, Card } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen, alertSuccess, alertError, alertApiError } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { useInstitution } from "../hooks/useInstitution";
import { useClassrooms } from "../hooks/useClassrooms";
import InstitutionProfile from "../components/director/InstitutionProfile";
import ClassroomTable from "../components/director/ClassroomTable";
import ClassroomModal from "../components/director/ClassroomModal";
import { classroomReportService } from "../services/classroomReportService";
import { storage } from "@/core/utils/storage";

export default function DirectorInstitutionPage() {
     const { user, role } = useAuth();
     const institutionId = user?.institutionId;

     const {
          institution,
          loading: loadingInst,
          fetchById,
          updateInstitution,
     } = useInstitution();

     const {
          classrooms,
          loading: loadingClassrooms,
          fetchAll: fetchClassrooms,
          createClassroom,
          updateClassroom,
          toggleStatus: toggleClassroomStatus,
     } = useClassrooms(institutionId);

     const [activeTab, setActiveTab] = useState("profile");
     const [classroomSearch, setClassroomSearch] = useState("");
     const [classroomModalOpen, setClassroomModalOpen] = useState(false);
     const [selectedClassroom, setSelectedClassroom] = useState(null);
     const [reporting, setReporting] = useState(false);

     useEffect(() => {
          if (institutionId) {
               fetchById(institutionId);
               fetchClassrooms();
          }
     }, [institutionId, fetchById, fetchClassrooms]);

     const filteredClassrooms = classrooms.filter((c) => {
          if (!classroomSearch) return true;
          const term = classroomSearch.toLowerCase();
          return (
               c.name?.toLowerCase().includes(term) ||
               c.age?.toLowerCase().includes(term)
          );
     });

     function handleCreateClassroom() {
          setSelectedClassroom(null);
          setClassroomModalOpen(true);
     }

     function handleEditClassroom(classroom) {
          setSelectedClassroom(classroom);
          setClassroomModalOpen(true);
     }

     async function handleSaveClassroom(id, data) {
          if (id) {
               await updateClassroom(id, data);
          } else {
               await createClassroom(data);
          }
          setClassroomModalOpen(false);
          fetchClassrooms();
     }

     async function handleToggleClassroomStatus(classroom) {
          await toggleClassroomStatus(classroom.id, classroom.status);
          fetchClassrooms();
     }

     async function handleUpdateInstitution(id, data) {
          await updateInstitution(id, data);
          storage.remove("sigei_institution_cache");
          window.location.reload();
     }

     async function handleGenerateClassroomReport() {
          if (!filteredClassrooms.length) {
               alertError("No hay aulas para generar reporte con los filtros actuales");
               return;
          }

          try {
               setReporting(true);

               const directorName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";

               const reportPayload = {
                    classrooms: filteredClassrooms,
                    institution: {
                         ...institution,
                         directorName: institution.directorName || directorName,
                    },
               };

               await classroomReportService.generatePdfReport(reportPayload);
               alertSuccess("Reporte de aulas generado correctamente");
          } catch (error) {
               alertApiError(error);
          } finally {
               setReporting(false);
          }
     }

     if (loadingInst && !institution) {
          return <LoadingScreen />;
     }

     if (!institutionId) {
          return (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-gray-500 text-sm">
                         No se encontró una institución asociada a su cuenta.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                         Contacte al administrador del sistema.
                    </p>
               </div>
          );
     }

     const tabs = [
          { key: "profile", label: "Perfil Institucional" },
          { key: "classrooms", label: "Aulas" },
     ];

     return (
          <div className="space-y-6">
               <div className="border-b border-gray-200">
                    <nav className="flex gap-6">
                         {tabs.map((tab) => (
                              <button
                                   key={tab.key}
                                   onClick={() => setActiveTab(tab.key)}
                                   className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                                        activeTab === tab.key
                                             ? "border-primary-600 text-primary-600"
                                             : "border-transparent text-gray-500 hover:text-gray-700"
                                   }`}
                              >
                                   {tab.label}
                              </button>
                         ))}
                    </nav>
               </div>

               {activeTab === "profile" && (
                    <InstitutionProfile
                         institution={institution}
                         role={role}
                         onUpdate={handleUpdateInstitution}
                         loading={loadingInst}
                    />
               )}

               {activeTab === "classrooms" && (
                    <div className="space-y-6">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center gap-3">
                                   <div className="p-2.5 bg-indigo-100 rounded-xl">
                                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                                   </div>
                                   <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                             Gestión de Aulas
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                             Administra las aulas de tu institución
                                        </p>
                                   </div>
                              </div>
                              <div className="flex items-center gap-2">
                                   <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={RefreshCw}
                                        onClick={fetchClassrooms}
                                        loading={loadingClassrooms}
                                   >
                                        Actualizar
                                   </Button>
                                   <Button
                                        variant="outline"
                                        size="sm"
                                        icon={FileDown}
                                        onClick={handleGenerateClassroomReport}
                                        loading={reporting}
                                        disabled={reporting || !filteredClassrooms.length}
                                   >
                                        Reporte
                                   </Button>
                                   <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={handleCreateClassroom}
                                   >
                                        Nueva Aula
                                   </Button>
                              </div>
                         </div>

                         <Card padding="p-4">
                              <SearchInput
                                   value={classroomSearch}
                                   onChange={setClassroomSearch}
                                   placeholder="Buscar por nombre o sección..."
                              />
                         </Card>

                         <ClassroomTable
                              classrooms={filteredClassrooms}
                              onEdit={handleEditClassroom}
                              onToggleStatus={handleToggleClassroomStatus}
                         />

                         <ClassroomModal
                              isOpen={classroomModalOpen}
                              onClose={() => setClassroomModalOpen(false)}
                              classroom={selectedClassroom}
                              onSave={handleSaveClassroom}
                         />
                    </div>
               )}
          </div>
     );
}
