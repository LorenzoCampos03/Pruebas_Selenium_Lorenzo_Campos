import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Upload, X, CheckCircle, AlertCircle, Loader2, Eye } from "lucide-react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

/**
 * Componente para subir documentos a Cloudinary
 */
export function DocumentUploader({ 
  documentKey, 
  value, 
  onChange, 
  disabled = false,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx"
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("El archivo no debe superar los 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Subir a Cloudinary
      const url = await uploadFileToCloudinary(file, documentKey);
      onChange(url);
    } catch (err) {
      console.error("Error al subir archivo:", err);
      setError("Error al subir el archivo. Intente nuevamente.");
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const getFileName = (url) => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split("/");
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return "Archivo";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {!value ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-all ${
            uploading
              ? "border-blue-300 bg-blue-50 cursor-wait"
              : disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-600">Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                Subir archivo
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline truncate block"
            >
              {getFileName(value)}
            </a>
            <p className="text-xs text-green-600">Archivo subido correctamente</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
            title="Ver documento"
          >
            <Eye className="h-4 w-4 text-green-700" />
          </button>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 hover:bg-green-100 rounded transition-colors"
              title="Eliminar archivo"
            >
              <X className="h-4 w-4 text-green-700" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Formatos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
      </p>

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        url={value}
      />
    </div>
  );
}

/**
 * Función auxiliar para subir archivos a Cloudinary
 */
async function uploadFileToCloudinary(file, documentKey) {
  const CLOUD_NAME = "dz5ytt6lc";
  const UPLOAD_PRESET = "enrollments";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `enrollments/documents/${documentKey}`);

  const fileExtension = file.name.split(".").pop().toLowerCase();
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
  const useImage = imageExtensions.includes(fileExtension);
  const resourceType = useImage ? "image" : "raw";

  formData.append("resource_type", resourceType);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Error al subir archivo a Cloudinary");
  }

  const data = await response.json();

  console.log("Cloudinary response:", data);

  return data.secure_url;
} // ← Aquí termina la función

DocumentUploader.propTypes = {
  documentKey: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  accept: PropTypes.string,
};