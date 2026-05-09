import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FUNNEL_STEP,
  REPORT_READY_INTRO,
  REPORT_TITLE,
} from "../copy/funnelCopy.js";
import { fetchDischarge, fetchPaymentStatus } from "../services/index.js";
import {
  CaseState,
  dischargeAvailableFromCaseState,
} from "../constants/caseState.js";

const POLL_MS = 2500;
const POLL_MAX_ATTEMPTS = 60;

const WAIT_CYCLE = [
  "Confirming payment…",
  "Preparing your Legal Defense Report…",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const stepTagStyle = {
  margin: "0 0 8px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

function WaitBanner({ phase, message }) {
  if (phase !== "checking" && phase !== "generating") return null;
  return (
    <div
      style={{
        padding: "14px 16px",
        marginBottom: 14,
        background: "#f8fafc",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: "#1e293b",
          lineHeight: 1.4,
        }}
      >
        {message}
      </p>
    </div>
  );
}

export default function DescargoPage() {
  const { multaId: multaIdParam } = useParams();
  const navigate = useNavigate();
  const resumeNav = useRef(false);

  const multaId = useMemo(() => multaIdParam?.trim() ?? "", [multaIdParam]);
  const idOk = Boolean(multaId && UUID_RE.test(multaId));

  useEffect(() => {
    resumeNav.current = false;
  }, [multaId]);

  const [phase, setPhase] = useState(() => (idOk ? "checking" : "error"));
  const [text, setText] = useState("");
  const [err, setErr] = useState(() =>
    idOk
      ? ""
      : "Invalid link. Return home and run diagnosis again."
  );
  const [pollKey, setPollKey] = useState(0);
  const [waitIdx, setWaitIdx] = useState(0);

  const waitMessage =
    phase === "generating"
      ? "Loading your Legal Defense Report…"
      : WAIT_CYCLE[waitIdx % WAIT_CYCLE.length];

  useEffect(() => {
    if (phase !== "checking") return undefined;
    const t = setInterval(() => setWaitIdx((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, [phase, pollKey]);

  useEffect(() => {
    if (!idOk) return undefined;

    let cancelled = false;
    let attempts = 0;

    setPhase("checking");
    setErr("");
    setText("");
    setWaitIdx(0);

    (async function poll() {
      while (!cancelled && attempts < POLL_MAX_ATTEMPTS) {
        attempts += 1;
        try {
          const row = await fetchPaymentStatus(multaId);
          if (cancelled) return;

          const cs = row.caseState;

          if (!cs) {
            if (!resumeNav.current) {
              resumeNav.current = true;
              navigate(`/?resume=${encodeURIComponent(multaId)}`, {
                replace: true,
              });
            }
            return;
          }

          const dischargeOk = dischargeAvailableFromCaseState(cs);

          const prePay =
            cs === CaseState.CREATED ||
            cs === CaseState.ANALYZED ||
            cs === CaseState.PAYMENT_PENDING;

          if (prePay && !resumeNav.current) {
            resumeNav.current = true;
            navigate(`/?resume=${encodeURIComponent(multaId)}`, {
              replace: true,
            });
            return;
          }

          if (cs === CaseState.FAILED) {
            if (!cancelled) {
              setErr(
                "We’re reviewing this case. Return home and try diagnosis again shortly."
              );
              setPhase("error");
            }
            return;
          }

          if (dischargeOk) {
            setPhase("generating");
            const disc = await fetchDischarge(multaId);
            if (cancelled) return;
            const bodyText =
              disc?.dischargeBody ?? disc?.data?.text ?? null;
            if (bodyText != null && String(bodyText).length > 0) {
              setText(String(bodyText));
              setPhase("ready");
              return;
            }
            setPhase("checking");
          }
        } catch (ex) {
          if (cancelled) return;
          if (ex.response?.status === 404) {
            setErr(
              "Report not found or no access. Sign in with the correct account."
            );
            setPhase("error");
            return;
          }
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }

      if (!cancelled) {
        setErr(
          "Payment not confirmed in time. If you were charged, wait and tap Retry."
        );
        setPhase("timeout");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [multaId, pollKey, idOk, navigate]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const downloadReport = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legal-defense-report-${multaId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const retryCheck = () => {
    setPollKey((k) => k + 1);
  };

  const textLink = {
    background: "none",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: 13,
    padding: 0,
    fontWeight: 500,
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 520,
        fontFamily: "system-ui,sans-serif",
        textAlign: "left",
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 12, color: "#94a3b8" }}>
        MultaCheck
      </p>
      <p style={stepTagStyle}>3 · {FUNNEL_STEP.result}</p>

      <h1 style={{ fontSize: 22, color: "#0f172a", margin: "0 0 10px", fontWeight: 700 }}>
        {REPORT_TITLE}
      </h1>

      <WaitBanner phase={phase} message={waitMessage} />

      {phase === "error" && err ? (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</p>
      ) : null}

      {phase === "timeout" && err ? (
        <>
          <p style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</p>
          <button
            type="button"
            onClick={retryCheck}
            style={{
              padding: "12px 18px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 10,
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            style={{ ...textLink, display: "block", marginTop: 8 }}
          >
            Back
          </button>
        </>
      ) : null}

      {phase === "ready" && text ? (
        <>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.45,
            }}
          >
            {REPORT_READY_INTRO}
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f8fafc",
              padding: 14,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 13,
              lineHeight: 1.5,
              maxHeight: "min(52vh, 420px)",
              overflow: "auto",
            }}
          >
            {text}
          </pre>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 11,
              color: "#94a3b8",
              fontStyle: "italic",
            }}
          >
            Informational only—not binding legal advice.
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "#64748b" }}>
            <button type="button" onClick={() => void copyReport()} style={textLink}>
              Copy
            </button>
            <span style={{ margin: "0 10px", color: "#cbd5e1" }}>|</span>
            <button type="button" onClick={downloadReport} style={textLink}>
              Download
            </button>
          </p>
        </>
      ) : null}

      {phase === "ready" ? (
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "14px 18px",
            fontWeight: 700,
            cursor: "pointer",
            display: "block",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 10,
          }}
        >
          Back
        </button>
      ) : phase === "error" ? (
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          style={{
            ...textLink,
            marginTop: 14,
            display: "inline-block",
            fontWeight: 600,
          }}
        >
          Back
        </button>
      ) : null}
    </div>
  );
}
