import Modal from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Confirmar", message = "¿Estás seguro?", confirmText = "Confirmar", cancelText = "Cancelar", variant = "danger", loading = false }) {
     return (
          <Modal open={open} onClose={onClose} size="sm">
               <div className="text-center py-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <div className="flex items-center justify-center gap-3">
                         <Button variant="ghost" onClick={onClose} disabled={loading}>
                              {cancelText}
                         </Button>
                         <Button variant={variant} onClick={onConfirm} loading={loading}>
                              {confirmText}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}
