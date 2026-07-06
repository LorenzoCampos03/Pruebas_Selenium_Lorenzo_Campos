import { NavLink } from "react-router-dom";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { getSidebarMenu } from "@/router/routeConfig";
import { getRoleLabel } from "@/core/utils/constants";

function isLightColor(hex) {
     if (!hex) return false;
     const num = parseInt(hex.replace("#", ""), 16);
     const r = num >> 16;
     const g = (num >> 8) & 0x00ff;
     const b = num & 0x0000ff;
     return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function hexToRgb(hex) {
     const num = parseInt(hex.replace("#", ""), 16);
     return { r: num >> 16, g: (num >> 8) & 0xff, b: num & 0xff };
}

function darkenRgb({ r, g, b }, factor) {
     return {
          r: Math.round(r * (1 - factor)),
          g: Math.round(g * (1 - factor)),
          b: Math.round(b * (1 - factor)),
     };
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, themeColor, logoSrc, institutionName }) {
     const { role } = useAuth();
     const menuItems = getSidebarMenu(role);
     const expanded = mobileOpen || !collapsed;
     const roleLabel = getRoleLabel(role);

     const hasColor = !!themeColor;
     const light = hasColor && isLightColor(themeColor);

     const txt = hasColor ? (light ? "text-gray-800" : "text-white") : "text-white";
     const txtMuted = hasColor ? (light ? "text-gray-400" : "text-white/40") : "text-slate-500";
     const txtItem = hasColor ? (light ? "text-gray-600" : "text-white/65") : "text-slate-400";
     const txtItemHover = hasColor ? (light ? "hover:text-gray-900" : "hover:text-white") : "hover:text-white";
     const iconInactive = hasColor ? (light ? "text-gray-400" : "text-white/40") : "text-slate-500";
     const iconHover = hasColor ? (light ? "group-hover:text-gray-700" : "group-hover:text-white/80") : "group-hover:text-slate-200";
     const hoverBg = hasColor ? (light ? "hover:bg-black/[0.06]" : "hover:bg-white/[0.08]") : "hover:bg-white/[0.06]";
     const dividerClass = hasColor ? (light ? "bg-black/[0.06]" : "bg-white/[0.08]") : "bg-white/[0.06]";
     const activeBg = hasColor ? (light ? "bg-black/[0.08]" : "bg-white/[0.12]") : "bg-white/[0.08]";
     const activeAccent = hasColor ? (light ? "bg-gray-900" : "bg-white") : "bg-primary-400";
     const activeIcon = hasColor ? (light ? "text-gray-900" : "text-white") : "text-primary-400";
     const activeText = hasColor ? (light ? "text-gray-900" : "text-white") : "text-white";

     let sidebarStyle;
     if (hasColor) {
          const rgb = hexToRgb(themeColor);
          const dark = darkenRgb(rgb, 0.35);
          sidebarStyle = {
               background: `linear-gradient(180deg, rgba(${rgb.r},${rgb.g},${rgb.b},0.95) 0%, rgba(${dark.r},${dark.g},${dark.b},0.98) 100%)`,
               backdropFilter: "blur(12px)",
          };
     }

     return (
          <aside
               className={[
                    "fixed left-0 top-0 h-screen flex flex-col z-40",
                    "transition-[width,transform] duration-300 ease-in-out overflow-hidden",
                    hasColor ? "" : "bg-sidebar",
                    mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
                    "lg:translate-x-0 lg:shadow-none",
                    collapsed ? "lg:w-18" : "lg:w-66",
                    "w-66",
               ].join(" ")}
               style={sidebarStyle}
          >
               <div className={[
                    "flex items-center shrink-0 overflow-hidden",
                    expanded ? "px-5 gap-3.5 h-18" : "justify-center h-18",
               ].join(" ")}>
                    <div className={[
                         "shrink-0 rounded-xl overflow-hidden flex items-center justify-center",
                         hasColor
                              ? (light ? "bg-white shadow-sm border border-black/6" : "bg-white/12 border border-white/10")
                              : "bg-white/8 border border-white/6",
                         expanded ? "w-10 h-10" : "w-9 h-9",
                    ].join(" ")}>
                         <img src={logoSrc} alt={institutionName} className="w-full h-full object-contain p-1" />
                    </div>
                    {expanded && (
                         <div className="flex flex-col min-w-0 flex-1">
                              <span className={[
                                   "block font-semibold text-sm leading-tight truncate",
                                   txt,
                              ].join(" ")} title={institutionName}>
                                   {institutionName}
                              </span>
                              <span className={[
                                   "block text-[11px] mt-1 leading-none truncate",
                                   txtMuted,
                              ].join(" ")}>
                                   {roleLabel}
                              </span>
                         </div>
                    )}
                    {expanded && (
                         <button
                              onClick={onMobileClose}
                              className={[
                                   "lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer",
                                   hasColor
                                        ? (light ? "text-gray-400 hover:text-gray-600 hover:bg-black/6" : "text-white/50 hover:text-white hover:bg-white/10")
                                        : "text-slate-500 hover:text-white hover:bg-white/8",
                              ].join(" ")}
                         >
                              <X className="w-4 h-4" />
                         </button>
                    )}
               </div>

               <div className={expanded ? "mx-5 my-1" : "mx-3 my-1"}>
                    <div className={["h-px", dividerClass].join(" ")} />
               </div>

               {expanded && (
                    <div className="px-5 pt-4 pb-2">
                         <span className={[
                              "text-[10px] font-bold uppercase tracking-[0.12em]",
                              txtMuted,
                         ].join(" ")}>
                              Navegación
                         </span>
                    </div>
               )}

               <nav className={[
                    "flex-1 overflow-y-auto overflow-x-hidden scrollbar-none",
                    expanded ? "px-3 py-1" : "px-2 py-1",
               ].join(" ")}>
                    <div className={expanded ? "space-y-0.5" : "space-y-1 flex flex-col items-center"}>
                         {menuItems.map((item) => (
                              <NavLink
                                   key={item.path}
                                   to={item.path}
                                   end={item.path === menuItems[0]?.path}
                                   title={!expanded ? item.label : undefined}
                                   className={({ isActive }) =>
                                        [
                                             "relative flex items-center font-medium select-none group",
                                             "transition-all duration-200 rounded-lg",
                                             expanded
                                                  ? "gap-3 px-3 py-2.5 text-[13px]"
                                                  : "w-10 h-10 justify-center",
                                             isActive
                                                  ? [activeBg, activeText, "font-semibold"].join(" ")
                                                  : [txtItem, txtItemHover, hoverBg].join(" "),
                                        ].join(" ")
                                   }
                              >
                                   {({ isActive }) => (
                                        <>
                                             {isActive && expanded && (
                                                  <span className={[
                                                       "absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r-full",
                                                       activeAccent,
                                                  ].join(" ")} />
                                             )}
                                             <item.icon
                                                  className={[
                                                       "shrink-0 transition-colors",
                                                       expanded ? "w-4.5 h-4.5" : "w-5 h-5",
                                                       isActive
                                                            ? activeIcon
                                                            : [iconInactive, iconHover].join(" "),
                                                  ].join(" ")}
                                                  strokeWidth={isActive ? 2.2 : 1.6}
                                             />
                                             {expanded && (
                                                  <span className="truncate leading-none">{item.label}</span>
                                             )}
                                        </>
                                   )}
                              </NavLink>
                         ))}
                    </div>
               </nav>

               <div className={expanded ? "mx-5 my-1" : "mx-3 my-1"}>
                    <div className={["h-px", dividerClass].join(" ")} />
               </div>

               <div className="hidden lg:block shrink-0 py-2">
                    <button
                         onClick={onToggle}
                         title={collapsed ? "Expandir menú" : "Colapsar menú"}
                         className={[
                              "flex items-center transition-all duration-200 cursor-pointer rounded-lg mx-auto",
                              expanded
                                   ? "gap-3 px-3 py-2 mx-3 text-[12px] font-medium w-auto"
                                   : "w-9 h-9 justify-center",
                              hasColor
                                   ? (light ? "text-gray-400 hover:text-gray-600 hover:bg-black/5" : "text-white/35 hover:text-white/70 hover:bg-white/6")
                                   : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
                         ].join(" ")}
                    >
                         {collapsed
                              ? <ChevronsRight className="w-4 h-4 shrink-0" />
                              : (
                                   <>
                                        <ChevronsLeft className="w-4 h-4 shrink-0" />
                                        <span>Colapsar</span>
                                   </>
                              )
                         }
                    </button>
               </div>
          </aside>
     );
}
