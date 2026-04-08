"use client";
import React, { useState } from 'react';
import { Scale, ShieldCheck, MapPin, Truck, Briefcase, FileText, LayoutDashboard, FileSpreadsheet, Bus, Car, Upload } from 'lucide-react';

export default function MultaCheck() {
  const [patente, setPatente] = useState('');
  const [step, setStep] = useState('input');

  const provincias = [
    { n: "CABA", b: "🇦🇷" }, { n: "Buenos Aires", b: "🏛️" }, { n: "Córdoba", b: "🌾" },
    { n: "Santa Fe", b: "🏞️" }, { n: "Mendoza", b: "🍇" }, { n: "Salta", b: "⛰️" },
    { n: "Tucumán", b: "🚜" }, { n: "Neuquén", b: "❄️" },
  ];

  const handlePatenteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && patente.length >= 6) setStep('results');
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
            
            {/* Fundamentación Legal Superior */}
            <div style={{ textAlign: 'left', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px', marginBottom: '35px', color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
              <strong>SEGURIDAD JURÍDICA FEDERAL</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Conforme a lo establecido en la <strong>Constitución Nacional Argentina, Artículo 18</strong>, la defensa en juicio de la persona y de sus derechos es inviolable. En el marco de la <strong>Ley Nacional de Tránsito N° 24.449, Artículo 69</strong>, todo ciudadano tiene el derecho fundamental a ser oído y presentar descargos antes de cualquier ratificación de infracción.
              </p>
            </div>

            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '35px' }}>Auditoría administrativa federal para el análisis de fotomultas.</p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold', outline: 'none' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handlePatenteKeyDown}
              />
              <button onClick={() => { if(patente.length >= 6) setStep('results'); }} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                AUDITAR DOMINIO
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>JURISDICCIONES CON SOPORTE ADMINISTRATIVO:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {provincias.map(p => (
                  <span key={p.n} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#64748b' }}>{p.b} {p.n}</span>
                ))}
              </div>
            </div>

            {/* Carteles Inferiores con Vectores Solicitados */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Flotas - Con Colectivo y Auto */}
              <div style={{ padding: '35px 25px', backgroundColor: '#fff', border: '2px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px', color: '#2563eb' }}>
                  <Bus size={32} />
                  <Truck size={32} />
                  <Car size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Gestión masiva y auditoría técnica automatizada para logística, pasajeros y servicios.</p>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>CARGA DE FLOTA</p>
                  <div style={{ cursor: 'pointer', backgroundColor: '#10b981', color: 'white', padding: '10px', borderRadius: '12px' }}>
                    <FileSpreadsheet size={24} />
                  </div>
                </div>
              </div>

              {/* Estudios Jurídicos */}
              <div style={{ padding: '35px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'center' }}>
                <div style={{ color: '#2563eb', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                  <Briefcase size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Soporte técnico administrativo para carteras de infracciones de tránsito a nivel nacional.</p>
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
