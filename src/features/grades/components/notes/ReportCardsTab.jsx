import { Suspense, lazy } from 'react'

const ReportCardList = lazy(() => import('../../pages/ReportCardList').then(module => ({ default: module.ReportCardList })))

export default function ReportCardsTab() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ReportCardList />
    </Suspense>
  )
}
