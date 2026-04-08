"use client";
import React, { useState, useEffect } from 'react';
import { Scale, Loader2, Search, ArrowRight, ClipboardCheck } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [logs, setLogs] = useState(["[SISTEMA]: Monitor de auditoría en línea."]); 

  const handleStart = () => {
    if (!patente) return alert("Ingresá patente");
    setLogs(prev => [...prev, `[AUDITORÍA]: Solicitud para ${patente.toUpperCase()}`]);
    setStep('evaluating');
    setTimeout(() => {
        setLogs(prev => [...prev, "[ÉXITO]: Registro detectado. Analizando inconsistencias..."]);
        setStep('found');
    }, 2500);
  };

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <nav style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900', fontStyle: 'italic', fontSize: '24px' }}>
          <Scale color="#3b82f6" /> MULTACHECK
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', border: '1px solid #1e293b', padding: '5px 15px', borderRadius: '20px' }}>
          MONITOR NACIONAL ACTIVO
        </div>
      </nav>

      {/* CONTENIDO */}
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        {step === 'input' && (
          <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', marginBottom: '20px' }}>Evaluación Experta.</h1>
            <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Detección técnica de vicios de forma en actas.</p>
            <input 
              style={{ width: '100%', padding: '25px', borderRadius: '20px', border: '2px solid #1e293b', backgroundColor: '#0f172a', color: 'white', fontSize: '32px', textAlign: 'center', marginBottom: '20px', outline: 'none' }}
              placeholder="PATENTE"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
            />
            <button 
              onClick={handleStart}
              style={{ width: '100%', padding: '20px', borderRadius: '20px', backgroundColor: '#2563eb', color: 'white', fontWeight: '900', fontSize: '20px', cursor: 'pointer', border: 'none' }}
            >
              AUDITAR VEHÍCULO
            </button>
          </div>
        )}

        {step === 'evaluating' && (
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={60} style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontStyle: 'italic', fontWeight: 'bold' }}>SINCRONIZANDO REGISTROS...</h2>
          </div>
        )}

        {step === 'found' && (
          <div style={{ backgroundColor: '#0f172a', padding: '40px', borderRadius: '30px', border: '1px solid #1e293b', textAlign: 'center' }}>
            <h2 style={{ fontWeight: '900', marginBottom: '20px' }}>REGISTRO DETECTADO</h2>
            <div style={{ fontSize: '50px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '30px' }}>{patente.toUpperCase()}</div>
            <button onClick={() => setStep('input')} style={{ padding: '15px 30px', backgroundColor: 'white', color: 'black', borderRadius: '15px', fontWeight: 'bold' }}>REINICIAR AUDITORÍA</button>
          </div>
        )}
      </main>

      {/* CUADERNO DE BITÁCORA (Monitor de funciones) */}
      <footer style={{ backgroundColor: '#000', padding: '20px', borderTop: '2px solid #1e40af' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '10px' }}>
             Cuaderno de Bitácora / Monitor de Funciones
          </p>
          <div style={{ height: '80px', overflowY: 'auto', backgroundColor: '#020617', padding: '10px', borderRadius: '10px', fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
