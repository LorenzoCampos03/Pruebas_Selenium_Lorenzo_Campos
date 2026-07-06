export const ROUTES = {
     LOGIN: "/login",
     ROOT: "/",

     ADMIN: {
          ROOT: "/admin",
          INSTITUCIONES: "/admin/instituciones",
          USUARIOS: "/admin/usuarios",
          ROLES: "/admin/roles",
          CONFIGURACION: "/admin/configuracion",
          PLANTILLAS: "/admin/plantillas",
     },

     DIRECCION: {
          ROOT: "/direccion",
          INSTITUCION: "/direccion/institucion",
          PERSONAL: "/direccion/personal",
          ESTUDIANTES: "/direccion/estudiantes",
          REPORTES: "/direccion/reportes",
          COMUNICADOS: "/direccion/comunicados",
          ACADEMIC: "/direccion/academic",
          NOTIFICACIONES: "/direccion/notificaciones",
     },

     SECRETARIA: {
          ROOT: "/secretaria",
          MATRICULAS: "/secretaria/matriculas",
          PERIODOS_ACADEMICOS: "/secretaria/periodos-academicos",
          ESTUDIANTES: "/secretaria/estudiantes",
          REPORTES: "/secretaria/reportes",
          DOCUMENTOS: "/secretaria/documentos",
          HORARIOS: "/secretaria/horarios",
          EVENTOS: "/secretaria/eventos",
     },

     DOCENTE: {
          ROOT: "/docente",
          CURSOS: "/docente/cursos",
          CURSO_DETAIL: "/docente/cursos/:courseId",
          ASISTENCIA: "/docente/asistencia",
          CALIFICACIONES: "/docente/calificaciones",
          REPORTES: "/docente/reportes",
          HORARIO: "/docente/horario",
     },

     AUXILIAR: {
          ROOT: "/auxiliar",
          ASISTENCIA: "/auxiliar/asistencia",
          INCIDENCIAS: "/auxiliar/incidencias",
          REPORTES: "/auxiliar/reportes",
          ESTUDIANTES: "/auxiliar/estudiantes",
     },

     PSICOLOGO: {
          ROOT: "/psicologo",
          ATENCIONES: "/psicologo/atenciones",
          EVALUACIONES: "/psicologo/evaluaciones",
              REPORTES: "/psicologo/reportes",
          INFORMES: "/psicologo/informes",
     },

     FAMILIA: {
          ROOT: "/familia",
          HIJOS: "/familia/hijos",
          CALIFICACIONES: "/familia/calificaciones",
          COMUNICADOS: "/familia/comunicados",
          ASISTENCIA: "/familia/asistencia",
     },
};
