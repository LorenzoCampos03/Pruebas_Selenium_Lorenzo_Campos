import { Badge } from "@/shared/components/ui";
import { PaginatedTable } from "@/shared/components/ui";
import StatusSwitch from "../shared/StatusSwitch";
import InstitutionAvatar from "../shared/InstitutionAvatar";
import { INSTITUTION_STATUS } from "../../models/institutionModel";
import { Eye, Pencil } from "lucide-react";

const INSTITUTION_STATUS_FILTERS = [
     { value: "all", label: "Todos" },
     { value: INSTITUTION_STATUS.ACTIVE, label: "Activos" },
     { value: INSTITUTION_STATUS.INACTIVE, label: "Inactivos" },
];

export default function InstitutionTable({
     institutions,
     onView,
     onEdit,
     onToggleStatus,
}) {
     const columns = [
          {
               key: "modularCode",
               label: "Código Modular",
               width: "120px",
               render: (row) => (
                    <span className="font-mono text-xs font-semibold text-gray-800">
                         {row.modularCode}
                    </span>
               ),
          },
          {
               key: "name",
               label: "Institución",
               render: (row) => (
                    <div className="flex items-center gap-3">
                         <InstitutionAvatar
                              logoUrl={row.logoUrl}
                              name={row.name}
                              colorInstitution={row.colorInstitution}
                              size="sm"
                         />
                         <div>
                              <p className="font-medium text-gray-800">{row.name}</p>
                              <p className="text-xs text-gray-400">
                                   {[row.institutionType, row.level].filter(Boolean).join(" · ")}
                              </p>
                         </div>
                    </div>
               ),
          },
          {
               key: "director",
               label: "Director",
               render: (row) => (
                    <span className="text-sm text-gray-600">{row.directorName || row.director || "—"}</span>
               ),
          },
          {
               key: "address",
               label: "Ubicación",
               render: (row) => {
                    const addr = row.address;
                    if (!addr) return "—";
                    return (
                         <span className="text-xs text-gray-500">
                              {[addr.district, addr.province, addr.department]
                                   .filter(Boolean)
                                   .join(", ")}
                         </span>
                    );
               },
          },
          {
               key: "status",
               label: "Estado",
               width: "100px",
               render: (row) => (
                    <div className="flex items-center gap-2">
                         <StatusSwitch
                              active={row.status === INSTITUTION_STATUS.ACTIVE}
                              onToggle={() => onToggleStatus(row)}
                         />
                         <Badge
                              variant={row.status === INSTITUTION_STATUS.ACTIVE ? "success" : "gray"}
                              size="sm"
                              dot
                         >
                              {row.status === INSTITUTION_STATUS.ACTIVE ? "Activa" : "Inactiva"}
                         </Badge>
                    </div>
               ),
          },
          {
               key: "actions",
               label: "Acciones",
               width: "100px",
               render: (row) => (
                    <div className="flex items-center gap-1">
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onView(row);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                              title="Ver detalles"
                         >
                              <Eye className="w-4 h-4" />
                         </button>
                         <button
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onEdit(row);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Editar director"
                         >
                              <Pencil className="w-4 h-4" />
                         </button>
                    </div>
               ),
          },
     ];

     return (
          <PaginatedTable
               columns={columns}
               data={institutions}
               emptyMessage="No se encontraron instituciones"
               pageSize={10}
               statusFilters={INSTITUTION_STATUS_FILTERS}
          />
     );
}
