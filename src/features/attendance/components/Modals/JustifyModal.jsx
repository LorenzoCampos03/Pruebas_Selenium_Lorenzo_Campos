import { useState, useEffect } from "react";
import { X, Upload, FileText, ExternalLink, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

function Modal({ isOpen, onClose, title, children }) {
     if (!isOpen) return null;
     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                              <h2 className="text-lg font-semibold">{title}</h2>
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

export default function JustifyModal({ open, onClose, onSubmit, attendance }) {
     const [formData, setFormData] = useState({
          justificationReason: "",
          justificationDocumentUrl: "",
     });
     const [selectedFile, setSelectedFile] = useState(null);
     const [uploading, setUploading] = useState(false);

     useEffect(() => {
          if (attendance) {
               setFormData({
                    justificationReason: attendance.justificationReason || "",
                    justificationDocumentUrl: attendance.justificationDocumentUrl || "",
               });
          }
     }, [attendance, open]);

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData((prev) => ({
               ...prev,
               [name]: value,
          }));
     };

     const handleFileChange = (e) => {
          const file = e.target.files[0];
          if (file) {
               setSelectedFile(file);
          }
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          
          // Si hay un archivo seleccionado, subirlo primero
          if (selectedFile) {
               setUploading(true);
               try {
                    const formDataUpload = new FormData();
                    formDataUpload.append("file", selectedFile);
                    
                    // Importar el apiClient configurado
                    const { default: apiClient } = await import("@/core/api/apiClient");
                    const response = await apiClient.post(
                         `/api/attendance/${attendance.id}/upload-justification`,
                         formDataUpload,
                         {
                              headers: {
                                   "Content-Type": "multipart/form-data",
                              },
                         }
                    );
                    
                    formData.justificationDocumentUrl = response.data.url;
                    
                    Swal.fire({
                         title: "¡Documento subido!",
                         text: "El documento se subió correctamente",
                         icon: "success",
                         timer: 1500,
                         showConfirmButton: false,
                         customClass: {
                              popup: 'rounded-lg',
                              title: 'text-lg font-semibold'
                         }
                    });
               } catch (error) {
                    console.error("Error uploading file:", error);
                    Swal.fire({
                         title: "Error al subir",
                         text: "No se pudo subir el documento. Intenta nuevamente.",
                         icon: "error",
                         confirmButtonText: "Entendido",
                         confirmButtonColor: "#3b82f6",
                         customClass: {
                              popup: 'rounded-lg',
                              title: 'text-lg font-semibold',
                              confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
                         }
                    });
                    setUploading(false);
                    return;
               } finally {
                    setUploading(false);
               }
          }
          
          onSubmit(formData);
     };

     return (
          <Modal isOpen={open} onClose={onClose} title="Justificar Asistencia">
               <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                              Motivo de Justificación <span className="text-red-500">*</span>
                         </label>
                         <textarea
                              name="justificationReason"
                              value={formData.justificationReason}
                              onChange={handleChange}
                              required
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Describa el motivo de la justificación..."
                         />
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Documento de Justificación
                         </label>
                         
                         {formData.justificationDocumentUrl && !selectedFile ? (
                              <div className="space-y-3">
                                   <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                             <p className="text-sm font-medium text-green-900">Documento cargado</p>
                                             <p className="text-xs text-green-700 truncate">{formData.justificationDocumentUrl.split('/').pop()}</p>
                                        </div>
                                        <a
                                             href={formData.justificationDocumentUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                                        >
                                             <ExternalLink className="w-3.5 h-3.5" />
                                             Ver
                                        </a>
                                   </div>
                                   <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                             <Upload className="w-5 h-5" />
                                             <span>Cambiar documento</span>
                                        </div>
                                        <input
                                             type="file"
                                             onChange={handleFileChange}
                                             className="hidden"
                                             accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                   </label>
                              </div>
                         ) : (
                              <div>
                                   <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                             <Upload className="w-5 h-5" />
                                             <span>{selectedFile ? selectedFile.name : "Seleccionar archivo"}</span>
                                        </div>
                                        <input
                                             type="file"
                                             onChange={handleFileChange}
                                             className="hidden"
                                             accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                   </label>
                                   {selectedFile && (
                                        <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                             <FileText className="w-4 h-4" />
                                             <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                                        </div>
                                   )}
                              </div>
                         )}
                         <p className="mt-2 text-xs text-gray-500">
                              Formatos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                         </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                         <button
                              type="button"
                              onClick={onClose}
                              disabled={uploading}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                         >
                              Cancelar
                         </button>
                         <button
                              type="submit"
                              disabled={uploading}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                         >
                              {uploading ? "Subiendo..." : "Justificar"}
                         </button>
                    </div>
               </form>
          </Modal>
     );
}
