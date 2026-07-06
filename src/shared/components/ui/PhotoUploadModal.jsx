import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPE = "image/png";

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onUpload,
  title = "Subir foto",
  currentPhotoUrl = null,
}) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateAndSet = (selected) => {
    if (!selected) return;
    if (selected.type !== ALLOWED_TYPE) {
      setError("Solo se permiten archivos PNG.");
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError("El archivo no debe superar los 5 MB.");
      return;
    }
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleFileChange = (e) => {
    validateAndSet(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await onUpload(file);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const displayPhoto = preview || currentPhotoUrl;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-5">
        <div
          className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-primary-400 transition-colors bg-gray-50"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {displayPhoto ? (
            <div className="relative">
              <img
                src={displayPhoto}
                alt="Vista previa"
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
              />
              {preview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setFile(null);
                    setError(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Camera className="w-12 h-12" />
              <p className="text-sm text-center">
                Arrastra una imagen aquí o <span className="text-primary-600 font-medium">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-gray-400">Solo PNG · máx. 5 MB</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center font-medium">{error}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            icon={Upload}
            onClick={handleSubmit}
            disabled={!file}
            loading={loading}
          >
            Guardar foto
          </Button>
        </div>
      </div>
    </Modal>
  );
}
