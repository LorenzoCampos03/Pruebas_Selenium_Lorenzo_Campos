import { Badge } from "@/shared/components/ui";
import { PaginatedTable } from "@/shared/components/ui";
import StatusSwitch from "../shared/StatusSwitch";
import { CLASSROOM_STATUS } from "../../models/classroomModel";
import { Pencil } from "lucide-react";

export default function ClassroomTable({
     classrooms,
     onEdit,
     onToggleStatus,
}) {
     const columns = [
          {
               key: "name",
               label: "Aula",
               render: (row) => (
                    <div className="flex items-center gap-2">
                         {row.color && (
                              <span
                                   className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                                   style={{ backgroundColor: row.color }}
                              />
                         )}
                         <span className="font-semibold text-gray-800">{row.name}</span>
                    </div>
               ),
          },
          {
               key: "age",
               label: "Edad",
               width: "100px",
               render: (row) => (
                    <span className="text-sm text-gray-600">
                         {row.age || "—"}
                    </span>
               ),
          },
          {
               key: "capacity",
               label: "Capacidad",
               width: "100px",
               render: (row) => (
                    <span className="text-sm text-gray-600">
                         {row.capacity || "—"} alumnos
                    </span>
               ),
          },
          {
               key: "status",
               label: "Estado",
               width: "120px",
               render: (row) => (
                    <div className="flex items-center gap-2">
                         <StatusSwitch
                              active={row.status === CLASSROOM_STATUS.ACTIVE}
                              onToggle={() => onToggleStatus(row)}
                         />
                         <Badge
                              variant={row.status === CLASSROOM_STATUS.ACTIVE ? "success" : "gray"}
                              size="sm"
                              dot
                         >
                              {row.status === CLASSROOM_STATUS.ACTIVE ? "Activa" : "Inactiva"}
                         </Badge>
                    </div>
               ),
          },
          {
               key: "actions",
               label: "",
               width: "60px",
               render: (row) => (
                    <button
                         onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row);
                         }}
                         className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                         title="Editar aula"
                    >
                         <Pencil className="w-4 h-4" />
                    </button>
               ),
          },
     ];

     return (
          <PaginatedTable
               columns={columns}
               data={classrooms}
               emptyMessage="No se encontraron aulas"
               pageSize={10}
          />
     );
}
