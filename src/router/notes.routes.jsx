import { Route } from 'react-router-dom'
import { ReportCardForm } from '@/features/grades/pages/ReportCardForm'
import { ReportCardDetail } from '@/features/grades/pages/ReportCardDetail'
import { ReportCardList } from '@/features/grades/pages/ReportCardList'
import NotesMainPage from '@/features/grades/pages/NotesMainPage'
import StudentNotesDetail from '@/features/grades/pages/StudentNotesDetail'
import DailyEvaluationList from '@/features/grades/pages/DailyEvaluationList'
import DailyEvaluationWizard from '@/features/grades/pages/DailyEvaluationWizard'
import DailyEvaluationDetail from '@/features/grades/pages/DailyEvaluationDetail'
import DailyEvaluationEdit from '@/features/grades/pages/DailyEvaluationEdit'

export const notesRoutes = (
  <>
    {/* Visualización de Notas (solo promedios) */}
    <Route path="notas" element={<NotesMainPage />} />
    <Route path="notas/:studentId" element={<StudentNotesDetail />} />
    
    {/* Rutas de Evaluaciones Diarias - NO TOCAR, ya existen */}
    <Route path="evaluaciones-diarias" element={<DailyEvaluationList />} />
    <Route path="evaluaciones-diarias/nueva" element={<DailyEvaluationWizard />} />
    <Route path="evaluaciones-diarias/:id" element={<DailyEvaluationDetail />} />
    <Route path="evaluaciones-diarias/:id/editar" element={<DailyEvaluationEdit />} />
    
    {/* Rutas de Boletas de Notas - NO TOCAR, ya existen */}
    <Route path="BoletasNotas" element={<ReportCardList />} />
    <Route path="BoletasNotas/nueva" element={<ReportCardForm />} />
    <Route path="BoletasNotas/editar/:id" element={<ReportCardForm isEditing />} />
    <Route path="BoletasNotas/:id" element={<ReportCardDetail />} />
  </>
)