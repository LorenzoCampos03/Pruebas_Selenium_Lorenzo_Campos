import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { institutionService } from "@/features/institutions/services/institutionService";
import { parseInstitutionFromApi } from "@/features/institutions/models/institutionModel";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import { storage } from "@/core/utils/storage";
import Sidebar from "./Sidebar";
import Header from "./Header";

const INSTITUTION_CACHE_KEY = "sigei_institution_cache";

function getCachedInstitution(institutionId) {
     const cached = storage.get(INSTITUTION_CACHE_KEY);
     if (cached && cached.id === institutionId) return cached;
     return null;
}

function setCachedInstitution(data) {
     storage.set(INSTITUTION_CACHE_KEY, data);
}

export default function MainLayout() {
     const { user, role } = useAuth();
     const [collapsed, setCollapsed] = useState(false);
     const [mobileOpen, setMobileOpen] = useState(false);
     const [institutionData, setInstitutionData] = useState(() => {
          if (user?.institutionId && role !== "ROLE_ADMIN") {
               return getCachedInstitution(user.institutionId);
          }
          return null;
     });
     const location = useLocation();
     const prevPathRef = useRef(location.pathname);

     useEffect(() => {
          if (prevPathRef.current !== location.pathname) {
               prevPathRef.current = location.pathname;
               if (mobileOpen) {
                    queueMicrotask(() => setMobileOpen(false));
               }
          }
     }, [location.pathname, mobileOpen]);

     useEffect(() => {
          let isMounted = true;
          const fetchInstitution = async () => {
               if (user?.institutionId && role !== "ROLE_ADMIN") {
                    try {
                         const response = await institutionService.getById(user.institutionId);
                         const raw = isSuccessResponse(response) ? extractData(response) : response;
                         const data = parseInstitutionFromApi(raw);
                         if (isMounted) {
                              setInstitutionData(data);
                              setCachedInstitution(data);
                         }
                    } catch {
                         if (isMounted) setInstitutionData(getCachedInstitution(user.institutionId));
                    }
               } else {
                    if (isMounted) {
                         setInstitutionData(null);
                         storage.remove(INSTITUTION_CACHE_KEY);
                    }
               }
          };
          fetchInstitution();
          return () => { isMounted = false; };
     }, [user?.institutionId, role]);

     const closeMobile = useCallback(() => setMobileOpen(false), []);

     const themeColor = institutionData?.colorInstitution || null;
     const logoSrc = institutionData?.logoUrl || `${import.meta.env.BASE_URL}SigeiLogo.png`;
     const institutionName = institutionData?.name || "SIGEI";

     return (
          <div className="h-screen overflow-hidden bg-gray-50/80">
               {mobileOpen && (
                    <div
                         className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 lg:hidden"
                         onClick={closeMobile}
                    />
               )}

               <Sidebar
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(!collapsed)}
                    mobileOpen={mobileOpen}
                    onMobileClose={closeMobile}
                    themeColor={themeColor}
                    logoSrc={logoSrc}
                    institutionName={institutionName}
               />

               <div className={[
                    "flex flex-col h-screen transition-[margin] duration-300 ease-in-out",
                    collapsed ? "lg:ml-18" : "lg:ml-66",
               ].join(" ")}>
                    <Header
                         onMenuToggle={() => setMobileOpen(!mobileOpen)}
                         themeColor={themeColor}
                         institutionName={institutionName}
                    />
                    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                         <Outlet />
                    </main>
               </div>
          </div>
     );
}
