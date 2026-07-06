import { useState, useCallback } from "react";
import { enrollmentService } from "../services/enrollmentService";
import { studentService } from "../../students/services/studentService";
import { academicPeriodService } from "../services/academicPeriodService";
import {
  alertApiError,
  alertCreated,
  alertUpdated,
  alertConfirmDelete,
  alertConfirmAction,
  alertDeleted,
  alertWarning,
} from "@/shared/components/feedback";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { ENROLLMENT_STATUS } from "../models/enrollmentModel";
import { getEnrollmentBlockReason } from "../models/academicPeriodModel";

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==============================
  // 🔹 HELPERS REUTILIZABLES
  // ==============================

  const execute = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err);
      alertApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sortEnrollments = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.enrollmentDate || a.createdAt || 0);
      const dateB = new Date(b.enrollmentDate || b.createdAt || 0);
      return dateB - dateA;
    });
  };

  const enrichEnrollmentsWithStudents = async (data) => {
    let enrichedData = Array.isArray(data) ? data : [];

    const needsEnrichment = enrichedData.some(
      (e) => e.studentId && (!e.studentFullName || !e.student)
    );

    if (!needsEnrichment) return enrichedData;

    console.log("🔄 Enriqueciendo matrículas con datos de estudiantes...");

    const studentIds = [
      ...new Set(
        enrichedData.filter((e) => e.studentId).map((e) => e.studentId)
      ),
    ];

    const studentDataPromises = studentIds.map(async (studentId) => {
      try {
        const res = await studentService.getById(studentId);
        const student = isSuccessResponse(res) ? extractData(res) : res;
        return { id: studentId, data: student };
      } catch {
        return { id: studentId, data: null };
      }
    });

    const studentsDataArray = await Promise.all(studentDataPromises);
    const studentsMap = new Map(
      studentsDataArray.map((s) => [s.id, s.data])
    );

    return enrichedData.map((enrollment) => {
      const student = studentsMap.get(enrollment.studentId);
      if (!student) return enrollment;

      return {
        ...enrollment,
        studentFullName:
          student.fullName ||
          `${student.firstName || ""} ${student.lastName || ""} ${student.motherLastName || ""}`.trim() ||
          null,
        studentDocumentNumber: student.documentNumber || null,
        student,
      };
    });
  };

  const enrichEnrollmentsWithAcademicPeriods = async (data) => {
    let enrichedData = Array.isArray(data) ? data : [];

    const needsEnrichment = enrichedData.some(
      (e) => e.academicPeriodId && !e.academicPeriod
    );

    if (!needsEnrichment) return enrichedData;

    console.log("🔄 Enriqueciendo matrículas con períodos académicos...");

    const periodIds = [
      ...new Set(
        enrichedData.filter((e) => e.academicPeriodId).map((e) => e.academicPeriodId)
      ),
    ];

    const periodDataPromises = periodIds.map(async (periodId) => {
      try {
        const res = await academicPeriodService.getById(periodId);
        const period = isSuccessResponse(res) ? extractData(res) : res;
        return { id: periodId, data: period };
      } catch {
        return { id: periodId, data: null };
      }
    });

    const periodsDataArray = await Promise.all(periodDataPromises);
    const periodsMap = new Map(
      periodsDataArray.map((p) => [p.id, p.data])
    );

    return enrichedData.map((enrollment) => {
      if (enrollment.academicPeriod) return enrollment;
      const period = periodsMap.get(enrollment.academicPeriodId);
      if (!period) return enrollment;
      return { ...enrollment, academicPeriod: period };
    });
  };

  const mapEnrollmentError = (error, fallback) => {
    let msg = fallback;

    if (error.response?.data?.message) msg = error.response.data.message;
    else if (error.response?.data?.error) msg = error.response.data.error;
    else if (error.message) msg = error.message;

    if (msg.includes("ya pertenece a la institución"))
      return msg;
    if (msg.includes("Student") || msg.includes("estudiante"))
      return "El estudiante no existe o no está activo";
    if (msg.includes("Institution") || msg.includes("institución"))
      return "La institución no es válida";
    if (msg.includes("Duplicate") || msg.includes("duplicado"))
      return "El estudiante ya está matriculado";
    if (msg.includes("Classroom") || msg.includes("aula"))
      return "El aula no pertenece a la institución";

    return msg;
  };

  // ==============================
  // 🔹 GUARD: VALIDAR ACCIONES SOBRE MATRÍCULAS
  // ==============================

  const guardEnrollmentAction = async (id, actionName) => {
    try {
      const enrollment = await enrollmentService.getById(id);

      if (enrollment?.enrollmentStatus === ENROLLMENT_STATUS.CANCELLED) {
        alertWarning(
          `No es posible ${actionName} una matrícula cancelada.`,
          "Matrícula cancelada"
        );
        return false;
      }

      if (enrollment?.academicPeriodId) {
        try {
          const period = await academicPeriodService.getById(enrollment.academicPeriodId);
          const blockReason = getEnrollmentBlockReason(period);
          if (blockReason) {
            const reasonLabel = blockReason === "periodo_cerrado" ? "Período cerrado" : "Matrícula cerrada";
            const reasonMsg = blockReason === "periodo_cerrado"
              ? `No es posible ${actionName} una matrícula en un período académico cerrado.`
              : `No es posible ${actionName} una matrícula, la ventana de matrícula ha finalizado.`;
            alertWarning(reasonMsg, reasonLabel);
            return false;
          }
        } catch {
          console.warn("[ENROLLMENTS] No se pudo verificar el período académico");
        }
      }

      return true;
    } catch (err) {
      console.error(`[ENROLLMENTS] Error al validar acción ${actionName}:`, err);
      return true;
    }
  };

  // ==============================
  // 🔹 FETCHES
  // ==============================

  const fetchAll = useCallback(() =>
    execute(async () => {
      const response = await enrollmentService.getAll();
      let data = isSuccessResponse(response)
        ? extractData(response)
        : response;

      data = await enrichEnrollmentsWithStudents(data);
      data = await enrichEnrollmentsWithAcademicPeriods(data);
      data = sortEnrollments(data);

      setEnrollments(data);
      return data;
    }), []);

  const fetchByStudent = useCallback((studentId) =>
    execute(async () => {
      const response = await enrollmentService.getByStudent(studentId);
      let data = isSuccessResponse(response)
        ? extractData(response)
        : response;

      data = Array.isArray(data) ? data : [];
      data = await enrichEnrollmentsWithStudents(data);
      data = await enrichEnrollmentsWithAcademicPeriods(data);

      setEnrollments(data);
    }), []);

  const fetchByAcademicPeriod = useCallback((periodId) =>
    execute(async () => {
      const response = await enrollmentService.getAll();
      let data = isSuccessResponse(response)
        ? extractData(response)
        : response;

      data = await enrichEnrollmentsWithStudents(data);
      data = await enrichEnrollmentsWithAcademicPeriods(data);

      const filtered = Array.isArray(data)
        ? data.filter((e) => e.academicPeriodId === periodId)
        : [];

      setEnrollments(filtered);
    }), []);

  const fetchByInstitution = useCallback((institutionId) =>
    execute(async () => {
      const response = await enrollmentService.getByInstitution(institutionId);
      let data = isSuccessResponse(response)
        ? extractData(response)
        : response;

      data = await enrichEnrollmentsWithStudents(data);
      data = await enrichEnrollmentsWithAcademicPeriods(data);
      data = sortEnrollments(data);

      setEnrollments(data);
    }), []);

  const fetchById = useCallback(async (id) => {
    try {
      const response = await enrollmentService.getById(id);
      return isSuccessResponse(response)
        ? extractData(response)
        : response;
    } catch (err) {
      alertApiError(err);
      throw err;
    }
  }, []);

  // ==============================
  // 🔹 CREATE / UPDATE
  // ==============================

  const syncStudentClassroom = async (payload) => {
    if (payload.studentId && payload.classroomId) {
      try {
        await studentService.update(payload.studentId, {
          classroomId: payload.classroomId,
          institutionId: payload.institutionId,
        });
      } catch (err) {
        console.error("❌ Error sincronizando estudiante:", err);
      }
    }
  };

  const createEnrollment = useCallback(async (payload) => {
    try {
      const response = await enrollmentService.create(payload);

      await syncStudentClassroom(payload);

      alertCreated("Matrícula");
      return response;
    } catch (error) {
      const msg = mapEnrollmentError(error, "Error al crear matrícula");
      alertApiError(new Error(msg));
      throw error;
    }
  }, []);

  const updateEnrollment = useCallback(async (id, payload) => {
    const allowed = await guardEnrollmentAction(id, "editar");
    if (!allowed) return null;

    try {
      const response = await enrollmentService.update(id, payload);

      await syncStudentClassroom(payload);

      alertUpdated("Matrícula");
      return response;
    } catch (error) {
      const msg = mapEnrollmentError(error, "Error al actualizar matrícula");
      alertApiError(new Error(msg));
      throw error;
    }
  }, []);

  // ==============================
  // 🔹 DELETE / STATUS
  // ==============================

  const deleteEnrollment = useCallback(async (id) => {
    try {
      const confirm = await alertConfirmDelete("matrícula");
      if (!confirm.isConfirmed) return null;

      const allowed = await guardEnrollmentAction(id, "eliminar");
      if (!allowed) return false;

      await enrollmentService.delete(id);
      alertDeleted("Matrícula");

      return true;
    } catch (err) {
      let msg = "Error al eliminar la matrícula";

      if (err.response?.status === 500)
        msg = "Error interno del servidor";
      else if (err.response?.status === 404)
        msg = "No encontrada";
      else if (err.response?.status === 403)
        msg = "Sin permisos";
      else if (err.response?.status === 409)
        msg = "Está en uso";

      alertApiError(new Error(msg));
      return false;
    }
  }, []);

  const restoreEnrollment = useCallback(async () => {
    alertApiError(new Error("No implementado en backend"));
    return false;
  }, []);

  const activateEnrollment = useCallback(async (id) => {
    const allowed = await guardEnrollmentAction(id, "activar");
    if (!allowed) return false;

    try {
      await enrollmentService.activate(id);
      alertUpdated("Matrícula activada");
      return true;
    } catch (err) {
      alertApiError(err);
      return false;
    }
  }, []);

  const setPendingEnrollment = useCallback(async (id) => {
    const allowed = await guardEnrollmentAction(id, "cambiar a pendiente");
    if (!allowed) return false;

    try {
      await enrollmentService.setPending(id);
      alertUpdated("Matrícula pendiente");
      return true;
    } catch (err) {
      alertApiError(err);
      return false;
    }
  }, []);

  const archiveByYear = useCallback(async (academicYear) => {
    try {
      const confirm = await alertConfirmAction({
        title: "Archivar matrículas",
        message: `¿Estás seguro de archivar todas las matrículas del año ${academicYear}? Se marcarán como INACTIVE conservando todos sus datos.`,
        confirmText: "Sí, archivar",
        cancelText: "Cancelar",
        icon: "warning",
        confirmColor: "orange",
      });
      if (!confirm.isConfirmed) return false;

      const response = await enrollmentService.archiveByYear(academicYear);
      alertUpdated(`Matrículas del ${academicYear} archivadas (${response?.data ?? ""})`);
      return true;
    } catch (err) {
      alertApiError(err);
      return false;
    }
  }, []);

  // ==============================
  return {
    enrollments,
    loading,
    error,
    fetchAll,
    fetchByStudent,
    fetchByAcademicPeriod,
    fetchByInstitution,
    fetchById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    restoreEnrollment,
    activateEnrollment,
    setPendingEnrollment,
    archiveByYear,
  };
}