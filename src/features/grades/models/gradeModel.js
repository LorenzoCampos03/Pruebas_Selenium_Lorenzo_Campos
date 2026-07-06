export const GRADE_LEVELS = {
     AD: "AD",
     A: "A",
     B: "B",
     C: "C",
};

export const GRADE_LEVEL_LABELS = {
     [GRADE_LEVELS.AD]: "Logro Destacado",
     [GRADE_LEVELS.A]: "Logro Esperado",
     [GRADE_LEVELS.B]: "En Proceso",
     [GRADE_LEVELS.C]: "En Inicio",
};

export function createEmptyGrade() {
     return {
          id: null,
          studentId: "",
          courseId: "",
          competencyId: "",
          period: "",
          grade: "",
          observations: "",
     };
}

export function formatGradeForApi(grade) {
     return {
          studentId: grade.studentId,
          courseId: grade.courseId,
          competencyId: grade.competencyId,
          period: grade.period,
          grade: grade.grade,
          observations: grade.observations,
     };
}

export function parseGradeFromApi(apiData) {
     return {
          id: apiData.id,
          studentId: apiData.studentId || "",
          courseId: apiData.courseId || "",
          competencyId: apiData.competencyId || "",
          period: apiData.period || "",
          grade: apiData.grade || "",
          observations: apiData.observations || "",
          createdAt: apiData.createdAt || null,
     };
}
