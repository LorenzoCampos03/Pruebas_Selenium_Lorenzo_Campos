export function formatDate(dateString) {
     if (!dateString) return "";
     return new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
     }).format(new Date(dateString));
}

export function formatDateShortMonth(dateString) {
     if (!dateString) return "";
     return new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
     }).format(new Date(dateString));
}

export function formatDateTime(dateString) {
     if (!dateString) return "";
     return new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
     }).format(new Date(dateString));
}

export function formatDNI(dni) {
     if (!dni) return "";
     return dni.replace(/(\d{8})/, "$1");
}

export function formatPhone(phone) {
     if (!phone) return "";
     return phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

export function capitalize(str) {
     if (!str) return "";
     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function fullName(user) {
     if (!user) return "";
     const parts = [user.firstName, user.lastName, user.motherLastName].filter(Boolean);
     return parts.join(" ");
}
