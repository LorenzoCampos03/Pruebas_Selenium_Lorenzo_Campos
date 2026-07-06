import { getPeriodLabel } from '@/core/utils/periodUtils'
import { IconGenerar, IconVer, IconEditar, IconEliminar, IconPDF } from './ReportCardIcons'

export function ReportCardTable({ 
  students, 
  boletasPorEstudiante, 
  periodNumber, 
  academicYear,
  generando,
  generandoId,
  onGenerarIndividual 
}) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-16 text-center text-sm text-gray-400">
          No hay estudiantes registrados en esta aula
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estudiante</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CUI</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Periodo</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PDF</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map(student => {
            const boletas = boletasPorEstudiante[student.id] || []
            const boletaActual = boletas.find(b => b.periodNumber === periodNumber && b.academicYear === academicYear)
            const tieneBoletaHoy = !!boletaActual
            const isGenerandoEste = generandoId === student.id
            const pdfUrl = boletaActual ? boletaActual.pdfUrl : null

            return (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                      {student.firstName ? student.firstName[0] : ''}{student.lastName ? student.lastName[0] : ''}
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.lastName} {student.motherLastName}, {student.firstName}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500 font-mono">{student.cui || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{getPeriodLabel('BIMESTRE', periodNumber)} {academicYear}</td>
                <td className="px-5 py-4">
                  {tieneBoletaHoy ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Generada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {pdfUrl ? (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      <IconPDF />
                      Ver PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onGenerarIndividual(student)}
                      disabled={generando}
                      title={tieneBoletaHoy ? 'Regenerar boleta' : 'Generar boleta'}
                      className={'p-1.5 rounded-lg transition-colors disabled:opacity-40 ' + (tieneBoletaHoy ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50')}
                    >
                      {isGenerandoEste ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IconGenerar />
                      )}
                    </button>
                    {pdfUrl ? (
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" title="Ver PDF" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                        <IconVer />
                      </a>
                    ) : (
                      <button disabled title="No hay PDF aun" className="p-1.5 rounded-lg text-blue-300 cursor-not-allowed opacity-30">
                        <IconVer />
                      </button>
                    )}
                    <button disabled title="Solo administrador puede editar" className="p-1.5 rounded-lg text-indigo-300 cursor-not-allowed opacity-30">
                      <IconEditar />
                    </button>
                    <button disabled title="Solo administrador puede eliminar" className="p-1.5 rounded-lg text-red-300 cursor-not-allowed opacity-30">
                      <IconEliminar />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
