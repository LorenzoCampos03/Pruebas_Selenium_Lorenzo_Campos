export const CLASSROOM_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
};

export const CLASSROOM_STATUS_LABELS = {
     [CLASSROOM_STATUS.ACTIVE]: "Activa",
     [CLASSROOM_STATUS.INACTIVE]: "Inactiva",
};

export const CLASSROOM_SHIFTS = [
     { value: "MAÑANA", label: "Mañana" },
     { value: "TARDE", label: "Tarde" },
];

export const CLASSROOM_AGES = [
     { value: "3 años", label: "3 años" },
     { value: "4 años", label: "4 años" },
     { value: "5 años", label: "5 años" },
];

export const CLASSROOM_COLORS = [
     { value: "#EF4444", label: "Rojo" },
     { value: "#F59E0B", label: "Amarillo" },
     { value: "#10B981", label: "Verde" },
     { value: "#3B82F6", label: "Azul" },
     { value: "#8B5CF6", label: "Morado" },
     { value: "#EC4899", label: "Rosa" },
     { value: "#F97316", label: "Naranja" },
     { value: "#06B6D4", label: "Cian" },
];

export function createEmptyClassroom() {
     return {
          id: null,
          name: "",
          age: "",
          capacity: "",
          color: "",
          status: CLASSROOM_STATUS.ACTIVE,
     };
}

export function formatClassroomForApi(classroom) {
     return {
          classroomName: classroom.name,
          classroomAge: classroom.age,
          capacity: Number(classroom.capacity),
          color: classroom.color || null,
     };
}

export function parseClassroomFromApi(apiData) {
     return {
          id: apiData.id,
          name: apiData.classroomName || apiData.name || "",
          age: apiData.classroomAge || apiData.age || "",
          capacity: apiData.capacity || "",
          color: apiData.color || "",
          status: apiData.status || CLASSROOM_STATUS.ACTIVE,
          institutionId: apiData.institutionId || null,
          createdAt: apiData.createdAt || null,
          updatedAt: apiData.updatedAt || null,
     };
}
