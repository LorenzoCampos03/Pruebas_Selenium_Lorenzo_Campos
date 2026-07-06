import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import apiClient from "@/core/api/apiClient";
import { Modal, Button, Spinner } from "@/shared/components/ui";
import { ENDPOINTS } from "@/core/api/endpoints";
import toast from "react-hot-toast";

export default function WhatsAppQRModal({ isOpen, onClose, institutionId, onConnected }) {
     const [qrCode, setQrCode] = useState("");
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState("");

     const fetchQr = async () => {
          try {
               setLoading(true);
               setError("");
               const url = ENDPOINTS.WHATSAPP.QR(institutionId);
               const response = await apiClient.get(url);
               const data = response.data?.data || response.data;
               if (data && data.base64) {
                    setQrCode(data.base64);
               } else if (data && data.qrcode) {
                    setQrCode(data.qrcode);
               } else {
                    setError("No se pudo obtener el QR. Puede que la instancia ya esté conectada.");
               }
          } catch {
               setError("Error de conexión con el servicio de WhatsApp.");
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          let interval;
          if (isOpen) {
               fetchQr();

               if (institutionId) {
                    // Poll connection status every 3 seconds to auto-close when paired
                    interval = setInterval(async () => {
                         try {
                              const response = await apiClient.get(ENDPOINTS.WHATSAPP.STATUS(institutionId));
                              const statusData = response.data?.data || response.data;
                              if (statusData?.instance?.state === "open" || statusData?.instance?.connectionStatus === "CONNECTED") {
                                   clearInterval(interval);
                                   toast.success("¡WhatsApp vinculado con éxito!");
                                   if (onConnected) onConnected();
                                   onClose();
                              }
                         } catch (err) {
                              // ignore polling errors
                         }
                    }, 3000);
               }
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isOpen, institutionId]);

     return (
          <Modal isOpen={isOpen} onClose={onClose} title="Conectar WhatsApp (Mensajero)" size="sm">
               <div className="flex flex-col items-center p-4">
                    <p className="text-sm text-gray-600 text-center mb-6">
                         Escanea el código QR con tu aplicación de WhatsApp para vincular el número que actuará como mensajero del sistema.
                    </p>
                    
                    {loading ? (
                         <div className="py-8"><Spinner /></div>
                    ) : error ? (
                         <div className="text-red-500 text-sm text-center bg-red-50 p-4 rounded-lg w-full mb-4">
                              {error}
                         </div>
                    ) : qrCode ? (
                         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                              {qrCode.startsWith("data:image") ? (
                                   <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                              ) : (
                                   <QRCodeSVG value={qrCode} size={256} />
                              )}
                         </div>
                    ) : (
                         <div className="text-gray-500 text-sm py-8 text-center">
                              No hay código QR disponible en este momento.
                         </div>
                    )}

                    <div className="flex gap-3 w-full">
                         <Button variant="outline" className="flex-1" onClick={fetchQr} disabled={loading}>
                              Actualizar QR
                         </Button>
                         <Button variant="primary" className="flex-1" onClick={onClose}>
                              Cerrar
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
