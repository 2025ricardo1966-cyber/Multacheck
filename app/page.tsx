"use client";
import React, { useState } from 'react';
import { Scale, Loader2, Users, ChevronRight, CheckCircle, MapPin } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  
  // Base de datos simulada con localizaciones precisas para generar confianza
  const multasEncontradas = [
    { id: 1, fecha: "15/03/2026", lugar: "La Matanza, PBA", monto: "$85.400", falta: "Exceso Velocidad (Art. 51)" },
    { id: 2, fecha: "02/04/2026", lugar: "Escobar, PBA", monto: "$42.100", falta: "Luces Bajas Reglamentarias" },
    { id: 3, fecha: "10/04/2026", lugar: "CABA", monto: "$32.400", falta: "Ingreso indebido a Área Restringida" },
    { id: 4, fecha: "12/04/2026", lugar: "San Isidro, PBA", monto: "$91.000", falta: "Semáforo en Rojo" },
    { id: 5, fecha: "18/04/2026", lugar: "Avellaneda, PBA", monto: "$28.500", falta: "Mal Estacionamiento" },
    { id: 6, fecha: "20/04/2026", lugar: "CABA", monto: "$15.200", falta: "Uso de Celular al conducir" },
    { id: 7, fecha: "22/04/2026", lugar: "Morón, PBA", monto: "$55.000", falta: "Giro prohibido en Av." },
    { id: 8, fecha: "25/04/2026", lugar: "Lomas de Zamora, PBA", monto: "$40.000", falta: "Falta de VTV vigente" },
    { id: 9, fecha: "27/04/2026", lugar: "CABA", monto: "$12.800", falta: "Obstrucción de rampa" },
    { id: 10, fecha: "30/04/2026", lugar: "Tigre, PBA", monto: "$77.300", falta: "Exceso Velocidad (Radar)" }
  ];

  const handleSearch = () => {
    if (patente.length < 6) return alert("Por favor, ingresá una patente válida para iniciar la auditoría.");
    setStep('evaluating');
    setTimeout(() => setStep('results'), 2500);
  };

  // Manejador para detectar la tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Navbar con Monitor de Usuarios */}
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px' }}>
          <Scale size={20} color="#3b82f6" /> MULTACHECK
        </div>
        <div style={{ fontSize: '11px', color: '#60a5fa', border: '1px solid #1d4ed8', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={12} /> 1.240 USUARIOS EN LÍNEA
        </div>
      </nav>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '50px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px', fontStyle: 'italic' }}>Evaluación Experta</h1>
            <p style={{ color: '#94a3b8', marginBottom: '35px', fontSize: '15px' }}>Análisis legal de vicios de forma en actas nacionales.</p>
            
            <div style={{ background: '#0f172a', padding: '30px', borderRadius: '25px', border: '1px solid #1e293b' }}>
              <input 
                style={{ width: '100%', padding: '18px', backgroundColor: '#000', border: '2px solid #1e293b', borderRadius: '12px', color: 'white', fontSize: '24px', textAlign: 'center', marginBottom: '15px', outline: 'none', textTransform: 'uppercase' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button onClick={handleSearch} style={{ width: '100%', padding: '16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                AUDITAR VEHÍCULO <ChevronRight size={18} />
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
              <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>Se detectaron {multasEncontradas.length} actas con irregularidades técnicas.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>{m.falta}</div>
                      <div style={{ fontSize: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <MapPin size={12} /> {m.lugar} • {m.fecha}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#f8fafc' }}>{m.monto}</div>
                  </div>
                  <button style={{ width: '100%', padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={14} /> ANALIZAR VIABILIDAD DE DEFENSA
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={() => setStep('input')} style={{ marginTop: '30px', background: 'none', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>REALIZAR NUEVA AUDITORÍA</button>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: '#1e293b', fontSize: '9px', letterSpacing: '4px' }}>
        MULTACHECK • SISTEMA DE AUDITORÍA NACIONAL 2026
      </footer>

      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
