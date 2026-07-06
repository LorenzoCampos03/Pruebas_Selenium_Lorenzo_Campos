import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import apiClient from "@/core/api/apiClient";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/core/auth/ProtectedRoute";
import { MainLayout } from "@/shared/components/layout";
import { EnDesarrollo } from "@/shared/components/feedback";
import GradesPage from "@/features/grades/pages/GradesPage";
import { notesRoutes } from "@/router/notes.routes";
import { LoginPage } from "@/features/auth";
import {
     AdminDashboard,
     DireccionDashboard,
     SecretariaDashboard,
     DocenteDashboard,
     AuxiliarDashboard,
     PsicologoDashboard,
     FamiliaDashboard,
} from "@/features/dashboard";
import {
     PsychologyPage,
     NewEvaluationPage,
     EditEvaluationPage,
     ViewEvaluationPage,
     SpecialNeedsSupportPage,
     NewSpecialNeedsSupportPage,
     EditSpecialNeedsSupportPage,
     ViewSpecialNeedsSupportPage,
} from "@/features/psychology";
import { AttendancePage, NewAttendancePage, DailyAttendanceSheetPage, DocenteAttendanceRedirect, IncidencesPage } from "@/features/attendance";
import {
     EnrollmentsListPage,
     AcademicPeriodsPage,
} from "@/features/enrollments";
import { InstitutionsListPage } from "@/features/institutions";
import { StudentsListPage } from "@/features/students";
import FamiliaMyChildrenPage from "@/features/students/components/familia/FamiliaMyChildrenPage";
import { IncidentsPage } from "@/features/discipline";
import { EventsPage, RecurringEventsPage } from "@/features/events";
import AcademicPage from "@/features/academic/pages/AcademicPage";
import AcademicByAgePage from "@/features/academic/pages/AcademicByAgePage";
import CourseDetailPage from "@/features/academic/pages/CourseDetailPage";
import { TeachersListPage, TeacherSchedulePage } from "@/features/teachers";
import { getRouteByRole } from "@/core/utils/constants";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import RolesPage from "@/features/admin/pages/RolesPage";
import ConfiguracionPage from "@/features/admin/pages/ConfiguracionPage";
import TemplatesAdminPage from "@/features/admin/pages/TemplatesAdminPage";
import NotificationsInstitutionPage from "@/features/institutions/pages/NotificationsInstitutionPage";


import DailyEvaluationFlow from "@/features/grades/pages/DailyEvaluationFlow";
import DailyEvaluationList from "@/features/grades/pages/DailyEvaluationList";
import DailyEvaluationDetail from "@/features/grades/pages/DailyEvaluationDetail";
import DailyEvaluationEdit from "@/features/grades/pages/DailyEvaluationEdit";

function RootRedirect() {
     const { isAuthenticated, role, loading } = useAuth();

     if (loading) {
          return (
               <div className="min-h-screen flex items-center justify-center bg-slate-100">
                    <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
               </div>
          );
     }

     if (isAuthenticated && role) {
          return <Navigate to={getRouteByRole(role)} replace />;
     }

     return <Navigate to="/login" replace />;
}

// Redirige al docente al nivel de edad de su aula asignada
function DocenteCursosRedirect() {
     const { user } = useAuth();
     const [target, setTarget] = useState(null);

     const AGE_ROUTE = {
          "3 años": "3-anos",
          "4 años": "4-anos",
          "5 años": "5-anos",
     };

     useEffect(() => {
          if (!user?.userId) return;
          // Si el perfil ya trae ageLevel, usarlo directo
          if (user.ageLevel && AGE_ROUTE[user.ageLevel]) {
               setTarget(AGE_ROUTE[user.ageLevel]);
               return;
          }
          // Si no, consultar el aula del docente
          apiClient.get(`/api/classrooms/teacher/${user.userId}`)
               .then(({ data }) => {
                    const classrooms = data?.data || data || [];
                    const active = classrooms.find(c => c.status === "ACTIVE");
                    const age = active?.classroomAge;
                    setTarget(age && AGE_ROUTE[age] ? AGE_ROUTE[age] : "3-anos");
               })
               .catch(() => setTarget("3-anos"));
     }, [user]);

     if (!target) return null; // espera mientras resuelve
     return <Navigate to={`/docente/cursos/${target}`} replace />;
}

export default function AppRouter() {
     return (
          <Routes>
               <Route path="/" element={<RootRedirect />} />
               <Route path="/login" element={<LoginPage />} />

               <Route
                    path="/admin"
                    element={
                         <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<AdminDashboard />} />
                    <Route path="instituciones" element={<InstitutionsListPage />} />
                    <Route path="usuarios" element={<EnDesarrollo titulo="Usuarios" />} />
                    <Route path="roles" element={<RolesPage />} />
                    <Route path="plantillas" element={<TemplatesAdminPage />} />
                    <Route path="configuracion" element={<ConfiguracionPage />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/direccion"
                    element={
                         <ProtectedRoute allowedRoles={["DIRECTOR", "SUBDIRECTOR"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<DireccionDashboard />} />
                    <Route path="institucion" element={<InstitutionsListPage />} />
                    <Route path="personal" element={<TeachersListPage />} />
                    <Route path="estudiantes" element={<StudentsListPage />} />
                    <Route path="reportes" element={<IncidentsPage />} />
                    <Route path="comunicados" element={<EnDesarrollo titulo="Comunicados" />} />
                    <Route path="notificaciones" element={<NotificationsInstitutionPage />} />

                    <Route path="academic" element={<AcademicPage />} />
                    <Route path="academic/:age" element={<AcademicByAgePage />} />
                    <Route path="academic/:age/:courseId" element={<CourseDetailPage />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/secretaria"
                    element={
                         <ProtectedRoute allowedRoles={["SECRETARIA"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<SecretariaDashboard />} />
                    <Route path="matriculas" element={<EnrollmentsListPage />} />
                    <Route path="periodos-academicos" element={<AcademicPeriodsPage />} />
                    <Route path="estudiantes" element={<StudentsListPage />} />
                    <Route path="reportes" element={<IncidentsPage />} />
                    <Route path="documentos" element={<EnDesarrollo titulo="Documentos" />} />
                    <Route path="horarios" element={<EnDesarrollo titulo="Horarios" />} />
                    <Route path="eventos" element={<EventsPage />} />
                    <Route path="eventos/fechas-recurrentes" element={<RecurringEventsPage />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/docente"
                    element={
                         <ProtectedRoute allowedRoles={["DOCENTE"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<DocenteDashboard />} />

                    <Route path="cursos/lista" element={<AcademicPage />} />

                    <Route path="cursos" element={<AcademicPage />} />
                    <Route path="cursos/:age" element={<AcademicByAgePage />} />
                    <Route path="cursos/:age/:courseId" element={<CourseDetailPage />} />

                    <Route path="asistencia" element={<DocenteAttendanceRedirect />} />
                    <Route path="asistencia/nuevo" element={<NewAttendancePage />} />
                    <Route path="asistencia/aula/:classroomId" element={<DailyAttendanceSheetPage />} />
                    <Route path="calificaciones" element={<GradesPage />} />
                    <Route path="reportes" element={<IncidentsPage />} />
                    {notesRoutes}

                    <Route path="evaluaciones-diarias" element={<DailyEvaluationList />} />
                    <Route path="evaluaciones-diarias/nueva" element={<DailyEvaluationFlow />} />
                    <Route path="evaluaciones-diarias/:id/editar" element={<DailyEvaluationEdit />} />
                    <Route path="evaluaciones-diarias/:id" element={<DailyEvaluationDetail />} />

                    <Route path="horario" element={<TeacherSchedulePage />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/auxiliar"
                    element={
                         <ProtectedRoute allowedRoles={["AUXILIAR"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<AuxiliarDashboard />} />
                    <Route path="asistencia" element={<AttendancePage />} />
                    <Route path="asistencia/nuevo" element={<NewAttendancePage />} />
                    <Route path="asistencia/aula/:classroomId" element={<DailyAttendanceSheetPage />} />
                    <Route path="incidencias" element={<IncidencesPage />} />
                    <Route path="reportes" element={<IncidentsPage />} />
                    <Route path="estudiantes" element={<StudentsListPage />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/psicologo"
                    element={
                         <ProtectedRoute allowedRoles={["PSICOLOGO"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<PsicologoDashboard />} />
                    <Route path="atenciones" element={<SpecialNeedsSupportPage />} />
                    <Route path="atenciones/new" element={<NewSpecialNeedsSupportPage />} />
                    <Route path="atenciones/edit/:id" element={<EditSpecialNeedsSupportPage />} />
                    <Route path="atenciones/view/:id" element={<ViewSpecialNeedsSupportPage />} />
                    <Route path="evaluaciones" element={<PsychologyPage />} />
                    <Route path="reportes" element={<IncidentsPage />} />
                    <Route path="evaluaciones/new" element={<NewEvaluationPage />} />
                    <Route path="evaluaciones/edit/:id" element={<EditEvaluationPage />} />
                    <Route path="evaluaciones/view/:id" element={<ViewEvaluationPage />} />
                    <Route path="informes" element={<EnDesarrollo titulo="Informes" />} />
                    <Route path="perfil" element={<ProfilePage />} />
               </Route>

               <Route
                    path="/familia"
                    element={
                         <ProtectedRoute allowedRoles={["APODERADO", "PADRE", "MADRE"]}>
                              <MainLayout />
                         </ProtectedRoute>
                    }
               >
                    <Route index element={<FamiliaDashboard />} />
                    <Route path="hijos" element={<FamiliaMyChildrenPage />} />
                    <Route path="calificaciones" element={<EnDesarrollo titulo="Calificaciones" />} />
                    <Route path="comunicados" element={<EnDesarrollo titulo="Comunicados" />} />
                    <Route path="asistencia" element={<AttendancePage />} />
               </Route>

               <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
     );
}
