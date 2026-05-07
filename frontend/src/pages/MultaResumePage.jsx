import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMultaFullState } from "../services/index.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Punto de entrada /multa/:id — solo consulta backend y redirige a la etapa correcta.
 */
export default function MultaResumePage() {
  const { multaId: raw } = useParams();
  const navigate = useNavigate();
  const multaId = useMemo(() => raw?.trim() ?? "", [raw]);
  const idOk = Boolean(multaId && UUID_RE.test(multaId));
  const [hint, setHint] = useState("Verifying your case with our servers…");

  useEffect(() => {
    if (!idOk) {
      navigate("/", { replace: true });
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchMultaFullState(multaId);
        const row = res?.data;
        if (cancelled) return;

        if (!row?.multaId) {
          navigate("/", { replace: true });
          return;
        }

        if (row.lifecycleState === "ERROR_STATE") {
          navigate("/", {
            replace: true,
            state: {
              recoveryNotice:
                "We’re reviewing this case on our side. Please try again later or contact support.",
            },
          });
          return;
        }

        if (row.paid === true && row.dischargeAvailable === true) {
          navigate(`/descargo/${multaId}`, { replace: true });
          return;
        }

        navigate(`/?resume=${encodeURIComponent(multaId)}`, { replace: true });
      } catch {
        if (cancelled) return;
        setHint("Still verifying…");
        navigate("/", {
          replace: true,
          state: {
            recoveryNotice:
              "We couldn’t load that case. Open Analyze from the home screen.",
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [multaId, idOk, navigate]);

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "system-ui,sans-serif",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
        {hint}
      </p>
      <p style={{ margin: "14px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.45 }}>
        This only takes a moment. Your progress is saved on our servers.
      </p>
    </div>
  );
}
