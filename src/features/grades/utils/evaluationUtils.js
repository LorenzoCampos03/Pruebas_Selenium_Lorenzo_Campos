import { EVALUATION_CONFIG } from '../config/evaluationConfig';

/**
 * Formatea una fecha a formato legible
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Obtiene la etiqueta de un nivel de logro
 */
export const getAchievementLabel = (level) => {
  return EVALUATION_CONFIG.ACHIEVEMENT_LABELS[level] || level;
};

/**
 * Obtiene el color de un nivel de logro
 */
export const getAchievementColor = (level) => {
  return EVALUATION_CONFIG.ACHIEVEMENT_COLORS[level] || '#6b7280';
};

/**
 * Valida si una evaluación está completa
 */
export const isEvaluationComplete = (evaluation) => {
  if (!evaluation.classroom || !evaluation.course || !evaluation.competency) {
    return false;
  }

  if (evaluation.details.size === 0) {
    return false;
  }

  // Verificar que todos los estudiantes tengan un nivel de logro
  for (const detail of evaluation.details.values()) {
    if (!detail.achievementLevel) {
      return false;
    }
  }

  return true;
};

/**
 * Calcula el porcentaje de evaluación completada
 */
export const calculateEvaluationProgress = (evaluatedCount, totalCount) => {
  if (totalCount === 0) return 0;
  return Math.round((evaluatedCount / totalCount) * 100);
};

/**
 * Obtiene el nombre completo de un estudiante
 */
export const getStudentFullName = (student) => {
  const { firstName, lastName, motherLastName } = student;
  return `${lastName} ${motherLastName}, ${firstName}`.trim();
};

/**
 * Agrupa estudiantes por nivel de logro
 */
export const groupStudentsByAchievementLevel = (students, details) => {
  const grouped = {
    AD: [],
    A: [],
    B: [],
    C: [],
    SIN_EVALUAR: [],
  };

  students.forEach(student => {
    const detail = details.get(student.id);
    if (detail && detail.achievementLevel) {
      grouped[detail.achievementLevel].push(student);
    } else {
      grouped.SIN_EVALUAR.push(student);
    }
  });

  return grouped;
};

/**
 * Genera un resumen de evaluación
 */
export const generateEvaluationSummary = (students, details) => {
  const grouped = groupStudentsByAchievementLevel(students, details);
  const total = students.length;

  return {
    total,
    AD: {
      count: grouped.AD.length,
      percentage: Math.round((grouped.AD.length / total) * 100),
    },
    A: {
      count: grouped.A.length,
      percentage: Math.round((grouped.A.length / total) * 100),
    },
    B: {
      count: grouped.B.length,
      percentage: Math.round((grouped.B.length / total) * 100),
    },
    C: {
      count: grouped.C.length,
      percentage: Math.round((grouped.C.length / total) * 100),
    },
    SIN_EVALUAR: {
      count: grouped.SIN_EVALUAR.length,
      percentage: Math.round((grouped.SIN_EVALUAR.length / total) * 100),
    },
  };
};

/**
 * Exporta evaluación a CSV
 */
export const exportEvaluationToCSV = (evaluation, students, details) => {
  const headers = ['Estudiante', 'CUI', 'Nivel de Logro', 'Observación'];
  const rows = students.map(student => {
    const detail = details.get(student.id);
    return [
      getStudentFullName(student),
      student.cui,
      detail?.achievementLevel ? getAchievementLabel(detail.achievementLevel) : 'Sin evaluar',
      detail?.observation || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Descarga un archivo CSV
 */
export const downloadCSV = (content, filename) => {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Valida que un estudiante tenga evaluación completa
 */
export const isStudentEvaluated = (studentId, details) => {
  const detail = details.get(studentId);
  return detail && detail.achievementLevel;
};

/**
 * Obtiene estadísticas de evaluación
 */
export const getEvaluationStats = (students, details) => {
  const evaluated = Array.from(details.values()).filter(d => d.achievementLevel).length;
  const notEvaluated = students.length - evaluated;

  return {
    total: students.length,
    evaluated,
    notEvaluated,
    completionPercentage: Math.round((evaluated / students.length) * 100),
  };
};
