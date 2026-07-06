import toast from "react-hot-toast";
import Swal from "sweetalert2";
import AsistenciaToast from "../components/Modals/AsistenciaToast";

function showToast(type, message, duration = 3000, sub) {
  toast.custom(
    (t) => <AsistenciaToast type={type} message={message} visible={t.visible} sub={sub} />,
    { position: "top-center", duration }
  );
}

export function toastSuccess(message, sub) {
  showToast("success", message, 3000, sub);
}

export function toastError(message, sub) {
  showToast("error", message, 4000, sub);
}

export function toastWarning(message, sub) {
  showToast("warning", message, 4000, sub);
}

export function toastInfo(message, sub) {
  showToast("info", message, 3000, sub);
}

export function toastScan(message, sub) {
  showToast("scan", message, 2500, sub);
}

export function toastConfirm(message, title = "¿Estás seguro?") {
  return Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: "#0f172a",
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


