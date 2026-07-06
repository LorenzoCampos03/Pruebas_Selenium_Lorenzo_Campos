// Páginas principales
export { default as EnrollmentsListPage } from "./pages/EnrollmentsListPage";
export { default as AcademicPeriodsPage } from "./pages/AcademicPeriodsPage";

// Hooks
export { useEnrollments } from "./hooks/useEnrollments";
export { useAcademicPeriods } from "./hooks/useAcademicPeriods";
export { useEnrollmentValidation } from "./hooks/useEnrollmentValidation";
export { useInstitutionSchedules } from "./hooks/useInstitutionSchedules";

// Servicios
export { enrollmentService } from "./services/enrollmentService";
export { academicPeriodService } from "./services/academicPeriodService";
export * from "./services/enrollmentReportService";

// Modelos
export * from "./models/enrollmentModel";
export * from "./models/academicPeriodModel";

// Componentes compartidos (exportar solo si son necesarios fuera del módulo)
export { Modal } from "./components/shared/Modal";
export { 
  EnrollmentReportButton,
  ExportEnrollmentsButton,
  ExportEnrollmentDetailButton 
} from "./components/shared/EnrollmentReportButton";
export { DocumentUploader } from "./components/shared/DocumentUploader";
export { DocumentViewer } from "./components/shared/DocumentViewer";
