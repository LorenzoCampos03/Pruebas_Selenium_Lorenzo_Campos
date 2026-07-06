import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { X, Download, FileText, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

function getExtension(url) {
  return url.split(".").pop()?.split("?")[0]?.toLowerCase();
}

function isImageUrl(url) {
  if (!url) return false;
  if (url.includes("/image/upload/")) return true;
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(getExtension(url));
}

function isCloudinaryUrl(url) {
  return url?.includes("res.cloudinary.com");
}

function getCloudinaryPageImageUrl(baseUrl, page) {
  if (!baseUrl) return baseUrl;
  return baseUrl.replace("/upload/", `/upload/pg_${page},q_auto,f_auto,w_1000/`);
}

export function DocumentPreviewModal({ isOpen, onClose, url, title }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPageReached, setMaxPageReached] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setCurrentPage(1);
    setMaxPageReached(false);
    setLoadError(false);
  }, [url, isOpen]);

  if (!isOpen || !url) return null;

  const ext = getExtension(url);
  const isPdf = ext === "pdf";
  const isImage = isImageUrl(url) && !isPdf;
  const isCloudinaryPdf = isPdf && isCloudinaryUrl(url);
  const fileName = title || url.split("/").pop()?.split("?")[0] || "Documento";

  const currentPageUrl = isCloudinaryPdf ? getCloudinaryPageImageUrl(url, currentPage) : url;

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => p + 1);

  const handleImageError = () => {
    if (currentPage > 1) {
      setMaxPageReached(true);
      setCurrentPage(p => p - 1);
    } else {
      setLoadError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.2s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: "zoomIn 0.2s ease-out" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <a
              href={url}
              download
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir documento completo
              </a>
            </div>
          ) : isCloudinaryPdf && !loadError ? (
            <div className="flex flex-col items-center gap-4 w-full h-full">
              <img
                key={currentPage}
                src={currentPageUrl}
                alt={`${fileName} - Página ${currentPage}`}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
                onError={handleImageError}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg disabled:opacity-30 enabled:hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                  Página {currentPage}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={maxPageReached}
                  className="p-2 rounded-lg disabled:opacity-30 enabled:hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-sm font-medium flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir documento completo
              </a>
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center gap-4 w-full h-full">
              <iframe
                src={url}
                className="w-full min-h-[75vh] rounded-lg border-0"
                title={fileName}
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm text-sm font-medium flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir documento en nueva pestaña
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 py-12">
              <FileText className="h-20 w-20 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700 mb-1">Vista previa no disponible</p>
              <p className="text-sm text-gray-400 mb-6">Este tipo de archivo no se puede previsualizar</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir documento
              </a>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

DocumentPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  url: PropTypes.string,
  title: PropTypes.string,
};
