// Exportaciones centralizadas de servicios de grades/notes
export { gradeService } from './gradeService'
export { reportCardsService } from './ReportCard.service'
export { dailyEvaluationService } from './DailyEvaluation.service'
export { notesService } from './notesService'
export { generarBoletaIndividual, generarBoletasMasivas } from './reportCardGenerator.service'

// Re-exportar para compatibilidad con código existente
export { reportCardsService as ReportCardService } from './ReportCard.service'
export { dailyEvaluationService as DailyEvaluationService } from './DailyEvaluation.service'