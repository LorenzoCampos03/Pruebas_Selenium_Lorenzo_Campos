import { useState } from "react";
import { Building2 } from "lucide-react";

export default function InstitutionAvatar({
     logoUrl,
     name,
     colorInstitution,
     size = "lg",
}) {
     const [hasError, setHasError] = useState(false);

     const sizeClasses = {
          sm: "h-10 w-10",
          md: "h-12 w-12",
          lg: "h-14 w-14",
     };

     const iconSizes = {
          sm: "w-5 h-5",
          md: "w-6 h-6",
          lg: "w-7 h-7",
     };

     const avatarSize = sizeClasses[size] || sizeClasses.lg;
     const iconSize = iconSizes[size] || iconSizes.lg;
     const hasLogo = Boolean(logoUrl) && !hasError;

     if (hasLogo) {
          return (
               <img
                    src={logoUrl}
                    alt={name ? `Logo de ${name}` : "Logo de institución"}
                    className={`${avatarSize} rounded-xl object-cover border border-gray-200 bg-white`}
                    onError={() => setHasError(true)}
               />
          );
     }

     return (
          <div
               className={`${avatarSize} rounded-xl border border-gray-200 flex items-center justify-center`}
               style={{ backgroundColor: colorInstitution || "#dbeafe" }}
          >
               <Building2 className={`${iconSize} text-primary-600`} />
          </div>
     );
}