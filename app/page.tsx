"use client";
import React, { useState } from 'react';
import { Scale, MapPin, Truck, Briefcase, FileSpreadsheet, Bus, Car, Search, CheckCircle2, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react';

export default function MultaCheck() {
  const [patente, setPatente] = useState('');
  const [step, setStep] = useState('input');
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  const provincias = [
    { n: "CABA", b: "🇦🇷" }, { n: "Buenos Aires", b: "🏛️" }, { n: "Córdoba", b: "🌾" },
    { n: "Santa Fe", b: "🏞️" }, { n: "Mendoza", b: "🍇" }, { n: "Salta", b: "⛰️" },
    { n: "Tucumán", b: "🚜" }, { n: "Neuquén", b: "❄️" }, { n: "San Luis", b: "🏔️" }
  ];

  const manejarBusqueda = () => {
    if (patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    setStep('results');
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 5%', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button style={{ fontSize: '11px', color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
          LOGIN PROFESIONAL
        </button>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            
            {/* Botón Desplegable de Fundamentación Legal */}
            <div style={{ marginBottom: '25px' }}>
              <button 
                onClick={() => setShowLegal(!showLegal)}
                style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto', color: '#64748b', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <ShieldCheck size={18} color="#2563eb" /> 
                FUNDAMENTACIÓN LEGAL
                {showLegal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showLegal && (
                <div style={{ textAlign: 'left', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px', marginTop: '10px', color: '#64748b', fontSize: '12px', lineHeight: '1.6', animation: 'fadeIn 0.3s ease' }}>
                  <strong>SEGURIDAD JURÍDICA FEDERAL</strong>
                  <p style={{ margin: '8px 0 0 0' }}>
                    Conforme a la <strong>Constitución Nacional Argentina, Art. 18</strong> (Inviolabilidad de la defensa en juicio) y la <strong>Ley Nacional de Tránsito N° 24.449, Art. 69</strong>, garantizamos el acceso técnico a la revisión de toda supuesta infracción. Nuestra plataforma asiste al ciudadano en el ejercicio de su derecho a ser oído y presentar descargos técnicos antes de la ratificación de cualquier sanción pecuniaria.
                  </p>
                </div>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>Auditoría federal para el análisis de fotomultas.</p>
            
            {/* Jurisdicciones (Botones) */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                {provincias.map(p => (
                  <button 
                    key={p.n} 
                    onClick={() => setProvinciaSeleccionada(provinciaSeleccionada === p.n ? null : p.n)}
                    style={{ padding: '6px 10px', backgroundColor: provinciaSeleccionada === p.n ? '#2563eb' : '#fff', color: provinciaSeleccionada === p.n ? '#fff' : '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', cursor: 'pointer', fontWeight: provinciaSeleccionada === p.n ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {p.b} {p.n}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Responsivo */}
            <div style={{ background: '#fff', padding: 'clamp(20px, 5vw, 35px)', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
              <input 
                style={{ width: '100%', padding: '15px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: 'clamp(18px, 4vw, 24px)', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', outline: 'none', marginBottom: '15px' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && manejarBusqueda()}
              />
              <button onClick={manejarBusqueda} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                <Search size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                AUDITAR DOMINIO {provinciaSeleccionada ? 'EN ' + provinciaSeleccionada.toUpperCase() : 'NACIONAL'}
              </button>
            </div>

            {/* Carteles Adaptables (Mobile/PC) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '30px 20px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '15px', color: '#2563eb' }}>
                  <Bus size={28} /> <Truck size={28} /> <Car size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Gestión masiva y auditoría técnica para logística y servicios.</p>
                <div style={{ backgroundColor: '#10b981', color: 'white', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <FileSpreadsheet size={24} />
                </div>
              </div>

              <div style={{ padding: '30px 20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <Briefcase size={28} color="#2563eb" style={{ marginBottom: '15px', margin: '0 auto' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Soporte técnico administrativo para carteras de infracciones federales.</p>
                <p style={{ fontSize: '10px', color: '#94a3b8' }}>Módulo de gestión de descargos técnicos</p>
              </div>
            </div>
            
            {/* Indicador de compatibilidad */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '15px', color: '#cbd5e1' }}>
              <Monitor size={16} /> <Smartphone size={16} />
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>COMPATIBLE CON PC • ANDROID • IOS</span>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
