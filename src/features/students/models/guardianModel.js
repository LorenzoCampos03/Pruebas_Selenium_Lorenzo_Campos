export const GUARDIAN_RELATIONSHIPS = [
     { value: "PADRE", label: "Padre" },
     { value: "MADRE", label: "Madre" },
     { value: "APODERADO", label: "Apoderado" },
];

export function createEmptyGuardian() {
     return {
          id: null,
          studentId: "",
          firstName: "",
          lastName: "",
          motherLastName: "",
          relationship: "",
          documentType: "DNI",
          documentNumber: "",
          phone: "",
          email: "",
          isEmergencyContact: false,
          emergencyPhone: "",
          whatsapp: "",
     };
}

export function formatGuardianForApi(guardian) {
     const payload = {
          studentId: guardian.studentId,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          relationship: guardian.relationship,
          documentType: guardian.documentType,
          documentNumber: guardian.documentNumber,
          phone: guardian.phone,
          isEmergencyContact: guardian.isEmergencyContact || false,
     };

     if (guardian.motherLastName) payload.motherLastName = guardian.motherLastName;
     if (guardian.email) payload.email = guardian.email;
     if (guardian.emergencyPhone) payload.emergencyPhone = guardian.emergencyPhone;
     if (guardian.whatsapp) payload.whatsapp = guardian.whatsapp;

     return payload;
}

export function formatGuardianUpdateForApi(guardian) {
     const payload = {};
     const fields = [
          "firstName", "lastName", "motherLastName", "relationship",
          "documentType", "documentNumber", "phone", "email",
          "isEmergencyContact", "emergencyPhone", "whatsapp",
     ];

     fields.forEach((field) => {
          if (guardian[field] !== undefined && guardian[field] !== null) {
               payload[field] = guardian[field];
          }
     });

     return payload;
}

export function parseGuardianFromApi(data) {
     return {
          id: data.id,
          studentId: data.studentId || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          motherLastName: data.motherLastName || "",
          relationship: data.relationship || "",
          documentType: data.documentType || "DNI",
          documentNumber: data.documentNumber || "",
          phone: data.phone || "",
          email: data.email || "",
          isEmergencyContact: data.isEmergencyContact || data.emergencyContact || false,
          emergencyPhone: data.emergencyPhone || "",
          whatsapp: data.whatsapp || "",
          status: data.status || "A",
          photoUrl: data.photoUrl || "",
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          createdBy: data.createdBy || "",
          updatedBy: data.updatedBy || "",
     };
}
