import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Camera, Scan, QrCode,
  Smartphone, User, Maximize2, Minimize2,
  Zap, ZapOff, RefreshCw, School, Clock,
  Trash2, ListChecks, Save, Loader2, CheckCircle2,
  GraduationCap, Hash
} from "lucide-react";
import jsQR from "jsqr";
import { toastSuccess, toastError, toastScan, toastWarning } from "../../utils/notifications";
import { attendanceService } from "../../services/attendanceService";

function playBeep(type = "success") {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  if (type === "success") {
    osc.frequency.value = 1200;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } else {
    osc.frequency.value = 300;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "P", title: "Presente", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "LATE", label: "T", title: "Tardanza", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "ABSENT", label: "A", title: "Ausente", color: "bg-red-50 text-red-700 border-red-200" },
];

export default function QRScannerModal({
  open, onClose, currentUser
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);
  const animationRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const [detectedCodes, setDetectedCodes] = useState([]);
  const [queue, setQueue] = useState([]);
  const [saving, setSaving] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [allClassrooms, setAllClassrooms] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!open || !currentUser?.institutionId) return;
    let cancelled = false;
    (async () => {
      setDataLoaded(false);
      try {
        const [studentsRes, classroomsRes] = await Promise.all([
          attendanceService.getStudentsByInstitution(currentUser.institutionId),
          attendanceService.getClassroomsByInstitution(currentUser.institutionId),
        ]);
        if (!cancelled) {
          setAllStudents(Array.isArray(studentsRes) ? studentsRes : (studentsRes?.data || []));
          setAllClassrooms(Array.isArray(classroomsRes) ? classroomsRes : (classroomsRes?.data || []));
          setDataLoaded(true);
        }
      } catch { if (!cancelled) setDataLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [open, currentUser?.institutionId]);

  const findClassroomName = useCallback((student) => {
    if (!student?.classroomId) return "Sin aula";
    const c = allClassrooms.find(c => String(c.id) === String(student.classroomId));
    return c?.classroomName || c?.name || "Aula";
  }, [allClassrooms]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    if (scanTimeoutRef.current) { clearTimeout(scanTimeoutRef.current); scanTimeoutRef.current = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false); setLoading(false); setTorchOn(false);
  }, [stream]);

  const tryToggleTorch = useCallback(async () => {
    try {
      const track = stream?.getVideoTracks()[0];
      if (track?.getCapabilities()?.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
        setTorchOn(!torchOn);
      }
    } catch {
      console.warn("Linterna no disponible");
    }
  }, [stream, torchOn]);

  const addStudentToQueue = useCallback((student) => {
    if (queue.some(q => String(q.studentId) === String(student.id))) {
      toastWarning(`${student.lastName}, ${student.firstName} ya está en la lista`);
      return false;
    }
    if (!student.classroomId) {
      toastError("Estudiante sin aula asignada", `${student.lastName}, ${student.firstName} no tiene aula`);
      return false;
    }
    const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
    setQueue(prev => [...prev, {
      studentId: student.id,
      lastName: student.lastName,
      firstName: student.firstName,
      cui: student.cui,
      documentNumber: student.documentNumber,
      classroomId: student.classroomId,
      classroomName: findClassroomName(student),
      entryTime: now,
      status: "PRESENT",
    }]);
    return true;
  }, [queue, findClassroomName]);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) { animationRef.current = requestAnimationFrame(processFrame); return; }
    const ctx = canvas.getContext("2d");
    const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight);
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    if (code && code.data) {
      setLastDetected({ data: code.data, timestamp: Date.now() });
    } else {
      if (Date.now() - (lastDetected?.timestamp || 0) > 2000) setLastDetected(null);
    }
    animationRef.current = requestAnimationFrame(processFrame);
  }, [lastDetected]);

  useEffect(() => {
    let mounted = true;
    if (open) {
      setLoading(true); setScanning(false); setError(null);
      setDetectedCodes([]); setManualInput(""); setQueue([]); setSaving(false);
      const init = async () => {
        try {
          const ms = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 }, focusMode: "continuous" },
          });
          if (!mounted) { ms.getTracks().forEach(t => t.stop()); return; }
          setStream(ms);
          await new Promise(r => setTimeout(r, 150));
          if (videoRef.current) {
            videoRef.current.srcObject = ms; videoRef.current.muted = true;
            try { await videoRef.current.play(); if (mounted) { setScanning(true); setLoading(false); animationRef.current = requestAnimationFrame(processFrame); } }
            catch { if (mounted) { setError("No se pudo reproducir el video."); setLoading(false); } }
          } else { if (mounted) { setError("Error al inicializar."); setLoading(false); } }
        } catch (err) {
          if (mounted) {
            let msg = "No se pudo acceder a la cámara.";
            if (err.name?.includes("NotAllowed")) msg = "Permiso de cámara denegado.";
            else if (err.name?.includes("NotFound")) msg = "No se encontró cámara.";
            else if (err.name?.includes("NotReadable")) msg = "Cámara usada por otra app.";
            setError(msg); setLoading(false);
          }
        }
      };
      init();
    } else { stopCamera(); }
    return () => { mounted = false; stopCamera(); };
  }, [open]);

  useEffect(() => {
    if (lastDetected && Date.now() - lastDetected.timestamp < 500) {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        const id = lastDetected.data.trim();
        if (detectedCodes.includes(id)) return;
        setDetectedCodes(prev => [...prev, id]);
        const student = allStudents.find(s => String(s.id) === String(id));
        if (student) {
          playBeep("success");
          if (navigator.vibrate) navigator.vibrate(50);
          const added = addStudentToQueue(student, "qr");
          if (added) toastScan(`${student.lastName}, ${student.firstName}`, findClassroomName(student));
        }
      }, 400);
    }
    return () => { if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current); };
  }, [lastDetected, detectedCodes, allStudents, addStudentToQueue, findClassroomName]);

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current; const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    if (code && code.data) {
      const id = code.data.trim();
      const student = allStudents.find(s => String(s.id) === String(id));
      if (student) {
        playBeep("success");
        if (navigator.vibrate) navigator.vibrate(50);
        const added = addStudentToQueue(student, "qr");
        if (added) toastScan(`${student.lastName}, ${student.firstName}`, findClassroomName(student));
      } else {
        toastError("Estudiante no encontrado");
      }
    } else {
      playBeep("error");
      toastError("QR no detectado", "Ajusta iluminación y enfoque");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const dni = manualInput.trim();
    if (dni.length === 8) {
      const student = allStudents.find(s => String(s.documentNumber) === dni);
      if (!student) { toastError("No encontrado", `DNI ${dni} no registrado`); return; }
      playBeep("success");
      if (navigator.vibrate) navigator.vibrate(50);
      const added = addStudentToQueue(student, "manual");
      if (added) {
        toastScan(`${student.lastName}, ${student.firstName}`, findClassroomName(student));
        setManualInput("");
      }
    }
  };

  const handleStatusChange = (studentId, status) => {
    setQueue(prev => prev.map(s => String(s.studentId) === String(studentId) ? { ...s, status } : s));
  };

  const handleRemove = (studentId) => {
    setQueue(prev => prev.filter(s => String(s.studentId) !== String(studentId)));
  };

  const handleSave = async () => {
    if (!queue.length) { toastWarning("No hay estudiantes para registrar"); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const year = new Date().getFullYear();
      const userId = currentUser?.userId || currentUser?.id;

      const byClassroom = {};
      for (const item of queue) {
        if (!byClassroom[item.classroomId]) byClassroom[item.classroomId] = [];
        byClassroom[item.classroomId].push(item);
      }

      for (const [classroomId, items] of Object.entries(byClassroom)) {
        const existingRes = await attendanceService.getByDate(today);
        const existingList = Array.isArray(existingRes) ? existingRes : (existingRes?.data || []);

        const existingForClassroom = existingList.filter(a => String(a.classroomId) === String(classroomId));
        if (!existingForClassroom.length) {
          const clsStudents = allStudents.filter(s => String(s.classroomId) === String(classroomId));
          const absentPayload = clsStudents
            .filter(s => !items.some(i => String(i.studentId) === String(s.id)))
            .map(s => ({
              studentId: s.id, classroomId, institutionId: currentUser.institutionId,
              attendanceDate: today, academicYear: year, status: "ABSENT", registeredBy: userId,
            }));
          if (absentPayload.length) {
            try { await attendanceService.bulkCreate(absentPayload); }
            catch { await Promise.allSettled(absentPayload.map(p => attendanceService.create(p).catch(() => {}))); }
          }
        }

        for (const item of items) {
          const existing = existingList.find(a => String(a.studentId) === String(item.studentId));
          const nowTime = item.entryTime;
          if (existing?.id) {
            await attendanceService.update(existing.id, {
              ...existing, status: item.status,
              arrivalTime: item.status !== "ABSENT" ? nowTime : existing.arrivalTime,
            }).catch(() => {});
          } else {
            await attendanceService.create({
              studentId: item.studentId, classroomId, institutionId: currentUser.institutionId,
              attendanceDate: today, academicYear: year, status: item.status,
              arrivalTime: item.status !== "ABSENT" ? nowTime : "",
              registeredBy: userId,
            }).catch(() => {});
          }
        }
      }

      toastSuccess("Registro completado", `${queue.length} estudiantes registrados`);
      onClose();
    } catch (err) {
      console.error("Error saving:", err);
      toastError("Error al guardar", "Intenta nuevamente");
    } finally {
      setSaving(false);
    }
  };

  const queueByClassroom = queue.reduce((acc, item) => {
    const name = item.classroomName || "Sin aula";
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
  }, {});

  const uniqueClassrooms = Object.keys(queueByClassroom).length;
  const statusCounts = queue.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border border-slate-200/80 overflow-hidden"
        >

          {/* Header glass */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-sm">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Escanear Código QR</h2>
                <p className="text-[10px] text-slate-400">{allStudents.length} estudiantes disponibles</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <ListChecks className="w-3 h-3" />
                  {queue.length}
                </span>
              )}
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Body ─── */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

            {/* ── LEFT / TOP: Scanner ── */}
            <div className="lg:w-1/2 p-3 sm:p-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col gap-3 bg-gradient-to-br from-slate-50/50 to-white">

              {/* Camera */}
              <div className={`relative bg-black rounded-xl overflow-hidden shadow-inner ${fullscreen ? "h-[340px]" : "h-[220px] sm:h-[260px]"}`}>
                <video ref={videoRef} autoPlay playsInline muted
                  className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
                <canvas ref={canvasRef} className="hidden" />

                {loading && !scanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="text-center text-white px-6">
                      <div className="relative w-10 h-10 mx-auto mb-3">
                        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" />
                      </div>
                      <p className="text-sm font-medium text-white/80">Iniciando cámara...</p>
                      <p className="text-[10px] text-white/40 mt-1">Permite el acceso cuando se solicite</p>
                    </div>
                  </div>
                )}

                {scanning && (
                  <>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
                      <div className="absolute inset-[8%] border-2 border-indigo-400/60 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <div className="absolute -top-px -left-px w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] border-l-[3px] border-indigo-400 rounded-tl-2xl" />
                        <div className="absolute -top-px -right-px w-5 h-5 sm:w-6 sm:h-6 border-t-[3px] border-r-[3px] border-indigo-400 rounded-tr-2xl" />
                        <div className="absolute -bottom-px -left-px w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl-2xl" />
                        <div className="absolute -bottom-px -right-px w-5 h-5 sm:w-6 sm:h-6 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br-2xl" />
                        <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-lg shadow-indigo-400/50"
                          style={{
                            top: `${35 + Math.sin(Date.now() / 700) * 20}%`,
                            filter: "blur(0.5px)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="px-2 py-1 bg-black/70 text-[9px] text-white/90 rounded-md font-semibold tracking-wider backdrop-blur-sm border border-white/10">
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                        ESCANEANDO
                      </span>
                      <div className="flex items-center gap-1 pointer-events-auto">
                        <button onClick={() => setFullscreen(!fullscreen)}
                          className="p-1.5 bg-black/50 hover:bg-black/70 text-white/70 hover:text-white rounded-lg transition-all backdrop-blur-sm">
                          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={tryToggleTorch}
                          className={`p-1.5 rounded-lg transition-all backdrop-blur-sm ${torchOn ? "bg-yellow-500/90 text-white shadow-lg shadow-yellow-500/30" : "bg-black/50 hover:bg-black/70 text-white/70 hover:text-white"}`}>
                          {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                      <p className="text-white/80 text-[9px] bg-black/60 inline-block px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 font-medium">
                        Coloca el código QR en el centro
                      </p>
                    </div>
                  </>
                )}

                {error && !loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="text-center text-white px-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-500/20 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-xs font-semibold text-white/90 mb-1">{error}</p>
                      <p className="text-[10px] text-white/50 mb-4">Verifica los permisos de la cámara</p>
                      <button onClick={() => { setError(null); setLoading(true); (async () => { try { const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setStream(ms); if (videoRef.current) { videoRef.current.srcObject = ms; await videoRef.current.play(); setScanning(true); } setLoading(false); } catch { setError("No se pudo reiniciar"); setLoading(false); } })(); }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-xl transition-all backdrop-blur-sm border border-white/10">
                        <RefreshCw className="w-3 h-3" /> Reintentar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCapturePhoto} disabled={!scanning}
                  className="flex-1 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl hover:from-slate-900 hover:to-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Scan className="w-3.5 h-3.5" /> Capturar frame
                </button>
                <button type="button" onClick={stopCamera} disabled={!scanning}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Detener
                </button>
              </div>

              {/* Manual DNI */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center">
                    <Smartphone className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ingreso Manual por DNI</span>
                </div>
                <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input type="text" value={manualInput} inputMode="numeric"
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 8) setManualInput(v); }}
                      placeholder="Ingresa 8 dígitos" maxLength={8}
                      className="w-full pl-8 pr-2 py-2 text-xs font-mono tracking-[0.25em] text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 bg-slate-50 transition-all placeholder:text-slate-300" />
                  </div>
                  <button type="submit" disabled={manualInput.length !== 8}
                    className="px-3 py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
                    <User className="w-3 h-3" /> Buscar
                  </button>
                </form>
              </div>
            </div>

            {/* ── RIGHT / BOTTOM: Queue ── */}
            <div className="lg:w-1/2 flex flex-col bg-white max-h-[300px] lg:max-h-none">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-700">Lista de estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  {statusCounts.PRESENT > 0 && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{statusCounts.PRESENT}P</span>
                  )}
                  {statusCounts.LATE > 0 && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{statusCounts.LATE}T</span>
                  )}
                  {statusCounts.ABSENT > 0 && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{statusCounts.ABSENT}A</span>
                  )}
                  <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200 tabular-nums">
                    {queue.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/30">
                {!dataLoaded && !allStudents.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <Loader2 className="w-8 h-8 mb-2 opacity-30 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Cargando estudiantes...</p>
                  </div>
                ) : queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <QrCode className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Sin estudiantes aún</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Escanea un QR o ingresa un DNI manualmente</p>
                  </div>
                ) : (
                  <>
                    {uniqueClassrooms > 1 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Object.entries(queueByClassroom).map(([name, items]) => (
                          <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-slate-500 rounded-full text-[9px] font-semibold border border-slate-200 shadow-sm">
                            <School className="w-2.5 h-2.5" />
                            {name}: {items.length}
                          </span>
                        ))}
                      </div>
                    )}

                    {Object.entries(queueByClassroom).map(([classroomName, items]) => (
                      <div key={classroomName}>
                        <div className="flex items-center gap-1.5 px-1 py-1.5">
                          <School className="w-3 h-3 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{classroomName}</span>
                          <span className="text-[9px] text-slate-300 ml-auto">{items.length}</span>
                        </div>
                        <AnimatePresence>
                          {items.map((item) => (
                            <motion.div
                              key={item.studentId}
                              initial={{ opacity: 0, x: -10, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: "auto" }}
                              exit={{ opacity: 0, x: 10, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-center gap-2 px-3 py-2 bg-white rounded-xl border-l-[3px] hover:shadow-sm transition-all group mb-1 ${
                                item.status === "PRESENT" ? "border-l-emerald-500 border border-slate-100" :
                                item.status === "LATE" ? "border-l-amber-500 border border-slate-100" :
                                "border-l-red-500 border border-slate-100"
                              }`}>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                  {item.lastName}, {item.firstName}
                                </p>
                                <p className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                                  <Clock className="w-2 h-2" />
                                  {item.entryTime}
                                  {item.cui && <><span className="text-slate-300 mx-0.5">·</span>CUI: {item.cui}</>}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {STATUS_OPTIONS.map(opt => (
                                  <button key={opt.value}
                                    onClick={() => handleStatusChange(item.studentId, opt.value)}
                                    className={`w-7 h-7 text-[10px] font-bold rounded-lg border transition-all ${
                                      item.status === opt.value
                                        ? opt.color + " ring-1 ring-slate-800"
                                        : "text-slate-300 border-slate-100 hover:border-slate-200 hover:text-slate-500"
                                    }`}
                                    title={opt.title}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                                <button onClick={() => handleRemove(item.studentId)}
                                  className="ml-1 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── Footer: Save ─── */}
          <div className="sticky bottom-0 bg-white/90 backdrop-blur-md px-4 sm:px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {queue.length} estudiante{queue.length !== 1 ? "s" : ""}
                {uniqueClassrooms > 0 && (
                  <span className="text-slate-400"> · {uniqueClassrooms} aula{uniqueClassrooms > 1 ? "s" : ""}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!queue.length || saving}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl hover:from-slate-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm">
                {saving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" /> Guardar ({queue.length})</>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
