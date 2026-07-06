// Este componente ahora usa el listado existente de DailyEvaluationList
import { Suspense, lazy } from 'react'

const DailyEvaluationList = lazy(() => import('../../pages/DailyEvaluationList'))

export default function DailyEvaluationsTab() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <DailyEvaluationList />
    </Suspense>
  )
}
