import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { Toast } from "@/shared/components/ui";
import { ErrorBoundary } from "@/shared/components/feedback";
import { AppRouter } from "@/router";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <Toast />
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
