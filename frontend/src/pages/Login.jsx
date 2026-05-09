import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import "../styles/system-auth.css";

const LAST_TENANT_SLUG_KEY = "multacheck_last_tenant_slug";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tenantSlug, setTenantSlug] = useState(() =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem(LAST_TENANT_SLUG_KEY) ?? ""
      : ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password, tenantSlug);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? "Error al ingresar");
    }
    setBusy(false);
  };

  return (
    <div className="sys-auth-page">
      <div className="sys-auth-card">
        <h1>Ingresar</h1>
        <form className="sys-auth-form" onSubmit={submit}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Slug de empresa (ej. demo)"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value.trim().toLowerCase())}
            required
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "…" : "Entrar"}
          </button>
        </form>
        {error ? <p className="sys-auth-error">{error}</p> : null}
        <p className="sys-auth-footer">
          <Link to="/register">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
