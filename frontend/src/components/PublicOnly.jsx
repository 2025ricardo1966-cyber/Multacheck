import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function PublicOnly({ children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        Cargando…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
