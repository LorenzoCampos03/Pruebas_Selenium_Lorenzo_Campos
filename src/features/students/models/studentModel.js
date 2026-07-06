export const STUDENT_STATUS = {
     ACTIVE: "ACTIVE",
     INACTIVE: "INACTIVE",
     TRANSFERRED: "TRANSFERRED",
};

export const STUDENT_STATUS_LABELS = {
     [STUDENT_STATUS.ACTIVE]: "Activo",
     [STUDENT_STATUS.INACTIVE]: "Inactivo",
     [STUDENT_STATUS.TRANSFERRED]: "Transferido",
};

export const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export const GENDERS = [
     { value: "M", label: "Masculino" },
     { value: "F", label: "Femenino" },
];

export function createEmptyStudent() {
     return {
          id: null,
          cui: "",
          firstName: "",
          lastName: "",
          motherLastName: "",
          documentType: "DNI",
          documentNumber: "",
          gender: "",
          dateOfBirth: "",
          address: "",
          photoUrl: "",
          institutionId: "",
          classroomId: "",
          motorDevelopment: "",
          languageDevelopment: "",
          socialDevelopment: "",
          developmentObservations: "",
          bloodType: "",
          allergies: "",
          medications: "",
          conditions: "",
          emergencyNotes: "",
          status: STUDENT_STATUS.ACTIVE,
     };
}

export function formatStudentForApi(student) {
     const payload = {
          cui: student.cui,
          firstName: student.firstName,
          lastName: student.lastName,
          documentType: student.documentType,
          documentNumber: student.documentNumber,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          institutionId: student.institutionId,
          classroomId: student.classroomId,
     };

     if (student.motherLastName) payload.motherLastName = student.motherLastName;
     if (student.address) payload.address = student.address;
     if (student.photoUrl) payload.photoUrl = student.photoUrl;
     if (student.motorDevelopment) payload.motorDevelopment = student.motorDevelopment;
     if (student.languageDevelopment) payload.languageDevelopment = student.languageDevelopment;
     if (student.socialDevelopment) payload.socialDevelopment = student.socialDevelopment;
     if (student.developmentObservations) payload.developmentObservations = student.developmentObservations;
     if (student.bloodType) payload.bloodType = student.bloodType;
     if (student.allergies) payload.allergies = student.allergies;
     if (student.medications) payload.medications = student.medications;
     if (student.conditions) payload.conditions = student.conditions;
     if (student.emergencyNotes) payload.emergencyNotes = student.emergencyNotes;

     return payload;
}

export function formatStudentUpdateForApi(student) {
     const payload = {};
     const fields = [
          "cui", "firstName", "lastName", "motherLastName", "documentType",
          "documentNumber", "gender", "dateOfBirth", "address", "photoUrl",
          "institutionId", "classroomId", "motorDevelopment", "languageDevelopment",
          "socialDevelopment", "developmentObservations", "bloodType", "allergies",
          "medications", "conditions", "emergencyNotes",
     ];

     fields.forEach((field) => {
          if (student[field] !== undefined && student[field] !== null) {
               payload[field] = student[field];
          }
     });

     return payload;
}

export function parseStudentFromApi(data) {
     return {
          id: data.id,
          cui: data.cui || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          motherLastName: data.motherLastName || "",
          documentType: data.documentType || "DNI",
          documentNumber: data.documentNumber || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          address: data.address || "",
          photoUrl: data.photoUrl || "",
          institutionId: data.institutionId || "",
          classroomId: data.classroomId || "",
          motorDevelopment: data.motorDevelopment || "",
          languageDevelopment: data.languageDevelopment || "",
          socialDevelopment: data.socialDevelopment || "",
          developmentObservations: data.developmentObservations || "",
          bloodType: data.bloodType || "",
          allergies: data.allergies || "",
          medications: data.medications || "",
          conditions: data.conditions || "",
          emergencyNotes: data.emergencyNotes || "",
          status: data.status || STUDENT_STATUS.ACTIVE,
          guardians: data.guardians || [],
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          createdBy: data.createdBy || "",
          updatedBy: data.updatedBy || "",
     };
}
