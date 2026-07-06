import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ChevronDown, User, Plus, Search, AlertCircle } from "lucide-react";
import { studentService } from "@/features/students/services/studentService";
import { enrollmentService } from "../../services/enrollmentService";
import { institutionService } from "@/features/institutions/services/institutionService";
import { classroomService } from "@/features/institutions/services/classroomService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { REQUIRED_DOCUMENTS, getDocumentUrlKey } from "../../models/enrollmentModel";
import { alertUpdated } from "@/shared/components/feedback";
import { CreateStudentModal } from "../modals/CreateStudentModal";
import { StudentSearchModal } from "../modals/StudentSearchModal";

export function EnhancedStudentSelector({ value, onChange, institutionId, disabled = false, academicPeriodId = null, onReactivateSuccess }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [pendingDocForCreate, setPendingDocForCreate] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedEnrollmentStatus, setSelectedEnrollmentStatus] = useState(null);
  const [selectedEnrollmentInfo, setSelectedEnrollmentInfo] = useState(null);
  const [loadingEnrollmentStatus, setLoadingEnrollmentStatus] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    if (institutionId) {
      fetchStudents(institutionId);
    } else {
      setStudents([]);
      setSearchTerm("");
    }
  }, [institutionId]);

  const fetchStudents = async (instId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentService.getByInstitution(instId);
      const data = isSuccessResponse(response) ? extractData(response) : response;
      const studentsList = Array.isArray(data) ? data : [];
      setStudents(studentsList);
    } catch (err) {
      setError("Error al cargar los estudiantes");
      console.error("Error fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = searchTerm.trim()
    ? students.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${student.firstName || ''} ${student.lastName || ''} ${student.motherLastName || ''}`.toLowerCase();
        const documentNumber = student.documentNumber || '';
        const cui = student.cui || '';
        return fullName.includes(searchLower) || documentNumber.includes(searchTerm) || cui.includes(searchTerm);
      })
    : students;

  const selectedStudent = students.find(student => student.id === value);

  const normalizeEnrollments = (response) => {
    if (!response) return [];
    let data = isSuccessResponse(response) ? extractData(response) : response;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    if (data && data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
    if (data && data.data && typeof data.data === 'object' && data.data.id) return [data.data];
    if (data && Array.isArray(data)) return data;
    if (data && data.content && Array.isArray(data.content)) return data.content;
    if (data && typeof data === 'object' && data.enrollmentStatus) return [data];
    return [];
  };

  const fetchEnrollmentStatusForStudent = async (studentId) => {
    if (!studentId) {
      setSelectedEnrollmentStatus(null);
      setSelectedEnrollmentInfo(null);
      return;
    }
    setLoadingEnrollmentStatus(true);
    try {
      const enrollRes = await enrollmentService.getByStudent(studentId);
      const enrollments = normalizeEnrollments(enrollRes);
      const { enrollmentStatus, enrollmentInfo } = classifyEnrollmentStatus(enrollments, academicPeriodId);
      setSelectedEnrollmentStatus(enrollmentStatus);
      setSelectedEnrollmentInfo(enrollmentInfo);
    } catch (err) {
      console.warn("Error al verificar matrículas:", err);
      setSelectedEnrollmentStatus(null);
      setSelectedEnrollmentInfo(null);
    } finally {
      setLoadingEnrollmentStatus(false);
    }
  };

  useEffect(() => {
    if (value && academicPeriodId) {
      fetchEnrollmentStatusForStudent(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicPeriodId]);

  const handleCreateNew = () => {
    setPendingDocForCreate(searchTerm.trim());
    setShowCreateModal(true);
  };

  const handleStudentCreated = (newStudent) => {
    if (!newStudent.id) {
      console.error("El estudiante creado no tiene ID:", newStudent);
      return;
    }

    setStudents(prev => {
      const exists = prev.some(s => s.id === newStudent.id);
      if (exists) return prev;
      return [newStudent, ...prev];
    });

    onChange(newStudent.id, newStudent);
    setShowCreateModal(false);
    setSearchTerm("");
  };

  const classifyEnrollmentStatus = (enrollments, periodId = null) => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return { enrollmentStatus: "not_enrolled", enrollmentInfo: null };
    }

    const sorted = [...enrollments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const activeOrPending = sorted.find(e => e.enrollmentStatus === "ACTIVE" || e.enrollmentStatus === "PENDING");
    if (activeOrPending) {
      return { enrollmentStatus: "currently_enrolled", enrollmentInfo: activeOrPending };
    }

    if (periodId) {
      const inactiveInPeriod = sorted.find(e => e.enrollmentStatus === "INACTIVE" && e.academicPeriodId === periodId);
      if (inactiveInPeriod) {
        return { enrollmentStatus: "inactive_in_period", enrollmentInfo: inactiveInPeriod };
      }
    }

    const inactive = sorted.find(e => e.enrollmentStatus === "INACTIVE");
    if (inactive) {
      return { enrollmentStatus: "inactive_enrolled", enrollmentInfo: inactive };
    }

    return { enrollmentStatus: "previously_enrolled", enrollmentInfo: sorted[0] };
  };

  const enrichCrossEnrollment = async (crossData, fallbackStudentId) => {
    if (!crossData) return null;
    const enriched = { ...crossData };
    if (!enriched.studentId && fallbackStudentId) enriched.studentId = fallbackStudentId;

    // 1. Intentar obtener enrollment completo via getByStudent (más probable que tenga nombres)
    if (enriched.studentId && (!enriched.institutionName || !enriched.classroomName)) {
      try {
        const enrollRes = await enrollmentService.getByStudent(enriched.studentId);
        const enrollments = normalizeEnrollments(enrollRes);
        const other = enrollments.find(e =>
          e.institutionId === enriched.institutionId
        );
        if (other) {
          if (!enriched.institutionName) enriched.institutionName = other.institutionName || null;
          if (!enriched.classroomName) enriched.classroomName = other.classroomName || null;
        }
      } catch {
        console.warn("[enrichCrossEnrollment] getByStudent no disponible");
      }
    }

    // 2. Fallback directo por si getByStudent no retornó los nombres
    if (!enriched.institutionName && enriched.institutionId) {
      try {
        const instRes = await institutionService.getById(enriched.institutionId);
        const inst = isSuccessResponse(instRes) ? extractData(instRes) : instRes;
        enriched.institutionName = inst?.name || null;
      } catch {
        console.warn("[enrichCrossEnrollment] No se pudo obtener institución (sin permisos)");
      }
    }
    if (!enriched.classroomName && enriched.classroomId) {
      try {
        const clsRes = await classroomService.getById(enriched.institutionId, enriched.classroomId);
        const cls = isSuccessResponse(clsRes) ? extractData(clsRes) : clsRes;
        enriched.classroomName = cls?.name || cls?.grade || null;
      } catch {
        console.warn("[enrichCrossEnrollment] No se pudo obtener aula (sin permisos)");
      }
    }

    return enriched;
  };

  const performSearch = async (doc) => {
    if (docType === "DNI") {
      if (doc.length !== 8 || !/^\d+$/.test(doc)) {
        setSearchResult({ type: "error", message: "El DNI debe tener exactamente 8 dígitos numéricos" });
        setShowSearchModal(true);
        return;
      }
    } else {
      if (doc.length < 1 || doc.length > 16) {
        setSearchResult({ type: "error", message: "El Carné de Extranjería debe tener entre 1 y 16 caracteres" });
        setShowSearchModal(true);
        return;
      }
    }

    setSearching(true);
    setSearchResult(null);
    setShowSearchModal(true);

    try {
      const response = await studentService.getByInstitution(institutionId);
      const studentsData = isSuccessResponse(response) ? extractData(response) : response;
      const studentList = Array.isArray(studentsData) ? studentsData : [];

      const foundStudent = studentList.find(s => s.documentNumber === doc);

      if (foundStudent) {
        let enrollmentInfo = null;
        let enrollmentStatus = null;
        let crossEnrollmentInfo = null;
        let crossEnrollmentStatus = null;
        try {
          const enrollRes = await enrollmentService.getByStudent(foundStudent.id);
          const enrollments = normalizeEnrollments(enrollRes);
          const classified = classifyEnrollmentStatus(enrollments, academicPeriodId);
          enrollmentStatus = classified.enrollmentStatus;
          enrollmentInfo = classified.enrollmentInfo;

          const crossRes = await enrollmentService.checkCrossInstitution(foundStudent.id);
          const crossData = isSuccessResponse(crossRes) ? extractData(crossRes) : crossRes;
          if (crossData) {
            crossEnrollmentStatus = "cross_enrolled";
            crossEnrollmentInfo = await enrichCrossEnrollment(crossData, foundStudent.id);
          }
        } catch (err) {
          console.warn("[performSearch] Error al verificar matrículas:", err);
          if (!enrollmentStatus) {
            enrollmentStatus = "check_error";
          }
        }

        setSearchResult({
          type: "found",
          student: foundStudent,
          enrollment: enrollmentInfo,
          enrollmentStatus,
          crossEnrollment: crossEnrollmentInfo,
          crossEnrollmentStatus,
        });
      } else {
        // Buscar globalmente si el estudiante existe en otra institución
        let globalStudent = null;
        let globalCrossEnrollment = null;
        try {
          const existsResponse = await studentService.existsByDocument(doc);
          const existsData = isSuccessResponse(existsResponse) ? extractData(existsResponse) : existsResponse;

          if (existsData) {
            // Si existsByDocument devolvió el objeto del estudiante con ID
            if (existsData.id) {
              globalStudent = existsData;
            } else {
              // Fallback: buscar en todos los estudiantes
              const allResponse = await studentService.getAll();
              const allData = isSuccessResponse(allResponse) ? extractData(allResponse) : allResponse;
              const allList = Array.isArray(allData) ? allData : (allData?.data && Array.isArray(allData.data) ? allData.data : []);
              globalStudent = allList.find(s => s.documentNumber === doc) || null;
            }

            if (globalStudent?.id) {
              const crossRes = await enrollmentService.checkCrossInstitution(globalStudent.id);
              const crossData = isSuccessResponse(crossRes) ? extractData(crossRes) : crossRes;
              if (crossData) {
                globalCrossEnrollment = await enrichCrossEnrollment(crossData, globalStudent.id);
              }
            }
          }
        } catch (err) {
          console.warn("[performSearch] Error al buscar globalmente:", err);
        }

        if (globalStudent) {
          setSearchResult({
            type: "found_elsewhere",
            student: globalStudent,
            documentNumber: doc,
            crossEnrollment: globalCrossEnrollment,
            crossEnrollmentStatus: globalCrossEnrollment ? "cross_enrolled" : null,
            message: globalCrossEnrollment
              ? `Este estudiante está matriculado en ${globalCrossEnrollment.institutionName || "otra institución"}`
              : "Este estudiante existe en el sistema pero no está registrado en esta institución",
          });
        } else {
          setSearchResult({ type: "not_found", documentNumber: doc });
        }
      }
    } catch (err) {
      console.error("Error en búsqueda:", err);
      setSearchResult({ type: "error", message: "Error al buscar el estudiante. Verifique su conexión." });
    } finally {
      setSearching(false);
    }
  };

  const openSearchModal = () => {
    if (searchTerm.trim()) {
      performSearch(searchTerm.trim());
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      openSearchModal();
    }
  };

  const handleStudentSelected = ({ student, enrollment }) => {
    const currentYear = new Date().getFullYear().toString();
    const prefillData = enrollment
      ? (() => {
          const isFromCurrentYear = enrollment.academicYear === currentYear;
          const data = {
            classroomId: enrollment.classroomId || "",
            shift: enrollment.shift || "",
            modality: enrollment.modality || "",
          };
          if (!isFromCurrentYear) {
            data.ageGroup = enrollment.ageGroup || "";
            data.educationalLevel = enrollment.educationalLevel || "";
            data.previousInstitution = enrollment.previousInstitution || "";
            data.observations = enrollment.observations || "";
            data.enrollmentType = enrollment.enrollmentType || "";
          }
          REQUIRED_DOCUMENTS.forEach(doc => {
            if (enrollment[doc.key] !== undefined) {
              data[doc.key] = enrollment[doc.key];
            }
            const urlKey = getDocumentUrlKey(doc.key);
            if (enrollment[urlKey] !== undefined) {
              data[urlKey] = enrollment[urlKey];
            }
          });
          return data;
        })()
      : null;

    onChange(student.id, student, prefillData);
    setSearchTerm("");
    fetchEnrollmentStatusForStudent(student.id);
  };

  const handleReactivateEnrollment = async (enrollmentId) => {
    setReactivating(true);
    try {
      await enrollmentService.setPending(enrollmentId);
      alertUpdated("Matrícula reactivada a Pendiente");
      fetchEnrollmentStatusForStudent(value);
      onReactivateSuccess?.();
    } catch (err) {
      console.error("Error al reactivar matrícula:", err);
    } finally {
      setReactivating(false);
    }
  };

  const handleStudentNotFound = (documentNumber) => {
    setPendingDocForCreate(documentNumber);
    setShowCreateModal(true);
  };

  const getStudentAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <div className="space-y-3">
        {/* Buscador de estudiantes con botón buscar */}
        {students.length > 0 && (
          <div className="space-y-2">
            {/* Selector de tipo de documento */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Tipo de documento:</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setDocType("DNI")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    docType === "DNI" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  DNI
                </button>
                <button
                  type="button"
                  onClick={() => setDocType("CE")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    docType === "CE" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  C. Extranjería
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={docType === "DNI" ? "Buscar por DNI (8 dígitos) o nombre..." : "Buscar por Carné de Extranjería..."}
                  value={searchTerm}
                  maxLength={docType === "DNI" ? 8 : 16}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={disabled}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={openSearchModal}
                disabled={disabled || !searchTerm.trim()}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </div>
          </div>
        )}

        {/* Selector principal */}
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => {
              const selectedValue = e.target.value;

              if (selectedValue === "CREATE_NEW") {
                e.target.value = "";
                handleCreateNew();
              } else if (selectedValue) {
                const selectedStudent = students.find(s => s.id === selectedValue);
                onChange(selectedValue, selectedStudent || null);
                fetchEnrollmentStatusForStudent(selectedValue);
              } else {
                onChange("", null);
                setSelectedEnrollmentStatus(null);
                setSelectedEnrollmentInfo(null);
              }
            }}
            disabled={disabled || loading || !institutionId}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
          >
            <option value="">
              {loading ? "Cargando estudiantes..." :
               !institutionId ? "Seleccione una institución primero" :
               students.length === 0 ? "No hay estudiantes disponibles" :
               searchTerm ? `Seleccione de ${filteredStudents.length} resultado(s)` :
               "Seleccione un estudiante"}
            </option>

            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} {student.motherLastName} - DNI: {student.documentNumber}
              </option>
            ))}

            {institutionId && (
              <option value="CREATE_NEW" className="font-medium text-blue-600">
                ➕ Crear nuevo estudiante
              </option>
            )}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Información del estudiante seleccionado */}
        {selectedStudent && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  {selectedStudent.firstName} {selectedStudent.lastName} {selectedStudent.motherLastName}
                </p>
                <p className="text-xs text-blue-700">
                  DNI: {selectedStudent.documentNumber}
                  {selectedStudent.cui && ` • CUI: ${selectedStudent.cui}`}
                  {selectedStudent.dateOfBirth && ` • Edad: ${getStudentAge(selectedStudent.dateOfBirth)} años`}
                </p>
                {selectedStudent.dateOfBirth && (
                  <p className="text-xs text-blue-600">
                    Nacimiento: {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
                {loadingEnrollmentStatus && (
                  <p className="text-xs text-gray-500 mt-1">Verificando estado de matrícula...</p>
                )}
                {!loadingEnrollmentStatus && selectedEnrollmentStatus === "currently_enrolled" && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      Matriculado actualmente
                    </span>
                    {selectedEnrollmentInfo?.classroomName && (
                      <span className="text-xs text-yellow-700 ml-2">
                        Aula: {selectedEnrollmentInfo.classroomName}
                      </span>
                    )}
                  </div>
                )}
                {!loadingEnrollmentStatus && selectedEnrollmentStatus === "inactive_in_period" && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-900">
                          Este estudiante ya tiene una matrícula en este período académico en estado inactivo
                        </p>
                        <button
                          type="button"
                          onClick={() => handleReactivateEnrollment(selectedEnrollmentInfo.id)}
                          disabled={reactivating}
                          className="mt-2 px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {reactivating ? "Reactivando..." : "Reactivar matrícula"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {!loadingEnrollmentStatus && selectedEnrollmentStatus === "inactive_enrolled" && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Matrícula inactiva (año anterior)
                    </span>
                  </div>
                )}
                {!loadingEnrollmentStatus && selectedEnrollmentStatus === "not_enrolled" && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Sin matrícula previa
                    </span>
                  </div>
                )}
                {!loadingEnrollmentStatus && selectedEnrollmentStatus === "previously_enrolled" && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Matrícula cancelada anteriormente
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón para crear nuevo estudiante */}
        {institutionId && (
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            ¿No encuentra al estudiante? Crear nuevo
          </button>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Modal de búsqueda de estudiantes */}
      <StudentSearchModal
        isOpen={showSearchModal}
        onClose={() => { setShowSearchModal(false); setSearchResult(null); }}
        searchResult={searchResult}
        onStudentSelected={handleStudentSelected}
        onStudentNotFound={handleStudentNotFound}
        onReactivate={handleReactivateEnrollment}
        searching={searching}
      />

      {/* Modal para crear estudiante */}
      {showCreateModal && (
        <CreateStudentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onStudentCreated={handleStudentCreated}
          institutionId={institutionId}
          prefillDocumentNumber={pendingDocForCreate}
        />
      )}
    </>
  );
}

EnhancedStudentSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  institutionId: PropTypes.string,
  disabled: PropTypes.bool,
  academicPeriodId: PropTypes.string,
  onReactivateSuccess: PropTypes.func,
};
