import { useState, useEffect, useRef } from "react";
import React from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/router";
import { Plus, Brain, RefreshCw, SlidersHorizontal, FileText, ChevronDown, ChevronUp, X, Search, CheckCircle2, XCircle, LayoutList, Calendar, Tag, Clock, FileDown, Loader2, User, Check } from "lucide-react";
import { useAuth } from "../../../core/auth/AuthContext";
import { usePsychology } from "../hooks/usePsychology";
import StatsCards from "../components/StatsCards";
import EvaluationTable from "../components/EvaluationTable";
import EvaluationModal from "../components/EvaluationModal";
import EvaluationForm from "../components/EvaluationForm";
import { usePsychologyReport } from "../hooks/usePsychologyReport";

function Button({ variant = "primary", size = "md", icon: Icon, onClick, loading, children, className = "", active }) {
     const variants = {
          primary: "bg-primary-600 hover:bg-primary-700 text-white",
          ghost: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
          icon: "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 p-2",
          success: "bg-green-600 hover:bg-green-700 text-white",
          warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
     };
     const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };
     const activeClass = active ? "ring-2 ring-offset-1 ring-primary-400" : "";

     return (
          <button
               onClick={onClick}
               disabled={loading}
               className={`rounded-lg font-medium transition-colors flex items-center gap-2 ${variants[variant]} ${sizes[size]} ${loading ? "opacity-50 cursor-not-allowed" : ""} ${activeClass} ${className}`}
          >
               {Icon && <Icon className="w-4 h-4" />}
               {loading ? "Cargando..." : children}
          </button>
     );
}

function Card({ children, padding = "p-4" }) {
     return <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${padding}`}>{children}</div>;
}

function Modal({ isOpen, onClose, title, children, size = "2xl" }) {
     if (!isOpen) return null;
     const sizeClasses = { "2xl": "max-w-2xl" };
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
                    <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                              <h2 className="text-lg font-semibold">{title}</h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                         </div>
                         <div className="p-6">{children}</div>
                    </div>
               </div>
          </div>
     );
}

// Autocomplete search component
function StudentSearchCombobox({ value, onChange, onSelect, students, placeholder }) {
     const [open, setOpen] = useState(false);
     const [inputValue, setInputValue] = useState(value || "");
     const ref = useRef(null);

     const suggestions = students
          .filter(s => {
               const name = `${s.firstName || ""} ${s.lastName || ""}`.trim().toLowerCase();
               return inputValue.trim().length > 0 && name.includes(inputValue.toLowerCase());
          })
          .slice(0, 8);

     useEffect(() => {
          function handleClickOutside(e) {
               if (ref.current && !ref.current.contains(e.target)) setOpen(false);
          }
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
     }, []);

     function handleInput(e) {
          const val = e.target.value;
          setInputValue(val);
          onChange(val);
          setOpen(true);
     }

     function handleSelect(student) {
          const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
          setInputValue(name);
          onChange(name);
          onSelect && onSelect(student);
          setOpen(false);
     }

     function handleClear() {
          setInputValue("");
          onChange("");
          onSelect && onSelect(null);
     }

      const [dropdownStyle, setDropdownStyle] = useState(null);

      useEffect(() => {
           if (!open || !ref.current) { setDropdownStyle(null); return; }
           const r = ref.current.getBoundingClientRect();
           setDropdownStyle({ top: r.bottom + 6, left: r.left, width: r.width, zIndex: 9999 });
      }, [open, suggestions.length]);

      return (
           <div ref={ref} className="relative w-60">
                <div className="relative flex items-center group">
                     <Search className="absolute left-3 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 pointer-events-none transition-colors" />
                     <input
                          type="text"
                          value={inputValue}
                          onChange={handleInput}
                          onFocus={() => inputValue && setOpen(true)}
                          placeholder={placeholder || "Buscar estudiante..."}
                          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white text-sm transition-all placeholder-gray-400"
                     />
                     {inputValue && (
                          <button onClick={handleClear} className="absolute right-2.5 text-gray-300 hover:text-gray-500 transition-colors">
                               <X className="w-3.5 h-3.5" />
                          </button>
                     )}
                </div>
                {open && suggestions.length > 0 && dropdownStyle && ReactDOM.createPortal(
                     <div
                          style={{ position: "fixed", ...dropdownStyle }}
                          className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
                     >
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                               <p className="text-xs text-gray-400 font-medium">Sugerencias</p>
                          </div>
                          {suggestions.map(s => (
                               <button
                                    key={s.id}
                                    onMouseDown={() => handleSelect(s)}
                                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2.5 transition-colors"
                               >
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                         {(s.firstName || "?")[0]}
                                    </div>
                                    {s.firstName} {s.lastName}
                               </button>
                          ))}
                     </div>,
                     document.body
                )}
           </div>
      );
}

// Advanced filters panel
function AdvancedFilters({ filters, onChange, onReset }) {
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
                              <Tag className="w-3 h-3" /> Tipo de evaluación
                         </label>
                         <select
                              value={filters.evaluationType}
                              onChange={e => onChange({ ...filters, evaluationType: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              <option value="">Todos los tipos</option>
                              <option value="INICIAL">Inicial</option>
                              <option value="SEGUIMIENTO">Seguimiento</option>
                              <option value="ESPECIAL">Especial</option>
                              <option value="DERIVACION">Derivación</option>
                         </select>
                    </div>
                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Clock className="w-3 h-3" /> Requiere seguimiento
                         </label>
                         <select
                              value={filters.requiresFollowUp}
                              onChange={e => onChange({ ...filters, requiresFollowUp: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              <option value="">Todos</option>
                              <option value="true">Sí requiere</option>
                              <option value="false">No requiere</option>
                         </select>
                    </div>
                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Calendar className="w-3 h-3" /> Fecha desde
                         </label>
                         <input
                              type="date"
                              value={filters.dateFrom}
                              onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         />
                    </div>
                    <div className="space-y-1">
                         <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Calendar className="w-3 h-3" /> Fecha hasta
                         </label>
                         <input
                              type="date"
                              value={filters.dateTo}
                              onChange={e => onChange({ ...filters, dateTo: e.target.value })}
                              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-400 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         />
                    </div>

               </div>
          </div>
     );
}

const EMPTY_FILTERS = {
     evaluationType: "",
     requiresFollowUp: "",
     dateFrom: "",
     dateTo: "",
};

// statusMode: "active" | "inactive" | "all"
export default function PsychologyPage() {
     const { user, role } = useAuth();
     const navigate = useNavigate();
     const {
           evaluations,
           students,
           institutions,
           loading,
           fetchAll,
          deleteEvaluation,
          restoreEvaluation,
          hardDeleteEvaluation,
     } = usePsychology(user);

      const [search, setSearch] = useState("");
      const [statusMode, setStatusMode] = useState("active");
      const [showAdvanced, setShowAdvanced] = useState(false);
      const [advancedFilters, setAdvancedFilters] = useState(EMPTY_FILTERS);
      const [modalOpen, setModalOpen] = useState(false);
      const [detailModalOpen, setDetailModalOpen] = useState(false);
       const [selectedEvaluation, setSelectedEvaluation] = useState(null);
       const [reportMenuOpen, setReportMenuOpen] = useState(false);
       const [sessionModalOpen, setSessionModalOpen] = useState(false);
       const [selStudent, setSelStudent] = useState(null);
       const [studentSearch, setStudentSearch] = useState("");
       const [selectedSessionIds, setSelectedSessionIds] = useState([]);
       const [selectAll, setSelectAll] = useState(true);
       const { generating, generateGeneral, generateIndividual, generateStudentReport } = usePsychologyReport();

      useEffect(() => {
           fetchAll();
      }, [fetchAll]);

      const activeFilterCount = Object.values(advancedFilters).filter(v => v !== "").length;

     const filteredEvaluations = evaluations.filter((ev) => {
          // Status filter
          if (statusMode === "active" && ev.status !== "ACTIVE") return false;
          if (statusMode === "inactive" && ev.status !== "INACTIVE") return false;
          if (statusMode === "scheduled" && ev.status !== "SCHEDULED") return false;

          // Search by student name
          if (search) {
               const term = search.toLowerCase();
               const studentName = (ev.studentName || "").toLowerCase();
               if (!studentName.includes(term)) return false;
          }

          // Advanced filters
          if (advancedFilters.evaluationType && ev.evaluationType !== advancedFilters.evaluationType) return false;
          if (advancedFilters.requiresFollowUp !== "") {
               const expected = advancedFilters.requiresFollowUp === "true";
               if (ev.requiresFollowUp !== expected) return false;
          }
          if (advancedFilters.dateFrom && ev.evaluationDate && ev.evaluationDate < advancedFilters.dateFrom) return false;
           if (advancedFilters.dateTo && ev.evaluationDate && ev.evaluationDate > advancedFilters.dateTo) return false;

           return true;
     });

     function handleCreate() {
          navigate("/psicologo/evaluaciones/new");
     }

     function handleEdit(evaluation) {
          navigate(`/psicologo/evaluaciones/edit/${evaluation.id}`);
     }

     function handleView(evaluation) {
          navigate(`/psicologo/evaluaciones/view/${evaluation.id}`);
     }

     async function handleDelete(id) {
          await deleteEvaluation(id);
          fetchAll();
     }

     async function handleRestore(id) {
          await restoreEvaluation(id);
          fetchAll();
     }

     function handleStartScheduled(evaluation) {
          // Navegar a la página de edición con un flag especial para iniciar sesión
          navigate(`/psicologo/evaluaciones/edit/${evaluation.id}?startSession=true`);
     }

     async function handleHardDelete(id) {
          await hardDeleteEvaluation(id);
          fetchAll();
     }

     if (loading && evaluations.length === 0) {
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
                         <div className="p-3 bg-primary-100 rounded-xl">
                              <Brain className="w-6 h-6 text-primary-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Evaluaciones Psicológicas</h1>
                              <p className="text-sm text-gray-500">Sistema integral de gestión psicológica estudiantil</p>
                         </div>
                    </div>
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                         Nueva Evaluación
                    </Button>
               </div>

               {/* Tabs */}
               <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                         <button className="border-b-2 border-primary-500 py-3 px-1 text-sm font-medium text-primary-600">
                              Evaluaciones Psicológicas
                         </button>
                         <button
                              onClick={() => navigate(ROUTES.PSICOLOGO.ATENCIONES)}
                              className="border-b-2 border-transparent py-3 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                         >
                              Área de Soporte Especial
                         </button>
                    </nav>
               </div>

               <StatsCards evaluations={evaluations} />

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
                                   Activas
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
                                   Inactivas
                              </button>
                              <button
                                   onClick={() => setStatusMode("scheduled")}
                                   className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        statusMode === "scheduled"
                                             ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                                             : "text-gray-500 hover:text-gray-700"
                                   }`}
                              >
                                   <Calendar className={`w-3.5 h-3.5 ${statusMode === "scheduled" ? "text-blue-500" : "text-gray-400"}`} />
                                   Programadas
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

                           {/* Autocomplete search */}
                           <StudentSearchCombobox
                                value={search}
                                onChange={setSearch}
                                onSelect={(student) => {
                                     if (student) setSearch(`${student.firstName} ${student.lastName}`.trim());
                                }}
                                students={students}
                                placeholder="Buscar estudiante..."
                           />

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
                                 {/* Report button with dropdown */}
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
                                           {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                                           {generating ? "Generando..." : "Reporte"}
                                           <ChevronDown className={`w-3 h-3 transition-transform ${reportMenuOpen ? "rotate-180" : ""}`} />
                                      </button>
                                      {reportMenuOpen && (
                                           <>
                                                <div className="fixed inset-0 z-40" onClick={() => setReportMenuOpen(false)} />
                                                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                                     <button
                                                          onClick={() => {
                                                               setReportMenuOpen(false);
                                                               const inst = institutions.find(i => String(i.id) === String(user?.institutionId))
                                                                    || (filteredEvaluations[0] && institutions.find(i => String(i.id) === String(filteredEvaluations[0].institutionId)))
                                                                    || null;
                                                               generateGeneral(filteredEvaluations, inst);
                                                          }}
                                                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                     >
                                                          <FileText className="w-4 h-4 text-gray-500" />
                                                          <div>
                                                               <p className="font-medium">Reporte general</p>
                                                               <p className="text-xs text-gray-400">Todas las evaluaciones filtradas</p>
                                                          </div>
                                                     </button>
                                                     <div className="border-t border-gray-100" />
                                                     <button
                                                          onClick={() => {
                                                               setReportMenuOpen(false);
                                                               setSelStudent(null);
                                                               setStudentSearch("");
                                                               setSelectedSessionIds([]);
                                                               setSelectAll(true);
                                                               setSessionModalOpen(true);
                                                          }}
                                                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                     >
                                                          <User className="w-4 h-4 text-gray-500" />
                                                          <div>
                                                               <p className="font-medium">Reporte por estudiante</p>
                                                               <p className="text-xs text-gray-400">Selecciona estudiante y sesiones</p>
                                                          </div>
                                                     </button>
                                                </div>
                                           </>
                                      )}
                                 </div>
                               {/* Results count pill */}
                               <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium">
                                    <FileText className="w-3.5 h-3.5" />
                                    {filteredEvaluations.length} resultado{filteredEvaluations.length !== 1 ? "s" : ""}
                               </span>
                               <button
                                    onClick={fetchAll}
                                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                               onReset={() => setAdvancedFilters(EMPTY_FILTERS)}
                          />
                     )}
               </div>

               {/* Results */}
               <div>
                    {filteredEvaluations.length === 0 ? (
                         <Card padding="p-12">
                              <div className="text-center">
                                   <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                   </div>
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones</h3>
                                   <p className="text-sm text-gray-500 mb-6">Comienza creando tu primera evaluación psicológica.</p>
                                   <Button variant="primary" onClick={handleCreate}>Crear primera evaluación</Button>
                              </div>
                         </Card>
                    ) : (
                          <EvaluationTable
                               evaluations={filteredEvaluations}
                               onView={handleView}
                               onEdit={handleEdit}
                               onDelete={handleDelete}
                               onRestore={handleRestore}
                               onHardDelete={handleHardDelete}
                               onStartScheduled={handleStartScheduled}
                               userRole={role}
                               onPdfExport={(evaluation) => {
                                    const inst = institutions.find(i => String(i.id) === String(evaluation.institutionId))
                                         || institutions.find(i => String(i.id) === String(user?.institutionId))
                                         || null;
                                    generateIndividual(evaluation, inst);
                               }}
                          />
                    )}
               </div>

                <EvaluationModal
                     isOpen={modalOpen}
                     onClose={() => setModalOpen(false)}
                     evaluation={selectedEvaluation}
                />

                 <Modal
                     isOpen={detailModalOpen}
                     onClose={() => setDetailModalOpen(false)}
                     title="Detalles de la Evaluación"
                     size="2xl"
                >
                     <EvaluationForm
                          evaluation={selectedEvaluation}
                          onChange={() => {}}
                          readOnly
                     />
                </Modal>

                {/* Session selector modal for student report */}
                <Modal isOpen={sessionModalOpen} onClose={() => setSessionModalOpen(false)} title="Reporte por estudiante" size="2xl">
                     <div className="space-y-5">
                          {/* Student search */}
                          <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1.5 text-gray-400" />
                                    Seleccionar estudiante
                               </label>
                               <StudentSearchCombobox
                                    value={studentSearch}
                                    onChange={(val) => {
                                         setStudentSearch(val);
                                         if (!val) { setSelStudent(null); setSelectedSessionIds([]); }
                                    }}
                                    onSelect={(student) => {
                                         if (student) {
                                              setStudentSearch(`${student.firstName} ${student.lastName}`.trim());
                                              setSelStudent(student);
                                              const studentEvs = evaluations.filter(e => String(e.studentId) === String(student.id));
                                              setSelectedSessionIds(studentEvs.map(e => e.id));
                                              setSelectAll(true);
                                         }
                                    }}
                                    students={students}
                                    placeholder="Buscar estudiante..."
                               />
                          </div>

                          {selStudent && (
                               <>
                                    {/* Student info card */}
                                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-4">
                                         <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm">
                                                   {(selStudent.firstName || "?")[0]}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                   <h3 className="text-base font-bold text-gray-900 truncate">{selStudent.firstName} {selStudent.lastName}</h3>
                                                   <div className="flex items-center gap-3 mt-1">
                                                        {selStudent.documentNumber && (
                                                             <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                                                  {selStudent.documentNumber}
                                                             </span>
                                                        )}
                                                        <span className="text-xs text-gray-500">
                                                             {evaluations.filter(e => String(e.studentId) === String(selStudent.id)).length} sesiones
                                                        </span>
                                                   </div>
                                              </div>
                                              <button
                                                   onClick={() => { setSelStudent(null); setStudentSearch(""); setSelectedSessionIds([]); }}
                                                   className="text-xs font-semibold text-gray-400 hover:text-red-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-all flex-shrink-0"
                                              >
                                                   Cambiar
                                              </button>
                                         </div>
                                    </div>

                                    {/* Session list */}
                                    <div>
                                         <div className="flex items-center justify-between mb-3">
                                              <h4 className="text-sm font-semibold text-gray-700">
                                                   Seleccionar sesiones
                                                   <span className="ml-2 text-xs font-normal text-gray-400">({selectedSessionIds.length} seleccionadas)</span>
                                              </h4>
                                              <button
                                                   onClick={() => {
                                                        if (selectAll) {
                                                             setSelectedSessionIds([]);
                                                             setSelectAll(false);
                                                        } else {
                                                             const allIds = evaluations.filter(e => String(e.studentId) === String(selStudent.id)).map(e => e.id);
                                                             setSelectedSessionIds(allIds);
                                                             setSelectAll(true);
                                                        }
                                                   }}
                                                   className="text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 px-2.5 py-1 rounded-lg hover:bg-primary-100 transition-colors"
                                              >
                                                   {selectAll ? "Deseleccionar todo" : "Seleccionar todo"}
                                              </button>
                                         </div>
                                         <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                                              {evaluations
                                                   .filter(e => String(e.studentId) === String(selStudent.id))
                                                   .sort((a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate))
                                                   .map((ev, idx) => {
                                                        const checked = selectedSessionIds.includes(ev.id);
                                                        const typeColors = {
                                                             INICIAL: "bg-blue-100 text-blue-700",
                                                             SEGUIMIENTO: "bg-purple-100 text-purple-700",
                                                             ESPECIAL: "bg-amber-100 text-amber-700",
                                                             DERIVACION: "bg-red-100 text-red-700",
                                                        };
                                                        const tc = typeColors[ev.evaluationType] || "bg-gray-100 text-gray-700";
                                                         return (
                                                              <label
                                                                   key={ev.id}
                                                                   onClick={() => {
                                                                        const newSelected = checked
                                                                             ? selectedSessionIds.filter(id => id !== ev.id)
                                                                             : [...selectedSessionIds, ev.id];
                                                                        setSelectedSessionIds(newSelected);
                                                                        if (checked) setSelectAll(false);
                                                                   }}
                                                                   className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                                        checked ? "bg-primary-50/70" : "hover:bg-gray-50"
                                                                   }`}
                                                              >
                                                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                       checked ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                                                                  }`}>
                                                                       {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                                                  </div>
                                                                  <span className="text-xs font-bold text-gray-400 w-7 text-center flex-shrink-0">#{idx + 1}</span>
                                                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                                                       <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tc} flex-shrink-0`}>{ev.evaluationType}</span>
                                                                       <span className="text-sm text-gray-600">{new Date(ev.evaluationDate).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                                  </div>
                                                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                                       ev.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                                                  }`}>
                                                                       {ev.status === "ACTIVE" ? "Activa" : "Inactiva"}
                                                                  </span>
                                                             </label>
                                                        );
                                                   })}
                                         </div>
                                    </div>

                                    {/* Generate button */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                         <p className="text-xs text-gray-400">
                                              {selectedSessionIds.length} de {evaluations.filter(e => String(e.studentId) === String(selStudent.id)).length} sesiones seleccionadas
                                         </p>
                                         <div className="flex gap-2">
                                              <button
                                                   onClick={() => setSessionModalOpen(false)}
                                                   className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                              >
                                                   Cancelar
                                              </button>
                                              <button
                                                   onClick={() => {
                                                        const inst = institutions.find(i => String(i.id) === String(user?.institutionId)) || null;
                                                        const selectedEvs = evaluations.filter(e => selectedSessionIds.includes(e.id));
                                                        generateStudentReport(selectedEvs, inst);
                                                        setSessionModalOpen(false);
                                                   }}
                                                   disabled={selectedSessionIds.length === 0 || generating}
                                                   className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                   {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                                   {generating ? "Generando..." : `Generar reporte (${selectedSessionIds.length})`}
                                              </button>
                                         </div>
                                    </div>
                               </>
                          )}
                     </div>
                </Modal>
            </div>
      );
}