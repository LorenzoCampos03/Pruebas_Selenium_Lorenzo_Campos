import Swal from "sweetalert2";

const POPUP_BASE = [
     "!rounded-2xl",
     "!shadow-2xl",
     "!shadow-black/10",
     "!border",
     "!border-gray-100",
     "!p-0",
     "!overflow-hidden",
     "!max-w-sm",
     "!w-full",
].join(" ");

const TITLE_BASE = [
     "!text-lg",
     "!font-semibold",
     "!text-gray-900",
     "!pt-0",
     "!pb-1",
     "!px-0",
].join(" ");

const HTML_CONTAINER_BASE = [
     "!text-sm",
     "!text-gray-500",
     "!m-0",
     "!px-0",
     "!pb-0",
     "!leading-relaxed",
].join(" ");

const ACTIONS_BASE = [
     "!p-0",
     "!mt-2",
     "!gap-3",
     "!w-full",
     "!flex-row-reverse",
].join(" ");

const BTN_CONFIRM = [
     "!rounded-lg",
     "!px-5",
     "!py-2.5",
     "!text-sm",
     "!font-semibold",
     "!shadow-none",
     "!transition-all",
     "!duration-200",
].join(" ");

const BTN_CANCEL = [
     "!rounded-lg",
     "!px-5",
     "!py-2.5",
     "!text-sm",
     "!font-medium",
     "!bg-gray-100",
     "!text-gray-600",
     "!shadow-none",
     "!border-0",
     "!transition-all",
     "!duration-200",
     "hover:!bg-gray-200",
].join(" ");

const ICONS = {
     success: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50">
          <svg class="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
     </div>`,
     error: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-50">
          <svg class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
     </div>`,
     warning: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-amber-50">
          <svg class="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
     </div>`,
     info: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-blue-50">
          <svg class="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
     </div>`,
     question: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50">
          <svg class="w-7 h-7 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
     </div>`,
     logout: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-50">
          <svg class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
     </div>`,
     delete: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-50">
          <svg class="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
     </div>`,
     restore: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50">
          <svg class="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
     </div>`,
     login: `<div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50">
          <svg class="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
     </div>`,
};

function buildContent(iconHtml, title, body) {
     return `<div class="flex flex-col items-center text-center px-6 pt-7 pb-5">
          ${iconHtml}
          <h2 class="text-lg font-semibold text-gray-900 mt-4">${title}</h2>
          ${body ? `<p class="text-sm text-gray-500 mt-1.5 leading-relaxed">${body}</p>` : ""}
     </div>`;
}

function buildContentHtml(iconHtml, title, bodyHtml) {
     return `<div class="flex flex-col items-center text-center px-6 pt-7 pb-5">
          ${iconHtml}
          <h2 class="text-lg font-semibold text-gray-900 mt-4">${title}</h2>
          ${bodyHtml ? `<div class="text-sm text-gray-500 mt-1.5 leading-relaxed">${bodyHtml}</div>` : ""}
     </div>`;
}

const CONFIRM_BASE = {
     showCancelButton: true,
     reverseButtons: true,
     buttonsStyling: true,
     showClass: { popup: "swal2-show", backdrop: "swal2-backdrop-show" },
     hideClass: { popup: "swal2-hide", backdrop: "swal2-backdrop-hide" },
     customClass: {
          popup: POPUP_BASE,
          actions: ACTIONS_BASE + " !px-6 !pb-5",
          confirmButton: BTN_CONFIRM,
          cancelButton: BTN_CANCEL,
     },
};

const NOTIFY_BASE = {
     showConfirmButton: false,
     showClass: { popup: "swal2-show", backdrop: "swal2-backdrop-show" },
     hideClass: { popup: "swal2-hide", backdrop: "swal2-backdrop-hide" },
     customClass: {
          popup: POPUP_BASE,
     },
};

export function alertSuccess(message, title = "Operación exitosa") {
     return Swal.fire({
          ...NOTIFY_BASE,
          html: buildContent(ICONS.success, title, message),
          timer: 2500,
          timerProgressBar: true,
     });
}

export function alertError(message, title = "Error") {
     return Swal.fire({
          ...NOTIFY_BASE,
          showConfirmButton: true,
          html: buildContent(ICONS.error, title, message),
          customClass: {
               ...NOTIFY_BASE.customClass,
               actions: ACTIONS_BASE + " !px-6 !pb-5",
               confirmButton: BTN_CONFIRM + " !bg-red-600 hover:!bg-red-700",
          },
          confirmButtonText: "Entendido",
     });
}

export function alertWarning(message, title = "Advertencia") {
     return Swal.fire({
          ...NOTIFY_BASE,
          showConfirmButton: true,
          html: buildContent(ICONS.warning, title, message),
          customClass: {
               ...NOTIFY_BASE.customClass,
               actions: ACTIONS_BASE + " !px-6 !pb-5",
               confirmButton: BTN_CONFIRM + " !bg-amber-500 hover:!bg-amber-600",
          },
          confirmButtonText: "Entendido",
     });
}

export function alertInfo(message, title = "Información") {
     return Swal.fire({
          ...NOTIFY_BASE,
          showConfirmButton: true,
          html: buildContent(ICONS.info, title, message),
          customClass: {
               ...NOTIFY_BASE.customClass,
               actions: ACTIONS_BASE + " !px-6 !pb-5",
               confirmButton: BTN_CONFIRM + " !bg-blue-600 hover:!bg-blue-700",
          },
          confirmButtonText: "Entendido",
     });
}

export function alertConfirmCreate(entityName = "registro") {
     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContent(ICONS.question, "Confirmar creación", `¿Está seguro de crear este ${entityName}?`),
          confirmButtonText: "Sí, crear",
          cancelButtonText: "Cancelar",
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + " !bg-indigo-600 hover:!bg-indigo-700",
          },
     });
}

export function alertConfirmUpdate(entityName = "registro") {
     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContent(ICONS.question, "Confirmar actualización", `¿Está seguro de actualizar este ${entityName}?`),
          confirmButtonText: "Sí, actualizar",
          cancelButtonText: "Cancelar",
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + " !bg-indigo-600 hover:!bg-indigo-700",
          },
     });
}

export function alertConfirmDelete(entityName = "registro") {
     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContentHtml(
               ICONS.delete,
               "Confirmar eliminación",
               `¿Está seguro de eliminar este ${entityName}?<br/><span class="text-xs text-gray-400 mt-1 block">Esta acción cambiará el estado a inactivo.</span>`
          ),
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + " !bg-red-600 hover:!bg-red-700",
          },
     });
}

export function alertConfirmRestore(entityName = "registro") {
     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContent(ICONS.restore, "Confirmar restauración", `¿Está seguro de restaurar este ${entityName}?`),
          confirmButtonText: "Sí, restaurar",
          cancelButtonText: "Cancelar",
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + " !bg-emerald-600 hover:!bg-emerald-700",
          },
     });
}

export function alertConfirmLogout() {
     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContent(
               ICONS.logout,
               "Cerrar sesión",
               "¿Está seguro de que desea cerrar su sesión actual?"
          ),
          confirmButtonText: "Cerrar sesión",
          cancelButtonText: "Cancelar",
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + " !bg-red-600 hover:!bg-red-700",
          },
     });
}

export function alertLoginSuccess(userName = "") {
     const greeting = userName ? `Bienvenido, ${userName}` : "Bienvenido";
     return Swal.fire({
          ...NOTIFY_BASE,
          html: buildContent(ICONS.login, greeting, "Sesión iniciada correctamente"),
          timer: 2000,
          timerProgressBar: true,
     });
}

export function alertLoginError(message = "Credenciales incorrectas") {
     return Swal.fire({
          ...NOTIFY_BASE,
          showConfirmButton: true,
          html: buildContent(ICONS.error, "Error de autenticación", message),
          customClass: {
               ...NOTIFY_BASE.customClass,
               actions: ACTIONS_BASE + " !px-6 !pb-5",
               confirmButton: BTN_CONFIRM + " !bg-red-600 hover:!bg-red-700",
          },
          confirmButtonText: "Entendido",
     });
}

export function alertCreated(entityName = "registro") {
     return alertSuccess(`${entityName} creado exitosamente`, "Creado correctamente");
}

export function alertUpdated(entityName = "registro") {
     return alertSuccess(`${entityName} actualizado exitosamente`, "Actualizado correctamente");
}

export function alertDeleted(entityName = "registro") {
     return alertSuccess(`${entityName} eliminado exitosamente`, "Eliminado correctamente");
}

export function alertRestored(entityName = "registro") {
     return alertSuccess(`${entityName} restaurado exitosamente`, "Restaurado correctamente");
}

export function alertApiError(error) {
     const response = error?.response?.data;

     if (response?.success === false) {
          const details = response.details;
          if (details && details.length > 0) {
               const listHtml = details.map((d) => `<li class="text-gray-500">${d}</li>`).join("");
               return Swal.fire({
                    ...NOTIFY_BASE,
                    showConfirmButton: true,
                    html: buildContentHtml(
                         ICONS.error,
                         response.message || "Error",
                         `<ul class="text-left text-sm space-y-1 list-disc pl-4 mt-2">${listHtml}</ul>`
                    ),
                    customClass: {
                         ...NOTIFY_BASE.customClass,
                         actions: ACTIONS_BASE + " !px-6 !pb-5",
                         confirmButton: BTN_CONFIRM + " !bg-red-600 hover:!bg-red-700",
                    },
                    confirmButtonText: "Entendido",
               });
          }

          return alertError(response.message || "Ocurrió un error", `Error ${response.status || ""}`);
     }

     if (error?.code === "ECONNABORTED") {
          return alertError("La solicitud tardó demasiado. Intente nuevamente.", "Tiempo agotado");
     }

     if (!error?.response) {
          return alertError("No se pudo conectar con el servidor. Verifique su conexión.", "Sin conexión");
     }

     return alertError(error?.message || "Ocurrió un error inesperado");
}

export function alertLoading(message = "Procesando...") {
     Swal.fire({
          html: `<div class="flex flex-col items-center py-6 px-4">
               <div class="w-10 h-10 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
               <p class="text-sm text-gray-500 mt-4 font-medium">${message}</p>
          </div>`,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          customClass: {
               popup: POPUP_BASE,
          },
     });
}

export function alertCloseLoading() {
     Swal.close();
}

export function alertConfirmAction({ title, message, html, confirmText = "Confirmar", cancelText = "Cancelar", icon = "question", confirmColor = "indigo" }) {
     const iconHtml = ICONS[icon] || ICONS.question;
     const content = html
          ? buildContentHtml(iconHtml, title, html)
          : buildContent(iconHtml, title, message);

     return Swal.fire({
          ...CONFIRM_BASE,
          html: content,
          confirmButtonText: confirmText,
          cancelButtonText: cancelText,
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + ` !bg-${confirmColor}-600 hover:!bg-${confirmColor}-700`,
          },
     });
}

export function alertConfirmWithInput({ title, message, inputPlaceholder = "", confirmText = "Confirmar", cancelText = "Cancelar", icon = "warning", confirmColor = "red", maxLength = 500 }) {
     const iconHtml = ICONS[icon] || ICONS.warning;

     return Swal.fire({
          ...CONFIRM_BASE,
          html: buildContent(iconHtml, title, message),
          input: "textarea",
          inputPlaceholder,
          inputAttributes: { maxlength: maxLength },
          confirmButtonText: confirmText,
          cancelButtonText: cancelText,
          inputValidator: (value) => {
               if (!value || !value.trim()) return "Este campo es obligatorio";
          },
          customClass: {
               ...CONFIRM_BASE.customClass,
               confirmButton: BTN_CONFIRM + ` !bg-${confirmColor}-600 hover:!bg-${confirmColor}-700`,
               input: "!rounded-xl !border-gray-200 !text-sm !shadow-sm focus:!ring-2 focus:!ring-indigo-500/20 focus:!border-indigo-300 !mt-2",
          },
     });
}

const SweetAlertService = {
     success: alertSuccess,
     error: alertError,
     warning: alertWarning,
     info: alertInfo,
     confirmCreate: alertConfirmCreate,
     confirmUpdate: alertConfirmUpdate,
     confirmDelete: alertConfirmDelete,
     confirmRestore: alertConfirmRestore,
     confirmLogout: alertConfirmLogout,
     confirmAction: alertConfirmAction,
     confirmWithInput: alertConfirmWithInput,
     loginSuccess: alertLoginSuccess,
     loginError: alertLoginError,
     created: alertCreated,
     updated: alertUpdated,
     deleted: alertDeleted,
     restored: alertRestored,
     apiError: alertApiError,
     loading: alertLoading,
     closeLoading: alertCloseLoading,
};

export default SweetAlertService;
