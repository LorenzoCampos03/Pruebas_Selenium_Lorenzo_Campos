import { useState, useEffect, useRef } from "react";
import { 
  Bell, RefreshCw, AlertCircle, Save, Info, Check, X, 
  MessageSquare, Edit2, Play, CheckCircle, Smartphone
} from "lucide-react";
import { Button, Card, WhatsAppQRModal } from "@/shared/components/ui";
import { useAuth } from "@/core/auth/AuthContext";
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
  { value: "CUSTOM", label: "Mensaje Personalizado" },
];

// Helper to render text with WhatsApp-like formatting (*bold*, _italics_, {{variables}})
function formatWhatsAppText(text) {
  if (!text) return "";
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold *text*
  formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  // Italics _text_
  formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>");
  // Strikethrough ~text~
  formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>");
  // Newlines
  formatted = formatted.replace(/\n/g, "<br/>");
  // Variables {{variable}}
  formatted = formatted.replace(/\{\{(.*?)\}\}/g, '<span class="bg-blue-100/80 text-blue-700 font-semibold px-1 py-0.5 rounded font-mono text-[11px] border border-blue-200/50">$1</span>');

  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

const CATEGORIES = [
  { id: "ALL", label: "Todas", icon: Bell },
  { id: "ATTENDANCE", label: "Asistencia", icon: CheckCircle },
  { id: "GRADES", label: "Calificaciones", icon: Edit2 },
  { id: "DISCIPLINE", label: "Disciplina", icon: AlertCircle },
  { id: "PSYCHOLOGY", label: "Psicología", icon: Info },
  { id: "ENROLLMENT", label: "Matrícula", icon: Save },
  { id: "GENERAL", label: "Comunicados", icon: MessageSquare }
];

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
    const label = FRIENDLY_VARIABLES[es] || es;
    result = result.replaceAll(`{{${en}}}`, `(${label})`);
  }
  return result;
}

function translateFriendlyToEn(text) {
  if (!text) return "";
  let result = text;
  for (const [en, es] of Object.entries(VAR_MAP_EN_TO_ES)) {
    const label = FRIENDLY_VARIABLES[es] || es;
    result = result.replaceAll(`(${label})`, `{{${en}}}`);
    result = result.replaceAll(`(${es})`, `{{${en}}}`);
    result = result.replaceAll(`{{${es}}}`, `{{${en}}}`);
    result = result.replaceAll(`{{${en}}}`, `{{${en}}}`);
  }
  return result;
}

const SAMPLE_VARIABLES = {
  nombreEstudiante: "Juan Diego Pérez",
  apellidoEstudiante: "Pérez Maldonado",
  nombreApoderado: "Sra. María Elena Pérez",
  nombreCurso: "Álgebra y Geometría",
  nombreAula: "4to de Secundaria - A",
  nombreDocente: "Prof. Alejandro Ruiz",
  nombreEvaluacion: "Prácticas Calificadas II",
  puntajeNota: "18/20",
  fecha: "25 de Mayo de 2026",
  hora: "08:15 AM",
  tipoIncidente: "Falta injustificada a clase",
  descripcionIncidente: "El alumno se retiró del aula de clases antes del término de la sesión sin autorización.",
  nivelGravedad: "Leve",
  accionTomada: "Citación a los padres para el día de mañana a las 9:00 AM",
  nombrePeriodo: "I Trimestre 2026",
  tituloComunicado: "Reunión General de Padres de Familia",
  cuerpoComunicado: "Se les convoca a la reunión de carácter urgente para coordinar las actividades del aniversario.",
  nombreEvento: "Día de la Madre - Actuación Central",
  fechaEvento: "29 de Mayo",
  horario: "10:30 AM",
  motivo: "Uso indebido de celular en clase",
  enlace: "https://sigei.edu.pe/incidencia/102",
  nombreInstitucion: "I.E. Valle Grande"
};

const FRIENDLY_VARIABLES = {
  nombreEstudiante: "Nombre del estudiante",
  apellidoEstudiante: "Apellido del estudiante",
  nombreApoderado: "Nombre del apoderado",
  nombreCurso: "Nombre del curso",
  nombreAula: "Nombre del aula/sección",
  nombreDocente: "Nombre del docente",
  nombreEvaluacion: "Nombre de la evaluación",
  puntajeNota: "Calificación/Puntaje",
  fecha: "Fecha del evento",
  hora: "Hora del evento",
  tipoIncidente: "Tipo de incidente",
  descripcionIncidente: "Descripción de la falta",
  nivelGravedad: "Nivel de gravedad",
  accionTomada: "Acción correctiva tomada",
  nombrePeriodo: "Período académico",
  tituloComunicado: "Título del comunicado",
  cuerpoComunicado: "Contenido del comunicado",
  nombreEvento: "Nombre del evento",
  fechaEvento: "Fecha del evento",
  horario: "Horario programado",
  motivo: "Motivo del evento",
  enlace: "Enlace web de seguimiento",
  nombreInstitucion: "Nombre del colegio"
};

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

function getTemplateCategory(type) {
  if (!type) return "GENERAL";
  if (type.startsWith("ATTENDANCE")) return "ATTENDANCE";
  if (type.startsWith("GRADES")) return "GRADES";
  if (type.startsWith("INCIDENT") || type === "BEHAVIOR_ALERT") return "DISCIPLINE";
  if (type.startsWith("PSYCHOLOGY")) return "PSYCHOLOGY";
  if (type.startsWith("ENROLLMENT")) return "ENROLLMENT";
  return "GENERAL";
}

function compileTemplateForPreview(templateBody) {
  if (!templateBody) return "";
  let compiled = templateBody;
  for (const [key, value] of Object.entries(SAMPLE_VARIABLES)) {
    const label = FRIENDLY_VARIABLES[key] || key;
    compiled = compiled.replaceAll(`(${label})`, value);
    compiled = compiled.replaceAll(`(${key})`, value);
    compiled = compiled.replaceAll(`{{${key}}}`, value);
  }
  return compiled;
}

export default function NotificationsInstitutionPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // WhatsApp connection states
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Editor states
  const [editBody, setEditBody] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const textareaRef = useRef(null);

  const [allowedVariables, setAllowedVariables] = useState([]);

  useEffect(() => {
    if (!selectedTemplate?.type) {
      setAllowedVariables([]);
      return;
    }
    
    let isMounted = true;
    apiClient.get(ENDPOINTS.TEMPLATES.VARIABLES_BY_TYPE(selectedTemplate.type))
      .then(response => {
        if (!isMounted) return;
        const data = response.data?.data || response.data || [];
        const mapped = data.map(item => item.label);
        setAllowedVariables(mapped);
      })
      .catch(() => {
        if (!isMounted) return;
        const allowed = VARIABLES_BY_TYPE[selectedTemplate.type] || [];
        setAllowedVariables(allowed);
      });
      
    return () => { isMounted = false; };
  }, [selectedTemplate?.type]);

  const commonKeys = ["nombreApoderado", "nombreInstitucion"];
  const filteredSuggestedVariables = selectedTemplate?.type === "CUSTOM"
    ? Object.keys(FRIENDLY_VARIABLES)
    : [
        ...allowedVariables,
        ...commonKeys.filter(c => !allowedVariables.includes(c))
      ];

  async function checkWhatsappStatus() {
    if (!user?.institutionId) return;
    try {
      const response = await apiClient.get(ENDPOINTS.WHATSAPP.STATUS(user.institutionId));
      const statusData = response.data?.data || response.data;
      if (statusData?.instance?.state === "open" || statusData?.instance?.connectionStatus === "CONNECTED") {
        setWhatsappConnected(true);
      } else {
        setWhatsappConnected(false);
      }
    } catch {
      setWhatsappConnected(false);
    }
  }

  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!user?.institutionId) return;
    if (!window.confirm("¿Estás seguro de que deseas desvincular el número de WhatsApp de esta institución?")) return;
    
    setDisconnecting(true);
    try {
      await apiClient.delete(ENDPOINTS.WHATSAPP.DISCONNECT(user.institutionId));
      toast.success("WhatsApp desvinculado de tu institución.");
      setWhatsappConnected(false);
    } catch {
      toast.error("No se pudo desvincular la cuenta de WhatsApp.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function fetchTemplates() {
    if (!user?.institutionId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(ENDPOINTS.TEMPLATES.BY_INSTITUTION(user.institutionId));
      const data = response.data?.data || response.data || [];
      const translatedData = (Array.isArray(data) ? data : []).map(t => ({
        ...t,
        bodyTemplate: translateEnToFriendly(t.bodyTemplate),
        variables: (t.variables || []).map(v => VAR_MAP_EN_TO_ES[v] || v)
      }));
      setTemplates(translatedData);
      
      // Auto-select first template if none selected
      if (translatedData.length > 0 && !selectedTemplate) {
        handleSelectTemplate(translatedData[0]);
      } else if (selectedTemplate) {
        const updated = translatedData.find(t => t.templateKey === selectedTemplate.templateKey);
        if (updated) handleSelectTemplate(updated);
      }
    } catch (error) {
      toast.error("No se pudieron cargar las plantillas de la institución.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
    checkWhatsappStatus();
  }, [user?.institutionId]);

  function handleSelectTemplate(template) {
    setSelectedTemplate(template);
  }

  async function handleToggleStatus(template, checked) {
    const statusVal = checked ? "ACTIVE" : "INACTIVE";
    try {
      await apiClient.post(
        ENDPOINTS.TEMPLATES.SAVE_OVERRIDE(template.templateKey, user.institutionId),
        {
          bodyTemplate: translateFriendlyToEn(template.bodyTemplate),
          status: statusVal
        }
      );
      toast.success(`Notificación ${checked ? 'habilitada' : 'deshabilitada'} con éxito.`);
      fetchTemplates();
      // Update local state for selection too
      if (selectedTemplate && selectedTemplate.templateKey === template.templateKey) {
        setSelectedTemplate(prev => prev ? { ...prev, status: statusVal } : null);
      }
    } catch {
      toast.error("No se pudo cambiar el estado de la notificación.");
    }
  }

  function handleOpenEdit() {
    setEditBody(selectedTemplate.bodyTemplate);
    setEditModalOpen(true);
  }

  function handleInsertVariable(variable) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = editBody;
    const label = FRIENDLY_VARIABLES[variable] || variable;
    const variableText = `(${label})`;
    
    const newText = text.substring(0, startPos) + variableText + text.substring(endPos, text.length);
    setEditBody(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + variableText.length;
      textarea.selectionEnd = startPos + variableText.length;
    }, 50);
  }

  async function handleResetToDefault() {
    if (!window.confirm("¿Estás seguro de que deseas restablecer este mensaje al diseño predeterminado del administrador? Se borrarán tus cambios de redacción.")) return;
    
    setSaving(true);
    try {
      await apiClient.post(
        ENDPOINTS.TEMPLATES.SAVE_OVERRIDE(selectedTemplate.templateKey, user.institutionId),
        {
          bodyTemplate: "", // Empty bodyTemplate to clear override and inherit global
          status: selectedTemplate.status
        }
      );
      toast.success("Mensaje restablecido al predeterminado.");
      setEditModalOpen(false);
      fetchTemplates();
    } catch {
      toast.error("No se pudo restablecer el mensaje.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustomization(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const backendBody = translateFriendlyToEn(editBody);
      await apiClient.post(
        ENDPOINTS.TEMPLATES.SAVE_OVERRIDE(selectedTemplate.templateKey, user.institutionId),
        {
          bodyTemplate: backendBody,
          status: selectedTemplate.status
        }
      );
      toast.success("Mensaje personalizado guardado con éxito.");
      setEditModalOpen(false);
      fetchTemplates();
    } catch {
      toast.error("No se pudo guardar la personalización.");
    } finally {
      setSaving(false);
    }
  }

  const [activeCategory, setActiveCategory] = useState("ALL");

  const filteredTemplates = templates.filter(template => {
    if (activeCategory === "ALL") return true;
    return getTemplateCategory(template.type) === activeCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-100 rounded-xl">
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Personalización de Notificaciones</h1>
            <p className="text-sm text-gray-500">Activa o desactiva las alertas automáticas que se envían a los padres de familia</p>
          </div>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={fetchTemplates} loading={loading}>
          Actualizar
        </Button>
      </div>

      {/* WhatsApp Link Banner */}
      <Card padding="p-4" className="bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
              Mensajería WhatsApp de la Institución
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                whatsappConnected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {whatsappConnected ? 'VINCULADO' : 'NO VINCULADO'}
              </span>
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              {whatsappConnected 
                ? 'Los mensajes de esta institución se enviarán desde tu propio número vinculado.' 
                : 'Vincula tu número de WhatsApp para enviar las notificaciones desde tu propia cuenta institucional.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {whatsappConnected ? (
            <>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                onClick={handleDisconnect}
                loading={disconnecting}
              >
                Desvincular
              </Button>
              <Button 
                variant="primary" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setQrModalOpen(true)}
              >
                Re-vincular
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setQrModalOpen(true)}
            >
              Vincular WhatsApp
            </Button>
          )}
        </div>
      </Card>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                // Auto-select first template in the selected category
                const firstInCat = templates.find(t => cat.id === "ALL" || getTemplateCategory(t.type) === cat.id);
                if (firstInCat) {
                  setSelectedTemplate(firstInCat);
                } else {
                  setSelectedTemplate(null);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No se encontraron eventos configurados</p>
          <p className="text-xs text-gray-400 mt-1">Comuníquese con el administrador del sistema para registrar las plantillas base.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* List Section */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Alertas en esta categoría ({filteredTemplates.length})
            </h3>
            {filteredTemplates.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-xl p-8 text-center text-gray-400 text-xs">
                No hay notificaciones configuradas en esta categoría.
              </div>
            ) : (
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  const typeLabel = NOTIFICATION_TYPES.find(n => n.value === template.type)?.label || template.type;
                  const hasOverride = template.institutionId !== null;

                  return (
                    <div 
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 bg-white hover:border-primary-400 hover:shadow-sm ${
                        isSelected ? 'border-primary-500 ring-2 ring-primary-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px] font-mono">
                            {template.templateKey}
                          </span>
                          {hasOverride && (
                            <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-100">
                              Personalizado
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{template.name}</h4>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{typeLabel}</p>
                      </div>

                      {/* Instant Toggle Switch */}
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.status === "ACTIVE"}
                            onChange={(e) => handleToggleStatus(template, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details & Preview Section */}
          <div className="lg:col-span-7">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Information Card (Left or Top) */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <Card padding="p-4" className="bg-white flex flex-col gap-3 h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTemplate.status === "ACTIVE" ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedTemplate.status === "ACTIVE" ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug">{selectedTemplate.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-1">{selectedTemplate.templateKey}</p>
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        Esta alerta se enviará automáticamente a los apoderados cuando ocurra el evento de{" "}
                        <span className="font-semibold text-gray-700">
                          {NOTIFICATION_TYPES.find(n => n.value === selectedTemplate.type)?.label || selectedTemplate.type}
                        </span>.
                      </p>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Variables disponibles para este evento</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredSuggestedVariables && filteredSuggestedVariables.length > 0 ? (
                            filteredSuggestedVariables.map((variable) => (
                              <span
                                key={variable}
                                className="text-[9px] font-semibold bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono"
                                title={FRIENDLY_VARIABLES[variable] || "Dato personalizado"}
                              >
                                {FRIENDLY_VARIABLES[variable] || variable}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] italic text-gray-400">Esta notificación no incluye variables.</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50">
                        <Button 
                          variant="primary" 
                          className="w-full text-xs py-2 flex items-center justify-center gap-1.5 font-semibold"
                          onClick={handleOpenEdit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Personalizar Mensaje
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Simulated WhatsApp bubble on the Right */}
                <div className="md:col-span-7 flex flex-col bg-slate-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm min-h-[400px]">
                  
                  {/* WhatsApp simulator header */}
                  <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 shrink-0 text-teal-200" />
                      <div>
                        <h4 className="text-xs font-bold leading-none">Previsualización de Mensaje</h4>
                        <span className="text-[9px] text-teal-200">Ejemplo con datos reales</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-[#128c7e] text-teal-100 px-2 py-0.5 rounded">
                      WhatsApp
                    </span>
                  </div>

                  {/* WhatsApp chat screen background */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto flex flex-col justify-end min-h-[300px]"
                    style={{
                      backgroundColor: "#e5ddd5",
                      backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                      backgroundSize: "contain",
                      backgroundRepeat: "repeat"
                    }}
                  >
                    
                    {/* WhatsApp bubble */}
                    <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-sm max-w-[90%] relative self-start border border-gray-200/50">
                      <div className="absolute top-0 -left-2 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
                      <div className="text-sm text-gray-800 leading-relaxed break-words font-sans">
                        {formatWhatsAppText(compileTemplateForPreview(selectedTemplate.bodyTemplate))}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-1 flex items-center justify-end gap-1 select-none">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCircle className="w-3 h-3 text-[#34b7f1] fill-[#34b7f1]" />
                      </div>
                    </div>

                  </div>

                  {/* Warning banner */}
                  <div className="bg-white border-t border-gray-200 px-4 py-2.5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#128c7e] animate-pulse" />
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      Datos de ejemplo cargados de forma automática
                    </span>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-20 text-center text-gray-400">
                Selecciona una notificación de la lista de la izquierda para ver su detalle y simulación de envío.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Edit Custom Message Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Personalizar Redacción</h3>
                <h4 className="text-base font-bold text-gray-900 mt-0.5">{selectedTemplate.name}</h4>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)} 
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomization} className="p-6 overflow-y-auto space-y-4.5 flex-1">
              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3.5 text-xs text-blue-800 leading-relaxed flex items-start gap-2.5">
                <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-bold">Nota importante:</span> Puedes redactar el mensaje a tu gusto. Al enviar la notificación, las variables entre paréntesis (como <span className="font-semibold">(Nombre del estudiante)</span>) se sustituirán de manera automática con los datos reales del alumno o apoderado.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Insertar Variable Dinámica
                </label>
                <span className="text-[10px] text-gray-400 block mb-2">
                  Haz clic en una variable para insertarla en la posición del cursor dentro de la redacción.
                </span>
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-gray-50 border border-gray-150 rounded-xl max-h-[100px] overflow-y-auto">
                  {filteredSuggestedVariables && filteredSuggestedVariables.length > 0 ? (
                    filteredSuggestedVariables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        className="text-[10px] font-bold bg-white hover:bg-primary-50 hover:text-primary-600 border border-gray-200 hover:border-primary-200 text-gray-700 px-2.5 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                      >
                        <span className="text-primary-500 font-bold">+</span>
                        {FRIENDLY_VARIABLES[v] || v}
                      </button>
                    ))
                  ) : (
                    <span className="text-[11px] italic text-gray-400">Esta notificación no incluye variables dinámicas.</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Mensaje Personalizado *
                </label>
                <textarea
                  ref={textareaRef}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 font-sans leading-relaxed"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
                <Button 
                  type="button"
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs py-2 order-3 sm:order-1" 
                  onClick={handleResetToDefault}
                  disabled={saving}
                >
                  Restablecer a Predeterminado
                </Button>
                <div className="flex gap-2 flex-1 order-1 sm:order-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="flex-1 text-xs" 
                    onClick={() => setEditModalOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhatsAppQRModal 
        isOpen={qrModalOpen} 
        onClose={() => {
          setQrModalOpen(false);
          checkWhatsappStatus();
        }} 
        institutionId={user?.institutionId}
        onConnected={() => setWhatsappConnected(true)}
      />
    </div>
  );
}
