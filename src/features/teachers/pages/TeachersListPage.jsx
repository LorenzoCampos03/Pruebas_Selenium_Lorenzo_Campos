import { useAuth } from "@/core/auth/AuthContext";
import { ROLES } from "@/core/utils/constants";
import DirectorTeachersAssignmentsPage from "./DirectorTeachersAssignmentsPage";
import TeacherSchedulePage from "./TeacherSchedulePage";

export default function TeachersListPage() {
     const { role } = useAuth();

     if (role === ROLES.DIRECTOR || role === ROLES.SUBDIRECTOR) {
          return <DirectorTeachersAssignmentsPage />;
     }

     if (role === ROLES.DOCENTE) {
          return <TeacherSchedulePage />;
     }

     return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
               <p className="text-gray-500 text-sm">
                    No tiene permisos para acceder a esta seccion.
               </p>
          </div>
     );
}
