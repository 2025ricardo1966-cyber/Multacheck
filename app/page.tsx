"use client";
import React, { useState } from 'react';
import { Scale, MapPin, Truck, Briefcase, FileSpreadsheet, Bus, Car, Search, CheckCircle2 } from 'lucide-react';

export default function MultaCheck() {
  const [patente, setPatente] = useState('');
  const [step, setStep] = useState('input');
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);

  const provincias = [
    { n: "CABA", b: "🇦🇷" }, { n: "Buenos Aires", b: "🏛️" }, { n: "Córdoba", b: "🌾" },
    { n: "Santa Fe", b: "🏞️" }, { n: "Mendoza", b: "🍇" }, { n: "Salta", b: "⛰️" },
    { n: "Tucumán", b: "🚜" }, { n: "Neuquén", b: "❄️" }, { n: "San Luis", b: "🏔️" }
  ];

  const manejarBusqueda = () => {
    if (patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    // Aquí el sistema ya sabe si tiene una provincia fija o busca en todo el país
    setStep('results');
  };

  const handlePatenteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') manejarBusqueda();
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button style={{ fontSize: '12px', color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          PANEL PROFESIONAL LOGIN
        </button>
      </nav>

      <main style={{ maxWidth: '850px', margin: '0 auto', padding: '20px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            
            {/* Fundamentación Legal */}
            <div style={{ textAlign: 'left', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px', marginBottom: '35px', color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
              <strong>SEGURIDAD JURÍDICA FEDERAL</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Conforme a la <strong>Constitución Nacional Argentina, Art. 18</strong> y la <strong>Ley 24.449, Art. 69</strong>, garantizamos el derecho a la revisión técnica de toda supuesta infracción antes de su ratificación.
              </p>
            </div>

            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '25px' }}>Auditoría administrativa para el análisis de fotomultas.</p>
            
            {/* Jurisdicciones como Botones de Selección */}
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1px' }}>SELECCIONAR JURISDICCIÓN ESPECÍFICA (OPCIONAL):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {provincias.map(p => (
                  <button 
                    key={p.n} 
                    onClick={() => setProvinciaSeleccionada(provinciaSeleccionada === p.n ? null : p.n)}
                    style={{ 
                      padding: '8px 14px', 
                      backgroundColor: provinciaSeleccionada === p.n ? '#2563eb' : '#fff', 
                      color: provinciaSeleccionada === p.n ? '#fff' : '#64748b',
                      border: '1px solid #e2e8f0', 
                      borderRadius: '10px', 
                      fontSize: '11px', 
                      cursor: 'pointer',
                      transition: '0.2s all',
                      fontWeight: provinciaSeleccionada === p.n ? 'bold' : 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {p.b} {p.n}
                    {provinciaSeleccionada === p.n && <CheckCircle2 size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Input de Patente con Inteligencia */}
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
              <div style={{ marginBottom: '15px', position: 'relative' }}>
                <input 
                  style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', outline: 'none' }}
                  placeholder="INGRESAR PATENTE"
                  value={patente} 
                  onChange={(e) => setPatente(e.target.value)}
                  onKeyDown={handlePatenteKeyDown}
                />
                {provinciaSeleccionada && (
                  <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#eff6ff', padding: '4px 8px', borderRadius: '6px' }}>
                    Buscando en {provinciaSeleccionada}
                  </span>
                )}
              </div>
              <button onClick={manejarBusqueda} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Search size={20} /> AUDITAR DOMINIO {provinciaSeleccionada ? 'EN ' + provinciaSeleccionada.toUpperCase() : 'NACIONAL'}
              </button>
            </div>

            {/* Carteles Inferiores con tus Vectores (Auto y Colectivo) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '35px 25px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px', color: '#2563eb' }}>
                  <Bus size={32} />
                  <Truck size={32} />
                  <Car size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Gestión masiva y auditoría técnica para logística, pasajeros y servicios corporativos.</p>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>CARGA DE FLOTA</p>
                  <div style={{ backgroundColor: '#10b981', color: 'white', padding: '10px', borderRadius: '12px' }}>
                    <FileSpreadsheet size={24} />
                  </div>
                </div>
              </div>

              <div style={{ padding: '35px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <div style={{ color: '#2563eb', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                  <Briefcase size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Soporte técnico administrativo para carteras de infracciones a nivel federal.</p>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                   <p style={{ fontSize: '11px', color: '#94a3b8' }}>Módulo de gestión de descargos técnicos</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
