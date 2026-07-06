import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from "../../models/attendanceModel";

function Modal({ isOpen, onClose, title, children }) {
     if (!isOpen) return null;
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                              <h2 className="text-lg font-semibold">{title}</h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                         <div className="p-6">{children}</div>
                    </div>
               </div>
          </div>
     );
}

export default function AttendanceForm({ open, onClose, onSubmit, attendance, students, classrooms, institutions, onInstitutionChange, onClassroomChange }) {
     const { user } = useAuth();
     const [formData, setFormData] = useState({
          studentId: "",
          classroomId: "",
          institutionId: "",
          attendanceDate: "",
          academicYear: new Date().getFullYear(),
          status: ATTENDANCE_STATUS.PRESENT,
          arrivalTime: "",
          departureTime: "",
          isJustified: false,
          justificationReason: "",
          registeredBy: "",
     });

     useEffect(() => {
          if (attendance) {
               requestAnimationFrame(() => setFormData({
                    studentId: attendance.studentId || "",
                    classroomId: attendance.classroomId || "",
                    institutionId: attendance.institutionId || "",
                    attendanceDate: attendance.attendanceDate || "",
                    academicYear: attendance.academicYear || new Date().getFullYear(),
                    status: attendance.status || ATTENDANCE_STATUS.PRESENT,
                    arrivalTime: attendance.arrivalTime || "",
                    departureTime: attendance.departureTime || "",
                    isJustified: attendance.isJustified || false,
                    justificationReason: attendance.justificationReason || "",
                    registeredBy: attendance.registeredBy || "",
               }));
               // Cargar estudiantes del aula si está editando
               if (attendance.classroomId && onClassroomChange) {
                    onClassroomChange(attendance.classroomId);
               }
           } else {
                // Auto-completar institución y registeredBy del usuario logueado
                const institutionId = user?.institutionId ? String(user.institutionId) : "";
                const registeredBy = user?.userId ? String(user.userId) : "";

                requestAnimationFrame(() => setFormData({
                     studentId: "",
                     classroomId: "",
                     institutionId,
                     attendanceDate: new Date().toISOString().split("T")[0],
                     academicYear: new Date().getFullYear(),
                     status: ATTENDANCE_STATUS.PRESENT,
                     arrivalTime: "",
                     departureTime: "",
                     isJustified: false,
                     justificationReason: "",
                     registeredBy,
                }));

                // Cargar aulas si hay institución
                if (institutionId && onInstitutionChange) {
                    onInstitutionChange(institutionId);
               }
          }
     }, [attendance, open, user, onInstitutionChange, onClassroomChange]);

     const handleChange = (e) => {
          const { name, value, checked, type } = e.target;
          
          // Si cambia el aula, resetear el estudiante y cargar estudiantes del aula
          if (name === "classroomId") {
               setFormData((prev) => ({
                    ...prev,
                    classroomId: value,
                    studentId: "", // Resetear estudiante cuando cambia el aula
               }));
               // Cargar estudiantes del aula seleccionada
               if (value && onClassroomChange) {
                    onClassroomChange(value);
               }
               return;
          }

          setFormData((prev) => ({
               ...prev,
               [name]: type === "checkbox" ? checked : value,
          }));

          // Si cambia la institución, cargar las aulas correspondientes
          if (name === "institutionId" && value && onInstitutionChange) {
               onInstitutionChange(value);
               // También resetear aula y estudiante
               setFormData((prev) => ({
                    ...prev,
                    institutionId: value,
                    classroomId: "",
                    studentId: "",
               }));
          }
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          onSubmit(formData);
     };

     return (
          <Modal isOpen={open} onClose={onClose} title={attendance ? "Editar Asistencia" : "Registrar Asistencia"}>
               <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Aula</label>
                              <select
                                   name="classroomId"
                                   value={formData.classroomId}
                                   onChange={handleChange}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                   <option value="">Seleccionar aula</option>
                                   {classrooms.map((classroom) => (
                                        <option key={classroom.id} value={String(classroom.id)}>
                                             {classroom.classroomName}
                                        </option>
                                   ))}
                              </select>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Estudiante <span className="text-red-500">*</span>
                              </label>
                              <select
                                   name="studentId"
                                   value={formData.studentId}
                                   onChange={handleChange}
                                   required
                                   disabled={!formData.classroomId}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                   <option value="">
                                        {formData.classroomId ? "Seleccionar estudiante" : "Primero selecciona un aula"}
                                   </option>
                                   {students.map((student) => (
                                        <option key={student.id} value={String(student.id)}>
                                             {student.firstName} {student.lastName}
                                        </option>
                                   ))}
                              </select>
                              {!formData.classroomId && (
                                   <p className="mt-1 text-xs text-gray-500">Selecciona un aula para ver los estudiantes</p>
                              )}
                              {formData.classroomId && students.length === 0 && (
                                   <p className="mt-1 text-xs text-amber-600">No hay estudiantes en esta aula</p>
                              )}
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                              <select
                                   name="institutionId"
                                   value={formData.institutionId}
                                   onChange={handleChange}
                                   disabled={!!user?.institutionId}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                   <option value="">Seleccionar institución</option>
                                   {institutions.map((institution) => (
                                        <option key={institution.id} value={String(institution.id)}>
                                             {institution.name}
                                        </option>
                                   ))}
                              </select>
                              {user?.institutionId && (
                                   <p className="mt-1 text-xs text-gray-500">Institución asignada automáticamente</p>
                              )}
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Fecha <span className="text-red-500">*</span>
                              </label>
                              <input
                                   type="date"
                                   name="attendanceDate"
                                   value={formData.attendanceDate}
                                   onChange={handleChange}
                                   required
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Estado <span className="text-red-500">*</span>
                              </label>
                              <select
                                   name="status"
                                   value={formData.status}
                                   onChange={handleChange}
                                   required
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                   {Object.entries(ATTENDANCE_STATUS).map(([, value]) => (
                                        <option key={value} value={value}>
                                             {ATTENDANCE_STATUS_LABELS[value]}
                                        </option>
                                   ))}
                              </select>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Año Académico</label>
                              <input
                                   type="number"
                                   name="academicYear"
                                   value={formData.academicYear}
                                   onChange={handleChange}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Llegada</label>
                              <input
                                   type="time"
                                   name="arrivalTime"
                                   value={formData.arrivalTime}
                                   onChange={handleChange}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                              <input
                                   type="time"
                                   name="departureTime"
                                   value={formData.departureTime}
                                   onChange={handleChange}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                         </div>
                    </div>

                    <div className="flex items-center">
                         <input
                              type="checkbox"
                              name="isJustified"
                              checked={formData.isJustified}
                              onChange={handleChange}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                         />
                         <label className="ml-2 block text-sm text-gray-900">¿Está justificado?</label>
                    </div>

                    {formData.isJustified && (
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Justificación</label>
                              <textarea
                                   name="justificationReason"
                                   value={formData.justificationReason}
                                   onChange={handleChange}
                                   rows={3}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                   placeholder="Describa el motivo..."
                              />
                         </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                         <button
                              type="button"
                              onClick={onClose}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                         >
                              Cancelar
                         </button>
                         <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                         >
                              {attendance ? "Actualizar" : "Registrar"}
                         </button>
                    </div>
               </form>
          </Modal>
     );
}
