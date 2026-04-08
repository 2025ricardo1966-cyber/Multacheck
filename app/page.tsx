"use client";
import React, { useState } from 'react';
import { Scale, Users, ChevronRight, ShieldCheck, Search, ArrowLeft, FileText, Briefcase, Truck, CreditCard } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [selectedMulta, setSelectedMulta] = useState<any>(null);

  // Simulación de multas detectadas
  const multasEncontradas = [
    { id: 1, fecha: "10/01/2026", lugar: "CABA", monto: "$32.400", falta: "Exceso Velocidad (Radar Fijo)", vicio: "Falta de Certificado de Homologación de cinemómetro actualizado.", exito: "85%" },
    { id: 6, fecha: "12/03/2026", lugar: "Salta (Cabra Corral)", monto: "$63.200", falta: "Exceso de Velocidad (Ruta 68)", vicio: "Defecto en la imagen capturada: falta de visibilidad del dominio.", exito: "95%" }
  ];

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      {/* Navbar con Acceso a Empresas */}
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            ACCESO PROFESIONAL
          </button>
          <div style={{ fontSize: '11px', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
             2026 • SOPORTE FEDERAL
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico Administrativo</h1>
            <p style={{ color: '#64748b', marginBottom: '35px', fontSize: '15px' }}>
              Herramienta de soporte para particulares, flotas y estudios jurídicos.
            </p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold', outline: 'none' }}
                placeholder="INGRESAR DOMINIO"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
              />
              <button onClick={() => setStep('results')} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', border: 'none', fontSize: '16px' }}>
                ANALIZAR ACTAS NACIONALES
              </button>
            </div>

            {/* Sección de Membresías (Invitación) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'left' }}>
              <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <Truck size={20} color="#2563eb" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Monitoreo masivo y alertas preventivas para logística.</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <Briefcase size={20} color="#2563eb" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Auditoría técnica automatizada para carteras de clientes.</p>
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
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{m.lugar} • {m.fecha}</div>
                    </div>
                    <button onClick={() => { setSelectedMulta(m); setStep('diagnosis'); }} style={{ padding: '10px 15px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      INFORME TÉCNICO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'diagnosis' && selectedMulta && (
          <div style={{ background: '#fff', padding: '35px', borderRadius: '30px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => setStep('results')} style={{ color: '#94a3b8', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>← VOLVER AL LISTADO</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
              <FileText color="#2563eb" />
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Diagnóstico de Consistencia</h2>
            </div>

            <div style={{ border: '2px solid #f8fafc', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}>HALLAZGO TÉCNICO:</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{selectedMulta.vicio}</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Viabilidad de Rectificación Administrativa:</span>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#10b981' }}>{selectedMulta.exito}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px' }}>
                <div style={{ width: selectedMulta.exito, height: '100%', backgroundColor: '#10b981', borderRadius: '10px' }}></div>
              </div>
            </div>

            <button style={{ width: '100%', padding: '20px', backgroundColor: '#0f172a', color: 'white', borderRadius: '15px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', border: 'none', marginBottom: '25px' }}>
              ADQUIRIR ARGUMENTOS TÉCNICOS
            </button>

            <p style={{ fontSize: '10px', color: '#cbd5e1', textAlign: 'justify', lineHeight: '1.4', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              * Aclaración Profesional: MULTACHECK actúa como un soporte de auditoría de datos basado en la Ley Nacional de Tránsito y normativas jurisdiccionales. Este reporte proporciona una base técnica para la autogestión o para facilitar la labor de su abogado de confianza en caso de resistencia judicial discrecional.
            </p>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '10px', letterSpacing: '4px' }}>
        MULTACHECK • SOPORTE TÉCNICO PARA PROFESIONALES Y FLOTAS
      </footer>
    </div>
  );
}
