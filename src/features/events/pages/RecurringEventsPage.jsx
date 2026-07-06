import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, RotateCcw } from "lucide-react";
import { Button, Modal, Input, Select, Badge, Spinner } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { alertSuccess, alertError, alertConfirmDelete, alertConfirmRestore, alertApiError } from "@/shared/components/feedback";
import { recurringEventService } from "../services/recurringEventService";
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS } from "../models/eventModel";

const MONTHS = [
     { value: 1, label: "Enero" },
     { value: 2, label: "Febrero" },
     { value: 3, label: "Marzo" },
     { value: 4, label: "Abril" },
     { value: 5, label: "Mayo" },
     { value: 6, label: "Junio" },
     { value: 7, label: "Julio" },
     { value: 8, label: "Agosto" },
     { value: 9, label: "Septiembre" },
     { value: 10, label: "Octubre" },
     { value: 11, label: "Noviembre" },
     { value: 12, label: "Diciembre" }
];

export default function RecurringEventsPage() {
     const navigate = useNavigate();
     const [templates, setTemplates] = useState([]);
     const [filteredTemplates, setFilteredTemplates] = useState([]);
     const [loading, setLoading] = useState(true);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("ACTIVE");

     // Modal states
     const [modalOpen, setModalOpen] = useState(false);
     const [submitting, setSubmitting] = useState(false);
     const [selectedTemplate, setSelectedTemplate] = useState(null);
     const [formData, setFormData] = useState({
          title: "",
          description: "",
          eventType: "CIVICO",
          month: 1,
          day: 1,
          isHoliday: false,
          affectsClasses: false
     });

     const loadTemplates = useCallback(async () => {
          setLoading(true);
          try {
               const data = await recurringEventService.getAll(statusFilter);
               setTemplates(data || []);
          } catch (error) {
               alertApiError("Error al cargar las fechas recurrentes", error);
          } finally {
               setLoading(false);
          }
     }, [statusFilter]);

     useEffect(() => {
          loadTemplates();
     }, [loadTemplates]);

     useEffect(() => {
          if (!searchTerm) {
               setFilteredTemplates(templates);
          } else {
               const term = searchTerm.toLowerCase();
               setFilteredTemplates(
                    templates.filter(t => {
                         const title = t.title || t.name || "";
                         return title.toLowerCase().includes(term);
                    })
               );
          }
     }, [templates, searchTerm]);

     const handleOpenCreate = () => {
          setSelectedTemplate(null);
          setFormData({
               title: "",
               description: "",
               eventType: "CIVICO",
               month: 1,
               day: 1,
               isHoliday: false,
               affectsClasses: false
          });
          setModalOpen(true);
     };

     const handleOpenEdit = (template) => {
          setSelectedTemplate(template);
          setFormData({
               title: template.title || template.name || "",
               description: template.description || "",
               eventType: template.eventType || "CIVICO",
               month: template.month || 1,
               day: template.day || 1,
               isHoliday: template.isHoliday ?? false,
               affectsClasses: template.affectsClasses ?? false
          });
          setModalOpen(true);
     };

     const handleFormSubmit = async (e) => {
          e.preventDefault();
          if (!formData.title.trim()) {
               alertError("El nombre es requerido");
               return;
          }
          setSubmitting(true);
          try {
               if (selectedTemplate) {
                    await recurringEventService.update(selectedTemplate.id, formData);
                    alertSuccess("Fecha recurrente actualizada exitosamente");
               } else {
                    await recurringEventService.create(formData);
                    alertSuccess("Fecha recurrente creada exitosamente");
               }
               setModalOpen(false);
               loadTemplates();
          } catch (error) {
               alertApiError("Error al guardar la fecha recurrente", error);
          } finally {
               setSubmitting(false);
          }
     };

     const handleDelete = async (id) => {
          const confirmed = await alertConfirmDelete("¿Estás seguro de eliminar esta fecha recurrente?");
          if (!confirmed) return;
          try {
               await recurringEventService.delete(id);
               alertSuccess("Fecha recurrente eliminada exitosamente");
               loadTemplates();
          } catch (error) {
               alertApiError("Error al eliminar la fecha recurrente", error);
          }
     };

     const handleRestore = async (id) => {
          const confirmed = await alertConfirmRestore("¿Estás seguro de restaurar esta fecha recurrente?");
          if (!confirmed) return;
          try {
               await recurringEventService.restore(id);
               alertSuccess("Fecha recurrente restaurada exitosamente");
               loadTemplates();
          } catch (error) {
               alertApiError("Error al restaurar la fecha recurrente", error);
          }
     };

     const getBadgeVariant = (type) => {
          switch (type) {
               case "CIVICO": return "primary";
               case "RELIGIOSO": return "warning";
               case "CULTURAL": return "success";
               case "INSTITUCIONAL": return "info";
               default: return "default";
          }
     };

     return (
          <div className="container mx-auto px-4 py-6">
               {/* Header */}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                         <Button
                              onClick={() => navigate(-1)}
                              variant="outline"
                              size="sm"
                              className="p-2"
                         >
                              <ArrowLeft className="h-5 w-5" />
                         </Button>
                         <div>
                              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                   <Calendar className="h-6 w-6 text-primary-600" />
                                   Configuración de Fechas Recurrentes
                              </h1>
                              <p className="text-sm text-gray-500 mt-1">
                                   Define las fechas cívicas e institucionales anuales para tu institución
                              </p>
                         </div>
                    </div>

                    {statusFilter === "ACTIVE" && (
                         <Button
                              onClick={handleOpenCreate}
                              variant="primary"
                              className="flex items-center gap-2 shadow-lg"
                         >
                              <Plus className="h-4 w-4" />
                              Nueva Fecha Recurrente
                         </Button>
                    )}
               </div>

               {/* Toolbar */}
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="w-full md:w-80">
                         <SearchInput
                              value={searchTerm}
                              onChange={(val) => setSearchTerm(val)}
                              placeholder="Buscar por nombre..."
                         />
                    </div>
                    <div className="w-full md:w-48">
                         <Select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              options={[
                                   { value: "ACTIVE", label: "Activos" },
                                   { value: "INACTIVE", label: "Eliminados" }
                              ]}
                         />
                    </div>
               </div>

               {/* Table / Grid list */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                         <div className="flex flex-col items-center justify-center py-20 gap-4">
                              <Spinner size="lg" />
                              <span className="text-gray-500 font-medium">Cargando fechas...</span>
                         </div>
                    ) : filteredTemplates.length === 0 ? (
                         <div className="text-center py-20 px-4">
                              <p className="text-gray-400 text-lg font-medium">No se encontraron fechas recurrentes</p>
                              <p className="text-gray-500 text-sm mt-1">
                                   Crea una nueva fecha o limpia los filtros para ver resultados
                              </p>
                         </div>
                    ) : (
                         <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                   <thead className="bg-gray-50">
                                        <tr>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                                             <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                             <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                   </thead>
                                   <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTemplates.map((template) => (
                                             <tr key={template.id} className="hover:bg-gray-50/50 transition">
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                       {template.day} de {MONTHS.find(m => m.value === template.month)?.label}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                       {template.title || template.name}
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                       <Badge variant={getBadgeVariant(template.eventType)}>
                                                            {EVENT_TYPE_LABELS[template.eventType] || template.eventType}
                                                       </Badge>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                       <div className="flex justify-end gap-2">
                                                            {statusFilter === "ACTIVE" ? (
                                                                 <>
                                                                      <Button
                                                                           onClick={() => handleOpenEdit(template)}
                                                                           variant="outline"
                                                                           size="sm"
                                                                           className="p-1.5"
                                                                      >
                                                                           <Edit className="h-4 w-4 text-blue-600" />
                                                                      </Button>
                                                                      <Button
                                                                           onClick={() => handleDelete(template.id)}
                                                                           variant="outline"
                                                                           size="sm"
                                                                           className="p-1.5"
                                                                      >
                                                                           <Trash2 className="h-4 w-4 text-red-600" />
                                                                      </Button>
                                                                 </>
                                                            ) : (
                                                                 <Button
                                                                      onClick={() => handleRestore(template.id)}
                                                                      variant="outline"
                                                                      size="sm"
                                                                      className="p-1.5"
                                                                 >
                                                                      <RotateCcw className="h-4 w-4 text-green-600" />
                                                                 </Button>
                                                            )}
                                                       </div>
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>
                    )}
               </div>

               {/* Modal Create/Edit */}
               <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={selectedTemplate ? "Editar Fecha Recurrente" : "Nueva Fecha Recurrente"}
               >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                         <Input
                              label="Nombre de la fecha"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Ej. Aniversario del Colegio"
                              required
                         />

                         <Input
                              label="Descripción"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Ej. Evento institucional"
                         />

                         <Select
                              label="Tipo de Evento"
                              value={formData.eventType}
                              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                              options={EVENT_TYPE_OPTIONS}
                              required
                         />

                         <div className="grid grid-cols-2 gap-4">
                              <Select
                                   label="Mes"
                                   value={formData.month}
                                   onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                   options={MONTHS}
                                   required
                              />

                              <Select
                                   label="Día"
                                   value={formData.day}
                                   onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                                   options={Array.from({ length: 31 }, (_, i) => ({
                                        value: i + 1,
                                        label: String(i + 1)
                                   }))}
                                   required
                              />
                         </div>

                         <div className="grid grid-cols-2 gap-4 p-2 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                   <input
                                        type="checkbox"
                                        checked={formData.isHoliday}
                                        onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded"
                                   />
                                   Es Feriado Nacional
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                   <input
                                        type="checkbox"
                                        checked={formData.affectsClasses}
                                        onChange={(e) => setFormData({ ...formData, affectsClasses: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded"
                                   />
                                   Afecta Clases (Suspensión)
                              </label>
                         </div>

                         <div className="flex justify-end gap-3 mt-6">
                              <Button
                                   type="button"
                                   variant="outline"
                                   onClick={() => setModalOpen(false)}
                                   disabled={submitting}
                              >
                                   Cancelar
                              </Button>
                              <Button
                                   type="submit"
                                   variant="primary"
                                   disabled={submitting}
                              >
                                   {submitting ? "Guardando..." : "Guardar"}
                              </Button>
                         </div>
                    </form>
               </Modal>
          </div>
     );
}
