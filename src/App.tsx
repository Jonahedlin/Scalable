import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ToastContainer from "./components/ToastContainer";
import { ToastProvider } from "./context/ToastContext";

type View = "login" | "dashboard";

function App() {
  const [view, setView] = useState<View>("login");

  return (
    <ToastProvider>
      {view === "dashboard"
        ? <Dashboard onSignOut={() => setView("login")} />
        : <Login onSuccess={() => setView("dashboard")} />
      }
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
