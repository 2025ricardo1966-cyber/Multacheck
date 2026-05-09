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
import { CaseState, canStartCheckout, dischargeAvailableFromCaseState } from "./constants/caseState.js";
import {
  friendlyAnalyzeResponse,
  friendlyApiError,
} from "./utils/apiErrors.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
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

/** Escudo en `public/escudos/` — el archivo se llama igual que `PROVINCES[].name` + `.png`. */
function escudoSrc(provinceName) {
  const file = `${provinceName}.png`;
  return `/escudos/${encodeURIComponent(file)}`;
}

function onEscudoError(e) {
  const el = e.currentTarget;
  el.onerror = null;
  el.classList.add("mc-flag-img--broken");
}

const LIGHT_KEYS = ["RED", "YELLOW", "GREEN"];
const AR_DOMAIN_PATTERNS = [/^[A-Z]{3}\d{3}$/, /^[A-Z]{2}\d{3}[A-Z]{2}$/];

function normalizeDomainToken(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function isValidDomain(token) {
  return AR_DOMAIN_PATTERNS.some((pattern) => pattern.test(token));
}

function extractDomainsFromText(source) {
  if (!source) return [];
  const seen = new Set();
  const items = source
    .split(/[\s,;|]+/g)
    .map((token) => normalizeDomainToken(token))
    .filter((token) => token && isValidDomain(token));
  for (const token of items) seen.add(token);
  return Array.from(seen);
}

function buildCaseSignalSummary(caseStateDraft) {
  const summary = [];
  if (caseStateDraft.notificationAnswer) {
    summary.push(`Notificación: ${caseStateDraft.notificationAnswer}`);
  }
  if (caseStateDraft.originAnswer) {
    summary.push(`Origen: ${caseStateDraft.originAnswer}`);
  }
  if (caseStateDraft.bulkDomains?.length) {
    summary.push(`Dominios detectados: ${caseStateDraft.bulkDomains.join(", ")}`);
  }
  if (caseStateDraft.imageUpload?.fileName) {
    summary.push(`Imagen adjunta: ${caseStateDraft.imageUpload.fileName}`);
  }
  if (caseStateDraft.pdfUpload?.fileName) {
    summary.push(`PDF adjunto: ${caseStateDraft.pdfUpload.fileName}`);
  }
  return summary.length ? `\n[CaseSignals] ${summary.join(" | ")}` : "";
}

function ShieldIcon() {
  return (
    <svg
      className="mc-shield-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

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
              <span className="mc-flag-ring">
                <img
                  className="mc-flag-img"
                  src={escudoSrc(p.name)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={onEscudoError}
                />
                <span className="mc-flag-abbr">{p.abbr}</span>
              </span>
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProvince, setSelectedProvince] = useState(
    () => PROVINCES.find((p) => p.abbr === "CF") ?? PROVINCES[0]
  );
  const [inputMode, setInputMode] = useState("PATENTE");
  const [country] = useState("AR");
  const [text, setText] = useState("");
  const [optionalObservations, setOptionalObservations] = useState("");
  const [showOptionalObservations, setShowOptionalObservations] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [showPostLoadQuestions, setShowPostLoadQuestions] = useState(false);
  const [bulkInputType, setBulkInputType] = useState("MANUAL");
  const [bulkRawText, setBulkRawText] = useState("");
  const [bulkSourceLabel, setBulkSourceLabel] = useState("");
  const [bulkHint, setBulkHint] = useState("");
  const [caseStateDraft, setCaseStateDraft] = useState({
    notificationAnswer: "No estoy seguro",
    originAnswer: "No lo sé",
    bulkDomains: [],
    imageUpload: null,
    pdfUpload: null,
  });
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
        const row = await fetchMultaFullState(candidate);
        if (cancelled) return;

        if (!row?.multaId && !row?.id) {
          sessionStorage.removeItem(STORAGE_RESUME_MULTA);
          lastRecoveryFetch.current = "";
          setSearchParams({}, { replace: true });
          setRecovering(false);
          return;
        }

        const cs = row.caseState;
        const dischargeOk = dischargeAvailableFromCaseState(cs);

        if (dischargeOk) {
          sessionStorage.setItem(STORAGE_RESUME_MULTA, candidate);
          lastRecoveryFetch.current = candidate;
          navigate(`/descargo/${candidate}`, { replace: true });
          return;
        }

        if (cs === CaseState.FAILED) {
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
          multaId: row.multaId ?? row.id,
          caseState: row.caseState,
          trafficLight: row.trafficLight,
          label: row.label ?? "",
        });
        sessionStorage.setItem(STORAGE_RESUME_MULTA, candidate);
        lastRecoveryFetch.current = candidate;
        setSearchParams({}, { replace: true });
      } catch (ex) {
        if (!cancelled) {
          setErr(friendlyApiError(ex));
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

  const updateCaseStateDraft = (patch) => {
    setCaseStateDraft((prev) => ({ ...prev, ...patch }));
  };

  useEffect(() => {
    return () => {
      if (caseStateDraft.imageUpload?.previewUrl) {
        URL.revokeObjectURL(caseStateDraft.imageUpload.previewUrl);
      }
    };
  }, [caseStateDraft.imageUpload?.previewUrl]);

  const parseAndStoreDomains = (source, sourceLabel) => {
    const parsed = extractDomainsFromText(source);
    updateCaseStateDraft({ bulkDomains: parsed });
    setBulkSourceLabel(sourceLabel);
    setBulkHint(
      parsed.length
        ? `${parsed.length} dominio(s) reconocidos en texto para esta revisión inicial.`
        : "Escribí o pegá patentes/dominios válidos para armar el listado."
    );
  };

  const handleBulkFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (extension !== "csv" && extension !== "xlsx") {
      setBulkHint("Formato no disponible aquí. Probá .csv, .xlsx o pegado manual.");
      event.target.value = "";
      return;
    }

    try {
      const plainText = await file.text();
      parseAndStoreDomains(plainText, `Archivo: ${file.name}`);
      if (extension === "xlsx") {
        setBulkHint((prev) =>
          prev
            ? `${prev} Para listados más claros suele funcionar mejor CSV o pegado manual.`
            : "Para listados más claros suele funcionar mejor CSV o pegado manual."
        );
      }
    } catch {
      setBulkHint("No pudimos leer el archivo tal cual. Probá exportar a .csv o usar pegado manual.");
    } finally {
      event.target.value = "";
    }
  };

  const onModeChange = (id) => {
    setInputMode(id);
    if (id === "FLOTA") {
      setShowPostLoadQuestions(true);
      if (!caseStateDraft.originAnswer) {
        updateCaseStateDraft({ originAnswer: "No lo sé" });
      }
    }
  };

  const saveImageInCaseState = (file) => {
    if (!file) return;
    const mime = file.type.toLowerCase();
    const accepted = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
    if (!accepted.includes(mime)) {
      setErr("Formato de imagen no soportado. Use JPG, JPEG, PNG o WEBP.");
      return;
    }
    if (caseStateDraft.imageUpload?.previewUrl) {
      URL.revokeObjectURL(caseStateDraft.imageUpload.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    updateCaseStateDraft({
      imageUpload: {
        file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        previewUrl,
        status:
          "Imagen registrada como apoyo al texto que completes más abajo.",
      },
    });
    setShowPostLoadQuestions(true);
    setErr("");
  };

  const clearImageInCaseState = () => {
    if (caseStateDraft.imageUpload?.previewUrl) {
      URL.revokeObjectURL(caseStateDraft.imageUpload.previewUrl);
    }
    updateCaseStateDraft({ imageUpload: null });
  };

  const savePdfInCaseState = (file) => {
    if (!file) return;
    const validPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!validPdf) {
      setErr("Solo se admite formato PDF para este módulo.");
      return;
    }
    updateCaseStateDraft({
      pdfUpload: {
        file,
        fileName: file.name,
        fileSize: file.size,
        status:
          "PDF registrado como contexto junto a tu descripción en texto.",
      },
    });
    setShowPostLoadQuestions(true);
    setErr("");
  };

  const clearPdfInCaseState = () => {
    updateCaseStateDraft({ pdfUpload: null });
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
        description: `${modePrefix()}${text.trim()} ${optionalObservations.trim()}${buildCaseSignalSummary(caseStateDraft)}`.trim(),
      });
      if (data?.success && data.data?.multaId) {
        setResult({
          ...data.data,
          caseState: data.data.caseState ?? CaseState.ANALYZED,
          anonymousPreview: false,
        });
        sessionStorage.setItem(STORAGE_RESUME_MULTA, data.data.multaId);
      } else if (data?.success && data.data?.anonymousPreview) {
        setResult({
          trafficLight: data.data.trafficLight,
          label: data.data.label ?? "",
          caseState: null,
          anonymousPreview: true,
        });
      } else {
        setErr(friendlyAnalyzeResponse(data));
      }
    } catch (ex) {
      setErr(friendlyApiError(ex));
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
    } catch (ex) {
      setErr(friendlyApiError(ex));
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
              <header className="mc-hero mc-hero--compact">
                <div className="mc-brand-row">
                  <ShieldIcon />
                  <h1 className="mc-brand">MultaCheck</h1>
                </div>
              </header>
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
            <div className="mc-auth-corner">
              {user ? (
                <>
                  <button
                    type="button"
                    className="mc-auth-btn"
                    onClick={() => navigate("/dashboard", { replace: true })}
                  >
                    Mi cuenta
                  </button>
                  <button
                    type="button"
                    className="mc-auth-btn"
                    onClick={() => {
                      logout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="mc-auth-btn"
                    onClick={() => navigate("/login")}
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    className="mc-auth-btn"
                    onClick={() => navigate("/register")}
                  >
                    Crear cuenta
                  </button>
                </>
              )}
            </div>
            <header className="mc-hero">
              <div className="mc-brand-row">
                <ShieldIcon />
                <h1 className="mc-brand">MultaCheck</h1>
              </div>
              <p className="mc-law-ref">
                LEY NACIONAL DE TRÁNSITO Nº 24.449 · ordenamiento y seguridad vial
              </p>
              <div className="mc-legal">{legalBody}</div>
              <p className="mc-slogan">DEFENSA CLARA, DECISIÓN SEGURA</p>
            </header>

            {recoveryNotice ? (
              <div className="mc-recovery-banner">{recoveryNotice}</div>
            ) : null}

            {!result ? (
              <>
                <p className="mc-step-tag">1 · {FUNNEL_STEP.diagnosis}</p>

                <h3 className="mc-module-label">Módulo de ingreso de datos</h3>
                <div className="mc-ingreso-grid">
                  {[
                    ["PATENTE", "PATENTE"],
                    ["IMAGEN", "IMAGEN"],
                    ["PDF", "PDF"],
                    ["FLOTA", "EMPRESAS/FLOTA"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`mc-mode-btn ${inputMode === id ? "mc-mode-btn--active" : ""}`}
                      onClick={() => onModeChange(id)}
                      disabled={busy}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} aria-busy={busy}>
                  <fieldset className="mc-analyze-fieldset" disabled={busy}>
                  {inputMode === "IMAGEN" ? (
                    <div className="mc-upload-panel">
                      <p className="mc-bulk-title">
                        Podés agregar imágenes o capturas para complementar el análisis.
                      </p>
                      <p className="mc-bulk-meta">
                        La orientación preliminar usa el texto que indiques (patente y detalle)
                        junto con esta referencia visual.
                      </p>
                      <div
                        className="mc-dropzone"
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const file = event.dataTransfer.files?.[0];
                          saveImageInCaseState(file);
                        }}
                      >
                        <p className="mc-dropzone-text">
                          Arrastrá una imagen aquí o elegila desde tu equipo
                        </p>
                        <label className="mc-upload-label" htmlFor="mc-image-file">
                          <input
                            id="mc-image-file"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              saveImageInCaseState(file);
                              event.target.value = "";
                            }}
                          />
                          <span>Subir imagen</span>
                        </label>
                      </div>

                      {caseStateDraft.imageUpload ? (
                        <div className="mc-upload-preview">
                          <img
                            src={caseStateDraft.imageUpload.previewUrl}
                            alt="Vista previa de carga"
                            className="mc-image-preview"
                          />
                          <p className="mc-bulk-meta">{caseStateDraft.imageUpload.status}</p>
                          <button
                            type="button"
                            className="mc-link-btn mc-link-btn--inline"
                            onClick={clearImageInCaseState}
                          >
                            Reemplazar imagen
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {inputMode === "PDF" ? (
                    <div className="mc-upload-panel">
                      <p className="mc-bulk-title">
                        Adjuntá documentación relacionada a la infracción.
                      </p>
                      <p className="mc-bulk-meta">
                        Ayuda a contextualizar tu caso; completá también patente y texto para la
                        orientación inicial.
                      </p>
                      <div
                        className="mc-dropzone"
                        onDragOver={(event) => {
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const file = event.dataTransfer.files?.[0];
                          savePdfInCaseState(file);
                        }}
                      >
                        <p className="mc-dropzone-text">
                          Arrastrá un PDF aquí o elegilo desde tu equipo
                        </p>
                        <label className="mc-upload-label" htmlFor="mc-pdf-file">
                          <input
                            id="mc-pdf-file"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              savePdfInCaseState(file);
                              event.target.value = "";
                            }}
                          />
                          <span>Subir PDF</span>
                        </label>
                      </div>

                      {caseStateDraft.pdfUpload ? (
                        <div className="mc-upload-preview">
                          <p className="mc-bulk-meta">{caseStateDraft.pdfUpload.status}</p>
                          <p className="mc-bulk-meta">
                            Archivo: {caseStateDraft.pdfUpload.fileName}
                          </p>
                          <p className="mc-bulk-meta">
                            Tamaño: {(caseStateDraft.pdfUpload.fileSize / 1024).toFixed(1)} KB
                          </p>
                          <div className="mc-inline-actions">
                            <button
                              type="button"
                              className="mc-link-btn mc-link-btn--inline"
                              onClick={clearPdfInCaseState}
                            >
                              Eliminar archivo
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {inputMode === "FLOTA" ? (
                    <div className="mc-bulk-panel">
                      <p className="mc-bulk-title">
                        Carga masiva de dominios para revisión inicial.
                      </p>
                      <p className="mc-bulk-meta">
                        Detectamos patentes y dominios en texto exportado; CSV suele ser el formato
                        más práctico para listados largos.
                      </p>
                      <div className="mc-bulk-switch">
                        {[
                          ["XLSX", "Archivo .xlsx o .csv"],
                          ["CSV", "Archivo .csv"],
                          ["MANUAL", "Pegado de lista"],
                        ].map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            className={`mc-bulk-btn ${bulkInputType === id ? "mc-bulk-btn--active" : ""}`}
                            onClick={() => setBulkInputType(id)}
                            disabled={busy}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {bulkInputType === "MANUAL" ? (
                        <textarea
                          className="mc-textarea mc-textarea--bulk"
                          value={bulkRawText}
                          onChange={(event) => {
                            const value = event.target.value;
                            setBulkRawText(value);
                            parseAndStoreDomains(value, "Pegado manual");
                            setShowPostLoadQuestions(value.trim().length > 0);
                          }}
                          placeholder={"Ejemplo:\nAA123BB\nAB123CD\nAAA123"}
                        />
                      ) : (
                        <label className="mc-upload-label" htmlFor="mc-bulk-file">
                          <input
                            id="mc-bulk-file"
                            type="file"
                            accept={bulkInputType === "CSV" ? ".csv" : ".xlsx,.csv"}
                            onChange={handleBulkFile}
                          />
                          <span>
                            {bulkInputType === "CSV"
                              ? "Elegir archivo .csv"
                              : "Elegir archivo .xlsx o .csv"}
                          </span>
                        </label>
                      )}

                      {bulkSourceLabel ? (
                        <p className="mc-bulk-meta">{bulkSourceLabel}</p>
                      ) : null}
                      {bulkHint ? <p className="mc-bulk-meta">{bulkHint}</p> : null}
                      {caseStateDraft.bulkDomains.length ? (
                        <div className="mc-bulk-preview">
                          <p className="mc-bulk-preview-title">
                            Dominios reconocidos (borrador)
                          </p>
                          <p className="mc-bulk-preview-list">
                            {caseStateDraft.bulkDomains.slice(0, 20).join(" · ")}
                            {caseStateDraft.bulkDomains.length > 20 ? " · …" : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <label className="mc-form-label" htmlFor="mc-main-input">
                    Patente o dominio
                  </label>
                  <input
                    id="mc-main-input"
                    className="mc-input"
                    required
                    value={text}
                    onChange={(e) => {
                      const value = e.target.value;
                      setText(value);
                      if (inputMode === "PATENTE") {
                        setShowPostLoadQuestions(value.trim().length > 0);
                        const parsedDomains = extractDomainsFromText(value);
                        if (parsedDomains.length) {
                          updateCaseStateDraft({ bulkDomains: parsedDomains });
                        }
                      }
                    }}
                    placeholder="Ejemplo: AB123CD o AAA123"
                  />
                  <button
                    type="button"
                    className="mc-link-btn mc-link-btn--inline"
                    onClick={() => setShowOptionalObservations((prev) => !prev)}
                    disabled={busy}
                  >
                    {showOptionalObservations
                      ? "Ocultar observaciones"
                      : "Agregar observaciones"}
                  </button>
                  {showOptionalObservations ? (
                    <textarea
                      id="mc-obs"
                      className="mc-textarea mc-textarea--compact"
                      value={optionalObservations}
                      onChange={(event) => setOptionalObservations(event.target.value)}
                      placeholder="Detalles opcionales: motivo, ubicación, fecha."
                    />
                  ) : null}

                  {showPostLoadQuestions ? (
                    <div className="mc-postload-panel">
                      <p className="mc-postload-title">Datos rápidos para afinar el diagnóstico</p>
                      <div className="mc-question">
                        <p className="mc-question-label">¿Recibió alguna notificación?</p>
                        <div className="mc-option-row">
                          {["Sí", "No", "No estoy seguro"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`mc-option-btn ${caseStateDraft.notificationAnswer === option ? "mc-option-btn--active" : ""}`}
                              onClick={() => updateCaseStateDraft({ notificationAnswer: option })}
                              disabled={busy}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mc-question">
                        <p className="mc-question-label">¿Dónde se originó la multa?</p>
                        <div className="mc-option-row">
                          {["Provincia", "Municipio", "Ruta Nacional", "No lo sé"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`mc-option-btn ${caseStateDraft.originAnswer === option ? "mc-option-btn--active" : ""}`}
                              onClick={() => updateCaseStateDraft({ originAnswer: option })}
                              disabled={busy}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {err ? <p className="mc-err">{err}</p> : null}
                  <div className="mc-analyze-wrap" aria-live="polite">
                    <button
                      type="submit"
                      disabled={busy}
                      className="mc-analyze-btn"
                      aria-busy={busy}
                    >
                      {busy ? "Analizando… podés esperar unos segundos." : "Analizar multa"}
                    </button>
                  </div>
                  </fieldset>
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

                {result?.anonymousPreview ? (
                  <p className="mc-report-sub">
                    Para guardar este caso, abonar el informe y acceder al descargo,
                    iniciá sesión o registrate y volvé a analizar con tu cuenta.
                  </p>
                ) : null}

                <button
                  type="button"
                  className="mc-pay-btn"
                  onClick={pay}
                  aria-busy={payBusy}
                  disabled={
                    payBusy ||
                    result?.anonymousPreview ||
                    !result?.multaId ||
                    !canStartCheckout(result?.caseState)
                  }
                >
                  {payBusy
                    ? "Preparando pago seguro… no cierres esta ventana."
                    : "Pagar de forma segura"}
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

            {!result && user ? (
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
          <span className="mc-footer-legal-note">
            Información orientativa; no reemplaza asesoramiento legal ni expedientes
            administrativos.
          </span>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
      <Route path="/dashboard" element={<MultaCheckHome />} />
      <Route path="/" element={<MultaCheckHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
