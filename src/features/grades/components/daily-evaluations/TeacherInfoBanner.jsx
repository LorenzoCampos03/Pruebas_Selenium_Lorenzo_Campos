export default function TeacherInfoBanner({ user, institutionName }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm flex flex-wrap gap-6">
      <span>
        👤 Profesor: <strong>{user?.firstName} {user?.lastName}</strong>
      </span>
      <span>
        🏫 Institución: <strong>{institutionName || '—'}</strong>
      </span>
    </div>
  )
}
