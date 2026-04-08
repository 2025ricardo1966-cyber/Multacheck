"use client";
import React, { useState } from 'react';
import { Scale, Loader2, Users, ChevronRight, CheckCircle, MapPin, Globe, ShieldCheck } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  
  // Listado de provincias para la portada
  const provincias = [
    "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", 
    "Salta", "Tucumán", "Neuquén", "Misiones", "Entre Ríos", "San Juan"
  ];

  const multasEncontradas = [
    { id: 1, fecha: "10/01/2026", lugar: "CABA", monto: "$32.400", falta: "Exceso Velocidad (Radar Fijo)" },
    { id: 2, fecha: "22/01/2026", lugar: "La Matanza, PBA", monto: "$85.400", falta: "Falta de VTV vigente" },
    { id: 3, fecha: "05/02/2026", lugar: "Escobar, PBA", monto: "$42.100", falta: "Luces Bajas Reglamentarias" },
    { id: 4, fecha: "15/02/2026", lugar: "Córdoba Capital", monto: "$91.200", falta: "Semáforo en Rojo (Cámara)" },
    { id: 5, fecha: "02/03/2026", lugar: "Rosario, Santa Fe", monto: "$28.500", falta: "Mal Estacionamiento" },
    { id: 6, fecha: "12/03/2026", lugar: "Salta City", monto: "$63.200", falta: "Exceso de Velocidad (Ruta 68)" },
    { id: 7, fecha: "20/03/2026", lugar: "Mendoza City", monto: "$55.000", falta: "Giro prohibido en Avenida" }
  ];

  const handleSearch = () => {
    if (patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    setStep('evaluating');
    setTimeout(() => setStep('results'), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px' }}>
          <Scale size={20} color="#3b82f6" /> MULTACHECK
        </div>
        <div style={{ fontSize: '11px', color: '#60a5fa', border: '1px solid #1d4ed8', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={12} /> 1.240 USUARIOS EN LÍNEA
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '50px', fontSize: '12px', color: '#94a3b8', marginBottom: '20px', border: '1px solid #334155' }}>
              <Globe size={14} className="text-blue-400" /> COBERTURA NACIONAL ACTIVA
            </div>
            
            <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic', lineHeight: '1' }}>Auditoría Federal</h1>
            <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '16px' }}>Análisis técnico de fotomultas y actas presenciales.</p>
            
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '25px', border: '1px solid #1e293b', marginBottom: '40px' }}>
              <input 
                style={{ width: '100%', padding: '20px', backgroundColor: '#000', border: '2px solid #1e293b', borderRadius: '15px', color: 'white', fontSize: '28px', textAlign: 'center', marginBottom: '15px', outline: 'none', textTransform: 'uppercase', fontWeight: 'bold' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button onClick={handleSearch} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' }}>
                AUDITAR VEHÍCULO <ChevronRight size={20} />
              </button>
            </div>

            {/* Sección de Provincias Visibles */}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center' }}>JURISDICCIONES VINCULADAS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {provincias.map((prov) => (
                  <span key={prov} style={{ padding: '6px 12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={10} color="#3b82f6" /> {prov}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'evaluating' && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 25px', color: '#3b82f6' }} />
            <p style={{ fontSize: '12px', letterSpacing: '3px', color: '#60a5fa', fontWeight: 'bold' }}>SINCRONIZANDO CON REGISTROS PROVINCIALES...</p>
          </div>
        )}

        {step === 'results' && (
          <div>
            <div style={{ marginBottom: '25px', borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900' }}>DOMINIO: {patente.toUpperCase()}</h2>
              <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>{multasEncontradas.length} infracciones detectadas con fallos de procedimiento.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>{m.falta}</div>
                      <div style={{ fontSize: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <MapPin size={12} /> {m.lugar} • {m.fecha}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '17px', color: '#f1f5f9' }}>{m.monto}</div>
                  </div>
                  <button style={{ width: '100%', padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> ANALIZAR VIABILIDAD DE DEFENSA
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={() => setStep('input')} style={{ marginTop: '35px', background: 'none', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold', textDecoration: 'underline' }}>NUEVA AUDITORÍA DE DOMINIO</button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '50px 20px', color: '#1e293b', fontSize: '10px', letterSpacing: '5px' }}>
        MULTACHECK ARGENTINA • 2026
      </footer>

      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
