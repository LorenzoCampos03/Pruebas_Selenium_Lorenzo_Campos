import { Badge, PaginatedTable } from "@/shared/components/ui";
import { STUDENT_STATUS, STUDENT_STATUS_LABELS } from "../../models/studentModel";
import { Eye, Pencil, RotateCcw, Camera } from "lucide-react";

const STATUS_VARIANT = {
     [STUDENT_STATUS.ACTIVE]: "success",
     [STUDENT_STATUS.INACTIVE]: "danger",
     [STUDENT_STATUS.TRANSFERRED]: "warning",
};

const STATUS_FILTERS = [
     { value: "all", label: "Todos" },
     { value: STUDENT_STATUS.ACTIVE, label: "Activos" },
     { value: STUDENT_STATUS.INACTIVE, label: "Inactivos" },
     { value: STUDENT_STATUS.TRANSFERRED, label: "Transferidos" },
];

export default function StudentTable({
     students,
     onView,
     onEdit,
     onRestore,
     onUploadPhoto,
     readOnly = false,
}) {
     const columns = [
          {
               key: "cui",
               label: "CUI",
               width: "110px",
               render: (row) => (
                    <span className="font-mono text-xs font-semibold text-gray-800">
                         {row.cui || "—"}
                    </span>
               ),
          },
          {
               key: "fullName",
               label: "Estudiante",
               render: (row) => (
                    <div className="flex items-center gap-3">
                         {row.photoUrl ? (
                              <img src={row.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" />
                         ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                   <span className="text-primary-600 text-xs font-semibold">
                                        {(row.firstName?.[0] || "?").toUpperCase()}
                                   </span>
                              </div>
                         )}
                         <div>
                              <p className="font-medium text-gray-800">
                                   {`${row.lastName || ""} ${row.motherLastName || ""} ${row.firstName || ""}`.trim()}
                              </p>
                              <p className="text-xs text-gray-400">
                                   {row.documentType}: {row.documentNumber}
                              </p>
                         </div>
                    </div>
               ),
          },
          {
               key: "gender",
               label: "Género",
               width: "90px",
               render: (row) => (
                    <span className="text-sm text-gray-600">
                         {row.gender === "M" ? "Masculino" : row.gender === "F" ? "Femenino" : "—"}
                    </span>
               ),
          },
          {
               key: "dateOfBirth",
               label: "Fecha Nac.",
               width: "110px",
               render: (row) => (
                    <span className="text-xs text-gray-500">
                         {row.dateOfBirth
                              ? new Date(row.dateOfBirth).toLocaleDateString("es-PE")
                              : "—"}
                    </span>
               ),
          },
          {
               key: "status",
               label: "Estado",
               width: "130px",
               render: (row) => (
                    <Badge
                         variant={STATUS_VARIANT[row.status] || "gray"}
                         size="sm"
                         dot
                    >
                         {STUDENT_STATUS_LABELS[row.status] || row.status}
                    </Badge>
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
                         {!readOnly && onUploadPhoto && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onUploadPhoto(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                   title="Subir foto"
                              >
                                   <Camera className="w-4 h-4" />
                              </button>
                         )}
                         {!readOnly && row.status === STUDENT_STATUS.ACTIVE && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                   title="Editar"
                              >
                                   <Pencil className="w-4 h-4" />
                              </button>
                         )}
                         {!readOnly && row.status === STUDENT_STATUS.INACTIVE && (
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onRestore?.(row);
                                   }}
                                   className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                   title="Restaurar"
                              >
                                   <RotateCcw className="w-4 h-4" />
                              </button>
                         )}
                    </div>
               ),
          },
     ];

     return (
          <PaginatedTable
               columns={columns}
               data={students}
               emptyMessage="No se encontraron estudiantes"
               pageSize={10}
               statusFilters={STATUS_FILTERS}
          />
     );
}
