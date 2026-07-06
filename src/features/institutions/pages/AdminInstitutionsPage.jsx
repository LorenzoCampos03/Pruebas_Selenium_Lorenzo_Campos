import { useState, useEffect } from "react";
import { Plus, Building2, RefreshCw, FileDown } from "lucide-react";
import { Button, Card, Modal } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen, alertSuccess, alertError, alertApiError } from "@/shared/components/feedback";
import { useInstitutions } from "../hooks/useInstitutions";
import InstitutionTable from "../components/admin/InstitutionTable";
import AdminInstitutionModal from "../components/admin/AdminInstitutionModal";
import InstitutionForm from "../components/shared/InstitutionForm";
import InstitutionAvatar from "../components/shared/InstitutionAvatar";
import { ROLES } from "@/core/utils/constants";
import { alertConfirmUpdate } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { institutionReportService } from "../services/institutionReportService";

export default function AdminInstitutionsPage() {
     const { user } = useAuth();
     const {
          institutions,
          loading,
          fetchAll,
          createInstitution,
          updateInstitution,
          toggleStatus,
     } = useInstitutions();

     const [search, setSearch] = useState("");
     const [modalOpen, setModalOpen] = useState(false);
     const [detailModalOpen, setDetailModalOpen] = useState(false);
     const [selectedInstitution, setSelectedInstitution] = useState(null);
     const [reporting, setReporting] = useState(false);

     useEffect(() => {
          fetchAll();
     }, [fetchAll]);

     const filteredInstitutions = institutions.filter((inst) => {
          if (!search) return true;
          const term = search.toLowerCase();
          return (
               inst.name?.toLowerCase().includes(term) ||
               inst.modularCode?.toLowerCase().includes(term) ||
               inst.director?.toLowerCase().includes(term)
          );
     });

     function handleCreate() {
          setSelectedInstitution(null);
          setModalOpen(true);
     }

     function handleEdit(institution) {
          setSelectedInstitution(institution);
          setModalOpen(true);
     }

     function handleView(institution) {
          setSelectedInstitution(institution);
          setDetailModalOpen(true);
     }

     async function handleSave(id, data) {
          if (id) {
               const confirm = await alertConfirmUpdate("institución");
               if (!confirm.isConfirmed) return;
               await updateInstitution(id, data);
               fetchAll();
          } else {
               const res = await createInstitution(data);
               return res;
          }
     }

     async function handleToggleStatus(institution) {
          await toggleStatus(institution.id, institution.status);
          fetchAll();
     }

     async function handleGenerateReport() {
          if (!filteredInstitutions.length) {
               alertError("No hay instituciones para generar reporte con los filtros actuales");
               return;
          }

          try {
               setReporting(true);

               const reportPayload = {
                    institutions: filteredInstitutions,
               };

               await institutionReportService.generatePdfReport(reportPayload);
               alertSuccess("Reporte de instituciones generado correctamente");
          } catch (error) {
               alertApiError(error);
          } finally {
               setReporting(false);
          }
     }

     if (loading && institutions.length === 0) {
          return <LoadingScreen />;
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-primary-100 rounded-xl">
                              <Building2 className="w-6 h-6 text-primary-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Instituciones</h1>
                              <p className="text-sm text-gray-500">
                                   Gestiona las instituciones educativas del sistema
                              </p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={RefreshCw}
                              onClick={fetchAll}
                              loading={loading}
                         >
                              Actualizar
                         </Button>
                         <Button
                              variant="outline"
                              size="sm"
                              icon={FileDown}
                              onClick={handleGenerateReport}
                              loading={reporting}
                              disabled={reporting || !filteredInstitutions.length}
                         >
                              Reporte
                         </Button>
                         <Button
                              variant="primary"
                              icon={Plus}
                              onClick={handleCreate}
                         >
                              Agregar Institución
                         </Button>
                    </div>
               </div>

               {/* Search */}
               <Card padding="p-4">
                    <SearchInput
                         value={search}
                         onChange={setSearch}
                         placeholder="Buscar por nombre, código modular o director..."
                    />
               </Card>

               {/* Table */}
               <InstitutionTable
                    institutions={filteredInstitutions}
                    onView={handleView}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
               />

               {/* Create/Edit Modal */}
                <AdminInstitutionModal
                     isOpen={modalOpen}
                     onClose={() => setModalOpen(false)}
                     institution={selectedInstitution}
                     onSave={handleSave}
                     institutions={institutions}
                     onRefresh={fetchAll}
                />

               {/* Detail View Modal */}
               <Modal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    title="Detalles de la Institución"
                    size="xl"
               >
                    {selectedInstitution && (
                         <Card padding="p-4" className="mb-4">
                              <div className="flex items-center gap-4">
                                   <InstitutionAvatar
                                        logoUrl={selectedInstitution.logoUrl}
                                        name={selectedInstitution.name}
                                        colorInstitution={selectedInstitution.colorInstitution}
                                        size="md"
                                   />
                                   <div>
                                        <h3 className="text-base font-bold text-gray-900">{selectedInstitution.name}</h3>
                                        <p className="text-xs text-gray-500">
                                             Código: {selectedInstitution.modularCode || "-"}
                                        </p>
                                   </div>
                              </div>
                         </Card>
                    )}
                    <InstitutionForm
                         institution={selectedInstitution}
                         role={ROLES.ADMINISTRADOR}
                         readOnly
                    />
               </Modal>
          </div>
     );
}
