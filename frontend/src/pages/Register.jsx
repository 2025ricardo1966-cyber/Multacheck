import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import "../styles/system-auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(email, password, companyName, companySlug);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? "Error al registrar");
    }
    setBusy(false);
  };

  return (
    <div className="sys-auth-page">
      <div className="sys-auth-card">
        <h1>Crear cuenta</h1>
        <form className="sys-auth-form" onSubmit={submit}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Nombre de la empresa"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Slug opcional (solo letras, números, guiones)"
            value={companySlug}
            onChange={(e) => setCompanySlug(e.target.value.trim().toLowerCase())}
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
            autoComplete="new-password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "…" : "Registrar"}
          </button>
        </form>
        {error ? <p className="sys-auth-error">{error}</p> : null}
        <p className="sys-auth-footer">
          <Link to="/login">Ya tengo cuenta</Link>
        </p>
      </div>
    </div>
  );
}
