"use client";
import React, { useState } from 'react';
import { Scale, Loader2, Search, Users, ChevronRight, CheckCircle, ShieldCheck } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  
  // Lista de ejemplo: El sistema mostrará todas juntas
  const multasEncontradas = [
    { id: 101, fecha: "15/03/2026", zona: "CABA", monto: "$35.000", falta: "Exceso Velocidad" },
    { id: 102, fecha: "02/04/2026", zona: "PBA", monto: "$22.400", falta: "Luz Roja" }
  ];

  const handleSearch = () => {
    if (patente.length < 6) return alert("Ingresá una patente válida");
    setStep('evaluating');
    setTimeout(() => setStep('results'), 2000);
  };

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Navbar con Contador Real */}
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px' }}>
          <Scale size={20} color="#3b82f6" /> MULTACHECK
        </div>
        <div style={{ fontSize: '11px', color: '#60a5fa', border: '1px solid #1d4ed8', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={12} /> 1.240 USUARIOS ACTIVOS
        </div>
      </nav>

      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '50px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic' }}>Auditoría Técnica</h1>
            <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '15px' }}>Análisis legal de actas nacionales bajo Ley 24.449</p>
            
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '25px', border: '1px solid #1e293b' }}>
              <input 
                style={{ width: '100%', padding: '18px', backgroundColor: '#000', border: '2px solid #1e293b', borderRadius: '12px', color: 'white', fontSize: '24px', textAlign: 'center', marginBottom: '15px', outline: 'none' }}
                placeholder="PATENTE"
                value={patente} onChange={(e) => setPatente(e.target.value)}
              />
              <button onClick={handleSearch} style={{ width: '100%', padding: '16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                AUDITAR TODAS LAS FALTAS <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'evaluating' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontSize: '14px', letterSpacing: '2px' }}>CONSOLIDANDO REGISTROS JURISDICCIONALES...</p>
          </div>
        )}

        {step === 'results' && (
          <div>
            <div style={{ marginBottom: '25px', borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900' }}>DOMINIO: {patente.toUpperCase()}</h2>
              <p style={{ color: '#64748b', fontSize: '12px' }}>Se detectaron {multasEncontradas.length} actas con inconsistencias.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{m.falta}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{m.zona} • {m.fecha}</div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{m.monto}</div>
                  </div>
                  <button style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle size={14} /> ANALIZAR ESTA MULTA
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={() => setStep('input')} style={{ marginTop: '25px', background: 'none', border: 'none', color: '#475569', fontSize: '11px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>REALIZAR OTRA BÚSQUEDA</button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '30px', color: '#1e293b', fontSize: '9px', letterSpacing: '4px' }}>
        MULTACHECK • AUDITORÍA ADMINISTRATIVA 2026
      </footer>

      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
