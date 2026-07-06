import { useState, useCallback } from "react";
import { psychologyService } from "../services/psychologyService";
import { parseEvaluationFromApi } from "../models/psychologyModel";
import { toastSuccess, toastError, toastConfirm } from "../utils/notifications.jsx";

// Nombres que indican que el evaluador no fue resuelto correctamente
const INVALID_EVALUATOR_NAMES = ["evaluator not found", "sin evaluador", ""];

function isValidEvaluatorName(name) {
     if (!name) return false;
     return !INVALID_EVALUATOR_NAMES.includes(name.toLowerCase().trim());
}

export function usePsychology(currentUser = null) {
     const [evaluations, setEvaluations] = useState([]);
     const [students, setStudents] = useState([]);
     const [institutions, setInstitutions] = useState([]);
     const [classrooms, setClassrooms] = useState([]);
     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);

     const fetchAll = useCallback(async () => {
          setLoading(true);
          try {
                const institutionId = currentUser?.institutionId;
                const institutionsPromise = institutionId
                     ? psychologyService.getInstitutionById(institutionId)
                          .then(res => ({ data: res?.data ? [res.data] : (res ? [res] : []) }))
                          .catch(() => ({ data: [] }))
                     : Promise.resolve({ data: [] });

                const [evalResponse, studentsResponse, institutionsResponse, classroomsResponse, usersResponse] = await Promise.all([
                     psychologyService.getAll(),
                     psychologyService.getAllStudents().catch(() => ({ data: [] })),
                     institutionsPromise,
                     psychologyService.getAllClassrooms().catch(() => ({ data: [] })),
                     psychologyService.getAllUsers().catch(() => ({ data: [] })),
                ]);

               setStudents(studentsResponse.data || []);
               setInstitutions(institutionsResponse.data || []);
               
               // Filtrar classrooms por institución del usuario si tiene una asignada
               let filteredClassrooms = classroomsResponse.data || [];
               if (currentUser?.institutionId) {
                    filteredClassrooms = (classroomsResponse.data || []).filter(
                         classroom => String(classroom.institutionId) === String(currentUser.institutionId)
                    );
               }
               setClassrooms(filteredClassrooms);

               const users = usersResponse.data || [];
               setUsers(users);

               if (evalResponse && evalResponse.success && Array.isArray(evalResponse.data)) {
                    // Filtrar evaluaciones por institución del usuario si tiene una asignada
                    let filteredEvaluations = evalResponse.data;
                    if (currentUser?.institutionId) {
                         filteredEvaluations = evalResponse.data.filter(
                              evaluation => String(evaluation.institutionId) === String(currentUser.institutionId)
                         );
                    }

                    const parsedList = filteredEvaluations.map(evaluation => {
                         const parsed = parseEvaluationFromApi(evaluation);
                         const student = (studentsResponse.data || []).find(s => String(s.id) === String(evaluation.studentId));
                         const classroom = (classroomsResponse.data || []).find(c => String(c.id) === String(evaluation.classroomId));
                         const institution = (institutionsResponse.data || []).find(i => String(i.id) === String(evaluation.institutionId));

                         // Resolver nombre del evaluador: usar el guardado o buscar por evaluatedBy
                         let evaluatorName = evaluation.evaluatorName;
                         if (!isValidEvaluatorName(evaluatorName) && evaluation.evaluatedBy) {
                              const evaluator = users.find(u => String(u.id) === String(evaluation.evaluatedBy));
                              if (evaluator) {
                                   evaluatorName = `${evaluator.firstName || ""} ${evaluator.lastName || ""}`.trim();
                              }
                         }

                         return {
                              ...parsed,
                              studentName: student ? `${student.firstName} ${student.lastName}` : "Student not found",
                              classroomName: classroom ? classroom.classroomName : "Classroom not found",
                              institutionName: institution ? institution.name : "Institution not found",
                              evaluatorName: isValidEvaluatorName(evaluatorName) ? evaluatorName : "Sin evaluador",
                              createdAt: evaluation.createdAt,
                         };
                    });

                    // Calcular número de sesión por estudiante
                    const evaluationsByStudent = {};
                    parsedList.forEach(evaluation => {
                         if (!evaluationsByStudent[evaluation.studentId]) {
                              evaluationsByStudent[evaluation.studentId] = [];
                         }
                         evaluationsByStudent[evaluation.studentId].push(evaluation);
                    });
                    Object.keys(evaluationsByStudent).forEach(studentId => {
                         evaluationsByStudent[studentId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                         evaluationsByStudent[studentId].forEach((evaluation, index) => {
                              evaluation.sessionNumber = index + 1;
                         });
                    });

                    setEvaluations(parsedList);
               } else {
                    setEvaluations([]);
               }
          } catch (err) {
               console.error("Error:", err);
               setEvaluations([]);
                toastError("No se pudieron cargar las evaluaciones");
          } finally {
               setLoading(false);
          }
     }, [currentUser]);

     const fetchStudents = useCallback(async () => {
          try {
               const response = await psychologyService.getAllStudents();
               setStudents(response.data || []);
          } catch (err) {
               console.error("Error fetching students:", err);
          }
     }, []);

      const fetchInstitutions = useCallback(async () => {
           try {
                if (currentUser?.institutionId) {
                     const response = await psychologyService.getInstitutionById(currentUser.institutionId);
                     const raw = response?.success ? response.data : response;
                     setInstitutions(raw ? [raw] : []);
                } else {
                     setInstitutions([]);
                }
           } catch (err) {
                console.error("Error fetching institution:", err);
                setInstitutions([]);
           }
      }, [currentUser]);

     const fetchClassrooms = useCallback(async () => {
          try {
               const response = await psychologyService.getAllClassrooms();
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchUsers = useCallback(async () => {
          try {
               const response = await psychologyService.getAllUsers();
               setUsers(response.data || []);
          } catch (err) {
               console.error("Error fetching users:", err);
          }
     }, []);

     const fetchClassroomsByInstitution = useCallback(async (institutionId) => {          try {
               const response = await psychologyService.getClassroomsByInstitution(institutionId);
               setClassrooms(response.data || []);
          } catch (err) {
               console.error("Error fetching classrooms:", err);
          }
     }, []);

     const fetchById = useCallback(async (id) => {
          setLoading(true);
          try {
               const response = await psychologyService.getById(id);
               if (response && response.success && response.data) {
                    const parsed = parseEvaluationFromApi(response.data);
                const institutionId = currentUser?.institutionId;
                const institutionsPromise = institutionId
                     ? psychologyService.getInstitutionById(institutionId)
                          .then(res => ({ data: res?.data ? [res.data] : (res ? [res] : []) }))
                          .catch(() => ({ data: [] }))
                     : Promise.resolve({ data: [] });

                const [studentsRes, classroomsRes, institutionsRes] = await Promise.all([
                     psychologyService.getAllStudents().catch(() => ({ data: [] })),
                     psychologyService.getAllClassrooms().catch(() => ({ data: [] })),
                     institutionsPromise,
                ]);
                    const student = (studentsRes.data || []).find(s => String(s.id) === String(response.data.studentId));
                    const classroom = (classroomsRes.data || []).find(c => String(c.id) === String(response.data.classroomId));
                    const institution = (institutionsRes.data || []).find(i => String(i.id) === String(response.data.institutionId));
                    return {
                         ...parsed,
                         studentName: student ? `${student.firstName} ${student.lastName}` : "Student not found",
                         classroomName: classroom ? classroom.classroomName : "Classroom not found",
                         institutionName: institution ? institution.name : "Institution not found",
                         evaluatorName: response.data.evaluatorName || "Evaluator not found",
                         createdAt: response.data.createdAt || response.data.evaluatedAt || null,
                         updatedAt: response.data.updatedAt || response.data.evaluatedAt || null,
                    };
               }
               return null;
          } catch (err) {
               console.error("Error fetching evaluation:", err);
                toastError("No se pudo cargar la evaluación");
               return null;
          } finally {
               setLoading(false);
          }
     }, []);

      const createEvaluation = useCallback(async (payload) => {
           const response = await psychologyService.create(payload);
           return response;
      }, []);

      const updateEvaluation = useCallback(async (id, payload) => {
           const response = await psychologyService.update(id, payload);
           return response;
      }, []);

      const deleteEvaluation = useCallback(async (id) => {
           const confirm = await toastConfirm("La evaluación pasará a estado inactivo", "¿Desactivar evaluación psicológica?");
           if (!confirm.isConfirmed) return null;
           await psychologyService.delete(id);
           toastSuccess("Evaluación psicológica desactivada exitosamente");
      }, []);

      const hardDeleteEvaluation = useCallback(async (id) => {
           const confirm = await toastConfirm("Esta acción es irreversible, se eliminará permanentemente", "¿Eliminar evaluación permanentemente?");
           if (!confirm.isConfirmed) return null;
           await psychologyService.hardDelete(id);
           toastSuccess("Evaluación psicológica eliminada permanentemente");
      }, []);

      const restoreEvaluation = useCallback(async (id) => {
           const confirm = await toastConfirm("La evaluación volverá a estado activo", "¿Reactivar evaluación psicológica?");
           if (!confirm.isConfirmed) return null;
           try {
                await psychologyService.restore(id);
                toastSuccess("Evaluación psicológica restaurada exitosamente");
           } catch (error) {
                console.error("Error al restaurar evaluación:", error);
                toastError("No se pudo reactivar la evaluación. Intenta nuevamente.");
           }
      }, []);

     return {
          evaluations,
          students,
          institutions,
          classrooms,
          setClassrooms,
          users,
          loading,
          fetchAll,
          fetchById,
          fetchStudents,
          fetchInstitutions,
          fetchClassrooms,
          fetchClassroomsByInstitution,
          fetchUsers,
          createEvaluation,
          updateEvaluation,
          deleteEvaluation,
          hardDeleteEvaluation,
          restoreEvaluation,
     };
}
