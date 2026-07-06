import { useState, useEffect } from "react";
import EvaluationForm from "./EvaluationForm";
import { formatEvaluationForApi } from "../models/psychologyModel";

function Modal({ isOpen, onClose, title, children, size = "2xl" }) {
     if (!isOpen) return null;

     const sizeClasses = {
          "2xl": "max-w-2xl",
          "xl": "max-w-xl",
          "lg": "max-w-lg",
     };

     return (
          <div className="fixed inset-0 z-50 overflow-y-auto">
               <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
                    <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
                         <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                              <h2 className="text-lg font-semibold">{title}</h2>
                              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                   ✕
                              </button>
                         </div>
                         <div className="p-6">
                              {children}
                         </div>
                    </div>
               </div>
          </div>
     );
}

function Button({ type = "button", variant = "primary", onClick, loading, children }) {
     const variants = {
          primary: "bg-primary-600 hover:bg-primary-700 text-white",
          ghost: "bg-gray-100 hover:bg-gray-200 text-gray-700",
     };

     return (
          <button
               type={type}
               onClick={onClick}
               disabled={loading}
               className={`px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
               {loading ? "Cargando..." : children}
          </button>
     );
}

export default function EvaluationModal({ isOpen, onClose, evaluation, onSave }) {
     const [formData, setFormData] = useState(evaluation || {});
     const [loading, setLoading] = useState(false);

     useEffect(() => {
          if (evaluation) {
               setFormData(evaluation);
          }
     }, [evaluation]);

     async function handleSubmit(e) {
          e.preventDefault();
          setLoading(true);
          try {
               const payload = formatEvaluationForApi(formData);
               await onSave(formData.id, payload);
               onClose();
          } catch (error) {
               console.error("Error saving evaluation:", error);
          } finally {
               setLoading(false);
          }
     }

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={evaluation?.id ? "Editar Evaluación" : "Nueva Evaluación"}
               size="2xl"
          >
               <form onSubmit={handleSubmit}>
                    <EvaluationForm
                         evaluation={formData}
                         onChange={setFormData}
                    />
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                         <Button
                              type="button"
                              variant="ghost"
                              onClick={onClose}
                         >
                              Cancelar
                         </Button>
                         <Button
                              type="submit"
                              variant="primary"
                              loading={loading}
                         >
                              {evaluation?.id ? "Actualizar" : "Crear"}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
}
