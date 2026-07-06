export function isSuccessResponse(response) {
     return response && response.success === true;
}

export function isErrorResponse(response) {
     return response && response.success === false;
}

export function extractData(response) {
     if (isSuccessResponse(response)) {
          return response.data;
     }
     return null;
}

export function extractMessage(response) {
     return response?.message || "Operación completada";
}

export function extractErrorDetails(error) {
     const response = error?.response?.data;

     if (isErrorResponse(response)) {
          return {
               status: response.status,
               errorCode: response.errorCode,
               message: response.message,
               details: response.details || [],
               path: response.path,
               timestamp: response.timestamp,
          };
     }

     if (error?.response) {
          return {
               status: error.response.status,
               errorCode: "UNKNOWN_ERROR",
               message: error.response.data?.message || error.message || "Error desconocido",
               details: [],
               path: "",
               timestamp: new Date().toISOString(),
          };
     }

     if (error?.code === "ECONNABORTED") {
          return {
               status: 408,
               errorCode: "TIMEOUT",
               message: "La solicitud tardó demasiado. Intente nuevamente.",
               details: [],
               path: "",
               timestamp: new Date().toISOString(),
          };
     }

     if (!error?.response) {
          return {
               status: 0,
               errorCode: "NETWORK_ERROR",
               message: "No se pudo conectar con el servidor. Verifique su conexión.",
               details: [],
               path: "",
               timestamp: new Date().toISOString(),
          };
     }

     return {
          status: 500,
          errorCode: "UNKNOWN_ERROR",
          message: error?.message || "Error desconocido",
          details: [],
          path: "",
          timestamp: new Date().toISOString(),
     };
}

export function getValidationErrors(error) {
     const errorData = extractErrorDetails(error);
     if (errorData.errorCode === "VALIDATION_ERROR" && errorData.details.length > 0) {
          const fieldErrors = {};
          errorData.details.forEach((detail) => {
               const [field, ...messageParts] = detail.split(": ");
               if (field && messageParts.length > 0) {
                    fieldErrors[field.trim()] = messageParts.join(": ").trim();
               }
          });
          return fieldErrors;
     }
     return null;
}

export const ERROR_CODES = {
     RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
     VALIDATION_ERROR: "VALIDATION_ERROR",
     INTERNAL_ERROR: "INTERNAL_ERROR",
     ACCESS_DENIED: "ACCESS_DENIED",
     CONFLICT: "CONFLICT",
     DUPLICATE_MODULAR_CODE: "DUPLICATE_MODULAR_CODE",
     DUPLICATE_ENROLLMENT: "DUPLICATE_ENROLLMENT",
     INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
     TIMEOUT: "TIMEOUT",
     NETWORK_ERROR: "NETWORK_ERROR",
     UNKNOWN_ERROR: "UNKNOWN_ERROR",
};
