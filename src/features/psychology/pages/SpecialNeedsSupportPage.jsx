import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Heart, RefreshCw, SlidersHorizontal, FileText, ChevronDown, ChevronUp, X, CheckCircle2, XCircle, LayoutList, Calendar, Building2, School, Clock, Tag, FileDown, Loader2 } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useSpecialNeedsSupport } from "../hooks/useSpecialNeedsSupport";
import { useSpecialNeedsSupportReport } from "../hooks/useSpecialNeedsSupportReport";
import SpecialNeedsSupportTable from "../components/SpecialNeedsSupportTable";
import MessageModal from "@/shared/components/ui/MessageModal";
import { ROUTES } from "@/router";

function Button({ variant = "primary", size = "md", icon: Icon, onClick, loading, children, className = "" }) {
     const variants = {
          primary: "bg-primary-600 hover:bg-primary-700 text-white",
          ghost: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
          icon: "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 p-2",
     };
     const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };

     return (
          <button
               onClick={onClick}
               disabled={loading}
               className={`rounded-lg font-medium transition-colors flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
          >
               {Icon && <Icon className="w-4 h-4" />}
               {loading ? "Cargando..." : children}
          </button>
     );
}

function Card({ children, padding = "p-4" }) {
     return <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${padding}`}>{children}</div>;
}

// Special Needs Stats cards
function SupportStatsCards({ supports = [] }) {
     const total = supports.length;
     const active = supports.filter(s => s.status === "ACTIVE").length;
     const inactive = total - active;

     // Calculate supports with upcoming review dates (next 30 days)
     const now = new Date();
     const next30Days = new Date();
     next30Days.setDate(now.getDate() + 30);
     const upcomingReviews = supports.filter(s => {
          if (!s.nextReviewDate) return false;
          const reviewDate = new Date(s.nextReviewDate);
          return s.status === "ACTIVE" && reviewDate >= now && reviewDate <= next30Days;
     }).length;

     return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                         <Heart className="w-6 h-6" />
                    </div>
                    <div>
                         <p className="text-2xl font-bold text-gray-900">{total}</p>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Soportes</p>
                    </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                         <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                         <p className="text-2xl font-bold text-gray-900">{active}</p>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wider font-semibold">Casos Activos</p>
                    </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                         <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                         <p className="text-2xl font-bold text-gray-900">{inactive}</p>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Casos Inactivos</p>
                    </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                         <Clock className="w-6 h-6" />
                    </div>
                    <div>
                         <p className="text-2xl font-bold text-gray-900">{upcomingReviews}</p>
                         <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Revisiones (30 días)</p>
                    </div>
               </div>
          </div>
     );
}

// Advanced filters panel
function AdvancedFilters({ filters, onChange, institutions, classrooms, onReset }) {
     const hasFilters = Object.values(filters).some(v => v !== "");
     return (
          <div className="mt-4 pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtros avanzados</p>
                    {hasFilters && (
                         <button
                              onClick={onReset}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                         >
                              <X className="w-3 h-3" />
                              Limpiar todo
                         </button>
                    )}
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Tag className="w-3 h-3" /> Tipo de Soporte
                         </label>
                         <select
                              value={filters.supportType}
                              onChange={e => onChange({ ...filters, supportType: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all text-gray-700"
                         >
                              <option value="">Todos los tipos</option>
                              <option value="COGNITIVO">Cognitivo</option>
                              <option value="MOTOR">Motor</option>
                              <option value="SENSORIAL">Sensorial</option>
                              <option value="EMOCIONAL">Emocional</option>
                              <option value="LENGUAJE">Lenguaje</option>
                              <option value="CONDUCTUAL">Conductual</option>
                         </select>
                    </div>

                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Building2 className="w-3 h-3" /> Institución
                         </label>
                         <select
                              value={filters.institutionId}
                              onChange={e => onChange({ ...filters, institutionId: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all text-gray-700"
                         >
                              <option value="">Todas las instituciones</option>
                              {institutions.map(i => (
                                   <option key={i.id} value={String(i.id)}>{i.name}</option>
                              ))}
                         </select>
                    </div>

                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <School className="w-3 h-3" /> Aula
                         </label>
                         <select
                              value={filters.classroomId}
                              onChange={e => onChange({ ...filters, classroomId: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all text-gray-700"
                         >
                              <option value="">Todas las aulas</option>
                              {classrooms.map(c => (
                                   <option key={c.id} value={String(c.id)}>{c.classroomName}</option>
                              ))}
                         </select>
                    </div>

                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Calendar className="w-3 h-3" /> Año académico
                         </label>
                         <input
                              type="number"
                              value={filters.academicYear}
                              onChange={e => onChange({ ...filters, academicYear: e.target.value })}
                              placeholder="Ej: 2026"
                              min="2000"
                              max="2100"
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all text-gray-700"
                         />
                    </div>
               </div>
          </div>
     );
}

const EMPTY_FILTERS = {
     supportType: "",
     institutionId: "",
     classroomId: "",
     academicYear: "",
};

export default function SpecialNeedsSupportPage() {
     const { user, role } = useAuth();
     const navigate = useNavigate();
     const location = useLocation();
     const {
          supports,
          students,
          institutions,
          classrooms,
          loading,
          fetchAll,
          deleteSupport,
          restoreSupport,
          hardDeleteSupport,
     } = useSpecialNeedsSupport(user);

     const [search, setSearch] = useState("");
     const [statusMode, setStatusMode] = useState("active");
     const [showAdvanced, setShowAdvanced] = useState(false);
     const [advancedFilters, setAdvancedFilters] = useState(EMPTY_FILTERS);
     const [reportMenuOpen, setReportMenuOpen] = useState(false);
     const [showPendingReviews, setShowPendingReviews] = useState(false);

     const { generating, generateGeneral, generateSummary } = useSpecialNeedsSupportReport();

     // Si viene de guardar un soporte con próxima revisión, activar vista de revisiones pendientes
     useEffect(() => {
          const params = new URLSearchParams(location.search);
          if (params.get("tab") === "revisiones") {
               setShowPendingReviews(true);
          }
     }, [location.search]);

     const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
     const [selectedSupportForMessage, setSelectedSupportForMessage] = useState(null);

     useEffect(() => {
          fetchAll();
     }, [fetchAll]);

     const activeFilterCount = Object.values(advancedFilters).filter(v => v !== "").length;

     const now = new Date();
     const next30 = new Date(); next30.setDate(now.getDate() + 30);

     const pendingReviews = supports.filter(s => {
          if (!s.nextReviewDate || s.status !== "ACTIVE") return false;
          return new Date(s.nextReviewDate) <= next30;
     }).sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));

     const filteredSupports = (showPendingReviews ? pendingReviews : supports).filter((sup) => {
          // Status filter
          if (statusMode === "active" && sup.status !== "ACTIVE") return false;
          if (statusMode === "inactive" && sup.status !== "INACTIVE") return false;

          // Search by student name
          if (search) {
               const term = search.toLowerCase();
               const studentName = (sup.studentName || "").toLowerCase();
               if (!studentName.includes(term)) return false;
          }

          // Advanced filters
          if (advancedFilters.supportType && sup.supportType !== advancedFilters.supportType) return false;
          if (advancedFilters.institutionId && String(sup.institutionId) !== advancedFilters.institutionId) return false;
          if (advancedFilters.classroomId && String(sup.classroomId) !== advancedFilters.classroomId) return false;
          if (advancedFilters.academicYear && String(sup.academicYear) !== advancedFilters.academicYear) return false;

          return true;
     });

     function handleCreate() {
          navigate("/psicologo/atenciones/new");
     }

     function handleEdit(support) {
          navigate(`/psicologo/atenciones/edit/${support.id}`);
     }

     function handleView(support) {
          navigate(`/psicologo/atenciones/view/${support.id}`);
     }

     function handleMessage(support) {
          setSelectedSupportForMessage(support);
          setIsMessageModalOpen(true);
     }

     async function handleDelete(id) {
          await deleteSupport(id);
          fetchAll();
     }

     async function handleRestore(id) {
          await restoreSupport(id);
          fetchAll();
     }

     async function handleHardDelete(id) {
          await hardDeleteSupport(id);
          fetchAll();
     }

     if (loading && supports.length === 0) {
          return (
               <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
               </div>
          );
     }

     return (
          <div className="space-y-6 p-6">
               {/* Header */}
               <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="p-3 bg-emerald-100 rounded-xl">
                              <Heart className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Soporte de Necesidades Especiales</h1>
                              <p className="text-sm text-gray-500">Módulo de gestión y acompañamiento psicopedagógico diferenciado</p>
                         </div>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                         Registrar Soporte
                    </Button>
               </div>

               {/* Tabs - Replicating Navigation Standard */}
               <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                         <button 
                              onClick={() => navigate(ROUTES.PSICOLOGO.EVALUACIONES)}
                              className="border-b-2 border-transparent py-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                         >
                              Evaluaciones Psicológicas
                         </button>
                         <button 
                              className="border-b-2 border-primary-500 py-3 px-1 text-sm font-medium text-primary-600 transition-colors font-semibold"
                         >
                              Área de Soporte Especial
                         </button>
                    </nav>
               </div>

               <SupportStatsCards supports={supports} />

               {/* Banner de revisiones pendientes */}
               {pendingReviews.length > 0 && (
                    <button
                         onClick={() => setShowPendingReviews(v => !v)}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                              showPendingReviews
                                   ? "bg-amber-50 border-amber-300 text-amber-800"
                                   : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
                         }`}
                    >
                         <Clock className={`w-4 h-4 flex-shrink-0 ${showPendingReviews ? "text-amber-600" : "text-amber-500"}`} />
                         <span className="text-sm font-semibold">
                              {pendingReviews.length} revisión{pendingReviews.length !== 1 ? "es" : ""} pendiente{pendingReviews.length !== 1 ? "s" : ""} en los próximos 30 días
                         </span>
                         <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
                              showPendingReviews ? "bg-amber-200 text-amber-800" : "bg-amber-100 text-amber-700"
                         }`}>
                              {showPendingReviews ? "Ver todos" : "Ver revisiones"}
                         </span>
                    </button>
               )}

               {/* Toolbar */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                         {/* Status pills */}
                         <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                              <button
                                   onClick={() => setStatusMode("active")}
                                   className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        statusMode === "active"
                                             ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
                                             : "text-gray-500 hover:text-gray-700"
                                   }`}
                              >
                                   <CheckCircle2 className={`w-3.5 h-3.5 ${statusMode === "active" ? "text-emerald-500" : "text-gray-400"}`} />
                                   Activos
                              </button>
                              <button
                                   onClick={() => setStatusMode("inactive")}
                                   className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        statusMode === "inactive"
                                             ? "bg-white text-red-600 shadow-sm border border-red-100"
                                             : "text-gray-500 hover:text-gray-700"
                                   }`}
                              >
                                   <XCircle className={`w-3.5 h-3.5 ${statusMode === "inactive" ? "text-red-400" : "text-gray-400"}`} />
                                   Inactivos
                              </button>
                              <button
                                   onClick={() => setStatusMode("all")}
                                   className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        statusMode === "all"
                                             ? "bg-white text-primary-700 shadow-sm border border-primary-100"
                                             : "text-gray-500 hover:text-gray-700"
                                   }`}
                              >
                                   <LayoutList className={`w-3.5 h-3.5 ${statusMode === "all" ? "text-primary-500" : "text-gray-400"}`} />
                                   Todos
                              </button>
                         </div>

                         {/* Divider */}
                         <div className="h-6 w-px bg-gray-200" />

                         {/* Simple student text search */}
                         <div className="relative">
                              <input
                                   type="text"
                                   value={search}
                                   onChange={(e) => setSearch(e.target.value)}
                                   placeholder="Buscar por estudiante..."
                                   className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white text-sm transition-all placeholder-gray-400 w-60 text-gray-700"
                              />
                              {search && (
                                   <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="w-3.5 h-3.5" />
                                   </button>
                              )}
                         </div>

                         {/* Advanced filters toggle */}
                         <button
                              onClick={() => setShowAdvanced(v => !v)}
                              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                                   showAdvanced || activeFilterCount > 0
                                        ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600"
                              }`}
                         >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              Filtros
                              {activeFilterCount > 0 && (
                                   <span className="bg-white text-primary-600 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                        {activeFilterCount}
                                   </span>
                              )}
                              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                         </button>

                         <div className="ml-auto flex items-center gap-2">
                              {/* Dropdown de reportes */}
                              <div className="relative">
                                   <button
                                        onClick={() => setReportMenuOpen(v => !v)}
                                        disabled={generating}
                                        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                             reportMenuOpen
                                                  ? "bg-primary-600 text-white border-primary-600"
                                                  : "bg-white text-gray-600 border-gray-200 hover:text-primary-600 hover:border-primary-300"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                   >
                                        {generating
                                             ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                             : <FileDown className="w-3.5 h-3.5" />}
                                        {generating ? "Generando..." : "Reporte"}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${reportMenuOpen ? "rotate-180" : ""}`} />
                                   </button>

                                   {reportMenuOpen && (
                                        <>
                                             <div className="fixed inset-0 z-40" onClick={() => setReportMenuOpen(false)} />
                                             <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                                  <button
                                                       onClick={() => {
                                                            setReportMenuOpen(false);
                                                            const inst =
                                                                 institutions.find(i => String(i.id) === String(user?.institutionId)) ||
                                                                 (filteredSupports[0] && institutions.find(i => String(i.id) === String(filteredSupports[0].institutionId))) ||
                                                                 null;
                                                            generateGeneral(filteredSupports, inst);
                                                       }}
                                                       className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                  >
                                                       <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                                                       <div>
                                                            <p className="font-medium">Reporte general</p>
                                                            <p className="text-xs text-gray-400">Fichas completas filtradas</p>
                                                       </div>
                                                  </button>
                                                  <div className="border-t border-gray-100" />
                                                  <button
                                                       onClick={() => {
                                                            setReportMenuOpen(false);
                                                            const inst =
                                                                 institutions.find(i => String(i.id) === String(user?.institutionId)) ||
                                                                 (filteredSupports[0] && institutions.find(i => String(i.id) === String(filteredSupports[0].institutionId))) ||
                                                                 null;
                                                            generateSummary(filteredSupports, inst);
                                                       }}
                                                       className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                  >
                                                       <FileDown className="w-4 h-4 text-gray-500 shrink-0" />
                                                       <div>
                                                            <p className="font-medium">Reporte resumen</p>
                                                            <p className="text-xs text-gray-400">Tabla consolidada por estudiante</p>
                                                       </div>
                                                  </button>
                                             </div>
                                        </>
                                   )}
                              </div>

                              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium">
                                   <FileText className="w-3.5 h-3.5" />
                                   {filteredSupports.length} resultado{filteredSupports.length !== 1 ? "s" : ""}
                              </span>
                              <button
                                   onClick={fetchAll}
                                   className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all"
                                   title="Actualizar"
                              >
                                   <RefreshCw className="w-4 h-4" />
                              </button>
                         </div>
                    </div>

                    {/* Advanced filters panel */}
                    {showAdvanced && (
                         <AdvancedFilters
                              filters={advancedFilters}
                              onChange={setAdvancedFilters}
                              institutions={institutions}
                              classrooms={classrooms}
                              onReset={() => setAdvancedFilters(EMPTY_FILTERS)}
                         />
                    )}
               </div>

               {/* Table Results */}
               <div>
                    {filteredSupports.length === 0 ? (
                         <Card padding="p-12">
                              <div className="text-center">
                                   <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <Heart className="w-8 h-8 text-gray-400" />
                                   </div>
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">No hay soportes especiales</h3>
                                   <p className="text-sm text-gray-500 mb-6">Comienza registrando tu primer soporte de necesidades especiales.</p>
                                   <Button variant="primary" onClick={handleCreate}>Registrar primer soporte</Button>
                              </div>
                         </Card>
                    ) : (
                         <SpecialNeedsSupportTable
                              supports={filteredSupports}
                              onView={handleView}
                              onEdit={handleEdit}
                              onMessage={handleMessage}
                              onDelete={handleDelete}
                              onRestore={handleRestore}
                              onHardDelete={handleHardDelete}
                              userRole={role}
                         />
                    )}
               </div>

               {/* Modal de Mensaje */}
               <MessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => {
                         setIsMessageModalOpen(false);
                         setSelectedSupportForMessage(null);
                    }}
                    eventData={
                         selectedSupportForMessage
                              ? {
                                     eventType: "INSTITUCIONAL",
                                     title: `Plan de Soporte para ${selectedSupportForMessage.studentName}`,
                                     startDate: new Date().toISOString(),
                                }
                              : null
                    }
                    institutionId={user?.institutionId}
                    whatsappConnected={true} // Asumimos true o se debe obtener del contexto/backend
               />
          </div>
     );
}
