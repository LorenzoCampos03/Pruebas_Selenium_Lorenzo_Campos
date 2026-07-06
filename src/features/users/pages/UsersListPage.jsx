import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, RefreshCw, FileDown, Camera } from "lucide-react";
import { Badge, Button, Card, PaginatedTable, PhotoUploadModal } from "@/shared/components/ui";
import { SearchInput } from "@/shared/components/form";
import { LoadingScreen, alertApiError } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { userService } from "../services/userService";
import { parseUserFromApi, USER_STATUS, USER_STATUS_LABELS, USER_ROLES } from "../models/userModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { institutionService } from "@/features/institutions/services/institutionService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import { ROLE_LABELS } from "@/core/utils/constants";
import { generateUsersListReport, generateUserDetailReport } from "../services/userReportService";
import toast from "react-hot-toast";

const ROLE_TABS = [
     { key: null, label: "Todos" },
     ...USER_ROLES.map((role) => ({ key: role, label: ROLE_LABELS[role] || role })),
];

function getRoleBadgeVariant(role) {
     const map = {
          DIRECTOR: "primary",
          SUBDIRECTOR: "info",
          SECRETARIA: "success",
          DOCENTE: "warning",
          AUXILIAR: "gray",
          PSICOLOGO: "danger",
          ADMINISTRADOR: "primary",
     };
     return map[role] || "gray";
}

function getStatusBadgeVariant(status) {
     if (status === USER_STATUS.ACTIVE) return "success";
     if (status === USER_STATUS.INACTIVE) return "warning";
     return "gray";
}

export default function UsersListPage() {
     const { user } = useAuth();
     const institutionId = user?.institutionId;

     const [users, setUsers] = useState([]);
     const [loading, setLoading] = useState(false);
     const [search, setSearch] = useState("");
     const [activeRole, setActiveRole] = useState(null);
     const [institution, setInstitution] = useState({});
     const [photoModal, setPhotoModal] = useState({ open: false, userId: null, currentUrl: null });

     const fetchUsers = useCallback(async () => {
          if (!institutionId) return;
          setLoading(true);
          try {
               const response = await userService.getByInstitution(institutionId);
               const data = isSuccessResponse(response) ? extractData(response) : response;
               setUsers(Array.isArray(data) ? data.map(parseUserFromApi) : []);
          } catch (err) {
               alertApiError(err);
          } finally {
               setLoading(false);
          }
     }, [institutionId]);

     useEffect(() => {
          fetchUsers();
     }, [fetchUsers]);

     useEffect(() => {
          if (!institutionId) return;
          institutionService.getById(institutionId).then((response) => {
               const raw = isSuccessResponse(response) ? extractData(response) : response;
               setInstitution(parseInstitutionFromApi(raw || {}));
          }).catch(() => { });
     }, [institutionId]);

     const filteredUsers = useMemo(() => {
          return users.filter((u) => {
               const matchesRole = activeRole === null || u.role === activeRole;
               if (!matchesRole) return false;
               if (!search) return true;
               const term = search.toLowerCase();
               const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
               return (
                    fullName.includes(term) ||
                    (u.username || "").toLowerCase().includes(term) ||
                    (u.documentNumber || "").toLowerCase().includes(term) ||
                    (u.email || "").toLowerCase().includes(term)
               );
          });
     }, [users, activeRole, search]);

     const columns = [
          {
               key: "fullName",
               label: "Apellidos y Nombres",
               render: (row) => (
                    <div className="flex items-center gap-3">
                         {row.photoUrl ? (
                              <img src={row.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200" />
                         ) : (
                              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                   <span className="text-primary-600 text-sm font-semibold">
                                        {(row.firstName?.[0] || row.lastName?.[0] || "?").toUpperCase()}
                                   </span>
                              </div>
                         )}
                         <div>
                              <p className="font-medium text-gray-900">
                                   {`${row.lastName || ""} ${row.firstName || ""}`.trim() || "-"}
                              </p>
                              <p className="text-xs text-gray-500">{row.email || row.username || "Sin correo"}</p>
                         </div>
                    </div>
               ),
          },
          {
               key: "username",
               label: "Usuario",
               render: (row) => row.username || "-",
          },
          {
               key: "documentNumber",
               label: "Documento",
               render: (row) => `${row.documentType || "-"} ${row.documentNumber || "-"}`,
          },
          {
               key: "phone",
               label: "Teléfono",
               render: (row) => row.phone || "-",
          },
          {
               key: "role",
               label: "Rol",
               render: (row) => (
                    <Badge variant={getRoleBadgeVariant(row.role)}>
                         {ROLE_LABELS[row.role] || row.role || "-"}
                    </Badge>
               ),
          },
          {
               key: "status",
               label: "Estado",
               render: (row) => (
                    <Badge variant={getStatusBadgeVariant(row.status)}>
                         {USER_STATUS_LABELS[row.status] || row.status || "-"}
                    </Badge>
               ),
          },
          {
               key: "actions",
               label: "Acciones",
               render: (row) => (
                    <div className="flex items-center gap-1">
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={Camera}
                              onClick={(e) => {
                                   e.stopPropagation();
                                   setPhotoModal({ open: true, userId: row.id, currentUrl: row.photoUrl });
                              }}
                         >
                              Foto
                         </Button>
                         <Button
                              size="sm"
                              variant="ghost"
                              icon={FileDown}
                              onClick={(e) => {
                                   e.stopPropagation();
                                   generateUserDetailReport(row, institution);
                              }}
                         >
                              Ficha
                         </Button>
                    </div>
               ),
          },
     ];

     if (loading && users.length === 0) {
          return <LoadingScreen />;
     }

     const handleUploadPhoto = async (file) => {
          try {
               await userService.uploadPhoto(photoModal.userId, file);
               toast.success("Foto actualizada correctamente");
               fetchUsers();
          } catch (err) {
               alertApiError(err);
               throw err;
          }
     };

     return (
          <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-primary-100 rounded-xl">
                              <Users className="w-6 h-6 text-primary-600" />
                         </div>
                         <div>
                              <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
                              <p className="text-sm text-gray-500">Personal registrado en la institución</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchUsers} loading={loading}>
                              Actualizar
                         </Button>
                         <Button
                              variant="ghost"
                              size="sm"
                              icon={FileDown}
                              onClick={() => generateUsersListReport(filteredUsers, activeRole, institution)}
                         >
                              Exportar
                         </Button>
                    </div>
               </div>

               <div className="border-b border-gray-200">
                    <nav className="flex gap-3 sm:gap-5 overflow-x-auto">
                         {ROLE_TABS.map((tab) => (
                              <button
                                   key={tab.key ?? "all"}
                                   onClick={() => setActiveRole(tab.key)}
                                   className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${activeRole === tab.key
                                             ? "border-primary-600 text-primary-600"
                                             : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                              >
                                   {tab.label}
                              </button>
                         ))}
                    </nav>
               </div>

               <Card padding="p-4" className="space-y-3">
                    <SearchInput
                         value={search}
                         onChange={setSearch}
                         placeholder="Buscar por nombre, usuario, documento o correo..."
                    />
                    <PaginatedTable
                         columns={columns}
                         data={filteredUsers}
                         emptyMessage="No hay usuarios registrados."
                         pageSize={10}
                         pageSizeOptions={[10, 20, 50]}
                         showStatusFilter={false}
                    />
               </Card>
          </div>
          <PhotoUploadModal
               isOpen={photoModal.open}
               onClose={() => setPhotoModal({ open: false, userId: null, currentUrl: null })}
               onUpload={handleUploadPhoto}
               title="Foto del usuario"
               currentPhotoUrl={photoModal.currentUrl}
          />
     );
}
