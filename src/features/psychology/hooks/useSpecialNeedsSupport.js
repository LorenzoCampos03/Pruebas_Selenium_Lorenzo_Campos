import { useState, useCallback } from "react";
import { specialNeedsSupportService } from "../services/specialNeedsSupportService";
import { parseSupportFromApi } from "../models/specialNeedsSupportModel";
import { psychologyService } from "../services/psychologyService";
import Swal from "sweetalert2";

const alertSuccess = (message, title = "¡Éxito!") => {
     return Swal.fire({
          icon: "success",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

const alertConfirm = (message, title = "¿Estás seguro?") => {
     return Swal.fire({
          icon: "warning",
          title,
          text: message,
          showCancelButton: true,
          confirmButtonColor: "#3b82f6",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Sí, continuar",
          cancelButtonText: "Cancelar",
     });
};

const alertError = (message, title = "Error") => {
     return Swal.fire({
          icon: "error",
          title,
          text: message,
          confirmButtonColor: "#3b82f6",
     });
};

// Normaliza cualquier respuesta a array
const toArray = (res) =>
     Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

// Carga la institución por ID (evita el 403 de getAllInstitutions)
async function loadInstitution(institutionId) {
     if (!institutionId) return [];
     try {
          const res = await psychologyService.getInstitutionById(institutionId);
          const inst = res?.data || res;
          return inst ? [inst] : [];
     } catch {
          return [];
     }
}

export function useSpecialNeedsSupport(currentUser = null) {
     const [supports, setSupports] = useState([]);
     const [students, setStudents] = useState([]);
     const [institutions, setInstitutions] = useState([]);
     const [classrooms, setClassrooms] = useState([]);
     const [loading, setLoading] = useState(false);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          try {
               const [supportsResponse, studentsResponse, institutionsList, classroomsResponse] = await Promise.all([
                    specialNeedsSupportService.getAll().catch(() => ({ data: [] })),
                    psychologyService.getAllStudents().catch(() => []),
                    loadInstitution(currentUser?.institutionId),
                    psychologyService.getAllClassrooms().catch(() => []),
               ]);

               const studentsList   = toArray(studentsResponse);
               const classroomsList = toArray(classroomsResponse);

               setStudents(studentsList);
               setInstitutions(institutionsList);
               setClassrooms(classroomsList);

               if (supportsResponse && supportsResponse.success && Array.isArray(supportsResponse.data)) {
                    let filteredSupports = supportsResponse.data;
                    if (currentUser?.institutionId) {
                         filteredSupports = supportsResponse.data.filter(
                              support => String(support.institutionId) === String(currentUser.institutionId)
                         );
                    }

                    const parsedList = filteredSupports.map(support => {
                         const parsed = parseSupportFromApi(support);
                         const student     = studentsList.find(s => String(s.id) === String(support.studentId));
                         const classroom   = classroomsList.find(c => String(c.id) === String(support.classroomId));
                         const institution = institutionsList.find(i => String(i.id) === String(support.institutionId));

                         return {
                              ...parsed,
                              studentName:     student     ? `${student.firstName} ${student.lastName}` : "Estudiante no encontrado",
                              classroomName:   classroom   ? classroom.classroomName                    : "Aula no encontrada",
                              institutionName: institution ? institution.name                           : "Institución no encontrada",
                         };
                    });

                    setSupports(parsedList);
               } else {
                    setSupports([]);
               }
          } catch (err) {
               console.error("Error loading supports:", err);
               setSupports([]);
               alertError("No se pudieron cargar los soportes de necesidades especiales");
          } finally {
               setLoading(false);
          }
     }, [currentUser]);

     const fetchById = useCallback(async (id) => {
          setLoading(true);
          try {
               const response = await specialNeedsSupportService.getById(id);
               if (response && response.success && response.data) {
                    const parsed = parseSupportFromApi(response.data);

                    const [studentsRes, classroomsRes, institutionsList] = await Promise.all([
                         psychologyService.getAllStudents().catch(() => []),
                         psychologyService.getAllClassrooms().catch(() => []),
                         loadInstitution(response.data.institutionId),
                    ]);

                    const studentsList   = toArray(studentsRes);
                    const classroomsList = toArray(classroomsRes);

                    setStudents(studentsList);
                    setClassrooms(classroomsList);
                    setInstitutions(institutionsList);

                    const student     = studentsList.find(s => String(s.id) === String(response.data.studentId));
                    const classroom   = classroomsList.find(c => String(c.id) === String(response.data.classroomId));
                    const institution = institutionsList.find(i => String(i.id) === String(response.data.institutionId));

                    return {
                         ...parsed,
                         studentName:     student     ? `${student.firstName} ${student.lastName}` : "Estudiante no encontrado",
                         classroomName:   classroom   ? classroom.classroomName                    : "Aula no encontrada",
                         institutionName: institution ? institution.name                           : "Institución no encontrada",
                    };
               }
               return null;
          } catch (err) {
               console.error("Error fetching support details:", err);
               alertError("No se pudo cargar el detalle del soporte");
               return null;
          } finally {
               setLoading(false);
          }
     }, []);

     const createSupport = useCallback(async (payload) => {
          const response = await specialNeedsSupportService.create(payload);
          alertSuccess("Soporte de necesidades especiales creado exitosamente", "¡Creado!");
          return response;
     }, []);

     const updateSupport = useCallback(async (id, payload) => {
          const response = await specialNeedsSupportService.update(id, payload);
          alertSuccess("Soporte de necesidades especiales actualizado exitosamente", "¡Actualizado!");
          return response;
     }, []);

     const deleteSupport = useCallback(async (id) => {
          const confirm = await alertConfirm("El soporte pasará a estado inactivo", "¿Desactivar soporte de necesidades especiales?");
          if (!confirm.isConfirmed) return null;
          await specialNeedsSupportService.delete(id);
          alertSuccess("Soporte de necesidades especiales desactivado exitosamente", "¡Desactivado!");
     }, []);

     const restoreSupport = useCallback(async (id) => {
          const confirm = await alertConfirm("El soporte volverá a estado activo", "¿Reactivar soporte de necesidades especiales?");
          if (!confirm.isConfirmed) return null;
          await specialNeedsSupportService.restore(id);
          alertSuccess("Soporte de necesidades especiales reactivado exitosamente", "¡Reactivado!");
     }, []);

     const hardDeleteSupport = useCallback(async (id) => {
          const confirm = await alertConfirm("Esta acción es irreversible, se eliminará permanentemente", "¿Eliminar soporte permanentemente?");
          if (!confirm.isConfirmed) return null;
          await specialNeedsSupportService.hardDelete(id);
          alertSuccess("Soporte de necesidades especiales eliminado permanentemente", "¡Eliminado!");
     }, []);

     return {
          supports,
          students,
          institutions,
          classrooms,
          loading,
          fetchAll,
          fetchById,
          createSupport,
          updateSupport,
          deleteSupport,
          restoreSupport,
          hardDeleteSupport,
     };
}
