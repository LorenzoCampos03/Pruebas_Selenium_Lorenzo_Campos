import { useState } from "react";
import { QrCode, Printer, X, Download } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
     if (!isOpen) return null;
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                              <h2 className="text-lg font-semibold flex items-center gap-2">
                                   <QrCode className="w-5 h-5 text-primary-600" />
                                   {title}
                              </h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                         <div className="p-6">{children}</div>
                    </div>
               </div>
          </div>
     );
}

export default function StudentQRGenerator({ student }) {
     const [showModal, setShowModal] = useState(false);

     if (!student) return null;

     // QR solo contiene el ID del estudiante (estático, nunca cambia)
     const qrData = student.id.toString();

     // Generar URL del QR usando API pública con mayor tamaño y corrección de errores
     const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=H&data=${encodeURIComponent(qrData)}`;

     const handlePrint = () => {
          const printWindow = window.open('', '_blank');
          printWindow.document.write(`
               <!DOCTYPE html>
               <html>
               <head>
                    <title>QR - ${student.firstName} ${student.lastName}</title>
                    <style>
                         body {
                              font-family: Arial, sans-serif;
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              justify-content: center;
                              min-height: 100vh;
                              margin: 0;
                              padding: 20px;
                         }
                         .qr-container {
                              text-align: center;
                              border: 2px solid #e5e7eb;
                              border-radius: 12px;
                              padding: 30px;
                              max-width: 400px;
                         }
                         h1 {
                              font-size: 24px;
                              margin-bottom: 10px;
                              color: #111827;
                         }
                         .info {
                              font-size: 14px;
                              color: #6b7280;
                              margin-bottom: 20px;
                         }
                         img {
                              max-width: 300px;
                              height: auto;
                              margin: 20px 0;
                         }
                         .footer {
                              margin-top: 20px;
                              font-size: 12px;
                              color: #9ca3af;
                         }
                         @media print {
                              body {
                                   padding: 0;
                              }
                              .qr-container {
                                   border: none;
                                   page-break-inside: avoid;
                              }
                         }
                    </style>
               </head>
               <body>
                    <div class="qr-container">
                         <h1>${student.firstName} ${student.lastName}</h1>
                         <div class="info">
                              <p><strong>CUI:</strong> ${student.cui || 'N/A'}</p>
                              <p><strong>DNI:</strong> ${student.documentNumber || 'N/A'}</p>
                         </div>
                         <img src="${qrCodeUrl}" alt="QR Code" />
                         <div class="footer">
                              <p>Código QR del Estudiante</p>
                              <p>Sistema SIGEI - Asistencia</p>
                         </div>
                    </div>
                    <script>
                         window.onload = function() {
                              setTimeout(function() {
                                   window.print();
                              }, 500);
                         };
                    </script>
               </body>
               </html>
          `);
          printWindow.document.close();
     };

     const handleDownload = () => {
          const link = document.createElement('a');
          link.href = qrCodeUrl;
          link.download = `QR-${student.firstName}-${student.lastName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
     };

     return (
          <>
               <button
                    onClick={() => setShowModal(true)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Ver QR del estudiante"
               >
                    <QrCode className="w-4 h-4" />
               </button>

               <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Código QR del Estudiante">
                    <div className="space-y-4">
                         <div className="text-center">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                   {student.firstName} {student.lastName}
                              </h3>
                              <div className="text-sm text-gray-600 space-y-1">
                                   {student.cui && <p><span className="font-medium">CUI:</span> {student.cui}</p>}
                                   {student.documentNumber && <p><span className="font-medium">DNI:</span> {student.documentNumber}</p>}
                              </div>
                         </div>

                         <div className="flex justify-center bg-gray-50 rounded-lg p-6">
                              <img 
                                   src={qrCodeUrl} 
                                   alt="QR Code" 
                                   className="w-64 h-64"
                              />
                         </div>

                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-xs text-blue-800">
                                   Este código QR contiene la información del estudiante para registro rápido de asistencia mediante escaneo.
                              </p>
                         </div>

                         <div className="flex justify-end gap-3 pt-4 border-t">
                              <button
                                   type="button"
                                   onClick={() => setShowModal(false)}
                                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                   Cerrar
                              </button>
                              <button
                                   type="button"
                                   onClick={handleDownload}
                                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                              >
                                   <Download className="w-4 h-4" />
                                   Descargar
                              </button>
                              <button
                                   type="button"
                                   onClick={handlePrint}
                                   className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                              >
                                   <Printer className="w-4 h-4" />
                                   Imprimir
                              </button>
                         </div>
                    </div>
               </Modal>
          </>
     );
}
