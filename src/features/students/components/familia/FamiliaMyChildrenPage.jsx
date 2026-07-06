import { useState, useEffect, useCallback } from "react";
import { Heart, ArrowLeft, Users, RefreshCw } from "lucide-react";
import { Card, Badge, Button } from "@/shared/components/ui";
import { LoadingScreen, alertApiError } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { studentService } from "../../services/studentService";
import { guardianService } from "../../services/guardianService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { STUDENT_STATUS, STUDENT_STATUS_LABELS } from "../../models/studentModel";
import { GUARDIAN_RELATIONSHIPS } from "../../models/guardianModel";
import StudentForm from "../shared/StudentForm";
import GuardianTable from "../shared/GuardianTable";

const STATUS_VARIANT = {
     [STUDENT_STATUS.ACTIVE]: "success",
     [STUDENT_STATUS.INACTIVE]: "danger",
     [STUDENT_STATUS.TRANSFERRED]: "warning",
};

const relationshipMap = Object.fromEntries(
     GUARDIAN_RELATIONSHIPS.map((r) => [r.value, r.label])
);

export default function FamiliaMyChildrenPage() {
     const { user } = useAuth();
     const [children, setChildren] = useState([]);
     const [loading, setLoading] = useState(true);
     const [selectedChild, setSelectedChild] = useState(null);
     const [guardians, setGuardians] = useState([]);
     const [guardiansLoading, setGuardiansLoading] = useState(false);

     const fetchChildren = useCallback(async () => {
          const documentNumber = user?.documentNumber;
          if (!documentNumber) {
               setLoading(false);
               return;
          }
          setLoading(true);
          try {
               const response = await studentService.getMyChildren(documentNumber);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setChildren(Array.isArray(data) ? data : []);
          } catch (err) {
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, [user]);

     useEffect(() => {
          fetchChildren();
     }, [fetchChildren]);

     async function handleSelectChild(child) {
          setSelectedChild(child);
          setGuardiansLoading(true);
          try {
               const response = await guardianService.getByStudent(child.id);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setGuardians(Array.isArray(data) ? data : []);
          } catch (err) {
               alertApiError(err);
          } finally {
               setGuardiansLoading(false);
          }
     }

     if (loading) {
          return <LoadingScreen />;
     }

     if (selectedChild) {
          return (
               <div className="space-y-6">
                    <div className="flex items-center gap-3">
                         <button
                              onClick={() => setSelectedChild(null)}
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                         >
                              <ArrowLeft className="w-5 h-5" />
                         </button>
                         <div className="flex-1">
                              <h1 className="text-xl font-bold text-gray-900">
                                   {`${selectedChild.firstName} ${selectedChild.lastName} ${selectedChild.motherLastName || ""}`.trim()}
                              </h1>
                              <p className="text-sm text-gray-500">Información de mi hijo/a</p>
                         </div>
                         <Badge
                              variant={STATUS_VARIANT[selectedChild.status] || "gray"}
                              size="md"
                              dot
                         >
                              {STUDENT_STATUS_LABELS[selectedChild.status] || selectedChild.status}
                         </Badge>
                    </div>

                    <Card padding="p-6">
                         <StudentForm student={selectedChild} readOnly />
                    </Card>

                    <div className="space-y-4">
                         <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-gray-400" />
                              <h2 className="text-lg font-semibold text-gray-900">Apoderados</h2>
                         </div>
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
                         <div className="p-2.5 bg-rose-100 rounded-xl">
                              <Heart className="w-6 h-6 text-rose-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Mis Hijos</h1>
                              <p className="text-sm text-gray-500">
                                   Información de tus hijos matriculados
                              </p>
                         </div>
                    </div>
                    <Button
                         variant="ghost"
                         size="sm"
                         icon={RefreshCw}
                         onClick={fetchChildren}
                         loading={loading}
                    >
                         Actualizar
                    </Button>
               </div>

               {children.length === 0 ? (
                    <Card padding="p-12">
                         <div className="text-center">
                              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-600 mb-2">
                                   No se encontraron hijos registrados
                              </h3>
                              <p className="text-sm text-gray-400">
                                   Si cree que esto es un error, contacte con la secretaría de su institución.
                              </p>
                         </div>
                    </Card>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {children.map((child) => (
                              <Card
                                   key={child.id}
                                   padding="p-5"
                                   className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                                   onClick={() => handleSelectChild(child)}
                              >
                                   <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                             <span className="text-sm font-bold text-primary-600">
                                                  {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                                             </span>
                                        </div>
                                        <Badge
                                             variant={STATUS_VARIANT[child.status] || "gray"}
                                             size="sm"
                                             dot
                                        >
                                             {STUDENT_STATUS_LABELS[child.status] || child.status}
                                        </Badge>
                                   </div>
                                   <h3 className="font-semibold text-gray-900 mb-1">
                                        {`${child.firstName} ${child.lastName}`.trim()}
                                   </h3>
                                   <p className="text-xs text-gray-500 mb-3">
                                        {child.documentType}: {child.documentNumber}
                                   </p>
                                   <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {child.dateOfBirth && (
                                             <span>
                                                  Nac: {new Date(child.dateOfBirth).toLocaleDateString("es-PE")}
                                             </span>
                                        )}
                                        {child.gender && (
                                             <span>
                                                  {child.gender === "M" ? "Masculino" : "Femenino"}
                                             </span>
                                        )}
                                   </div>
                              </Card>
                         ))}
                    </div>
               )}
          </div>
     );
}
