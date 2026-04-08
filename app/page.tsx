"use client";
import React, { useState } from 'react';
import { Scale, ShieldCheck, MapPin, Truck, Briefcase, FileText, LayoutDashboard, ChevronRight } from 'lucide-react';

export default function MultaCheck() {
  const [patente, setPatente] = useState('');
  const [step, setStep] = useState('input');

  const provincias = [
    { n: "CABA", b: "🇦🇷" },
    { n: "Buenos Aires", b: "🏛️" },
    { n: "Córdoba", b: "🌾" },
    { n: "Santa Fe", b: "🏞️" },
    { n: "Mendoza", b: "🍇" },
    { n: "Salta", b: "⛰️" },
    { n: "Tucumán", b: "🚜" },
    { n: "Neuquén", b: "❄️" },
  ];

  // Datos Simulados
  const multasEncontradas = [
    { id: 1, fecha: "10/01/2026", lugar: "CABA (Radar Fijo Libertador)", monto: "$32.400", falta: "Exceso de Velocidad (Cinemómetro Fijo)", vicio: "Falta de Certificado de Homologación de cinemómetro actualizado.", exito: "85%" },
    { id: 2, fecha: "22/01/2026", lugar: "Ruta 68, km 110 (Tolombon)", monto: "$63.200", falta: "Exceso de Velocidad (Cinemómetro Móvil)", vicio: "Defecto en la imagen capturada: falta de visibilidad del dominio.", exito: "95%" },
  ];

  const handlePatenteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (patente.length < 6) return alert("Ingresá un dominio válido.");
      setStep('results');
    }
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      {/* Navbar simplificada */}
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button style={{ fontSize: '12px', color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          PANEL PROFESIONAL
        </button>
      </nav>

      <main style={{ maxWidth: '750px', margin: '0 auto', padding: '20px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            
            {/* Fundamentación Legal Superior - Confiabilidad Instantánea */}
            <div style={{ textAlign: 'left', backgroundColor: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '15px', marginBottom: '35px', color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
              <strong>SEGURIDAD JURÍDICA FEDERAL</strong>
              <p style={{ margin: '8px 0 0 0' }}>
                Conforme a lo establecido en la <strong>Constitución Nacional Argentina, Artículo 18</strong>, la defensa en juicio de la persona y de sus derechos es inviolable. Asimismo, en el marco de la <strong>Ley Nacional de Tránsito N° 24.449, Artículo 69</strong> (Principio de legalidad y defensa en juicio), todo ciudadano tiene el derecho fundamental a ser oído y a presentar descargos y pruebas que asistan a su razón antes de que se ratifique cualquier infracción.
              </p>
            </div>

            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '35px' }}>Auditoría administrativa para particulares, flotas y estudios.</p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handlePatenteKeyDown}
              />
              <button onClick={() => { if(patente.length >= 6) setStep('results'); }} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                AUDITAR DOMINIO
              </button>
            </div>

            {/* Jurisdicciones Federales con soporte */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>JURISDICCIONES CON SOPORTE ADMINISTRATIVO:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                {provincias.map(p => (
                  <span key={p.n} style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#64748b' }}>{p.b} {p.n}</span>
                ))}
              </div>
            </div>

            {/* Carteles Inferiores Agrandados y Alineados */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '30px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'left' }}>
                <Truck size={24} color="#2563eb" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Gestión masiva y auditoría técnica automatizada para logística y empresas de servicios.</p>
              </div>
              <div style={{ padding: '30px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'left' }}>
                <Briefcase size={24} color="#2563eb" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Soporte técnico administrativo para estudios que manejan carteras de infracciones de tránsito.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div>
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '900' }}>DOMINIO: {patente.toUpperCase()}</h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Se han identificado los siguientes reportes para su revisión técnica.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#fff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{m.falta}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                         <MapPin size={11} /> {m.lugar} • {m.fecha}
                      </div>
                    </div>
                    <button style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      INFORME TÉCNICO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
