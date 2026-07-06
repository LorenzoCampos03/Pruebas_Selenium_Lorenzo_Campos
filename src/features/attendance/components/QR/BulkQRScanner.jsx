import { useState, useEffect } from "react";
import {
  X, QrCode, Save, Trash2, Clock, Users, School,
  CheckCircle2, Zap, BarChart3, ScanLine, Loader2,
  AlertCircle, BadgeCheck
} from "lucide-react";
import QRScannerModal from "./QRScannerModal";
import Swal from "sweetalert2";
import { toastSuccess, toastError } from "../../utils/notifications";

export default function BulkQRScanner({ open, onClose, students, classrooms, onSave, currentUser }) {
  const [scannedStudents, setScannedStudents] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const userClassrooms = classrooms.filter(c =>
    currentUser?.institutionId ? c.institutionId === currentUser.institutionId : true
  );

  const classroomSummary = scannedStudents.reduce((acc, student) => {
    const classroom = student.classroomName || "Sin aula";
    acc[classroom] = (acc[classroom] || 0) + 1;
    return acc;
  }, {});

  const totalClassrooms = Object.keys(classroomSummary).length;

  useEffect(() => {
    if (!open) {
      setScannedStudents([]);
      setError(null);
    }
  }, [open]);

  const handleQRScan = async (data) => {
    let studentId;
    let student;

    if (data.dni) {
      student = students.find(s => s.documentNumber === data.dni);
      if (!student) {
        setError(`No se encontró ningún estudiante con DNI: ${data.dni}`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      studentId = student.id.toString();
    } else {
      studentId = data.studentId;
      student = students.find(s => s.id.toString() === studentId);
    }

    if (scannedStudents.find(s => s.studentId === studentId)) {
      setError("Este estudiante ya fue escaneado");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!student) {
      setError("Estudiante no encontrado");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!student.classroomId) {
      setError(`El estudiante ${student.firstName} ${student.lastName} no tiene aula asignada.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    const now = new Date();
    const entryTime = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setScannedStudents(prev => [...prev, {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      classroomId: student.classroomId,
      classroomName: classrooms.find(c => String(c.id) === String(student.classroomId))?.classroomName || "Aula no encontrada",
      cui: student.cui,
      entryTime,
      scannedAt: now
    }]);

    setError(null);
  };

  const handleRemoveStudent = (studentId) => {
    setScannedStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  const handleSaveAll = async () => {
    if (scannedStudents.length === 0) return;

    setSaving(true);
    try {
      const attendanceRecords = scannedStudents.map(student => ({
        studentId: student.studentId,
        classroomId: student.classroomId,
        institutionId: currentUser.institutionId,
        attendanceDate: new Date().toISOString().split('T')[0],
        academicYear: new Date().getFullYear(),
        status: "PRESENT",
        arrivalTime: student.entryTime,
        registeredBy: currentUser.userId || currentUser.id
      }));

      await onSave(attendanceRecords);
      toastSuccess("Registro masivo completado", `${scannedStudents.length} estudiantes registrados en ${totalClassrooms} aulas`);
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      if (error.response?.status === 409) {
        Swal.fire({
          title: "Registro duplicado",
          text: "Uno o más estudiantes ya tienen registro de asistencia para hoy",
          icon: "warning",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0f172a",
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-lg font-bold',
            confirmButton: 'px-5 py-2.5 rounded-lg text-sm font-semibold'
          }
        });
      } else {
        toastError("Error al guardar los registros");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Registro Masivo de Asistencia</h2>
                <p className="text-xs text-white/60">Escanea y registra múltiples estudiantes por lote</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Info + Action cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <School className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Asignación automática por aula</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Cada estudiante se asigna automáticamente a su aula al momento de guardar.
                      El sistema detecta el aula según los datos del estudiante.
                    </p>
                  </div>
                </div>
                {userClassrooms.length === 0 && (
                  <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    No hay aulas disponibles para tu institución.
                  </p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2.5">Acción rápida</p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
                >
                  <ScanLine className="w-4 h-4" />
                  Escanear Estudiante
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Escanea múltiples estudiantes antes de guardar
                </p>
              </div>
            </div>

            {/* Scanned students list */}
            {scannedStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-700">Aún no hay estudiantes escaneados</p>
                <p className="text-sm text-slate-400 mt-1">
                  Haz clic en "Escanear Estudiante" para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Escaneados</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">{scannedStudents.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Aulas</p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">{totalClassrooms}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Listos</p>
                    <p className="text-xl font-bold text-emerald-600 mt-0.5">
                      <BadgeCheck className="w-4 h-4 inline mr-1" />
                      {scannedStudents.length}
                    </p>
                  </div>
                </div>

                {/* Distribution by classroom */}
                {totalClassrooms > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Distribución por aula</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(classroomSummary).map(([classroom, total]) => {
                        const pct = Math.round((total / scannedStudents.length) * 100);
                        return (
                          <div key={classroom} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-xs font-semibold text-slate-600">{classroom}:</span>
                            <span className="text-xs font-bold text-slate-800">{total}</span>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Student list */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        Estudiantes Escaneados
                      </h3>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {scannedStudents.length} total
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {scannedStudents.map((student, index) => (
                      <div
                        key={student.studentId}
                        className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-5">{student.studentName}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              {student.cui && <span>CUI: {student.cui}</span>}
                              <span className="inline-flex items-center gap-1">
                                <School className="w-3 h-3" />
                                {student.classroomName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {student.entryTime}
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(student.studentId)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Listos para guardar: <strong className="text-slate-800">{scannedStudents.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAll}
                disabled={scannedStudents.length === 0 || saving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Todos ({scannedStudents.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <QRScannerModal
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleQRScan}
        />
      </div>
    </div>
  );
}
