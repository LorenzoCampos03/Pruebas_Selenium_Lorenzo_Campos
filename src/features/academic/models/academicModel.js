export const ACADEMIC_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
};

export const ACADEMIC_STATUS_LABELS = {
  [ACADEMIC_STATUS.ACTIVE]: "Activo",
  [ACADEMIC_STATUS.INACTIVE]: "Inactivo",
};

export const AGE_LEVELS = {
  TRES_ANOS: "3 años",
  CUATRO_ANOS: "4 años",
  CINCO_ANOS: "5 años",
};

export const AGE_LEVEL_LABELS = {
  [AGE_LEVELS.TRES_ANOS]: "3 Años",
  [AGE_LEVELS.CUATRO_ANOS]: "4 Años",
  [AGE_LEVELS.CINCO_ANOS]: "5 Años",
};

export const CURRICULAR_AREAS = {
  PERSONAL_SOCIAL: "PERSONAL_SOCIAL",
  PSICOMOTRIZ: "PSICOMOTRIZ",
  COMUNICACION: "COMUNICACION",
  MATEMATICA: "MATEMATICA",
  CIENCIA_Y_TECNOLOGIA: "CIENCIA_Y_TECNOLOGIA",
  EDUCACION_RELIGIOSA: "EDUCACION_RELIGIOSA",
  ARTE_Y_CULTURA: "ARTE_Y_CULTURA",
};

export const CURRICULAR_AREA_LABELS = {
  [CURRICULAR_AREAS.PERSONAL_SOCIAL]: "Personal Social",
  [CURRICULAR_AREAS.PSICOMOTRIZ]: "Psicomotriz",
  [CURRICULAR_AREAS.COMUNICACION]: "Comunicación",
  [CURRICULAR_AREAS.MATEMATICA]: "Matemática",
  [CURRICULAR_AREAS.CIENCIA_Y_TECNOLOGIA]: "Ciencia y Tecnología",
  [CURRICULAR_AREAS.EDUCACION_RELIGIOSA]: "Educación Religiosa",
  [CURRICULAR_AREAS.ARTE_Y_CULTURA]: "Arte y Cultura",
};

export function createEmptyCompetency() {
  return {
    id: "",
    courseId: "",
    institutionId: "",
    code: "",
    name: "",
    description: "",
    orderIndex: 1,
    status: ACADEMIC_STATUS.ACTIVE,
  };
}

export function createEmptyCapacity() {
  return {
    id: "",
    competencyId: "",
    institutionId: "",
    code: "",
    name: "",
    description: "",
    orderIndex: 1,
    status: ACADEMIC_STATUS.ACTIVE,
  };
}

export function createEmptyPerformance() {
  return {
    id: "",
    capacityId: "",
    institutionId: "",
    code: "",
    description: "",
    ageLevel: "",
    orderIndex: 1,
    status: ACADEMIC_STATUS.ACTIVE,
  };
}