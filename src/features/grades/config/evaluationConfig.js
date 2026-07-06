/**
 * Configuración de URLs para el servicio de evaluaciones
 * Ajusta estas URLs según tu backend
 */

export const EVALUATION_ENDPOINTS = {
  // Evaluaciones (Notes Microservice) - Dentro de GRADES
  EVALUATIONS: {
    BASE: '/api/v1/evaluations',
    BY_ID: (id) => `/api/v1/evaluations/${id}`,
    DETAILS: (id) => `/api/v1/evaluations/${id}/details`,
    BY_TEACHER_CLASSROOM: (teacherId, classroomId) => `/api/v1/evaluations/teacher/${teacherId}/classroom/${classroomId}`,
    COURSES_BY_TEACHER_CLASSROOM: (teacherId, classroomId) => `/api/v1/evaluations/teacher/${teacherId}/classroom/${classroomId}/courses`,
    UPDATE_DETAIL: (evaluationId, detailId) => `/api/v1/evaluations/${evaluationId}/details/${detailId}`,
    FINALIZE: (id) => `/api/v1/evaluations/${id}/finalize`,
    CANCEL: (id) => `/api/v1/evaluations/${id}/cancel`,
    EXISTS: '/api/v1/evaluations/exists',
  },

  // Boletas de Calificaciones (Notes Microservice) - Mantener REPORT_CARDS existente
  REPORTCARDS: {
    BASE: '/api/v1/reportcards',
    BY_ID: (id) => `/api/v1/reportcards/${id}`,
    BY_STUDENT: (studentId) => `/api/v1/reportcards/student/${studentId}`,
    BY_CLASSROOM: (classroomId) => `/api/v1/reportcards/classroom/${classroomId}`,
    BY_INSTITUTION: (institutionId) => `/api/v1/reportcards/institution/${institutionId}`,
    BY_STATUS: (status) => `/api/v1/reportcards/status/${status}`,
    RESTORE: (id) => `/api/v1/reportcards/${id}/restore`,
  },

  // Aulas (Institution Management Microservice)
  CLASSROOMS: {
    BASE: '/api/classrooms',
    BY_ID: (id) => `/api/classrooms/${id}`,
    BY_INSTITUTION: (institutionId) => `/api/classrooms/institution/${institutionId}`,
  },

  // Cursos (Academic Management Microservice)
  COURSES: {
    BASE: '/api/v1/courses',
    BY_ID: (id) => `/api/v1/courses/${id}`,
    BY_INSTITUTION: (institutionId) => `/api/v1/courses/institution/${institutionId}`,
    ACTIVE_BY_INSTITUTION: (institutionId) => `/api/v1/courses/institution/${institutionId}/active`,
  },

  // Competencias (Academic Management Microservice)
  COMPETENCIES: {
    BASE: '/api/v1/competencies',
    BY_ID: (id) => `/api/v1/competencies/${id}`,
    BY_COURSE: (courseId) => `/api/v1/competencies/course/${courseId}`,
    ACTIVE_BY_COURSE: (courseId) => `/api/v1/competencies/course/${courseId}/active`,
  },

  // Estudiantes (Students Microservice)
  STUDENTS: {
    BASE: '/api/students',
    BY_ID: (id) => `/api/students/${id}`,
    BY_CLASSROOM: (classroomId) => `/api/students/classroom/${classroomId}`,
  },
};

/**
 * Configuración de estados y niveles
 */
export const EVALUATION_CONFIG = {
  // Estados de evaluación
  STATUS: {
    EN_PROCESO: 'EN_PROCESO',
    FINALIZADO: 'FINALIZADO',
  },

  // Niveles de logro
  ACHIEVEMENT_LEVELS: {
    AD: 'AD',
    A: 'A',
    B: 'B',
    C: 'C',
  },

  // Etiquetas de niveles
  ACHIEVEMENT_LABELS: {
    AD: 'Logro Destacado',
    A: 'Logro Esperado',
    B: 'En Proceso',
    C: 'En Inicio',
  },

  // Colores para niveles
  ACHIEVEMENT_COLORS: {
    AD: '#10b981', // Verde
    A: '#3b82f6',  // Azul
    B: '#f59e0b',  // Ámbar
    C: '#ef4444',  // Rojo
  },
};

/**
 * Mensajes de validación
 */
export const VALIDATION_MESSAGES = {
  CLASSROOM_REQUIRED: 'Por favor selecciona un aula',
  COURSE_REQUIRED: 'Por favor selecciona un curso',
  COMPETENCY_REQUIRED: 'Por favor selecciona una competencia',
  DATE_REQUIRED: 'Por favor selecciona una fecha',
  STUDENTS_REQUIRED: 'Por favor evalúa al menos un estudiante',
  ACHIEVEMENT_LEVEL_REQUIRED: 'Por favor selecciona un nivel de logro para cada estudiante',
};

/**
 * Configuración de paginación
 */
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 10,
  MAX_ITEMS_PER_PAGE: 50,
};
