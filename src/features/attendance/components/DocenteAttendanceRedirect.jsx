import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import apiClient from "@/core/api/apiClient";
import AttendancePage from "../pages/AttendancePage";

export default function DocenteAttendanceRedirect() {
  const { user } = useAuth();
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!user?.userId) return;

    let cancelled = false;
    const fallback = () => { if (!cancelled) setTarget("__dashboard__"); };

    apiClient.get(`/api/teacher-assignments/teacher/${user.userId}`)
      .then(({ data }) => {
        if (cancelled) return;
        const list = data?.data || data || [];
        const assignments = Array.isArray(list) ? list : [];
        const active = assignments.find(a => a.status === "ACTIVE") || assignments[0];
        if (active?.classroomId) {
          setTarget(`/docente/asistencia/aula/${active.classroomId}`);
        } else {
          fallback();
        }
      })
      .catch(fallback);

    return () => { cancelled = true; };
  }, [user]);

  if (target === "__dashboard__") {
    return <AttendancePage />;
  }

  if (target) {
    return <Navigate to={target} replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Redirigiendo a tu aula…</p>
      </div>
    </div>
  );
}
