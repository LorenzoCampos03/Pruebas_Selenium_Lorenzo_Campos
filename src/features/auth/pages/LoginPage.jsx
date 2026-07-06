import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { alertLoginSuccess, alertLoginError, alertWarning } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { getRouteByRole } from "@/core/utils/constants";

export default function LoginPage() {
     const [username, setUsername] = useState("");
     const [password, setPassword] = useState("");
     const [showPassword, setShowPassword] = useState(false);
     const [isLoading, setIsLoading] = useState(false);
     const { login, isAuthenticated, role, loading } = useAuth();
     const navigate = useNavigate();

     useEffect(() => {
          if (!loading && isAuthenticated && role) {
               navigate(getRouteByRole(role), { replace: true });
          }
     }, [isAuthenticated, role, loading, navigate]);

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (!username.trim() || !password.trim()) {
               alertWarning("Ingresa usuario y contraseña");
               return;
          }

          setIsLoading(true);
          try {
               const result = await login(username, password);
               if (result.success) {
                    await alertLoginSuccess(result.displayName || username);
                    navigate(getRouteByRole(result.role), { replace: true });
               } else {
                    alertLoginError(result.message || "Credenciales incorrectas");
               }
          } catch {
               alertLoginError("Error de conexión con el servidor");
          } finally {
               setIsLoading(false);
          }
     };

     return (
          <div className="h-screen overflow-hidden flex">
               {/* ── Panel izquierdo ── */}
               <div
                    className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)" }}
               >
                    {/* Burbujas decorativas estáticas */}
                    <div className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-20" style={{ background: "#fbbf24" }} />
                    <div className="absolute top-32 right-16 w-14 h-14 rounded-full opacity-25" style={{ background: "#34d399" }} />
                    <div className="absolute bottom-24 left-20 w-16 h-16 rounded-full opacity-20" style={{ background: "#f472b6" }} />
                    <div className="absolute bottom-16 right-12 w-24 h-24 rounded-full opacity-15" style={{ background: "#a78bfa" }} />
                    <div className="absolute top-1/2 left-6 w-10 h-10 rounded-full opacity-30" style={{ background: "#fb923c" }} />

                    {/* Estrellas / formas */}
                    <div className="absolute top-20 right-28 text-yellow-300 opacity-60 text-3xl select-none">★</div>
                    <div className="absolute bottom-36 left-36 text-yellow-200 opacity-50 text-2xl select-none">✦</div>
                    <div className="absolute top-44 left-40 text-white opacity-20 text-5xl select-none">✿</div>
                    <div className="absolute bottom-48 right-40 text-white opacity-20 text-4xl select-none">❋</div>

                    <div className="relative z-10 flex flex-col items-center text-center px-12">
                         <div className="mb-8">
                              <div className="w-36 h-36 rounded-3xl bg-white flex items-center justify-center shadow-2xl border border-white/20 p-3">
                                   <img
                                        src={`${import.meta.env.BASE_URL}SigeiLogo.png`}
                                        alt="SIGEI"
                                        className="w-full h-full object-contain "
                                   />
                              </div>
                         </div>

                         <div>
                              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                                   SIGEI
                              </h1>
                              <p className="text-blue-100 text-base font-medium mb-6 leading-relaxed">
                                   Sistema Integrado de<br />Gestión Educativa
                              </p>
                              <div className="flex flex-wrap gap-2 justify-center mt-2">
                                   {["🎨 Inicial", "📚 Educación", "🌟 Aprendizaje"].map((tag) => (
                                        <span
                                             key={tag}
                                             className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-sm"
                                        >
                                             {tag}
                                        </span>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* Ola inferior decorativa */}
                    <div className="absolute bottom-0 left-0 right-0">
                         <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                   d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
                                   fill="rgba(255,255,255,0.08)"
                              />
                         </svg>
                    </div>

                    <p className="absolute bottom-4 text-blue-200/60 text-xs z-10">
                         Valle Grande &copy; {new Date().getFullYear()}
                    </p>
               </div>

               {/* ── Panel derecho — Formulario ── */}
               <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-gray-50 overflow-y-auto">
                    {/* Logo mobile */}
                    <div className="flex lg:hidden flex-col items-center mb-8">
                         <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg mb-3 p-2">
                              <img src={`${import.meta.env.BASE_URL}SigeiLogo.png`} alt="SIGEI" className="w-full h-full object-contain" />
                         </div>
                         <h1 className="text-2xl font-bold text-gray-900">SIGEI</h1>
                         <p className="text-xs text-gray-500 mt-1">Sistema Integrado de Gestión Educativa</p>
                    </div>

                    <div className="w-full max-w-md">
                         <div className="mb-8">
                              <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido de vuelta! 👋</h2>
                              <p className="text-sm text-gray-500 mt-1">
                                   Ingresa tus credenciales para continuar
                              </p>
                         </div>

                         <form onSubmit={handleSubmit} className="space-y-5">
                              <div>
                                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Usuario
                                   </label>
                                   <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Ingresa tu usuario"
                                        autoComplete="username"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors duration-150 bg-white hover:border-gray-300 placeholder-gray-400"
                                        disabled={isLoading}
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Contraseña
                                   </label>
                                   <div className="relative">
                                        <input
                                             type={showPassword ? "text" : "password"}
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             placeholder="Ingresa tu contraseña"
                                             autoComplete="current-password"
                                             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors duration-150 bg-white hover:border-gray-300 placeholder-gray-400 pr-12"
                                             disabled={isLoading}
                                        />
                                        <button
                                             type="button"
                                             onClick={() => setShowPassword(!showPassword)}
                                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                             {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                   </div>
                              </div>

                              <div className="pt-1">
                                   <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-xl text-sm transition-colors duration-150 flex items-center justify-center gap-2.5 shadow-lg shadow-primary-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                   >
                                        {isLoading ? (
                                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                             <>
                                                  <LogIn className="w-4 h-4" />
                                                  Iniciar Sesión
                                             </>
                                        )}
                                   </button>
                              </div>
                         </form>

                         {/* Info cards */}
                         <div className="mt-8 grid grid-cols-3 gap-3">
                              {[
                                   { icon: "🎓", label: "Gestión educativa" },
                                   { icon: "👶", label: "Nivel inicial" },
                                   { icon: "🔒", label: "Acceso seguro" },
                              ].map(({ icon, label }) => (
                                   <div
                                        key={label}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
                                   >
                                        <span className="text-xl">{icon}</span>
                                        <span className="text-xs text-gray-500 text-center font-medium leading-tight">
                                             {label}
                                        </span>
                                   </div>
                              ))}
                         </div>

                         <p className="text-center text-xs text-gray-400 mt-6 lg:hidden">
                              Valle Grande &copy; {new Date().getFullYear()}
                         </p>
                    </div>
               </div>
          </div>
     );
}
