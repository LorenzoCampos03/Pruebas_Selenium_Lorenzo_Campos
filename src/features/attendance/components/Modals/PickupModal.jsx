import { useState, useEffect } from "react";
import { X } from "lucide-react";

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

export default function PickupModal({ open, onClose, onSubmit, attendance }) {
     const [formData, setFormData] = useState({
          pickedUpByName: "",
          pickedUpByRelationship: "",
          pickedUpByDni: "",
          pickupTime: "",
          pickupNotes: "",
     });

     useEffect(() => {
          if (attendance) {
               requestAnimationFrame(() => setFormData({
                    pickedUpByName: attendance.pickedUpByName || "",
                    pickedUpByRelationship: attendance.pickedUpByRelationship || "",
                    pickedUpByDni: attendance.pickedUpByDni || "",
                    pickupTime: attendance.pickupTime || "",
                    pickupNotes: attendance.pickupNotes || "",
               }));
          }
     }, [attendance, open]);

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData((prev) => ({
               ...prev,
               [name]: value,
          }));
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          onSubmit(formData);
     };

     return (
          <Modal isOpen={open} onClose={onClose} title="Registrar Recojo del Estudiante">
               <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre Completo <span className="text-red-500">*</span>
                         </label>
                         <input
                              type="text"
                              name="pickedUpByName"
                              value={formData.pickedUpByName}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Nombre de quien recoge al estudiante"
                         />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Parentesco <span className="text-red-500">*</span>
                              </label>
                              <select
                                   name="pickedUpByRelationship"
                                   value={formData.pickedUpByRelationship}
                                   onChange={handleChange}
                                   required
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                   <option value="">Seleccionar parentesco</option>
                                   <option value="Padre">Padre</option>
                                   <option value="Madre">Madre</option>
                                   <option value="Tutor">Tutor</option>
                                   <option value="Tutor Legal">Tutor Legal</option>
                                   <option value="Abuelo">Abuelo</option>
                                   <option value="Abuela">Abuela</option>
                                   <option value="Tío">Tío</option>
                                   <option value="Tía">Tía</option>
                                   <option value="Hermano">Hermano</option>
                                   <option value="Hermana">Hermana</option>
                                   <option value="Otro Familiar">Otro Familiar</option>
                                   <option value="Apoderado">Apoderado</option>
                              </select>
                         </div>

                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   DNI <span className="text-red-500">*</span>
                              </label>
                              <input
                                   type="text"
                                   name="pickedUpByDni"
                                   value={formData.pickedUpByDni}
                                   onChange={handleChange}
                                   required
                                   maxLength={8}
                                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                   placeholder="Número de DNI"
                              />
                         </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora de Recojo <span className="text-red-500">*</span>
                         </label>
                         <input
                              type="time"
                              name="pickupTime"
                              value={formData.pickupTime}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                         />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                         <textarea
                              name="pickupNotes"
                              value={formData.pickupNotes}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Observaciones sobre el recojo (opcional)"
                         />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                         <button
                              type="button"
                              onClick={onClose}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                         >
                              Cancelar
                         </button>
                         <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                         >
                              Registrar Recojo
                         </button>
                    </div>
               </form>
          </Modal>
     );
}
