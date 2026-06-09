import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ToastContainer from "./components/ToastContainer";
import { ToastProvider } from "./context/ToastContext";

type View = "login" | "dashboard";

// Storage key for the auth token.
// Swap the stored value for a real JWT once the backend is ready.
export const TOKEN_KEY = "scalable_auth_token";

function App() {
  // Lazy initializer — reads localStorage once on mount.
  // If a token exists the user goes straight to the dashboard without seeing login.
  const [view, setView] = useState<View>(() =>
    localStorage.getItem(TOKEN_KEY) ? "dashboard" : "login"
  );

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    setView("dashboard");
  };

  const handleSignOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setView("login");
  };

  return (
    <ToastProvider>
      {view === "dashboard"
        ? <Dashboard onSignOut={handleSignOut} />
        : <Login onSuccess={(token) => handleLoginSuccess(token)} />
      }
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
