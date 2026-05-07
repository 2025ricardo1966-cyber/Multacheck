import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

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
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Crear cuenta</h2>
      <form onSubmit={submit}>
        <input
          type="text"
          autoComplete="organization"
          placeholder="Nombre de la empresa"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Slug opcional (solo letras, números, guiones)"
          value={companySlug}
          onChange={(e) =>
            setCompanySlug(e.target.value.trim().toLowerCase())
          }
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
          autoComplete="new-password"
          placeholder="Contraseña (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <br />
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Registrar"}
        </button>
      </form>
      {error ? (
        <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>
      ) : null}
      <p style={{ fontSize: 13 }}>
        <Link to="/login">Ya tengo cuenta</Link>
      </p>
    </div>
  );
}
