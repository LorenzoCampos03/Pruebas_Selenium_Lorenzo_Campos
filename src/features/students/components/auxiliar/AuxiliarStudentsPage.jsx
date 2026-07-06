import { useState, useEffect } from "react";
import { GraduationCap, RefreshCw, ArrowLeft, FileDown } from "lucide-react";
import { Button, Card } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { useStudents } from "../../hooks/useStudents";
import { useGuardians } from "../../hooks/useGuardians";
import StudentTable from "../shared/StudentTable";
import StudentForm from "../shared/StudentForm";
import GuardianTable from "../shared/GuardianTable";
import { parseStudentFromApi } from "../../models/studentModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { classroomService } from "../../services/classroomService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import { generateStudentsListReport, generateStudentDetailReport } from "../../services/studentReportService";

export default function AuxiliarStudentsPage() {
     const { user } = useAuth();
     const institutionId = user?.institutionId;

     const { students, loading, fetchByInstitution, fetchAll } = useStudents();
     const { guardians, loading: guardiansLoading, fetchByStudent } = useGuardians();

     const [search, setSearch] = useState("");
     const [detailStudent, setDetailStudent] = useState(null);
     const [institution, setInstitution] = useState({});
     const [classroomMap, setClassroomMap] = useState({});

     useEffect(() => {
          if (institutionId) {
               fetchByInstitution(institutionId);
          } else {
               fetchAll();
          }
     }, [institutionId, fetchByInstitution, fetchAll]);

     useEffect(() => {
          if (!institutionId) return;
          institutionService.getById(institutionId).then((response) => {
               const raw = isSuccessResponse(response) ? extractData(response) : response;
               setInstitution(parseInstitutionFromApi(raw || {}));
          }).catch(() => { });
     }, [institutionId]);

     useEffect(() => {
          if (!institutionId) return;
          classroomService.getByInstitution(institutionId).then((response) => {
               const payload = isSuccessResponse(response) ? extractData(response) : response;
               const list = Array.isArray(payload) ? payload : [];
               const map = {};
               list.forEach((c) => {
                    const name = c.classroomName || c.name || "Aula";
                    const age = c.classroomAge || c.age || "";
                    map[c.id] = age ? `${name} (${age})` : name;
               });
               setClassroomMap(map);
          }).catch(() => { });
     }, [institutionId]);

     useEffect(() => {
          if (detailStudent?.id) {
               fetchByStudent(detailStudent.id);
          }
     }, [detailStudent, fetchByStudent]);

     const filteredStudents = students.filter((s) => {
          if (!search) return true;
          const term = search.toLowerCase();
          const fullName = `${s.firstName} ${s.lastName} ${s.motherLastName}`.toLowerCase();
          return (
               fullName.includes(term) ||
               s.cui?.toLowerCase().includes(term) ||
               s.documentNumber?.toLowerCase().includes(term)
          );
     });

     function handleView(student) {
          setDetailStudent(parseStudentFromApi(student));
     }

     function refreshList() {
          if (institutionId) {
               fetchByInstitution(institutionId);
          } else {
               fetchAll();
          }
     }

     if (loading && students.length === 0) {
          return <LoadingScreen />;
     }

     if (detailStudent) {
          return (
               <div className="space-y-6">
                    <div className="flex items-center gap-3">
                         <button
                              onClick={() => setDetailStudent(null)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                         >
                              <ArrowLeft className="w-5 h-5" />
                         </button>
                         <div className="flex-1">
                              <h1 className="text-xl font-bold text-gray-900">
                                   {`${detailStudent.firstName} ${detailStudent.lastName} ${detailStudent.motherLastName || ""}`.trim()}
                              </h1>
                              <p className="text-sm text-gray-500">Detalle del estudiante</p>
                         </div>
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={FileDown}
                              onClick={() => generateStudentDetailReport({ ...detailStudent, guardians, classroomName: classroomMap[detailStudent.classroomId] || "" }, institution)}
                         >
                              Exportar Ficha
                         </Button>
                    </div>

                    <Card padding="p-6">
                         <StudentForm student={detailStudent} readOnly />
                    </Card>

                    <div className="space-y-4">
                         <h2 className="text-lg font-semibold text-gray-900">Apoderados</h2>
                         <Card padding="p-0">
                              {guardiansLoading ? (
                                   <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                   </div>
                              ) : (
                                   <GuardianTable guardians={guardians} readOnly />
                              )}
                         </Card>
                    </div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-primary-100 rounded-xl">
                              <GraduationCap className="w-6 h-6 text-primary-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Estudiantes</h1>
                              <p className="text-sm text-gray-500">
                                   Consulta de estudiantes
                              </p>
                         </div>
                    </div>
                    <Button
                         variant="ghost"
                         size="sm"
                         icon={RefreshCw}
                         onClick={refreshList}
                         loading={loading}
                    >
                         Actualizar
                    </Button>
                    <Button
                         variant="ghost"
                         size="sm"
                         icon={FileDown}
                         onClick={() => generateStudentsListReport(filteredStudents.map((s) => ({ ...s, classroomName: classroomMap[s.classroomId] || "" })), institution)}
                    >
                         Exportar
                    </Button>
               </div>

               <Card padding="p-4">
                    <SearchInput
                         value={search}
                         onChange={setSearch}
                         placeholder="Buscar por nombre, CUI o documento..."
                    />
               </Card>

               <StudentTable
                    students={filteredStudents}
                    onView={handleView}
                    onEdit={() => { }}
                    onRestore={() => { }}
                    readOnly
               />
          </div>
     );
}
