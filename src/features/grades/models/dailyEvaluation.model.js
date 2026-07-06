export const DAILY_EVALUATION_STATUS = {
  EN_PROCESO: 'EN_PROCESO',
  FINALIZADO: 'FINALIZADO',
}

export const DAILY_EVALUATION_STATUS_OPTIONS = [
  { value: 'EN_PROCESO', label: 'En Proceso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
]

export const ACHIEVEMENT_LEVELS = {
  AD: 'AD',
  A: 'A',
  B: 'B',
  C: 'C',
}

export const ACHIEVEMENT_LEVELS_OPTIONS = [
  { value: 'AD', label: 'AD', description: 'Logro destacado', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'A',  label: 'A',  description: 'Logro esperado',  color: 'bg-blue-100 text-blue-800' },
  { value: 'B',  label: 'B',  description: 'En proceso',      color: 'bg-yellow-100 text-yellow-800' },
  { value: 'C',  label: 'C',  description: 'En inicio',       color: 'bg-red-100 text-red-800' },
]

export const ACHIEVEMENT_LABELS = {
  AD: 'Logro Destacado',
  A: 'Logro Esperado',
  B: 'En Proceso',
  C: 'En Inicio',
}

export const getAchievementConfig = (level) =>
  ACHIEVEMENT_LEVELS_OPTIONS.find(l => l.value === level) || null

export const getStatusLabel = (status) =>
  DAILY_EVALUATION_STATUS_OPTIONS.find(o => o.value === status)?.label || status

export const getStatusClass = (status) =>
  status === 'FINALIZADO'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800'