import { X } from "lucide-react";

export default function ViewDocumentModal({ open, onClose, documentUrl, title = "Documento de Justificación" }) {
     if (!open) return null;

     // Forzar HTTPS en URLs de Cloudinary
     const secureUrl = documentUrl?.replace(/^http:/, 'https:');
     
     const isImage = secureUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || secureUrl?.includes('image/upload');
     const isPDF = secureUrl?.match(/\.pdf$/i);

     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="fixed inset-0 bg-black opacity-70" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
                              <h2 className="text-lg font-semibold">{title}</h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                         <div className="flex-1 overflow-auto p-6 bg-gray-50">
                              {isImage ? (
                                   <div className="flex items-center justify-center">
                                        <img
                                             src={secureUrl}
                                             alt="Documento de justificación"
                                             className="max-w-full h-auto rounded-lg shadow-lg"
                                        />
                                   </div>
                              ) : isPDF ? (
                                   <iframe
                                        src={secureUrl}
                                        className="w-full h-[70vh] rounded-lg shadow-lg"
                                        title="Documento PDF"
                                   />
                              ) : (
                                   <div className="text-center py-12">
                                        <p className="text-gray-600 mb-4">No se puede previsualizar este tipo de archivo</p>
                                        <a
                                             href={secureUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                        >
                                             Abrir en nueva pestaña
                                        </a>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
}
