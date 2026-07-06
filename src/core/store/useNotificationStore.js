import toast from "react-hot-toast";

export const notify = {
     success: (message) => toast.success(message),
     error: (message) => toast.error(message),
     info: (message) => toast(message, { icon: "ℹ️" }),
     warning: (message) => toast(message, { icon: "⚠️" }),
     promise: (promise, messages) => toast.promise(promise, messages),
};
