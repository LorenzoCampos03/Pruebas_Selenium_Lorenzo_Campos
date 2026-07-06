import { useState, useEffect, useRef } from "react";
import { 
  Plus, Edit, Trash2, RefreshCw, Bell, Search, AlertCircle, 
  Check, X, FileCode, CheckCircle, XCircle 
} from "lucide-react";
import { Button, Card } from "@/shared/components/ui";
import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";
import toast from "react-hot-toast";

const NOTIFICATION_TYPES = [
  { value: "ATTENDANCE_ABSENT", label: "Falta de Asistencia" },
  { value: "ATTENDANCE_LATE", label: "Tardanza de Asistencia" },
  { value: "ATTENDANCE_DAILY_SUMMARY", label: "Resumen Diario de Asistencia" },
  { value: "GRADES_REPORT_CARD", label: "Libreta de Notas Publicada" },
  { value: "GRADES_EVALUATION", label: "Nueva Evaluación Registrada" },
  { value: "INCIDENT_CREATED", label: "Incidente Disciplinario Reportado" },
  { value: "INCIDENT_RESOLVED", label: "Incidente Disciplinario Resuelto" },
  { value: "BEHAVIOR_ALERT", label: "Alerta de Comportamiento" },
  { value: "PSYCHOLOGY_EVALUATION", label: "Evaluación Psicología Completada" },
  { value: "PSYCHOLOGY_FOLLOW_UP", label: "Seguimiento Psicología Pendiente" },
  { value: "ENROLLMENT_CONFIRMED", label: "Matrícula Confirmada" },
  { value: "ENROLLMENT_PERIOD_OPEN", label: "Período de Matrícula Abierto" },
  { value: "ANNOUNCEMENT", label: "Comunicado General Institucional" },
  { value: "EVENT_REMINDER", label: "Recordatorio de Evento Cívico/Escolar" },
  { value: "CUSTOM", label: "Mensaje Personalizado de Sistema" },
];

const TYPE_BASE_KEYS = {
  ATTENDANCE_ABSENT: "attendance.absent",
  ATTENDANCE_LATE: "attendance.late",
  ATTENDANCE_DAILY_SUMMARY: "attendance.daily_summary",
  GRADES_REPORT_CARD: "grades.report_card",
  GRADES_EVALUATION: "grades.evaluation",
  INCIDENT_CREATED: "incident.created",
  INCIDENT_RESOLVED: "incident.resolved",
  BEHAVIOR_ALERT: "behavior.alert",
  PSYCHOLOGY_EVALUATION: "psychology.evaluation",
  PSYCHOLOGY_FOLLOW_UP: "psychology.follow_up",
  ENROLLMENT_CONFIRMED: "enrollment.confirmed",
  ENROLLMENT_PERIOD_OPEN: "enrollment.period_open",
  ANNOUNCEMENT: "announcement",
  EVENT_REMINDER: "event_reminder",
  CUSTOM: "custom"
};

const VAR_MAP_EN_TO_ES = {
  studentName: "nombreEstudiante",
  studentLastName: "apellidoEstudiante",
  guardianName: "nombreApoderado",
  courseName: "nombreCurso",
  classroomName: "nombreAula",
  teacherName: "nombreDocente",
  evaluationName: "nombreEvaluacion",
  score: "puntajeNota",
  date: "fecha",
  time: "hora",
  incidentType: "tipoIncidente",
  incidentDescription: "descripcionIncidente",
  severityLevel: "nivelGravedad",
  actionTaken: "accionTomada",
  periodName: "nombrePeriodo",
  announcementTitle: "tituloComunicado",
  announcementBody: "cuerpoComunicado",
  eventName: "nombreEvento",
  eventDate: "fechaEvento",
  scheduleTime: "horario",
  reason: "motivo",
  link: "enlace",
  institutionName: "nombreInstitucion"
};

const VAR_MAP_ES_TO_EN = Object.fromEntries(
  Object.entries(VAR_MAP_EN_TO_ES).map(([en, es]) => [es, en])
);

function translateEnToFriendly(text) {
  if (!text) return "";
  let result = text;
  for (const [en, es] of Object.entries(VAR_MAP_EN_TO_ES)) {
    const variable = SUGGESTED_VARIABLES.find(v => v.value === es);
    const friendlyLabel = variable ? variable.label : es;
    result = result.replaceAll(`{{${en}}}`, `(${friendlyLabel})`);
  }
  return result;
}

function translateFriendlyToEn(text) {
  if (!text) return "";
  let result = text;
  for (const [en, es] of Object.entries(VAR_MAP_EN_TO_ES)) {
    const variable = SUGGESTED_VARIABLES.find(v => v.value === es);
    const friendlyLabel = variable ? variable.label : es;
    result = result.replaceAll(`(${friendlyLabel})`, `{{${en}}}`);
    result = result.replaceAll(`(${es})`, `{{${en}}}`);
    result = result.replaceAll(`{{${es}}}`, `{{${en}}}`);
    result = result.replaceAll(`{{${en}}}`, `{{${en}}}`);
  }
  return result;
}

const SUGGESTED_VARIABLES = [
  { value: "nombreEstudiante", label: "Nombre del Estudiante" },
  { value: "apellidoEstudiante", label: "Apellido del Estudiante" },
  { value: "nombreApoderado", label: "Nombre del Apoderado" },
  { value: "nombreCurso", label: "Nombre del Curso" },
  { value: "nombreAula", label: "Nombre de Aula" },
  { value: "nombreDocente", label: "Nombre del Docente" },
  { value: "nombreEvaluacion", label: "Nombre de la Evaluación" },
  { value: "puntajeNota", label: "Calificación/Nota" },
  { value: "fecha", label: "Fecha" },
  { value: "hora", label: "Hora" },
  { value: "tipoIncidente", label: "Tipo de Incidente" },
  { value: "descripcionIncidente", label: "Detalle del Incidente" },
  { value: "nivelGravedad", label: "Gravedad de Falta" },
  { value: "accionTomada", label: "Acción Correctiva" },
  { value: "nombrePeriodo", label: "Periodo Académico" },
  { value: "tituloComunicado", label: "Título del Comunicado" },
  { value: "cuerpoComunicado", label: "Cuerpo del Comunicado" },
  { value: "nombreEvento", label: "Nombre del Evento" },
  { value: "fechaEvento", label: "Fecha del Evento" },
  { value: "horario", label: "Horario" },
  { value: "motivo", label: "Motivo" },
  { value: "enlace", label: "Enlace Web" },
  { value: "nombreInstitucion", label: "Nombre de Institución" }
];

const VARIABLES_BY_TYPE = {
  ATTENDANCE_ABSENT: ["nombreEstudiante", "apellidoEstudiante", "fecha", "hora", "nombreAula"],
  ATTENDANCE_LATE: ["nombreEstudiante", "apellidoEstudiante", "fecha", "hora", "nombreAula"],
  ATTENDANCE_DAILY_SUMMARY: ["fecha", "nombreAula"],
  GRADES_REPORT_CARD: ["nombreEstudiante", "apellidoEstudiante", "nombrePeriodo", "fecha"],
  GRADES_EVALUATION: ["nombreEstudiante", "apellidoEstudiante", "nombreCurso", "nombreEvaluacion", "puntajeNota", "nombrePeriodo", "fecha"],
  INCIDENT_CREATED: ["nombreEstudiante", "apellidoEstudiante", "tipoIncidente", "descripcionIncidente", "nivelGravedad", "accionTomada", "motivo", "enlace", "fecha", "hora"],
  INCIDENT_RESOLVED: ["nombreEstudiante", "apellidoEstudiante", "tipoIncidente", "descripcionIncidente", "nivelGravedad", "accionTomada", "motivo", "enlace", "fecha", "hora"],
  BEHAVIOR_ALERT: ["nombreEstudiante", "apellidoEstudiante", "tipoIncidente", "descripcionIncidente", "nivelGravedad", "accionTomada", "motivo", "enlace", "fecha", "hora"],
  PSYCHOLOGY_EVALUATION: ["nombreEstudiante", "apellidoEstudiante", "fecha", "hora", "enlace"],
  PSYCHOLOGY_FOLLOW_UP: ["nombreEstudiante", "apellidoEstudiante", "fecha", "hora", "enlace"],
  ENROLLMENT_CONFIRMED: ["nombreEstudiante", "apellidoEstudiante", "nombrePeriodo", "fecha"],
  ENROLLMENT_PERIOD_OPEN: ["nombrePeriodo", "fecha"],
  ANNOUNCEMENT: ["tituloComunicado", "cuerpoComunicado", "fecha"],
  EVENT_REMINDER: ["nombreEvento", "fechaEvento", "horario", "motivo"],
  CUSTOM: []
};

export default function TemplatesAdminPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [templateKey, setTemplateKey] = useState("");
  const [keySuffix, setKeySuffix] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState(NOTIFICATION_TYPES[0].value);
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef(null);

  const [dynamicVariables, setDynamicVariables] = useState([]);

  useEffect(() => {
    if (!type) return;
    
    let isMounted = true;
    apiClient.get(ENDPOINTS.TEMPLATES.VARIABLES_BY_TYPE(type))
      .then(response => {
        if (!isMounted) return;
        const data = response.data?.data || response.data || [];
        const mapped = data.map(item => ({
          value: item.label, // "nombreEstudiante" (Spanish key)
          label: item.description // "Nombre del Estudiante" (Friendly label)
        }));
        setDynamicVariables(mapped);
      })
      .catch(() => {
        if (!isMounted) return;
        // Fallback to static variables by type
        const allowedKeys = VARIABLES_BY_TYPE[type] || [];
        const fallback = SUGGESTED_VARIABLES.filter(v => allowedKeys.includes(v.value));
        setDynamicVariables(fallback);
      });
      
    return () => { isMounted = false; };
  }, [type]);

  const commonKeys = ["nombreApoderado", "nombreInstitucion"];
  const commonSuggested = SUGGESTED_VARIABLES.filter(v => commonKeys.includes(v.value));
  
  const filteredSuggestedVariables = type === "CUSTOM"
    ? SUGGESTED_VARIABLES
    : [
        ...dynamicVariables,
        ...commonSuggested.filter(c => !dynamicVariables.some(d => d.value === c.value))
      ];

  async function fetchTemplates() {
    setLoading(true);
    try {
      const response = await apiClient.get(ENDPOINTS.TEMPLATES.BASE);
      const data = response.data?.data || response.data || [];
      const translatedData = (Array.isArray(data) ? data : []).map(t => ({
        ...t,
        bodyTemplate: translateEnToFriendly(t.bodyTemplate),
        variables: (t.variables || []).map(v => VAR_MAP_EN_TO_ES[v] || v)
      }));
      setTemplates(translatedData);
    } catch (error) {
      toast.error("No se pudieron cargar las plantillas de notificación.");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  function handleOpenCreate() {
    setIsEditing(false);
    setSelectedTemplate(null);
    setTemplateKey("");
    setKeySuffix("");
    setName("");
    setType(NOTIFICATION_TYPES[0].value);
    setBodyTemplate("");
    setStatus("ACTIVE");
    setModalOpen(true);
  }

  function handleOpenEdit(template) {
    setIsEditing(true);
    setSelectedTemplate(template);
    setTemplateKey(template.templateKey);
    setKeySuffix("");
    setName(template.name);
    setType(template.type);
    setBodyTemplate(template.bodyTemplate);
    setStatus(template.status || "ACTIVE");
    setModalOpen(true);
  }

  function handleInsertVariable(variable) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = bodyTemplate;
    const sugVar = SUGGESTED_VARIABLES.find(v => v.value === variable);
    const friendlyLabel = sugVar ? sugVar.label : variable;
    const variableText = `(${friendlyLabel})`;
    
    const newText = text.substring(0, startPos) + variableText + text.substring(endPos, text.length);
    setBodyTemplate(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + variableText.length;
      textarea.selectionEnd = startPos + variableText.length;
    }, 50);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const finalKey = isEditing 
      ? templateKey 
      : (keySuffix.trim() ? `${TYPE_BASE_KEYS[type]}.${keySuffix.trim()}` : TYPE_BASE_KEYS[type]);

    if (!name || !finalKey || !bodyTemplate) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setSaving(true);
    
    const backendBodyTemplate = translateFriendlyToEn(bodyTemplate);

    // Auto-detect variables from the translated backend body template (anything between {{ }})
    const variablesList = [];
    const regex = /\{\{(.*?)\}\}/g;
    let match;
    while ((match = regex.exec(backendBodyTemplate)) !== null) {
      const varName = match[1].trim();
      if (varName && !variablesList.includes(varName)) {
        variablesList.push(varName);
      }
    }

    const payload = {
      templateKey: finalKey,
      name,
      type,
      bodyTemplate: backendBodyTemplate,
      variables: variablesList,
      status
    };

    try {
      if (isEditing) {
        await apiClient.put(ENDPOINTS.TEMPLATES.BY_ID(selectedTemplate.id), payload);
        toast.success("Plantilla actualizada con éxito.");
      } else {
        await apiClient.post(ENDPOINTS.TEMPLATES.BASE, payload);
        toast.success("Plantilla creada con éxito.");
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Ocurrió un error al guardar la plantilla.";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la plantilla "${template.name}"?`)) {
      return;
    }
    try {
      await apiClient.delete(ENDPOINTS.TEMPLATES.BY_ID(template.id));
      toast.success("Plantilla eliminada con éxito.");
      fetchTemplates();
    } catch (error) {
      toast.error("No se pudo eliminar la plantilla.");
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.templateKey?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-100 rounded-xl">
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Plantillas Globales de Notificación</h1>
            <p className="text-sm text-gray-500">Administración técnica y mapeo de eventos de mensajería</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" icon={RefreshCw} onClick={fetchTemplates} loading={loading}>
            Actualizar
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Crear Plantilla
          </Button>
        </div>
      </div>

      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o clave técnica..."
          className="w-full bg-transparent focus:outline-none text-sm text-gray-800"
        />
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No se encontraron plantillas</p>
          <p className="text-xs text-gray-400 mt-1">Intenta con otro filtro o crea una plantilla nueva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const typeLabel = NOTIFICATION_TYPES.find(t => t.value === template.type)?.label || template.type;
            const isGlobal = template.institutionId === null || template.institutionId === "";
            return (
              <Card key={template.id} padding="p-5" className="relative flex flex-col justify-between group hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{template.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${template.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {template.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                        {isGlobal && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">{template.templateKey}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(template)} 
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(template)} 
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 mb-4 text-xs text-gray-600 font-mono whitespace-pre-wrap line-clamp-4 relative">
                    {template.bodyTemplate}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {template.variables && template.variables.map((v) => {
                      const friendlyName = SUGGESTED_VARIABLES.find(sv => sv.value === v)?.label || v;
                      return (
                        <span key={v} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full" title={`{{${v}}}`}>
                          {friendlyName}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <FileCode className="w-3.5 h-3.5 text-gray-400" />
                    <span>Tipo: {typeLabel}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? "Editar Plantilla Global" : "Nueva Plantilla Global"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Clave Técnica *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      disabled
                      value={templateKey}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none bg-gray-50 text-gray-400 font-mono"
                    />
                  ) : (
                    <div className="flex items-center border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm bg-gray-50 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 focus-within:bg-white transition-all font-mono">
                      <span className="text-gray-800 bg-gray-200/75 select-none mr-2 px-2.5 py-1 rounded-lg border border-gray-300/60 font-semibold text-xs shrink-0">
                        {TYPE_BASE_KEYS[type]}.
                      </span>
                      <input
                        type="text"
                        value={keySuffix}
                        onChange={(e) => setKeySuffix(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="sufijo (ej. formal)"
                        className="w-full bg-transparent focus:outline-none py-1"
                      />
                    </div>
                  )}
                  {!isEditing && (
                    <span className="text-[9px] text-gray-400 block mt-1">
                      Final: {TYPE_BASE_KEYS[type]}{keySuffix ? `.${keySuffix}` : ""}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nombre del Evento *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Alerta de Inasistencia"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tipo de Evento Notificación *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                >
                  {NOTIFICATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Insertar Variable Dinámica (Sugeridas)
                </label>
                <span className="text-[10px] text-gray-400 block mb-2">
                  Haz clic en una variable para insertarla en la posición del cursor dentro del mensaje.
                </span>
                <div className="flex flex-wrap gap-2 p-3.5 bg-gray-50 border border-gray-150 rounded-xl max-h-[120px] overflow-y-auto">
                  {filteredSuggestedVariables.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => handleInsertVariable(v.value)}
                      className="text-xs font-semibold bg-white hover:bg-primary-50 hover:text-primary-600 border border-gray-200 hover:border-primary-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
                      title={`Inserta {{${v.value}}}`}
                    >
                      <span className="text-primary-500 font-bold text-sm">+</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Cuerpo del Mensaje (Soporta Markdown) *
                </label>
                <textarea
                  ref={textareaRef}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  placeholder={`ej. 🏫 *(Nombre de Institución)*\n\nEstimado/a *(Nombre del Apoderado)*,\nLe informamos que su hijo/a *(Nombre del Estudiante)*...`}
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 font-mono"
                  required
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Estado de la Plantilla *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("ACTIVE")}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        status === "ACTIVE"
                          ? "bg-green-50 border-green-300 text-green-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Activo (ACTIVE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("INACTIVE")}
                      className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        status === "INACTIVE"
                          ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      Inactivo (INACTIVE)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {saving ? "Guardando..." : "Guardar Plantilla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
