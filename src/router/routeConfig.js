import {
     LayoutDashboard,
     Users,
     Building2,
     Settings,
     UserCog,
     BookOpen,
     ClipboardList,
     CalendarDays,
     Calendar,
     FileText,
     Bell,
     Brain,
     HeartPulse,
     GraduationCap,
     Home,
     MessageSquare,
     BarChart3,
     Shield,
     BookOpenCheck,
} from "lucide-react";
import { ROUTES } from "./routes";

const adminMenu = [
     { label: "Dashboard", path: ROUTES.ADMIN.ROOT, icon: LayoutDashboard },
     { label: "Instituciones", path: ROUTES.ADMIN.INSTITUCIONES, icon: Building2 },
     { label: "Roles", path: ROUTES.ADMIN.ROLES, icon: Shield },
     { label: "Plantillas", path: ROUTES.ADMIN.PLANTILLAS, icon: Bell },
     { label: "Configuración", path: ROUTES.ADMIN.CONFIGURACION, icon: Settings },
];

const direccionMenu = [
     { label: "Dashboard", path: ROUTES.DIRECCION.ROOT, icon: LayoutDashboard },
     { label: "Mi Institución", path: ROUTES.DIRECCION.INSTITUCION, icon: Building2 },
     { label: "Personal", path: ROUTES.DIRECCION.PERSONAL, icon: UserCog },
     { label: "Estudiantes", path: ROUTES.DIRECCION.ESTUDIANTES, icon: GraduationCap },
     { label: "Cursos", path: ROUTES.DIRECCION.ACADEMIC, icon: BookOpenCheck },
     { label: "Reportes", path: ROUTES.DIRECCION.REPORTES, icon: BarChart3 },
     { label: "Comunicados", path: ROUTES.DIRECCION.COMUNICADOS, icon: Bell },
     { label: "Notificaciones", path: ROUTES.DIRECCION.NOTIFICACIONES, icon: Bell },
];

const secretariaMenu = [
     { label: "Dashboard", path: ROUTES.SECRETARIA.ROOT, icon: LayoutDashboard },
     { label: "Matrículas", path: ROUTES.SECRETARIA.MATRICULAS, icon: ClipboardList },
     { label: "Períodos Académicos", path: ROUTES.SECRETARIA.PERIODOS_ACADEMICOS, icon: CalendarDays },
     { label: "Estudiantes", path: ROUTES.SECRETARIA.ESTUDIANTES, icon: GraduationCap },
     { label: "Reportes", path: ROUTES.SECRETARIA.REPORTES, icon: BarChart3 },
     { label: "Documentos", path: ROUTES.SECRETARIA.DOCUMENTOS, icon: FileText },
     { label: "Horarios", path: ROUTES.SECRETARIA.HORARIOS, icon: CalendarDays },
     { label: "Eventos", path: ROUTES.SECRETARIA.EVENTOS, icon: Calendar },
];

const docenteMenu = [
     { label: "Dashboard", path: ROUTES.DOCENTE.ROOT, icon: LayoutDashboard },
     { label: "Cursos", path: ROUTES.DOCENTE.CURSOS, icon: BookOpenCheck },
     { label: "Asistencia", path: ROUTES.DOCENTE.ASISTENCIA, icon: ClipboardList },
     { label: "Calificaciones", path: ROUTES.DOCENTE.CALIFICACIONES, icon: FileText },
     { label: "Reportes", path: ROUTES.DOCENTE.REPORTES, icon: BarChart3 },
     { label: "Horario", path: ROUTES.DOCENTE.HORARIO, icon: CalendarDays },
];

const auxiliarMenu = [
     { label: "Dashboard", path: ROUTES.AUXILIAR.ROOT, icon: LayoutDashboard },
     { label: "Asistencia", path: ROUTES.AUXILIAR.ASISTENCIA, icon: ClipboardList },
     { label: "Incidencias", path: ROUTES.AUXILIAR.INCIDENCIAS, icon: Bell },
     { label: "Reportes", path: ROUTES.AUXILIAR.REPORTES, icon: BarChart3 },
     { label: "Estudiantes", path: ROUTES.AUXILIAR.ESTUDIANTES, icon: GraduationCap },
];

const psicologoMenu = [
     { label: "Dashboard", path: ROUTES.PSICOLOGO.ROOT, icon: LayoutDashboard },
     { label: "Atenciones", path: ROUTES.PSICOLOGO.ATENCIONES, icon: HeartPulse },
     { label: "Evaluaciones", path: ROUTES.PSICOLOGO.EVALUACIONES, icon: Brain },
     { label: "Reportes de Incidencia", path: ROUTES.PSICOLOGO.REPORTES, icon: BarChart3 },
     { label: "Informes", path: ROUTES.PSICOLOGO.INFORMES, icon: FileText },
];

const familiaMenu = [
     { label: "Inicio", path: ROUTES.FAMILIA.ROOT, icon: Home },
     { label: "Mis Hijos", path: ROUTES.FAMILIA.HIJOS, icon: GraduationCap },
     { label: "Calificaciones", path: ROUTES.FAMILIA.CALIFICACIONES, icon: FileText },
     { label: "Comunicados", path: ROUTES.FAMILIA.COMUNICADOS, icon: MessageSquare },
     { label: "Asistencia", path: ROUTES.FAMILIA.ASISTENCIA, icon: ClipboardList },
];

const SIDEBAR_CONFIG = {
     ADMINISTRADOR: adminMenu,
     DIRECTOR: direccionMenu,
     SUBDIRECTOR: direccionMenu,
     SECRETARIA: secretariaMenu,
     DOCENTE: docenteMenu,
     AUXILIAR: auxiliarMenu,
     PSICOLOGO: psicologoMenu,
     APODERADO: familiaMenu,
     PADRE: familiaMenu,
     MADRE: familiaMenu,
};

export function getSidebarMenu(role) {
     return SIDEBAR_CONFIG[role] || [];
}
