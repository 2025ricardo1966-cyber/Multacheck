"use client";
import React, { useState } from 'react';
import { Scale, Loader2, Users, ChevronRight, CheckCircle, MapPin, Globe, ShieldCheck, Search } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  
  const provincias = [
    "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", 
    "Salta", "Tucumán", "Neuquén", "Misiones", "Entre Ríos", "San Juan", "Chubut"
  ];

  const multasEncontradas = [
    { id: 1, fecha: "10/01/2026", lugar: "CABA", monto: "$32.400", falta: "Exceso Velocidad (Radar Fijo)" },
    { id: 2, fecha: "22/01/2026", lugar: "La Matanza, PBA", monto: "$85.400", falta: "Falta de VTV vigente" },
    { id: 3, fecha: "05/02/2026", lugar: "Escobar, PBA", monto: "$42.100", falta: "Luces Bajas Reglamentarias" },
    { id: 4, fecha: "15/02/2026", lugar: "Córdoba Capital", monto: "$91.200", falta: "Semáforo en Rojo (Cámara)" },
    { id: 5, fecha: "02/03/2026", lugar: "Rosario, Santa Fe", monto: "$28.500", falta: "Mal Estacionamiento" },
    { id: 6, fecha: "12/03/2026", lugar: "Salta (Cabra Corral)", monto: "$63.200", falta: "Exceso de Velocidad (Ruta 68)" },
    { id: 7, fecha: "20/03/2026", lugar: "Mendoza City", monto: "$55.000", falta: "Giro prohibido en Avenida" },
    { id: 10, fecha: "10/04/2026", lugar: "Mar del Plata, PBA", monto: "$77.300", falta: "Exceso Velocidad (Autovía 2)" }
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
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <div style={{ fontSize: '11px', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <Users size={12} /> 1.240 CONSULTAS EN TIEMPO REAL
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '50px', fontSize: '12px', color: '#64748b', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <ShieldCheck size={14} color="#10b981" /> VALIDACIÓN JURISDICCIONAL DISPONIBLE
            </div>
            
            <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic', lineHeight: '1', color: '#0f172a' }}>Análisis Técnico</h1>
            <p style={{ color: '#475569', marginBottom: '35px', fontSize: '16px' }}>Revisión de actas para detectar errores de forma o notificación.</p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
              <input 
                style={{ width: '100%', padding: '20px', backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '15px', color: '#0f172a', fontSize: '28px', textAlign: 'center', marginBottom: '15px', outline: 'none', textTransform: 'uppercase', fontWeight: 'bold' }}
                placeholder="NÚMERO DE PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button onClick={handleSearch} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' }}>
                INICIAR REVISIÓN DE FALTAS <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center' }}>SISTEMA DE VERIFICACIÓN FEDERAL:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {provincias.map((prov) => (
                  <span key={prov} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <MapPin size={10} color="#2563eb" /> {prov}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'evaluating' && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 25px', color: '#2563eb' }} />
            <p style={{ fontSize: '12px', letterSpacing: '3px', color: '#2563eb', fontWeight: 'bold' }}>CONTRASTANDO REGISTROS NACIONALES...</p>
          </div>
        )}

        {step === 'results' && (
          <div>
            <div style={{ marginBottom: '25px', borderLeft: '4px solid #2563eb', paddingLeft: '15px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>REPORTE DOMINIO: {patente.toUpperCase()}</h2>
              <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: 'bold' }}>Se identificaron {multasEncontradas.length} actas con potenciales vicios de forma.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{m.falta}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <MapPin size={12} color="#3b82f6" /> {m.lugar} • {m.fecha}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#0f172a' }}>{m.monto}</div>
                  </div>
                  <button style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Search size={16} /> VERIFICAR ESTADO LEGAL
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={() => setStep('input')} style={{ marginTop: '35px', background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold', textDecoration: 'underline' }}>CONSULTAR OTRA PATENTE</button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', fontSize: '10px', letterSpacing: '5px' }}>
        SISTEMA DE ANÁLISIS ADMINISTRATIVO • ARGENTINA 2026
      </footer>

      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
