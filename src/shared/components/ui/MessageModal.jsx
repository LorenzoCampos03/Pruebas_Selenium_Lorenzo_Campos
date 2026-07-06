import { useState, useEffect } from "react";
import apiClient from "@/core/api/apiClient";
import { useAuth } from "@/core/auth/AuthContext";
import { Modal, Button, Input, Spinner } from "@/shared/components/ui";
import { AlertCircle, Copy, RefreshCw } from "lucide-react";

// Mapeo de emojis por tipo de evento
const EVENT_TYPE_EMOJIS = {
     CIVICO: "🇵🇪",
     CULTURAL: "🎭",
     RELIGIOSO: "✨",
     INSTITUCIONAL: "🏫",
     INCIDENTE: "🚨",
};

const EVENT_TYPE_LABELS = {
     CIVICO: "Cívico",
     CULTURAL: "Cultural",
     RELIGIOSO: "Religioso",
     INSTITUCIONAL: "Institucional",
     INCIDENTE: "Incidente",
};

// Función para generar mensaje automático según tipo de evento
const generateAutoMessage = (eventData) => {
     if (!eventData) return "";
     
     const { eventType, title, startDate } = eventData;
     
     // Formatear fecha
     const date = new Date(startDate);
     const dayName = date.toLocaleDateString("es-PE", { weekday: "long" });
     const formattedDate = date.toLocaleDateString("es-PE", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
     });
     
     if (eventType === "INCIDENTE") {
          return `🚨 ALERT\n\nHOY HEMOS PASADO POR ${title?.toUpperCase()}\nEL DIA DE ${formattedDate.toUpperCase()}`;
     } else {
          return `📅 HOY ${dayName.toUpperCase()} (${formattedDate})\nSE CELEBRA ${title?.toUpperCase()}\nLES HACEMOS RECUERDO`;
     }
};

export default function MessageModal({ 
     isOpen, 
     onClose, 
     eventData, 
     onSuccess,
     institutionId,
     whatsappConnected
}) {
     const { user } = useAuth();
     
     const [recipientType, setRecipientType] = useState("manual"); // "manual" o "specific"
     const [recipientValue, setRecipientValue] = useState("");
     const [message, setMessage] = useState("");
     const [channel, setChannel] = useState("WHATSAPP"); // STRING singular, no array
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");
     const [success, setSuccess] = useState("");
     const [isEditing, setIsEditing] = useState(false);

     // Auto-generar mensaje cuando se abre el modal o cambia el evento
     useEffect(() => {
          if (isOpen && eventData) {
               setMessage(generateAutoMessage(eventData));
               setIsEditing(false);
               setError("");
               setSuccess("");
          }
     }, [isOpen, eventData]);

     // Validar formato de teléfono peruano
     const validatePhoneNumber = (phone) => {
          if (!phone) return false;
          // Acepta: 987654321 (9 dígitos), +51987654321, 51987654321
          const cleaned = phone.replace(/\D/g, "");
          return cleaned.length === 9 || cleaned.length === 11;
     };

     // Validar email básico
     const validateEmail = (email) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
     };

     const handleSend = async () => {
          try {
               setLoading(true);
               setError("");
               setSuccess("");

               // Validaciones
               if (!recipientValue.trim()) {
                    setError(`Por favor ingresa ${recipientType === "manual" ? "un número de teléfono" : "el ID del contacto"}`);
                    return;
               }

               if (!message.trim()) {
                    setError("Por favor escribe un mensaje");
                    return;
               }

               // Validar según el canal
               if (channel === "WHATSAPP") {
                    if (!validatePhoneNumber(recipientValue)) {
                         setError("Número de teléfono inválido. Debe tener 9 dígitos (ej: 987654321 o +51987654321)");
                         return;
                    }
               } else if (channel === "EMAIL") {
                    if (!validateEmail(recipientValue)) {
                         setError("Email inválido. Por favor ingresa un email válido");
                         return;
                    }
               }

               // Construir payload según el tipo de destinatario y canal
               let payload = {
                    institutionId: institutionId || user?.institutionId,
                    channel: channel, // SINGULAR (WHATSAPP o EMAIL)
                    type: "EVENT_REMINDER", // Tipo de notificación válido en el backend
                    subject: eventData?.title || "Notificación de Evento",
                    bodyText: message,
                    originService: "vg-web-sigei",
                    variables: {
                         eventName: eventData?.title || "",
                         eventDate: eventData?.startDate || "",
                         reason: "Notificación del evento",
                    },
               };

               // Mapear según tipo de destinatario
               if (recipientType === "manual" && channel === "WHATSAPP") {
                    payload.recipientPhone = recipientValue;
               } else if (recipientType === "manual" && channel === "EMAIL") {
                    payload.recipientEmail = recipientValue;
               } else if (recipientType === "specific") {
                    payload.recipientId = recipientValue;
               }

               // Si tiene imagen, agregar URL
               if (eventData?.imageUrl) {
                    payload.imageUrl = eventData.imageUrl;
               }

               // Verificar que al menos un receptor esté presente
               if (!payload.recipientPhone && !payload.recipientEmail && !payload.recipientId) {
                    setError("Por favor ingresa un destinatario (teléfono, email o ID)");
                    return;
               }

               // Enviar a backend
               console.log("📤 Enviando payload:", JSON.stringify(payload, null, 2));
               const response = await apiClient.post("/api/v1/notifications/send", payload);

               if (response.data && (response.data.status === "SENT" || response.data.success)) {
                    setSuccess(`✅ Mensaje enviado exitosamente`);
                    setTimeout(() => {
                         onClose();
                         if (onSuccess) onSuccess(response.data);
                    }, 2000);
               } else {
                    setError(response.data?.message || response.data?.error || "Error al enviar el mensaje");
               }
          } catch (err) {
               const errorMsg = err.response?.data?.message || 
                              err.response?.data?.error || 
                              err.message || 
                              "Error de conexión al enviar el mensaje";
               setError(errorMsg);
          } finally {
               setLoading(false);
          }
     };

     const handleClose = () => {
          // Reset form
          setRecipientType("manual");
          setRecipientValue("");
          setMessage("");
          setChannel("WHATSAPP");
          setError("");
          setSuccess("");
          setIsEditing(false);
          onClose();
     };

     const resetMessage = () => {
          setMessage(generateAutoMessage(eventData));
          setIsEditing(false);
     };

     return (
          <Modal isOpen={isOpen} onClose={handleClose} title="📨 Enviar Notificación por Evento" size="lg">
               <div className="flex flex-col gap-6 p-6">
                    
                    {/* INFORMACIÓN DEL EVENTO - Bonito */}
                    {eventData && (
                         <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                              <div className="space-y-3">
                                   {/* Tipo de Evento */}
                                   <div className="flex items-center gap-3">
                                        <span className="text-3xl">{EVENT_TYPE_EMOJIS[eventData.eventType] || "📌"}</span>
                                        <div>
                                             <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Tipo de Evento</p>
                                             <p className="text-lg font-bold text-blue-900">{EVENT_TYPE_LABELS[eventData.eventType] || eventData.eventType}</p>
                                        </div>
                                   </div>

                                   {/* Título del Evento */}
                                   <div className="border-t border-blue-200 pt-3">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">📅 Evento</p>
                                        <p className="text-base font-bold text-blue-900">{eventData.title}</p>
                                   </div>

                                   {/* Fecha del Evento */}
                                   <div className="border-t border-blue-200 pt-3">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">📆 Fecha</p>
                                        <p className="text-sm text-blue-800 font-medium">
                                             {new Date(eventData.startDate).toLocaleDateString("es-PE", { 
                                                  weekday: "long",
                                                  year: "numeric", 
                                                  month: "long", 
                                                  day: "numeric" 
                                             })}
                                        </p>
                                   </div>
                              </div>
                         </div>
                    )}
                    
                    {/* Advertencia si WhatsApp no está conectado */}
                    {channel === "WHATSAPP" && !whatsappConnected && (
                         <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-yellow-700">
                                   <strong>⚠️ WhatsApp no está conectado.</strong> Vincula WhatsApp en la sección de Calendarios antes de enviar mensajes.
                              </p>
                         </div>
                    )}

                    {/* Canal de Comunicación */}
                    <div className="space-y-3">
                         <label className="block text-sm font-semibold text-gray-700">Canal de Envío *</label>
                         <div className="flex gap-4">
                              {["WHATSAPP", "EMAIL"].map((ch) => (
                                   <label key={ch} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                             type="radio"
                                             name="channel"
                                             value={ch}
                                             checked={channel === ch}
                                             onChange={(e) => setChannel(e.target.value)}
                                             className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">{ch === "WHATSAPP" ? "📱 WhatsApp" : "📧 Email"}</span>
                                   </label>
                              ))}
                         </div>
                    </div>

                    {/* Tipo de Destinatario */}
                    <div className="space-y-3">
                         <label className="block text-sm font-semibold text-gray-700">Tipo de Destinatario *</label>
                         <div className="flex gap-2">
                              {["manual", "specific"].map((type) => (
                                   <button
                                        key={type}
                                        onClick={() => {
                                             setRecipientType(type);
                                             setRecipientValue("");
                                        }}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 ${
                                             recipientType === type
                                                  ? "bg-primary-600 text-white"
                                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                   >
                                        {type === "manual" ? (channel === "WHATSAPP" ? "Número" : "Email") : "ID Contacto"}
                                   </button>
                              ))}
                         </div>
                    </div>

                    {/* Destinatario Input */}
                    <div className="space-y-2">
                         <label className="block text-sm font-semibold text-gray-700">
                              {recipientType === "manual"
                                   ? channel === "WHATSAPP" 
                                        ? "Número de Teléfono"
                                        : "Dirección de Email"
                                   : "ID del Contacto"}
                              *
                         </label>

                         {recipientType === "manual" && channel === "WHATSAPP" && (
                              <>
                                   <Input
                                        type="tel"
                                        value={recipientValue}
                                        onChange={(e) => setRecipientValue(e.target.value)}
                                        placeholder="Ej: 987654321 o +51987654321"
                                        className="w-full"
                                   />
                                   <p className="text-xs text-gray-500">9 dígitos peruanos con o sin código de país (+51)</p>
                              </>
                         )}

                         {recipientType === "manual" && channel === "EMAIL" && (
                              <Input
                                   type="email"
                                   value={recipientValue}
                                   onChange={(e) => setRecipientValue(e.target.value)}
                                   placeholder="Ej: usuario@example.com"
                                   className="w-full"
                              />
                         )}

                         {recipientType === "specific" && (
                              <Input
                                   type="text"
                                   value={recipientValue}
                                   onChange={(e) => setRecipientValue(e.target.value)}
                                   placeholder="Ej: user-123 o guardian-456"
                                   className="w-full"
                              />
                         )}
                    </div>

                    {/* MENSAJE - Editor con Preview */}
                    <div className="space-y-3">
                         <div className="flex items-center justify-between gap-2">
                              <label className="block text-sm font-semibold text-gray-700">Mensaje *</label>
                              <button
                                   onClick={resetMessage}
                                   className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded"
                                   title="Restaurar mensaje generado automáticamente"
                              >
                                   <RefreshCw className="w-3 h-3" /> Restaurar
                              </button>
                         </div>

                         {/* Editor del Mensaje */}
                         <textarea
                              value={message}
                              onChange={(e) => {
                                   setMessage(e.target.value);
                                   setIsEditing(true);
                              }}
                              placeholder="Escribe tu mensaje aquí..."
                              rows={5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                         />
                         <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>{message.length} caracteres</span>
                              {isEditing && <span className="text-orange-600 font-medium">✏️ Editado manualmente</span>}
                         </div>
                    </div>

                    {/* PREVIEW DEL MENSAJE - Visual bonita */}
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-2">
                         <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">👀 Vista Previa del Mensaje</p>
                         <div className={`${
                              channel === "WHATSAPP" 
                                   ? "bg-white border-l-4 border-green-500 rounded-lg p-4 space-y-2" 
                                   : "bg-white border-l-4 border-blue-500 rounded-lg p-4 space-y-2"
                         }`}>
                              <div className="flex items-center gap-2">
                                   <span className="text-lg">{channel === "WHATSAPP" ? "💬" : "📧"}</span>
                                   <span className="text-xs font-bold text-gray-500">{channel === "WHATSAPP" ? "WhatsApp" : "Correo Electrónico"}</span>
                              </div>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words font-medium leading-relaxed">
                                   {message || "El mensaje aparecerá aquí..."}
                              </p>
                         </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                         <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                              {error}
                         </div>
                    )}

                    {/* Success Message */}
                    {success && (
                         <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                              {success}
                         </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                         <Button
                              variant="outline"
                              className="flex-1"
                              onClick={handleClose}
                              disabled={loading}
                         >
                              Cancelar
                         </Button>
                         <Button
                              variant="primary"
                              className="flex-1"
                              onClick={handleSend}
                              disabled={loading || (channel === "WHATSAPP" && !whatsappConnected)}
                         >
                              {loading ? (
                                   <div className="flex items-center gap-2">
                                        <Spinner size="sm" /> Enviando...
                                   </div>
                              ) : (
                                   "Enviar Mensaje"
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
