import { Toaster } from "react-hot-toast";

export default function Toast() {
     return (
          <Toaster
               position="top-right"
               toastOptions={{
                    duration: 3000,
                    style: {
                         background: "#1f2937",
                         color: "#f9fafb",
                         borderRadius: "0.75rem",
                         fontSize: "0.875rem",
                         padding: "12px 16px",
                    },
                    success: {
                         iconTheme: { primary: "#22c55e", secondary: "#f9fafb" },
                    },
                    error: {
                         iconTheme: { primary: "#ef4444", secondary: "#f9fafb" },
                         duration: 4000,
                    },
               }}
          />
     );
}
