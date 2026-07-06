import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, ChevronDown, User, UserCircle } from "lucide-react";
import { alertConfirmLogout, alertSuccess } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { getRoleLabel, ROLE_ROUTES } from "@/core/utils/constants";
import { userService } from "@/features/users/services/userService";
import { isSuccessResponse, extractData } from "@/core/api/apiResponse";

export default function Header({ onMenuToggle, themeColor, institutionName }) {
     const { user, role, logout } = useAuth();
     const navigate = useNavigate();
     const [dropdownOpen, setDropdownOpen] = useState(false);
     const [photoUrl, setPhotoUrl] = useState(null);
     const dropdownRef = useRef(null);

     useEffect(() => {
          const handler = (e) => {
               if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                    setDropdownOpen(false);
               }
          };
          document.addEventListener("mousedown", handler);
          return () => document.removeEventListener("mousedown", handler);
     }, []);

     useEffect(() => {
          if (!user?.userId) return;
          userService.getById(user.userId)
               .then((res) => {
                    const d = isSuccessResponse(res) ? extractData(res) : res;
                    if (d?.photoUrl) {
                         const ts = localStorage.getItem(`photo_timestamp_${user.userId}`);
                         setPhotoUrl(ts ? `${d.photoUrl}?t=${ts}` : d.photoUrl);
                    }
               })
               .catch(() => { });

          const handlePhotoUpdate = (e) => {
               const { url, ts } = e.detail;
               setPhotoUrl(`${url}?t=${ts}`);
          };
          window.addEventListener('photo-updated', handlePhotoUpdate);
          return () => window.removeEventListener('photo-updated', handlePhotoUpdate);
     }, [user?.userId]);

     const handleLogout = async () => {
          setDropdownOpen(false);
          const result = await alertConfirmLogout();
          if (!result.isConfirmed) return;
          await logout();
          await alertSuccess("Sesión cerrada correctamente", "¡Hasta pronto!");
          navigate("/login", { replace: true });
     };

     const displayName = user?.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : user?.firstName
               ? `${user.firstName} ${user.lastName || ""}`.trim()
               : user?.username || "Usuario";

     const initials = displayName
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase() || "")
          .join("");

     const roleLabel = getRoleLabel(role);
     const hasColor = !!themeColor;

     return (
          <header className="h-16 bg-white border-b border-gray-200/70 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0">
               <div className="flex items-center gap-3">
                    <button
                         onClick={onMenuToggle}
                         className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 lg:hidden cursor-pointer"
                    >
                         <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden sm:flex sm:items-center sm:gap-3">
                         {hasColor && (
                              <div
                                   className="w-2 h-2 rounded-full shrink-0"
                                   style={{ backgroundColor: themeColor }}
                              />
                         )}
                         <div>
                              <h1 className="text-sm font-semibold text-gray-800 leading-tight">
                                   {roleLabel}
                              </h1>
                              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                                   {institutionName !== "SIGEI" ? institutionName : "Panel de control"}
                              </p>
                         </div>
                    </div>
               </div>

               <div className="flex items-center gap-2">
                    <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

                    <div className="relative" ref={dropdownRef}>
                         <button
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                              className={[
                                   "flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl transition-colors cursor-pointer",
                                   dropdownOpen ? "bg-gray-100" : "hover:bg-gray-50",
                              ].join(" ")}
                         >
                              {photoUrl ? (
                                   <img src={photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-sm" />
                              ) : (
                                   <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                                        style={{ backgroundColor: themeColor || "#2563eb" }}
                                   >
                                        {initials || <User className="w-4 h-4" />}
                                   </div>
                              )}
                              <div className="hidden sm:block text-left">
                                   <p className="text-[13px] font-semibold text-gray-800 leading-tight max-w-36 truncate">
                                        {displayName}
                                   </p>
                                   <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                                        {roleLabel}
                                   </p>
                              </div>
                              <ChevronDown className={[
                                   "w-3.5 h-3.5 text-gray-400 transition-transform duration-200 hidden sm:block",
                                   dropdownOpen ? "rotate-180" : "",
                              ].join(" ")} />
                         </button>

                         {dropdownOpen && (
                              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl shadow-black/8 border border-gray-200/80 overflow-hidden z-50">
                                   <div className="p-4">
                                        <div className="flex items-center gap-3">
                                             {photoUrl ? (
                                                  <img src={photoUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 shadow-sm" />
                                             ) : (
                                                  <div
                                                       className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                                                       style={{ backgroundColor: themeColor || "#2563eb" }}
                                                  >
                                                       {initials || <User className="w-5 h-5" />}
                                                  </div>
                                             )}
                                             <div className="overflow-hidden flex-1">
                                                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                                  <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email || ""}</p>
                                             </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                             <span
                                                  className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-md"
                                                  style={{
                                                       backgroundColor: themeColor ? `${themeColor}15` : "#eff6ff",
                                                       color: themeColor || "#1d4ed8",
                                                  }}
                                             >
                                                  {roleLabel}
                                             </span>
                                             {institutionName !== "SIGEI" && (
                                                  <span className="text-[11px] text-gray-400 truncate">
                                                       {institutionName}
                                                  </span>
                                             )}
                                        </div>
                                   </div>

                                   <div className="h-px bg-gray-100 mx-3" />

                                   <div className="p-1.5">
                                        <button
                                             onClick={() => {
                                                  setDropdownOpen(false);
                                                  const base = ROLE_ROUTES[role] || "";
                                                  navigate(`${base}/perfil`);
                                             }}
                                             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                                        >
                                             <UserCircle className="w-4 h-4 text-gray-500" />
                                             Mi Perfil
                                        </button>
                                        <button
                                             onClick={handleLogout}
                                             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                                        >
                                             <LogOut className="w-4 h-4" />
                                             Cerrar sesión
                                        </button>
                                   </div>
                              </div>
                         )}
                    </div>
               </div>
          </header>
     );
}
