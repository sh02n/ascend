import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "../core/routing/AppRouter";
import { AuthProvider } from "../features/auth/hooks/useAuth";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
