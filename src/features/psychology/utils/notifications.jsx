import toast from "react-hot-toast";
import Swal from "sweetalert2";
import PsyToast from "../components/PsyToast";

function showToast(type, message, duration = 3000) {
  toast.custom(
    (t) => <PsyToast type={type} message={message} visible={t.visible} />,
    { position: "top-center", duration }
  );
}

export function toastSuccess(message) {
  showToast("success", message);
}

export function toastError(message) {
  showToast("error", message, 4000);
}

export function toastWarning(message) {
  showToast("warning", message, 4000);
}

export function toastInfo(message) {
  showToast("info", message);
}

export function toastConfirm(message, title = "¿Estás seguro?") {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: "#3b82f6",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Sí",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    width: 420,
    padding: "1.5rem",
    customClass: {
      popup: "rounded-2xl shadow-2xl",
      title: "text-lg font-bold text-gray-900",
      htmlContainer: "text-sm text-gray-600",
      confirmButton: "px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm",
      cancelButton: "px-5 py-2.5 rounded-lg text-sm font-semibold",
    },
  });
}

export function toastConfirmCustom({ icon, title, text, confirmText, confirmColor }) {
  return Swal.fire({
    icon: icon || "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: confirmColor || "#3b82f6",
    cancelButtonColor: "#6b7280",
    confirmButtonText: confirmText || "Sí",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    width: 460,
    padding: "1.5rem",
    customClass: {
      popup: "rounded-2xl shadow-2xl",
      title: "text-lg font-bold text-gray-900",
      htmlContainer: "text-sm text-gray-600",
      confirmButton: "px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm",
      cancelButton: "px-5 py-2.5 rounded-lg text-sm font-semibold",
    },
  });
}
