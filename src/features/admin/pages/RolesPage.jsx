import { useState, useEffect } from "react";
import { Shield, RefreshCw, Users, UserCheck, GraduationCap, BookOpen, UserCog, Brain, Home, Building2, TrendingUp } from "lucide-react";
import { Button, Card } from "@/shared/components/ui";
import { LoadingScreen } from "@/shared/components/feedback";
import { userService } from "@/features/users/services/userService";
import { parseUserFromApi } from "@/features/users/models/userModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { ROLE_LABELS } from "@/core/utils/constants";

const ROLE_CONFIG = [
  { role: "ADMINISTRADOR", icon: Shield, bg: "bg-purple-100", text: "text-purple-700", bar: "bg-purple-500", badge: "bg-purple-100 text-purple-700", description: "Gestión global del sistema", group: "Gestión" },
  { role: "DIRECTOR", icon: Building2, bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500", badge: "bg-blue-100 text-blue-700", description: "Dirección institucional", group: "Gestión" },
  { role: "SUBDIRECTOR", icon: UserCheck, bg: "bg-indigo-100", text: "text-indigo-700", bar: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700", description: "Subdirección institucional", group: "Gestión" },
  { role: "SECRETARIA", icon: UserCog, bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500", badge: "bg-green-100 text-green-700", description: "Administración y matrículas", group: "Gestión" },
  { role: "DOCENTE", icon: BookOpen, bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700", description: "Enseñanza y evaluación", group: "Personal" },
  { role: "AUXILIAR", icon: Users, bg: "bg-gray-100", text: "text-gray-700", bar: "bg-gray-400", badge: "bg-gray-100 text-gray-700", description: "Apoyo institucional", group: "Personal" },
  { role: "PSICOLOGO", icon: Brain, bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500", badge: "bg-red-100 text-red-700", description: "Evaluaciones psicológicas", group: "Personal" },
  { role: "PADRE", icon: Home, bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-400", badge: "bg-orange-100 text-orange-700", description: "Padre de familia", group: "Apoderados" },
  { role: "MADRE", icon: Home, bg: "bg-pink-100", text: "text-pink-700", bar: "bg-pink-400", badge: "bg-pink-100 text-pink-700", description: "Madre de familia", group: "Apoderados" },
  { role: "TUTOR", icon: Home, bg: "bg-teal-100", text: "text-teal-700", bar: "bg-teal-400", badge: "bg-teal-100 text-teal-700", description: "Tutor legal", group: "Apoderados" },
  { role: "APODERADO", icon: Home, bg: "bg-cyan-100", text: "text-cyan-700", bar: "bg-cyan-400", badge: "bg-cyan-100 text-cyan-700", description: "Apoderado de estudiante", group: "Apoderados" },
];

const GROUPS = ["Gestión", "Personal", "Apoderados"];

export default function RolesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await userService.getAll();
      const data = isSuccessResponse(res) ? extractData(res) : res;
      setUsers(Array.isArray(data) ? data.map(parseUserFromApi) : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const countByRole = users.reduce((acc, u) => {
    const r = u.role || "SIN_ROL";
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const totalUsers = users.length;
  const topRole = ROLE_CONFIG.reduce((top, cfg) => {
    const c = countByRole[cfg.role] || 0;
    return c > (countByRole[top?.role] || 0) ? cfg : top;
  }, ROLE_CONFIG[0]);

  const apoderadosCount = ["PADRE", "MADRE", "TUTOR", "APODERADO"].reduce((s, r) => s + (countByRole[r] || 0), 0);
  const personalCount = ["DOCENTE", "AUXILIAR", "PSICOLOGO"].reduce((s, r) => s + (countByRole[r] || 0), 0);
  const gestionCount = ["ADMINISTRADOR", "DIRECTOR", "SUBDIRECTOR", "SECRETARIA"].reduce((s, r) => s + (countByRole[r] || 0), 0);

  if (loading && users.length === 0) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-100 rounded-xl">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Roles del Sistema</h1>
            <p className="text-sm text-gray-500">Distribución de usuarios por rol asignado</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchUsers} loading={loading}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total</p>
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Users className="w-3.5 h-3.5 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-xs text-gray-400 mt-1">usuarios registrados</p>
        </Card>
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Gestión</p>
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{gestionCount}</p>
          <p className="text-xs text-gray-400 mt-1">administración</p>
        </Card>
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Personal</p>
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <GraduationCap className="w-3.5 h-3.5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{personalCount}</p>
          <p className="text-xs text-gray-400 mt-1">docentes y staff</p>
        </Card>
        <Card padding="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Apoderados</p>
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <Home className="w-3.5 h-3.5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">{apoderadosCount}</p>
          <p className="text-xs text-gray-400 mt-1">padres y tutores</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {GROUPS.map((group) => {
          const groupRoles = ROLE_CONFIG.filter((c) => c.group === group);
          const groupTotal = groupRoles.reduce((s, c) => s + (countByRole[c.role] || 0), 0);
          const maxInGroup = Math.max(...groupRoles.map((c) => countByRole[c.role] || 0), 1);
          return (
            <Card key={group} padding="p-0">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">{group}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                  {groupTotal} usuarios
                </span>
              </div>
              <div className="p-4 space-y-4">
                {groupRoles.map(({ role, icon: Icon, bg, text, bar, badge, description }) => {
                  const count = countByRole[role] || 0;
                  const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                  const barWidth = maxInGroup > 0 ? Math.round((count / maxInGroup) * 100) : 0;
                  return (
                    <div key={role}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`p-1.5 ${bg} ${text} rounded-lg shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800 truncate">
                              {ROLE_LABELS[role] || role}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${badge}`}>
                                {pct}%
                              </span>
                              <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bar} rounded-full transition-all duration-700`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {totalUsers > 0 && (
        <Card padding="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-bold text-gray-800">Distribución General</h2>
            <span className="text-xs text-gray-400">— proporción por rol del total de usuarios</span>
          </div>
          <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
            {ROLE_CONFIG.filter((c) => (countByRole[c.role] || 0) > 0).map(({ role, bar }) => {
              const pct = Math.round(((countByRole[role] || 0) / totalUsers) * 100);
              if (pct === 0) return null;
              return (
                <div
                  key={role}
                  className={`${bar} flex items-center justify-center transition-all duration-700 first:rounded-l-xl last:rounded-r-xl`}
                  style={{ width: `${pct}%` }}
                  title={`${ROLE_LABELS[role] || role}: ${countByRole[role]} (${pct}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {ROLE_CONFIG.filter((c) => (countByRole[c.role] || 0) > 0).map(({ role, bar, badge }) => (
              <div key={role} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${bar}`} />
                <span className="text-xs text-gray-500">{ROLE_LABELS[role] || role}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
