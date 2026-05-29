import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  createCheckoutSession,
  createPortalSession,
  fetchPublicPlans,
} from "../services/billing.service.js";
import { friendlyApiError } from "../utils/apiErrors.js";
import "../styles/system-auth.css";

export default function PlansPage() {
  const [params] = useSearchParams();
  const { user, logout } = useAuth();
  const [plans, setPlans] = useState([]);
  const [err, setErr] = useState("");
  const [busyTier, setBusyTier] = useState(null);

  const billingSuccess = params.get("billing") === "success";
  const paymentSuccess = params.get("payment") === "success";
  const billingCancel = params.get("billing") === "cancel";

  useEffect(() => {
    let cancelled = false;
    fetchPublicPlans()
      .then((list) => {
        if (!cancelled) setPlans(Array.isArray(list) ? list : []);
      })
      .catch((ex) => {
        if (!cancelled) setErr(friendlyApiError(ex));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async (tier) => {
    if (!user) {
      setErr("Iniciá sesión para cambiar de plan.");
      return;
    }
    setErr("");
    setBusyTier(tier);
    try {
      const url = await createCheckoutSession(tier);
      if (url) window.location.href = url;
      else setErr("No se pudo iniciar el checkout.");
    } catch (ex) {
      setErr(friendlyApiError(ex));
    }
    setBusyTier(null);
  };

  const openPortal = async () => {
    setErr("");
    setBusyTier("portal");
    try {
      const url = await createPortalSession();
      if (url) window.location.href = url;
      else setErr("No se pudo abrir el portal de facturación.");
    } catch (ex) {
      setErr(friendlyApiError(ex));
    }
    setBusyTier(null);
  };

  return (
    <div className="sys-auth-page" style={{ alignItems: "flex-start", paddingTop: 48 }}>
      <div className="sys-auth-card" style={{ maxWidth: 960, width: "100%" }}>
        {billingSuccess && (
          <div
            role="status"
            style={{
              background: "#d4edda",
              padding: "16px 20px",
              borderRadius: 8,
              marginBottom: 20,
              color: "#155724",
            }}
          >
            Suscripción actualizada correctamente. Ya podés usar tu nuevo plan.
          </div>
        )}

        {paymentSuccess && (
          <div
            role="status"
            style={{
              background: "#d4edda",
              padding: "16px 20px",
              borderRadius: 8,
              marginBottom: 20,
              color: "#155724",
            }}
          >
            Pago del informe confirmado. Volvé al inicio para ver tu caso o abrí el
            enlace de descargo que te dimos.
          </div>
        )}

        {billingCancel && (
          <div
            role="status"
            style={{
              background: "#f8d7da",
              padding: "16px 20px",
              borderRadius: 8,
              marginBottom: 20,
              color: "#721c24",
            }}
          >
            Pago o cambio de plan cancelado. Podés elegir otro plan cuando quieras.
          </div>
        )}

        <h1 style={{ marginTop: 0 }}>Planes</h1>
        <p className="sys-auth-footer" style={{ marginBottom: 24 }}>
          <Link to="/">← Volver al diagnóstico</Link>
        </p>

        {err ? <p className="sys-auth-error">{err}</p> : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
          }}
        >
          {plans.map((plan) => {
            const tier = plan.id ?? plan.key;
            const isFree = Number(plan.priceUsd) === 0;
            return (
              <div
                key={tier}
                style={{
                  border: "1px solid #e2e8f0",
                  padding: 20,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <h3 style={{ margin: "0 0 8px" }}>{plan.name ?? plan.label}</h3>
                <p style={{ fontSize: 24, fontWeight: 700, margin: "8px 0" }}>
                  {isFree ? "Gratis" : `$${plan.priceUsd}/mes`}
                </p>
                <p style={{ margin: "0 0 16px", color: "#64748b" }}>
                  {plan.dailyQuota == null
                    ? "Análisis ilimitados / día"
                    : `${plan.dailyQuota} análisis / día`}
                </p>
                {isFree ? (
                  <span className="sys-auth-footer">Plan actual (registro)</span>
                ) : (
                  <button
                    type="button"
                    className="sys-auth-form button"
                    disabled={busyTier != null}
                    onClick={() => startCheckout(tier)}
                  >
                    {busyTier === tier ? "…" : "Elegir plan"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {plans.length === 0 && !err ? (
          <p className="sys-auth-footer">Cargando planes…</p>
        ) : null}

        {user ? (
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <p>Conectado: {user.email}</p>
            <p>
              <button
                type="button"
                className="sys-auth-form button"
                style={{ marginRight: 8 }}
                disabled={busyTier != null}
                onClick={openPortal}
              >
                {busyTier === "portal" ? "…" : "Portal de facturación"}
              </button>
              <button type="button" onClick={() => logout()}>
                Salir
              </button>
            </p>
          </div>
        ) : (
          <p className="sys-auth-footer" style={{ marginTop: 32 }}>
            <Link to="/login">Ingresar</Link> para suscribirte a un plan de pago.
          </p>
        )}
      </div>
    </div>
  );
}
