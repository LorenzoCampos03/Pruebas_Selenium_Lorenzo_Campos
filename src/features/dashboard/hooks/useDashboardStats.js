import { useState, useEffect } from "react";
import { institutionService } from "@/features/institutions/services/institutionService";
import { userService } from "@/features/users/services/userService";
import { studentService } from "@/features/students/services/studentService";
import { enrollmentService } from "@/features/enrollments/services/enrollmentService";
import { eventService } from "@/features/events/services/eventService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";

function safeExtract(response) {
     const raw = isSuccessResponse(response) ? extractData(response) : response;
     return Array.isArray(raw) ? raw : [];
}

export function useAdminStats() {
     const [stats, setStats] = useState({ institutions: 0, users: 0, loading: true });

     useEffect(() => {
          let mounted = true;
          async function load() {
               try {
                    const [instRes, usersRes] = await Promise.all([
                         institutionService.getAll(),
                         userService.getAll(),
                    ]);
                    if (!mounted) return;
                    const institutions = safeExtract(instRes);
                    const users = safeExtract(usersRes);
                    setStats({
                         institutions: institutions.length,
                         users: users.length,
                         activeUsers: users.filter((u) => u.status === "ACTIVE" || u.status === "ACTIVO").length,
                         loading: false,
                    });
               } catch {
                    if (mounted) setStats((s) => ({ ...s, loading: false }));
               }
          }
          load();
          return () => { mounted = false; };
     }, []);

     return stats;
}

export function useDireccionStats(institutionId) {
     const [stats, setStats] = useState({ students: 0, staff: 0, loading: true });

     useEffect(() => {
          if (!institutionId) {
               setStats((s) => ({ ...s, loading: false }));
               return;
          }
          let mounted = true;
          async function load() {
               try {
                    const [studentsRes, usersRes] = await Promise.all([
                         studentService.getByInstitution(institutionId),
                         userService.getByInstitution(institutionId),
                    ]);
                    if (!mounted) return;
                    const students = safeExtract(studentsRes);
                    const users = safeExtract(usersRes);
                    const activeStudents = students.filter((s) => s.status === "ACTIVE" || s.status === "ACTIVO");
                    const activeStaff = users.filter((u) => u.status === "ACTIVE" || u.status === "ACTIVO");
                    setStats({
                         students: activeStudents.length,
                         totalStudents: students.length,
                         staff: activeStaff.length,
                         totalStaff: users.length,
                         loading: false,
                    });
               } catch {
                    if (mounted) setStats((s) => ({ ...s, loading: false }));
               }
          }
          load();
          return () => { mounted = false; };
     }, [institutionId]);

     return stats;
}

export function useSecretariaStats(institutionId) {
     const [stats, setStats] = useState({
          students: 0,
          enrollments: 0,
          events: 0,
          reports: 0,
          loading: true,
          enrollmentsByStatus: {},
          upcomingEvents: [],
          recentEnrollments: [],
     });

     useEffect(() => {
          if (!institutionId) {
               setStats((s) => ({ ...s, loading: false }));
               return;
          }
          let mounted = true;
          async function load() {
               try {
                    const [studentsRes, enrollmentsRes, eventsRes] = await Promise.all([
                         studentService.getByInstitution(institutionId),
                         enrollmentService.getByInstitution(institutionId),
                         eventService.getByInstitution(institutionId),
                    ]);
                    if (!mounted) return;

                    const students = safeExtract(studentsRes);
                    const enrollments = safeExtract(enrollmentsRes);
                    const events = safeExtract(eventsRes);

                    // Filtrar estudiantes activos
                    const activeStudents = students.filter((s) => s.status === "ACTIVE" || s.status === "ACTIVO");

                    // Contar matrículas por estado
                    const enrollmentsByStatus = enrollments.reduce((acc, enrollment) => {
                         const status = enrollment.enrollmentStatus || enrollment.status || "UNKNOWN";
                         acc[status] = (acc[status] || 0) + 1;
                         return acc;
                    }, {});

                    // Filtrar eventos activos y próximos
                    const now = new Date();
                    const activeEvents = events.filter((e) => {
                         if (e.status === "INACTIVE" || e.status === "INACTIVO") return false;
                         const eventDate = new Date(e.eventDate || e.startDate);
                         return eventDate >= now;
                    });

                    // Ordenar eventos por fecha
                    const upcomingEvents = activeEvents
                         .sort((a, b) => {
                              const dateA = new Date(a.eventDate || a.startDate);
                              const dateB = new Date(b.eventDate || b.startDate);
                              return dateA - dateB;
                         })
                         .slice(0, 5);

                    // Obtener matrículas recientes
                    const recentEnrollments = enrollments
                         .sort((a, b) => {
                              const dateA = new Date(a.enrollmentDate || a.createdAt);
                              const dateB = new Date(b.enrollmentDate || b.createdAt);
                              return dateB - dateA;
                         })
                         .slice(0, 5);

                    setStats({
                         students: activeStudents.length,
                         totalStudents: students.length,
                         enrollments: enrollments.length,
                         activeEnrollments: enrollmentsByStatus.ACTIVE || 0,
                         pendingEnrollments: enrollmentsByStatus.PENDING || 0,
                         events: activeEvents.length,
                         totalEvents: events.length,
                         reports: 0, // Esto se puede calcular si hay un servicio de reportes
                         loading: false,
                         enrollmentsByStatus,
                         upcomingEvents,
                         recentEnrollments,
                    });
               } catch (error) {
                    console.error("Error loading secretaria stats:", error);
                    if (mounted) setStats((s) => ({ ...s, loading: false }));
               }
          }
          load();
          return () => { mounted = false; };
     }, [institutionId]);

     return stats;
}
