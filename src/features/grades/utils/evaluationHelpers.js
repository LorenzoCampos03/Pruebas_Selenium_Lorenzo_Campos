/**
 * Construye el payload para crear una evaluación
 */
export function buildEvaluationPayload({ classroom, course, teacherId, evaluationDate, details }) {
  const academicPeriodId = classroom?.academicYear 
    || classroom?.academicPeriod 
    || classroom?.year 
    || new Date().getFullYear().toString()

  return {
    classroomId: classroom?.id,
    courseId: course?.id,
    teacherId,
    academicPeriodId,
    evaluationDate,
    details: Array.from(details.values()).map(d => ({
      studentId: d.studentId,
      competencyId: d.competencyId,
      achievementLevel: d.achievementLevel,
      observation: d.observation
    }))
  }
}

/**
 * Valida que el payload tenga los datos necesarios
 */
export function validateEvaluationPayload(payload, detailsArray) {
  if (!detailsArray.length) {
    return { valid: false, error: 'Debes evaluar al menos un estudiante' }
  }

  if (!payload.teacherId) {
    return { 
      valid: false, 
      error: 'No se pudo obtener el ID del profesor. Por favor, vuelve a iniciar sesión.' 
    }
  }

  return { valid: true }
}

/**
 * Convierte detalles de evaluación en un Map
 */
export function detailsArrayToMap(detailsArray) {
  const detailsMap = new Map()
  detailsArray.forEach(d => {
    detailsMap.set(`${d.studentId}-${d.competencyId}`, {
      id: d.id,
      studentId: d.studentId,
      competencyId: d.competencyId,
      achievementLevel: d.achievementLevel,
      observation: d.observation
    })
  })
  return detailsMap
}

/**
 * Obtiene el mensaje de error de una respuesta
 */
export function getErrorMessage(err) {
  return err.response?.data?.message 
    || err.response?.data?.error 
    || err.message 
    || 'Error desconocido'
}

/**
 * Valida que el usuario tenga institución asignada
 */
export function validateUserInstitution(user) {
  if (!user?.institutionId) {
    return { 
      valid: false, 
      error: 'El usuario no tiene una institución asignada' 
    }
  }
  return { valid: true }
}

/**
 * Valida que el aula tenga nivel de edad
 */
export function validateClassroomAge(classroom) {
  if (!classroom?.classroomAge) {
    return { 
      valid: false, 
      error: 'El aula no tiene nivel de edad configurado' 
    }
  }
  return { valid: true }
}
