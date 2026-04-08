"use client";
import React, { useState } from 'react';
import { Scale, Users, ChevronRight, ShieldCheck, Search, ArrowLeft, FileText, Briefcase, Truck, LayoutDashboard, Upload, MapPin, Building, Target, FilePlus } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // input, results, diagnosis, dashboard
  const [patente, setPatente] = useState('');
  const [selectedMulta, setSelectedMulta] = useState<any>(null);

  // Datos Federales Simulados
  const provinciasData = [
    { nombre: "CABA", bandera: "🇦🇷" }, // Reemplazar por URLs de banderas reales si se desea
    { nombre: "Buenos Aires", bandera: "🏛️" },
    { nombre: "Córdoba", bandera: "🌾" },
    { nombre: "Santa Fe", bandera: "🏞️" },
    { nombre: "Mendoza", bandera: "🍇" },
    { nombre: "Salta", bandera: "⛰️" },
    { nombre: "Tucumán", bandera: "🚜" },
    { nombre: "Neuquén", bandera: "❄️" },
  ];

  const multasEncontradas = [
    { id: 1, fecha: "10/01/2026", lugar: "CABA (Av. Del Libertador)", monto: "$32.400", falta: "Exceso Velocidad (Radar Fijo)", vicio: "Falta de Certificado de Homologación de cinemómetro actualizado.", exito: "85%" },
    { id: 6, fecha: "12/03/2026", lugar: "Salta (Ruta 68, km 110)", monto: "$63.200", falta: "Exceso de Velocidad (Cinemómetro Móvil)", vicio: "Defecto en la imagen capturada: falta de visibilidad del dominio.", exito: "95%" }
  ];

  // Lógica para detectar el 'Enter'
  const handlePatenteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (patente.length < 6) return alert("Ingresá un dominio válido.");
      setStep('results');
    }
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      {/* Navbar con Panel Profesional */}
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LayoutDashboard size={14} /> PANEL PROFESIONAL
        </button>
      </nav>

      <main style={{ maxWidth: '750px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '35px' }}>Soporte administrativo federal para el análisis de fotomultas.</p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
                onKeyDown={handlePatenteKeyDown} // Función de 'Enter' vinculada
              />
              <button onClick={() => { if(patente.length >= 6) setStep('results'); }} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                AUDITAR DOMINIO
              </button>
            </div>

            {/* Banderas Provinciales Federales */}
            <div style={{ textAlign: 'left', marginBottom: '35px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center', letterSpacing: '1px' }}>JURISDICCIONES CON SOPORTE ADMINISTRATIVO:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                {provinciasData.map(p => (
                  <span key={p.nombre} style={{ padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {p.bandera} {p.nombre}
                  </span>
                ))}
              </div>
            </div>

            {/* Carteles Inferiores más Grandes y Profesionales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '30px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                <Truck size={24} color="#2563eb" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Gestión masiva y auditoría técnica automatizada para logística y empresas de servicios.</p>
              </div>
              <div style={{ padding: '30px 25px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '25px', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              {multasEncontradas.map((m) => (
                <div key={m.id} style={{ background: '#fff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{m.falta}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={11} /> {m.lugar} • {m.fecha}
                      </div>
                    </div>
                    <button onClick={() => { setSelectedMulta(m); setStep('diagnosis'); }} style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      INFORME TÉCNICO
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Opción de Carga de Archivos */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <FilePlus size={24} color="#2563eb" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>¿Tenés un acta papel o PDF?</h4>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>Cargá una foto o escaneo de tu multa para el análisis manual (Art. 41 Ley 24.449).</p>
              <label style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={14} /> SUBIR MULTA (PDF/Foto)
                <input type="file" style={{ display: 'none' }} accept=".pdf, .jpg, .jpeg, .png" />
              </label>
            </div>
          </div>
        )}

        {/* El resto de estados (dashboard, diagnosis) permanecen igual */}
      </main>
    </div>
  );
}
