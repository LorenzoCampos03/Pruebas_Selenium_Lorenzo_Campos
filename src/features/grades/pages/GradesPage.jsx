import { useNavigate } from 'react-router-dom'
import { FileText, CalendarCheck, ArrowRight, BookOpen, TrendingUp } from 'lucide-react'

export default function GradesPage() {
  const navigate = useNavigate()

  const modules = [
    {
      title: 'Evaluación Diaria',
      description: 'Registra las evaluaciones diarias de tus estudiantes por competencias.',
      icon: CalendarCheck,
      route: '/docente/evaluaciones-diarias',
      accent: '#0891B2',
      accentLight: '#ECFEFF',
      accentMid: '#A5F3FC',
      stat: 'Por competencias',
      statIcon: BookOpen,
    },
    {
      title: 'Notas',
      description: 'Visualiza los promedios y notas de los estudiantes agrupados por curso.',
      icon: TrendingUp,
      route: '/docente/notas',
      accent: '#10B981',
      accentLight: '#D1FAE5',
      accentMid: '#6EE7B7',
      stat: 'Visualización de promedios',
      statIcon: TrendingUp,
    },
    {
      title: 'Boletas de Notas',
      description: 'Gestiona y genera las boletas de notas de los estudiantes por período académico.',
      icon: FileText,
      route: '/docente/BoletasNotas',
      accent: '#2563EB',
      accentLight: '#EFF6FF',
      accentMid: '#BFDBFE',
      stat: 'Por período académico',
      statIcon: TrendingUp,
    },
  ]

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* ── Header limpio ── */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Calificaciones
        </h1>
        <p className="text-sm text-gray-400">
          Selecciona el módulo que deseas gestionar
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        {modules.map((mod, i) => {
          const Icon = mod.icon
          const StatIcon = mod.statIcon
          return (
            <div
              key={mod.title}
              onClick={() => navigate(mod.route)}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group relative bg-white rounded-2xl border border-gray-200 
                         hover:border-transparent hover:shadow-xl cursor-pointer 
                         transition-all duration-300 overflow-hidden
                         animate-[fadeSlideUp_0.4s_ease_forwards] opacity-0"
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${mod.accent}, ${mod.accentMid})` }}
              />

              {/* Hover glow bg */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at top left, ${mod.accentLight} 0%, transparent 60%)` }}
              />

              <div className="relative p-6">
                {/* Icon + arrow row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: mod.accentLight }}
                  >
                    <Icon size={22} style={{ color: mod.accent }} />
                  </div>

                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                    style={{ background: mod.accentLight }}
                  >
                    <ArrowRight size={14} style={{ color: mod.accent }} />
                  </div>
                </div>

                {/* Text */}
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {mod.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  {mod.description}
                </p>

                {/* Stat pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: mod.accentLight, color: mod.accent }}
                >
                  <StatIcon size={11} />
                  {mod.stat}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}