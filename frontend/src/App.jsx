import "./App.css";
import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import {
  FUNNEL_STEP,
  REPORT_SUBTITLE,
  REPORT_TITLE,
  REPORT_VALUE_BULLETS,
  SEMAPHORE_IMPACT,
} from "./copy/funnelCopy.js";
import {
  analyzeMulta,
  createDischargeCheckout,
  fetchMultaFullState,
} from "./services/index.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnly from "./components/PublicOnly.jsx";
import DescargoPage from "./pages/DescargoPage.jsx";
import MultaResumePage from "./pages/MultaResumePage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

const APP_VERSION = "0.0.0";

const STORAGE_RESUME_MULTA = "multacheck_resume_multa_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROVINCES = [
  { name: "Buenos Aires", abbr: "BA" },
  { name: "Catamarca", abbr: "CC" },
  { name: "Chaco", abbr: "CH" },
  { name: "Chubut", abbr: "UB" },
  { name: "Córdoba", abbr: "CB" },
  { name: "Corrientes", abbr: "CN" },
  { name: "Entre Ríos", abbr: "ER" },
  { name: "Formosa", abbr: "FM" },
  { name: "Jujuy", abbr: "JY" },
  { name: "La Pampa", abbr: "LP" },
  { name: "La Rioja", abbr: "LR" },
  { name: "Mendoza", abbr: "MZ" },
  { name: "Misiones", abbr: "MN" },
  { name: "Neuquén", abbr: "NQ" },
  { name: "Río Negro", abbr: "RN" },
  { name: "Salta", abbr: "SA" },
  { name: "San Juan", abbr: "SJ" },
  { name: "San Luis", abbr: "SL" },
  { name: "Santa Cruz", abbr: "SC" },
  { name: "Santa Fe", abbr: "SF" },
  { name: "Santiago del Estero", abbr: "SE" },
  { name: "Tierra del Fuego", abbr: "TF" },
  { name: "Tucumán", abbr: "TM" },
  { name: "Ciudad Autónoma de Buenos Aires", abbr: "CF" },
];

const MID = Math.ceil(PROVINCES.length / 2);
const PROV_LEFT = PROVINCES.slice(0, MID);
const PROV_RIGHT = PROVINCES.slice(MID);

const LIGHT_KEYS = ["RED", "YELLOW", "GREEN"];

function Semaphore({ trafficLight }) {
  const key =
    trafficLight && ["GREEN", "YELLOW", "RED"].includes(trafficLight)
      ? trafficLight
      : "YELLOW";
  const impact = SEMAPHORE_IMPACT[key] ?? SEMAPHORE_IMPACT.YELLOW;

  return (
    <div className="mc-sem-wrap">
      <div className="mc-sem-row">
        {LIGHT_KEYS.map((k) => (
          <div
            key={k}
            title={k}
            className={`mc-dot mc-dot--${k} ${k === key ? "mc-dot--on" : ""}`}
          />
        ))}
      </div>
      <p className="mc-impact">{impact}</p>
    </div>
  );
}

function ProvinceColumn({ title, list, selectedName, onSelect }) {
  return (
    <aside className="mc-sidebar">
      <p className="mc-sidebar-title">{title}</p>
      <ul className="mc-prov-list">
        {list.map((p) => (
          <li key={p.abbr}>
            <button
              type="button"
              className={`mc-prov-item ${selectedName === p.name ? "mc-prov-item--active" : ""}`}
              onClick={() => onSelect(p)}
            >
              <span className="mc-flag-ring">{p.abbr}</span>
              <span className="mc-prov-label">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function DescargoPageWithKey() {
  const { multaId } = useParams();
  return <DescargoPage key={multaId} />;
}

function MultaCheckHome() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProvince, setSelectedProvince] = useState(
    () => PROVINCES.find((p) => p.abbr === "CF") ?? PROVINCES[0]
  );
  const [inputMode, setInputMode] = useState("PATENTE");
  const [country] = useState("AR");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [recovering, setRecovering] = useState(true);
  const [recoveryNotice, setRecoveryNotice] = useState(
    () => location.state?.recoveryNotice ?? ""
  );
  const lastRecoveryFetch = useRef("");
  const [ufLabel] = useState("UF ref. —");

  const resumeFromUrl = searchParams.get("resume")?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;

    const stored = sessionStorage.getItem(STORAGE_RESUME_MULTA)?.trim() ?? "";
    const candidate =
      resumeFromUrl && UUID_RE.test(resumeFromUrl)
        ? resumeFromUrl
        : stored && UUID_RE.test(stored)
          ? stored
          : "";

    if (!candidate) {
      setRecovering(false);
      return () => {
        cancelled = true;
      };
    }

    if (lastRecoveryFetch.current === candidate) {
      setRecovering(false);
      if (resumeFromUrl) setSearchParams({}, { replace: true });
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      setRecovering(true);
      setErr("");
      try {
        const res = await fetchMultaFullState(candidate);
        const row = res?.data;
        if (cancelled) return;

        if (!row?.multaId) {
          sessionStorage.removeItem(STORAGE_RESUME_MULTA);
          lastRecoveryFetch.current = "";
          setSearchParams({}, { replace: true });
          setRecovering(false);
          return;
        }

        if (row.paid === true && row.dischargeAvailable === true) {
          sessionStorage.setItem(STORAGE_RESUME_MULTA, candidate);
          lastRecoveryFetch.current = candidate;
          navigate(`/descargo/${candidate}`, { replace: true });
          return;
        }

        if (row.lifecycleState === "ERROR_STATE") {
          setRecoveryNotice(
            "Este caso requiere una revisión breve. Podés intentar analizar de nuevo en unos minutos."
          );
          sessionStorage.removeItem(STORAGE_RESUME_MULTA);
          lastRecoveryFetch.current = "";
          setSearchParams({}, { replace: true });
          setRecovering(false);
          return;
        }

        setResult({
          multaId: row.multaId,
          trafficLight: row.trafficLight,
          label: row.label ?? "",
        });
        sessionStorage.setItem(STORAGE_RESUME_MULTA, candidate);
        lastRecoveryFetch.current = candidate;
        setSearchParams({}, { replace: true });
      } catch {
        if (!cancelled) {
          setErr(
            "No pudimos restaurar tu último paso. Volvé a analizar desde el formulario."
          );
          sessionStorage.removeItem(STORAGE_RESUME_MULTA);
          lastRecoveryFetch.current = "";
          setSearchParams({}, { replace: true });
        }
      } finally {
        if (!cancelled) setRecovering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeFromUrl, navigate, setSearchParams]);

  const modePrefix = () => {
    switch (inputMode) {
      case "PATENTE":
        return "[Patente] ";
      case "IMAGEN":
        return "[Imagen] ";
      case "PDF":
        return "[PDF] ";
      case "FLOTA":
        return "[Empresas / Flota] ";
      default:
        return "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    lastRecoveryFetch.current = "";
    setBusy(true);
    try {
      const data = await analyzeMulta({
        country,
        type: "transito",
        description: `${modePrefix()}${text.trim()}`.trim(),
      });
      if (data?.success && data.data?.multaId) {
        setResult(data.data);
        sessionStorage.setItem(STORAGE_RESUME_MULTA, data.data.multaId);
      } else {
        setErr(data?.error ?? "El análisis no pudo completarse. Reintentá.");
      }
    } catch {
      setErr(
        "No pudimos contactar al servidor. Verificá tu conexión e intentá de nuevo."
      );
    }
    setBusy(false);
  };

  const pay = async () => {
    if (!result?.multaId) return;
    setPayBusy(true);
    setErr("");
    try {
      const url = await createDischargeCheckout(result.multaId);
      if (url) window.location.href = url;
      else setErr("El checkout no pudo iniciarse. Probá de nuevo en un momento.");
    } catch {
      setErr(
        "El pago no está disponible por unos segundos. Esperá y volvé a intentar."
      );
    }
    setPayBusy(false);
  };

  const legalBody = (
    <>
      <strong>Ley Nacional de Tránsito 24.449 — Marco aplicable.</strong> La presente
      plataforma orienta la evaluación preventiva de su situación conforme el orden
      jurídico que regula la circulación en Argentina y las competencias provinciales
      concordantes.
      <br />
      <br />
      <strong>Fundamento constitucional (extracto interpretativo).</strong> La
      Constitución Nacional garantiza el debido proceso, la defensa en juicio y la
      igualdad ante la ley (arts. 18 y 16 de la CN). Toda actuación estatal en materia
      de fiscalización vial debe observar principios de razonabilidad, suficiente
      motivación y acceso a la defensa, sin perjuicio de los recursos administrativos y
      judiciales que correspondan según jurisdicción y tipo de infracción.
      <br />
      <br />
      MultaCheck no sustituye asesoramiento legal personalizado ni un expediente
      administrativo; sintetiza información útil para una decisión informada,
      respetando la autonomía del usuario y el marco normativo vigente.
    </>
  );

  if (recovering) {
    return (
      <>
        <div className="mc-bg-fixed" aria-hidden />
        <div className="mc-app">
          <ProvinceColumn
            title="Provincias Argentina · I"
            list={PROV_LEFT}
            selectedName={selectedProvince.name}
            onSelect={setSelectedProvince}
          />
          <main className="mc-main">
            <div className="mc-glass mc-loading-card">
              <p className="mc-step-tag">1 · {FUNNEL_STEP.diagnosis}</p>
              <p className="mc-loading-title">Restaurando tu caso…</p>
            </div>
          </main>
          <ProvinceColumn
            title="Provincias Argentina · II"
            list={PROV_RIGHT}
            selectedName={selectedProvince.name}
            onSelect={setSelectedProvince}
          />
        </div>
        <footer className="mc-footer-fixed">
          <div className="mc-footer-inner">
            <div className="mc-footer-block">
              <span className="mc-sys-dot" aria-hidden />
              <span>Sistema: restaurando sesión</span>
            </div>
            <span className="mc-muted">
              Jurisdicción: <strong>{selectedProvince.name}</strong>
            </span>
            <span className="mc-muted">{ufLabel}</span>
            <span className="mc-muted">
              Contacto: soporte@multacheck.app · v{APP_VERSION}
            </span>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      <div className="mc-bg-fixed" aria-hidden />
      <div className="mc-app">
        <ProvinceColumn
          title="Provincias Argentina · I"
          list={PROV_LEFT}
          selectedName={selectedProvince.name}
          onSelect={setSelectedProvince}
        />

        <main className="mc-main">
          <div className="mc-glass">
            <h1 className="mc-brand">MultaCheck</h1>
            <p className="mc-law-ref">
              Ley Nacional de Tránsito Nº 24.449 · ordenamiento y seguridad vial
            </p>
            <div className="mc-legal">{legalBody}</div>
            <p className="mc-slogan">DEFENSA CLARA, DECISIÓN SEGURA</p>

            {recoveryNotice ? (
              <div className="mc-recovery-banner">{recoveryNotice}</div>
            ) : null}

            {!result ? (
              <>
                <p className="mc-step-tag">1 · {FUNNEL_STEP.diagnosis}</p>

                <div className="mc-ingreso-grid">
                  {[
                    ["PATENTE", "Patente"],
                    ["IMAGEN", "Imagen"],
                    ["PDF", "PDF"],
                    ["FLOTA", "Empresas‑Flota"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`mc-mode-btn ${inputMode === id ? "mc-mode-btn--active" : ""}`}
                      onClick={() => setInputMode(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit}>
                  <label className="mc-form-label" htmlFor="mc-obs">
                    Observaciones · texto libre (multa, motivo, ubicación)
                  </label>
                  <textarea
                    id="mc-obs"
                    className="mc-textarea"
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Describí la infracción, ubicación, fecha u otros datos relevantes."
                  />
                  {err ? <p className="mc-err">{err}</p> : null}
                  <div className="mc-analyze-wrap">
                    <button
                      type="submit"
                      disabled={busy}
                      className="mc-analyze-btn"
                    >
                      {busy ? "Analizando…" : "Analizar multa"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="mc-step-tag">2 · {FUNNEL_STEP.decision}</p>
                <Semaphore trafficLight={result.trafficLight} />

                <h2 className="mc-report-title">{REPORT_TITLE}</h2>
                <p className="mc-report-sub">{REPORT_SUBTITLE}</p>
                <ul className="mc-report-list">
                  {REPORT_VALUE_BULLETS.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                <p className="mc-report-sub">
                  Evaluamos la misma narración enviada en el diagnóstico. El informe
                  escrito completo se habilita en la siguiente pantalla tras confirmar
                  el pago seguro.
                </p>

                <button
                  type="button"
                  className="mc-pay-btn"
                  onClick={pay}
                  disabled={payBusy}
                >
                  {payBusy ? "Abriendo pago seguro…" : "Pagar de forma segura"}
                </button>
                {err ? <p className="mc-err">{err}</p> : null}
                <button
                  type="button"
                  className="mc-link-btn"
                  onClick={() => {
                    setResult(null);
                    setErr("");
                    lastRecoveryFetch.current = "";
                    sessionStorage.removeItem(STORAGE_RESUME_MULTA);
                  }}
                >
                  Volver al ingreso
                </button>
              </>
            )}

            {!result ? (
              <div className="mc-logout-row">
                <button
                  type="button"
                  className="mc-link-btn"
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </main>

        <ProvinceColumn
          title="Provincias Argentina · II"
          list={PROV_RIGHT}
          selectedName={selectedProvince.name}
          onSelect={setSelectedProvince}
        />
      </div>

      <footer className="mc-footer-fixed">
        <div className="mc-footer-inner">
          <div className="mc-footer-block">
            <span className="mc-sys-dot" aria-hidden />
            <span>Sistema operativo · canal seguro</span>
          </div>
          <span className="mc-muted">
            Jurisdicción seleccionada: <strong>{selectedProvince.name}</strong>
          </span>
          <span className="mc-muted">{ufLabel}</span>
          <span className="mc-muted">
            Contacto: soporte@multacheck.app · MultaCheck v{APP_VERSION}
          </span>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/descargo/:multaId"
        element={
          <ProtectedRoute>
            <DescargoPageWithKey />
          </ProtectedRoute>
        }
      />
      <Route path="/descargo" element={<Navigate to="/" replace />} />
      <Route
        path="/multa/:multaId"
        element={
          <ProtectedRoute>
            <MultaResumePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MultaCheckHome />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
