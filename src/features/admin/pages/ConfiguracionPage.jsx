import { useState, useEffect, useRef, useCallback } from "react";
import {
  Settings, Database, Trash2, Download, RefreshCw, AlertTriangle, Shield, Plus,
  CheckCircle2, Clock, Loader2, XCircle, ChevronLeft
} from "lucide-react";
import { Button, Card } from "@/shared/components/ui";
import apiClient from "@/core/api/apiClient";
import { ENDPOINTS } from "@/core/api/endpoints";
import toast from "react-hot-toast";

const ALL_DATABASES = [
  { key: "sigei_users", label: "Usuarios", description: "Gestión de usuarios y roles" },
  { key: "sigei_students", label: "Estudiantes", description: "Estudiantes y apoderados" },
  { key: "sigei_teachers", label: "Docentes", description: "Registro de docentes" },
  { key: "sigei_institution", label: "Instituciones", description: "Instituciones y aulas" },
  { key: "sigei_enrollments", label: "Matrículas", description: "Matrículas y períodos" },
  { key: "sigei_academic", label: "Académico", description: "Cursos y competencias" },
  { key: "sigei_assistance", label: "Asistencia", description: "Registro de asistencias" },
  { key: "sigei_psychology", label: "Psicología", description: "Evaluaciones psicológicas" },
  { key: "sigei_disciplinary", label: "Disciplinario", description: "Incidencias disciplinarias" },
  { key: "sigei_notifications", label: "Notificaciones", description: "Sistema de notificaciones" },
  { key: "sigei_event", label: "Eventos", description: "Eventos cívicos" },
];

function formatSize(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatDate(raw) {
  if (!raw) return "—";
  return new Date(raw).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DatabaseBackupDetail({ db, allBackups, onRefresh, onBack }) {
  const [creating, setCreating] = useState(false);
  const pollingRef = useRef(null);

  const dbBackups = allBackups.filter((b) => b.dbName === db.key);
  const anyProcessing = dbBackups.some((b) => b.status === "PROCESSING");
  const lastBackup = dbBackups.find((b) => b.status === "DONE");

  useEffect(() => {
    if (anyProcessing) {
      if (!pollingRef.current) pollingRef.current = setInterval(onRefresh, 5000);
    } else {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => clearInterval(pollingRef.current);
  }, [anyProcessing, onRefresh]);

  async function handleCreate() {
    setCreating(true);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.BACKUP_CREATE_DB(db.key));
      toast.success(`Respaldo de ${db.label} iniciado.`);
      onRefresh();
    } catch {
      toast.error(`No se pudo iniciar el respaldo de ${db.label}.`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDownload(backup) {
    try {
      const token = localStorage.getItem("access_token");
      const base = window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL;
      const res = await fetch(`${base}${ENDPOINTS.ADMIN.BACKUP_DOWNLOAD(backup.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.fileName || `${db.key}_backup.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el respaldo.");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{db.label}</h2>
            <p className="text-sm text-gray-500">{db.description}</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || anyProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl font-medium transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Crear Respaldo
        </button>
      </div>

      <div className="p-5 flex-1 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total de Respaldos</p>
            <p className="text-2xl font-bold text-gray-900">{dbBackups.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Último Respaldo Exitoso</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{lastBackup ? formatDate(lastBackup.createdAt) : "Ninguno"}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">Historial de Respaldos</h3>
          </div>
          {dbBackups.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay respaldos para este microservicio.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dbBackups.map((b, idx) => {
                const isProcessing = b.status === "PROCESSING";
                const isError = b.status === "ERROR";
                const isDone = b.status === "DONE";
                return (
                  <div key={b.id || idx} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isProcessing ? "bg-yellow-100" : isError ? "bg-red-100" : "bg-green-100"}`}>
                      {isProcessing && <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />}
                      {isError && <XCircle className="w-4 h-4 text-red-600" />}
                      {isDone && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{formatDate(b.createdAt)}</p>
                        {isDone && b.sizeKb > 0 && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500 font-medium">{formatSize(b.sizeKb)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${isProcessing ? "bg-yellow-100 text-yellow-700" : isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {b.status}
                      </span>
                      <button
                        onClick={() => isDone && handleDownload(b)}
                        disabled={!isDone}
                        className={`p-2 rounded-lg transition-colors ${isDone ? "text-primary-600 hover:bg-primary-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedDb, setSelectedDb] = useState(null);
  const [resetModal, setResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const { data } = await apiClient.get(ENDPOINTS.ADMIN.BACKUPS);
      const list = data?.data || data || [];
      setBackups(Array.isArray(list) ? list : []);
    } catch {
      setBackups([]);
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  async function handleResetSystem() {
    if (resetConfirmText !== "ELIMINAR TODO") return;
    setResetting(true);
    try {
      await apiClient.delete(ENDPOINTS.ADMIN.RESET_SYSTEM);
      toast.success("Sistema reiniciado. Solo se conservó la cuenta administrador.");
      setResetModal(false);
      setResetConfirmText("");
    } catch {
      toast.error("No se pudo reiniciar el sistema.");
    } finally {
      setResetting(false);
    }
  }

  const doneBackups = backups.filter((b) => b.status === "DONE").length;
  const totalSizeKb = backups.filter((b) => b.status === "DONE").reduce((s, b) => s + (b.sizeKb || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gray-100 rounded-xl">
          <Settings className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-sm text-gray-500">Administración general y respaldos de microservicios</p>
        </div>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchBackups} loading={loadingBackups}>
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card padding="p-4">
          <p className="text-xs text-gray-400 mb-1">Total respaldos</p>
          <p className="text-2xl font-bold text-gray-900">{backups.length}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-gray-400 mb-1">Completados</p>
          <p className="text-2xl font-bold text-green-600">{doneBackups}</p>
        </Card>
        <Card padding="p-4">
          <p className="text-xs text-gray-400 mb-1">Tamaño total</p>
          <p className="text-2xl font-bold text-primary-600">{formatSize(totalSizeKb)}</p>
        </Card>
      </div>

      <Card padding="p-0" className="overflow-hidden">
        {selectedDb ? (
          <DatabaseBackupDetail
            db={selectedDb}
            allBackups={backups}
            onRefresh={fetchBackups}
            onBack={() => setSelectedDb(null)}
          />
        ) : (
          <>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-500" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Respaldos por Microservicio</h2>
                <p className="text-xs text-gray-400 mt-0.5">Selecciona un módulo para gestionar su historial de copias de seguridad</p>
              </div>
            </div>
            {loadingBackups && backups.length === 0 ? (
              <div className="flex items-center justify-center py-14">
                <div className="w-7 h-7 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50">
                {ALL_DATABASES.map((db) => {
                  const dbBackups = backups.filter(b => b.dbName === db.key);
                  const last = dbBackups.find(b => b.status === "DONE");
                  return (
                    <div
                      key={db.key}
                      onClick={() => setSelectedDb(db)}
                      className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-primary-400 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                          <Database className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                          {dbBackups.length} {dbBackups.length === 1 ? 'respaldo' : 'respaldos'}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{db.label}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{db.description}</p>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">
                            {last ? formatDate(last.createdAt) : "Sin respaldos"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>

      <Card padding="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-600">Zona Peligrosa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Acciones irreversibles que afectan al sistema completo</p>
          </div>
        </div>
        <div className="border border-red-200 rounded-xl p-4 bg-red-50/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Purgar todos los datos del sistema</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Elimina todos los registros de todas las tablas y de Keycloak. Solo se conserva la cuenta administrador del sistema.
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <span className="text-xs text-primary-600 font-medium">Se conserva: administrador.sigei@sigei.edu.pe</span>
              </div>
            </div>
            <button
              onClick={() => { setResetModal(true); setResetConfirmText(""); }}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Purgar Sistema
            </button>
          </div>
        </div>
      </Card>

      {resetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmación requerida</h3>
                <p className="text-sm text-red-500">Esta acción es completamente irreversible</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700">Se eliminarán TODOS los datos del sistema:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-red-600">
                <li>Usuarios, docentes, estudiantes y apoderados</li>
                <li>Instituciones educativas y aulas</li>
                <li>Matrículas, notas y asistencias</li>
                <li>Todas las cuentas de Keycloak</li>
                <li>Reportes y evaluaciones psicológicas</li>
              </ul>
              <div className="pt-1 flex items-center gap-1.5 border-t border-red-200 mt-2">
                <Shield className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                <p className="text-xs text-primary-700 font-semibold">Solo se conservará: administrador.sigei@sigei.edu.pe</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Para confirmar, escribe <span className="font-bold text-red-600">ELIMINAR TODO</span>
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="ELIMINAR TODO"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { setResetModal(false); setResetConfirmText(""); }}
                disabled={resetting}
              >
                Cancelar
              </Button>
              <button
                onClick={handleResetSystem}
                disabled={resetConfirmText !== "ELIMINAR TODO" || resetting}
                className={[
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-colors",
                  resetConfirmText === "ELIMINAR TODO" && !resetting
                    ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                <Trash2 className="w-4 h-4" />
                {resetting ? "Procesando..." : "Purgar Sistema"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
