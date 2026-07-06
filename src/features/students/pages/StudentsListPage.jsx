import { useAuth } from "@/core/auth/AuthContext";
import { ROLES } from "@/core/utils/constants";
import SecretariaStudentsPage from "../components/secretaria/SecretariaStudentsPage";
import AuxiliarStudentsPage from "../components/auxiliar/AuxiliarStudentsPage";

export default function StudentsListPage() {
     const { role } = useAuth();

     if (role === ROLES.SECRETARIA) {
          return <SecretariaStudentsPage />;
     }

     if (role === ROLES.AUXILIAR) {
          return <AuxiliarStudentsPage />;
     }

     return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
               <p className="text-gray-500 text-sm">
                    No tiene permisos para acceder a esta sección.
               </p>
          </div>
     );
}
