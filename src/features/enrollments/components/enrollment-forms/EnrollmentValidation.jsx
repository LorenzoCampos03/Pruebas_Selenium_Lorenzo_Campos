import PropTypes from "prop-types";

/**
 * Componente para mostrar errores de validación de enrollment
 * Componente presentacional sin estado propio
 */
export function EnrollmentValidation({ validationErrors }) {
  // Si no hay errores, no mostrar nada
  if (!validationErrors || Object.keys(validationErrors).length === 0) {
    return null;
  }

  const errorEntries = Object.entries(validationErrors);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {errorEntries.length === 1
              ? "Se encontró un error de validación"
              : `Se encontraron ${errorEntries.length} errores de validación`}
          </h3>

          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <span className="font-medium">
                    {getFieldLabel(field)}:
                  </span>{" "}
                  {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

EnrollmentValidation.propTypes = {
  validationErrors: PropTypes.object,
};

/**
 * Obtiene una etiqueta legible para un campo
 */
function getFieldLabel(field) {
  const labels = {
    studentId: "Estudiante",
    institutionId: "Institución",
    classroomId: "Aula",
    academicYear: "Año Académico",
    academicPeriodId: "Período Académico",
    enrollmentDate: "Fecha de Matrícula",
    enrollmentStatus: "Estado",
    enrollmentType: "Tipo de Matrícula",
    ageGroup: "Grupo de Edad",
    shift: "Turno",
    section: "Sección",
    modality: "Modalidad",
    educationalLevel: "Nivel Educativo",
    studentAge: "Edad del Estudiante",
    observations: "Observaciones",
    general: "General",
  };

  return labels[field] || field;
}