import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

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
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Ingresar</h2>
      <form onSubmit={submit}>
        <input
          type="text"
          autoComplete="organization"
          placeholder="Slug de empresa (ej. demo)"
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value.trim().toLowerCase())}
          required
        />
        <br />
        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Entrar"}
        </button>
      </form>
      {error ? (
        <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>
      ) : null}
      <p style={{ fontSize: 13 }}>
        <Link to="/register">Crear cuenta</Link>
      </p>
    </div>
  );
}
