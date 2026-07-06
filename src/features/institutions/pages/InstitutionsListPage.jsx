import { useAuth } from "@/core/auth/AuthContext";
import { ROLES } from "@/core/utils/constants";
import AdminInstitutionsPage from "./AdminInstitutionsPage";
import DirectorInstitutionPage from "./DirectorInstitutionPage";


export default function InstitutionsListPage() {
     const { role } = useAuth();

     if (role === ROLES.ADMINISTRADOR) {
          return <AdminInstitutionsPage />;
     }

     if (role === ROLES.DIRECTOR || role === ROLES.SUBDIRECTOR) {
          return <DirectorInstitutionPage />;
     }

     return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
               <p className="text-gray-500 text-sm">
                    No tiene permisos para acceder a esta sección.
               </p>
          </div>
     );
}
