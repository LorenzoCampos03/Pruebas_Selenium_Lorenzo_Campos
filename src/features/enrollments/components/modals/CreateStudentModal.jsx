import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X, User, Save, AlertCircle } from "lucide-react";
import { studentService } from "@/features/students/services/studentService";

/**
 * Modal para crear un nuevo estudiante inline
 */
export function CreateStudentModal({ isOpen, onClose, onStudentCreated, institutionId, prefillDocumentNumber = "" }) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        motherLastName: "",
        documentType: "DNI",
        documentNumber: prefillDocumentNumber || "",
        dateOfBirth: "",
        gender: "",
        institutionId: institutionId || "",
        status: "ACTIVE",
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill document number when modal opens with a new prefill
    const [lastPrefill, setLastPrefill] = useState(prefillDocumentNumber);
    useEffect(() => {
        if (isOpen && prefillDocumentNumber && prefillDocumentNumber !== lastPrefill) {
            setLastPrefill(prefillDocumentNumber);
            setFormData(prev => ({ ...prev, documentNumber: prefillDocumentNumber }));
        }
    }, [isOpen, prefillDocumentNumber, lastPrefill]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = "El nombre es requerido";
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = "El apellido paterno es requerido";
        }

        if (!formData.documentNumber.trim()) {
            newErrors.documentNumber = "El número de documento es requerido";
        } else if (formData.documentNumber.length !== 8) {
            newErrors.documentNumber = "El DNI debe tener 8 dígitos";
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "La fecha de nacimiento es requerida";
        } else {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 2 || age > 7) {
                newErrors.dateOfBirth = "La edad debe estar entre 2 y 7 años para educación inicial";
            }
        }

        if (!formData.gender) {
            newErrors.gender = "El género es requerido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Generar CUI temporal basado en el DNI (el backend puede generar uno real)
            const temporaryCui = `CUI-${formData.documentNumber}`;
            
            const payload = {
                // CUI (requerido por el backend)
                cui: temporaryCui,
                
                // Campos básicos requeridos
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                motherLastName: formData.motherLastName.trim() || "",
                documentType: formData.documentType,
                documentNumber: formData.documentNumber.trim(),
                dateOfBirth: formData.dateOfBirth,
                
                // Género: convertir de "MASCULINO"/"FEMENINO" a "M"/"F"
                gender: formData.gender === "MASCULINO" ? "M" : formData.gender === "FEMENINO" ? "F" : formData.gender,
                
                // Campos de ubicación
                address: "",
                photoUrl: "",
                
                // Campos de institución y aula
                institutionId: institutionId,
                classroomId: "",
                
                // Campos de desarrollo (opcionales según el modelo)
                motorDevelopment: "",
                languageDevelopment: "", 
                socialDevelopment: "",
                developmentObservations: "",
                
                // Campos médicos (opcionales)
                bloodType: "",
                allergies: "",
                medications: "",
                conditions: "",
                emergencyNotes: "",
            };

            if (import.meta.env.DEV) {
                console.log("📤 Creando estudiante:", payload.firstName, payload.lastName);
                console.log("📦 Payload completo:", JSON.stringify(payload, null, 2));
            }

            const response = await studentService.create(payload);

            if (import.meta.env.DEV) {
                console.log("📥 Respuesta del servidor:", response);
            }

            // Manejar respuesta del backend con múltiples formatos posibles
            let createdStudent;
            
            // Formato 1: { success: true, data: {...} }
            if (response && response.success && response.data) {
                createdStudent = response.data;
            } 
            // Formato 2: { id: "...", firstName: "...", ... } (objeto directo)
            else if (response && response.id) {
                createdStudent = response;
            } 
            // Formato 3: [{ id: "...", ... }] (array con un elemento)
            else if (Array.isArray(response) && response.length > 0) {
                createdStudent = response[0];
            }
            // Formato 4: Respuesta envuelta en data
            else if (response && response.data && response.data.id) {
                createdStudent = response.data;
            }
            else {
                console.error("❌ Respuesta inesperada del servidor:", response);
                throw new Error("Respuesta inesperada del servidor");
            }

            // Validar que el estudiante creado tenga los campos mínimos necesarios
            if (!createdStudent.id || !createdStudent.firstName || !createdStudent.lastName) {
                console.error("❌ Estudiante creado sin campos requeridos:", createdStudent);
                throw new Error("El estudiante se creó pero faltan datos requeridos");
            }

            if (import.meta.env.DEV) {
                console.log("✅ Estudiante creado exitosamente:", {
                    id: createdStudent.id,
                    nombre: `${createdStudent.firstName} ${createdStudent.lastName}`,
                    dni: createdStudent.documentNumber,
                });
            }

            // Notificar al componente padre que se creó el estudiante
            onStudentCreated(createdStudent);

            // Cerrar modal y limpiar formulario
            handleClose();
        } catch (error) {
            console.error("❌ Error al crear estudiante:", error);
            
            // Log detallado del error para debugging
            if (error.response) {
                console.error("📛 Detalles del error:");
                console.error("  - Status:", error.response.status);
                console.error("  - Data:", error.response.data);
                console.error("  - Headers:", error.response.headers);
            }
            
            let errorMessage = "Error al crear el estudiante. Por favor, intente nuevamente.";
            
            if (error.response?.status === 0 || error.code === 'ECONNABORTED') {
                errorMessage = "No se pudo conectar con el servidor. Verifique su conexión.";
            } else if (error.response?.status === 400) {
                // Error 400 - Bad Request
                if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data?.details) {
                    // Si hay detalles específicos de validación
                    const details = error.response.data.details;
                    if (Array.isArray(details)) {
                        errorMessage = details.join(", ");
                    } else if (typeof details === 'object') {
                        // Convertir objeto de errores a mensaje legible
                        errorMessage = Object.entries(details)
                            .map(([field, msg]) => `${field}: ${msg}`)
                            .join(", ");
                    } else {
                        errorMessage = details;
                    }
                } else {
                    errorMessage = "Datos inválidos. Verifique que todos los campos estén correctos.";
                }
                
                // Detectar errores específicos de campos
                const errorText = errorMessage.toLowerCase();
                if (errorText.includes("cui") || errorText.includes("dni") || errorText.includes("document")) {
                    setErrors({ documentNumber: errorMessage });
                    return;
                } else if (errorText.includes("fecha") || errorText.includes("date") || errorText.includes("birth")) {
                    setErrors({ dateOfBirth: errorMessage });
                    return;
                } else if (errorText.includes("nombre") || errorText.includes("name")) {
                    setErrors({ firstName: errorMessage });
                    return;
                }
            } else if (error.response?.status === 500) {
                errorMessage = "Error interno del servidor. El servicio puede estar temporalmente no disponible.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.details) {
                errorMessage = error.response.data.details.join ? error.response.data.details.join(", ") : error.response.data.details;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setErrors({ general: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setFormData({
            firstName: "",
            lastName: "",
            motherLastName: "",
            documentType: "DNI",
            documentNumber: "",
            dateOfBirth: "",
            gender: "",
            institutionId: institutionId || "",
            status: "ACTIVE",
        });
        setErrors({});
        onClose();
    };

    // Early return si el modal no está abierto (sin logs para evitar spam en consola)
    if (!isOpen) {
        return null;
    }

    // Renderizar el modal usando Portal para evitar problemas de form anidados
    const modalContent = (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose(e);
                }
            }}
        >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay con efecto blur */}
                <div
                    className="fixed inset-0 transition-all duration-300"
                    style={{
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                    onClick={handleClose}
                    aria-hidden="true"
                />

                {/* Spacer element to center the modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>

                {/* Modal */}
                <div
                    className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                                    Crear Nuevo Estudiante
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Complete la información básica del estudiante
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            disabled={loading}
                            type="button"
                            aria-label="Cerrar modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Error general */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{errors.general}</p>
                        </div>
                    )}

                    {/* Formulario */}
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.type !== 'submit') {
                                e.preventDefault();
                            }
                        }}
                    >
                        {/* Nombres */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombres <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleChange("firstName", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: María José"
                                disabled={loading}
                                autoComplete="given-name"
                            />
                            {errors.firstName && (
                                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                            )}
                        </div>

                        {/* Apellidos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Apellido Paterno <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: García"
                                    disabled={loading}
                                    autoComplete="family-name"
                                />
                                {errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Apellido Materno
                                </label>
                                <input
                                    type="text"
                                    value={formData.motherLastName}
                                    onChange={(e) => handleChange("motherLastName", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: López"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* DNI y Género */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    DNI <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.documentNumber}
                                    onChange={(e) => handleChange("documentNumber", e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="12345678"
                                    maxLength="8"
                                    disabled={loading}
                                />
                                {errors.documentNumber && (
                                    <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Género <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => handleChange("gender", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                                {errors.gender && (
                                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                                )}
                            </div>
                        </div>

                        {/* Fecha de nacimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Nacimiento <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                                min="2017-01-01"
                                max="2022-12-31"
                            />
                            {errors.dateOfBirth && (
                                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleClose(e);
                                }}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Crear Estudiante
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // Usar createPortal para renderizar fuera del árbol DOM del formulario padre
    return createPortal(modalContent, document.body);
}

CreateStudentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onStudentCreated: PropTypes.func.isRequired,
    institutionId: PropTypes.string,
    prefillDocumentNumber: PropTypes.string,
};
