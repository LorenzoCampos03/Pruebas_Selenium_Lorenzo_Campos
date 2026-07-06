import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Clock, MessageSquare, CheckCircle, FileText, Calendar, Building2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { calendarService } from "@/features/events/services/calendarService";
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS, formatAttendanceForApi } from "../models/attendanceModel";
import Swal from "sweetalert2";

const swal = (opts) => Swal.fire({ confirmButtonColor: "#3b82f6", ...opts });

function StepIndicator({ currentStep, steps }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const Icon = step.icon;

        return (
          <div key={stepNumber} className={`relative flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
            isActive ? "bg-gradient-to-r from-primary-50 to-primary-50 border-l-4 border-primary-600 shadow-sm" : 
            isCompleted ? "bg-green-50/50" : "bg-white"
          }`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-all duration-300 ${
              isActive ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md shadow-primary-200" : 
              isCompleted ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" : 
              "bg-gray-100 text-gray-400"
            }`}>
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className={`text-xs font-bold tracking-wide ${
                isActive ? "text-primary-900" : isCompleted ? "text-green-800" : "text-gray-500"
              }`}>
                {step.title}
              </div>
              <div className={`text-xs mt-0.5 font-medium ${
                isActive ? "text-primary-600" : isCompleted ? "text-green-600" : "text-gray-400"
              }`}>
                {isCompleted ? "✓ Completado" : isActive ? "En progreso..." : "Pendiente"}
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-700 font-semibold">Progreso General</span>
          <span className="text-primary-700 font-bold text-base">{Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
          <div 
            className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-600 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Paso {currentStep} de {steps.length}
        </p>
      </div>
    </div>
  );
}

export default function NewAttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    students, institutions, classrooms, createAttendance, fetchAll,
    fetchInstitutions, fetchClassroomsByInstitution, fetchStudentsByClassroom
  } = useAttendance(user);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  const getPeruDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }));
  };

  const getDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getPeruDate();

  const [formData, setFormData] = useState({
    studentId: location.state?.studentId || "",
    classroomId: location.state?.classroomId || "",
    institutionId: user?.institutionId ? String(user.institutionId) : "",
    attendanceDate: getDateString(today),
    academicYear: today.getFullYear(),
    status: ATTENDANCE_STATUS.PRESENT,
    arrivalTime: "",
    departureTime: "",
    isJustified: false,
    justificationReason: "",
    registeredBy: user?.userId ? String(user.userId) : "",
  });

  const steps = [
    { title: "Información Básica", icon: User },
    { title: "Horarios", icon: Clock },
    { title: "Observaciones", icon: MessageSquare },
  ];

  useEffect(() => {
    fetchAll();
    fetchInstitutions();
    if (user?.institutionId) fetchClassroomsByInstitution(user.institutionId);
    fetchHolidays();
  }, [fetchAll, fetchInstitutions, fetchClassroomsByInstitution, user?.institutionId]);

  useEffect(() => {
    if (location.state?.classroomId) fetchStudentsByClassroom(location.state.classroomId);
  }, [fetchStudentsByClassroom, location.state?.classroomId]);

  useEffect(() => {
    const resolveAttendanceBlock = async () => {
      try {
        const nowPeru = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
        const todayStr = nowPeru.toISOString().split("T")[0];

        if (!user?.institutionId) {
          setBlockedReason("");
          return;
        }

        const calendars = await calendarService.getByInstitution(user.institutionId);
        const activeCalendar = (calendars || []).find((calendar) => {
          if (calendar.status !== "ACTIVE") return false;
          const start = String(calendar.startDate || "").slice(0, 10);
          const end = String(calendar.endDate || "").slice(0, 10);
          return start && end && todayStr >= start && todayStr <= end;
        });

        if (!activeCalendar?.id) {
          setBlockedReason("");
          return;
        }

        const calendarWithEvents = await calendarService.getWithEvents(activeCalendar.id);
        const holidayEvent = (calendarWithEvents?.events || []).find((event) => {
          if (event.status && event.status !== "ACTIVE") return false;
          const start = String(event.startDate || "").slice(0, 10);
          const end = String(event.endDate || event.startDate || "").slice(0, 10);
          return event.isHoliday === true && start && todayStr >= start && todayStr <= end;
        });

        if (holidayEvent) {
          setBlockedReason(`Hoy es feriado: "${holidayEvent.title}". No se permite registrar asistencia.`);
          return;
        }
        setBlockedReason("");
      } catch (error) {
        console.error("Error validating attendance date:", error);
        setBlockedReason("");
      }
    };
    resolveAttendanceBlock();
  }, [user?.institutionId]);

  const fetchHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const { attendanceService } = await import("../services/attendanceService");
      const currentYear = new Date().getFullYear();
      const civicDates = await attendanceService.getCivicDatesByYear(currentYear);
      const holidayDates = civicDates
        .filter(date => date.isHoliday || date.type === "FERIADO" || date.eventType === "HOLIDAY")
        .map(date => date.date);
      setHolidays(holidayDates);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    if (formData.classroomId && students.length === 0) {
      const timer = setTimeout(() => {
        if (students.length === 0) {
          swal({ icon: "warning", title: "Aula sin estudiantes", text: "Esta aula no tiene estudiantes registrados. Por favor selecciona otra aula." });
          setFormData(prev => ({ ...prev, classroomId: "", studentId: "" }));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [students, formData.classroomId]);

  function handleChange(field, value) {
    if (field === "classroomId") {
      setFormData(prev => ({ ...prev, classroomId: value, studentId: "" }));
      if (value) fetchStudentsByClassroom(value);
      return;
    }
    if (field === "attendanceDate" || field === "departureTime") return;
    if (field === "status") {
      setFormData(prev => ({
        ...prev,
        status: value,
        isJustified: value === ATTENDANCE_STATUS.JUSTIFIED,
        justificationReason: value === ATTENDANCE_STATUS.JUSTIFIED ? prev.justificationReason : "",
        arrivalTime: value === ATTENDANCE_STATUS.PRESENT ? prev.arrivalTime : "",
        departureTime: "",
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function validateStep1() {
    const requiredFields = [formData.studentId, formData.classroomId, formData.institutionId, formData.attendanceDate, formData.status];
    if (!requiredFields.every(field => field)) {
      swal({ icon: "warning", title: "Campos incompletos", text: "Por favor, complete todos los campos obligatorios antes de continuar." });
      return false;
    }
    return true;
  }

  async function handleNext() {
    if (blockedReason) {
      swal({ icon: "warning", title: "Registro bloqueado", text: blockedReason });
      return;
    }
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  }

  function handlePrevious() {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }

  async function handleSubmit() {
    if (blockedReason) {
      swal({ icon: "warning", title: "Registro bloqueado", text: blockedReason });
      return;
    }
    setLoading(true);
    try {
      const payload = formatAttendanceForApi(formData);
      await createAttendance(payload);
      swal({ icon: "success", title: "¡Creado!", text: "Registro de asistencia creado exitosamente" });
      navigate("/auxiliar/asistencia");
    } catch (error) {
      console.error("Error:", error);
      swal({ icon: "error", title: "Error al guardar", text: error.response?.data?.message || "No se pudo crear el registro de asistencia" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-primary-50/20 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate("/auxiliar/asistencia")}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Registrar Asistencia</h1>
              <p className="text-sm text-gray-600">Complete el formulario para registrar la asistencia del estudiante</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-700 font-medium">{new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Progreso</h3>
              </div>
              <StepIndicator currentStep={currentStep} steps={steps} />
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  {currentStep === 1 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><User className="w-5 h-5 text-white" /></div>}
                  {currentStep === 2 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><Clock className="w-5 h-5 text-white" /></div>}
                  {currentStep === 3 && <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg"><MessageSquare className="w-5 h-5 text-white" /></div>}
                  <div>
                    <h2 className="text-xl font-bold text-white mb-0.5">
                      {currentStep === 1 && "Información Básica"}
                      {currentStep === 2 && "Horarios"}
                      {currentStep === 3 && "Observaciones"}
                    </h2>
                    <p className="text-primary-100 text-xs">
                      {currentStep === 1 && "Datos del estudiante y estado de asistencia"}
                      {currentStep === 2 && "Registro de horarios de llegada y salida"}
                      {currentStep === 3 && "Justificaciones y observaciones adicionales"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {blockedReason && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Registro bloqueado</p>
                      <p className="text-sm text-amber-700">{blockedReason}</p>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    {location.state?.fromQr && location.state?.studentName && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Registro desde QR</p>
                        <p className="text-sm text-emerald-700 mt-1">
                          Estudiante detectado: <span className="font-semibold">{location.state.studentName}</span>
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5">El aula del estudiante fue seleccionada automaticamente.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Aula <span className="text-red-500">*</span>
                        </label>
                        <select value={formData.classroomId} onChange={(e) => handleChange("classroomId", e.target.value)}
                          className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                            formData.classroomId ? "border-primary-300 bg-white" : "border-gray-300"
                          }`}>
                          <option value="">Seleccionar aula</option>
                          {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.classroomName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Estudiante <span className="text-red-500">*</span>
                        </label>
                        <select value={formData.studentId} onChange={(e) => handleChange("studentId", e.target.value)}
                          disabled={!formData.classroomId}
                          className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 text-sm ${
                            formData.studentId ? "border-primary-300 bg-white" : "border-gray-300 bg-white"
                          } ${!formData.classroomId ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}>
                          <option value="">
                            {formData.classroomId ? "Seleccionar estudiante" : "Primero selecciona un aula"}
                          </option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Institución Educativa</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" readOnly
                            value={(() => {
                              const found = institutions.find(i => String(i.id) === String(formData.institutionId));
                              return found ? found.name : formData.institutionId;
                            })()}
                            className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-700 text-sm cursor-not-allowed" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-1">Asignada según tu perfil</p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Fecha <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="date" value={formData.attendanceDate} readOnly disabled
                            className={`w-full pl-10 pr-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                              formData.attendanceDate ? "border-primary-300 bg-white" : "border-gray-300"
                            } disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed`} />
                        </div>
                        {loadingHolidays && <p className="text-xs text-gray-500 mt-1 ml-1">Cargando feriados...</p>}
                        {!loadingHolidays && holidays.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1 ml-1">ℹ️ Los días feriados están bloqueados para registro</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Estado <span className="text-red-500">*</span>
                        </label>
                        <select value={formData.status} onChange={(e) => handleChange("status", e.target.value)}
                          className={`w-full px-3 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm ${
                            formData.status ? "border-primary-300 bg-white" : "border-gray-300"
                          }`}>
                          <option value={ATTENDANCE_STATUS.PRESENT}>{ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.PRESENT]}</option>
                          <option value={ATTENDANCE_STATUS.JUSTIFIED}>{ATTENDANCE_STATUS_LABELS[ATTENDANCE_STATUS.JUSTIFIED]}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Año Académico <span className="text-red-500">*</span>
                        </label>
                        <input type="number" value={formData.academicYear} readOnly
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed text-sm" />
                        <p className="text-xs text-gray-500 mt-1 ml-1">Año académico actual</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora de Llegada</label>
                        <input type="time" value={formData.arrivalTime}
                          onChange={(e) => handleChange("arrivalTime", e.target.value)}
                          disabled={formData.status !== ATTENDANCE_STATUS.PRESENT}
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white text-gray-900 text-sm disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed" />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora de Salida</label>
                        <input type="time" value={formData.departureTime} disabled readOnly
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input type="checkbox" checked={formData.isJustified}
                        onChange={(e) => handleChange("isJustified", e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                      <label className="ml-2 block text-sm font-medium text-gray-900">¿Está justificado?</label>
                    </div>

                    {formData.isJustified && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Motivo de Justificación</label>
                        <textarea value={formData.justificationReason}
                          onChange={(e) => handleChange("justificationReason", e.target.value)}
                          rows={4} placeholder="Describa el motivo de la justificación..."
                          className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-sm" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-6 pt-6 border-t">
                  <button type="button" onClick={handlePrevious} disabled={currentStep === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Anterior
                  </button>
                  <button type="button" onClick={handleNext} disabled={loading || Boolean(blockedReason)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Guardando..." : currentStep === steps.length ? "Registrar" : "Siguiente"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
