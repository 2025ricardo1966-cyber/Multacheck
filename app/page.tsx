"use client";
import React, { useState } from 'react';
import { Scale, ShieldCheck, FileText, Briefcase, Truck, LayoutDashboard, Upload, FileSpreadsheet, Loader2, PlusCircle, Filter, Download } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const flotaData = [
    { id: 1, dominio: "AF123JK", multas: 4, estado: "Revisado", vicios: 3, ahorro: "$210.000" },
    { id: 2, dominio: "AE990LL", multas: 1, estado: "Pendiente", vicios: 0, ahorro: "$0" },
    { id: 3, dominio: "AD456MM", multas: 12, estado: "Revisado", vicios: 8, ahorro: "$540.500" },
  ];

  const handleExcelUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setStep('dashboard');
    }, 2500);
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a', cursor: 'pointer' }} onClick={() => setStep('input')}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button onClick={() => setStep('dashboard')} style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LayoutDashboard size={14} /> PANEL PROFESIONAL
        </button>
      </nav>

      <main style={{ maxWidth: step === 'dashboard' ? '900px' : '700px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '35px' }}>Auditoría administrativa para particulares, flotas y estudios.</p>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold', outline: 'none' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
              />
              <button onClick={() => setStep('dashboard')} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', cursor: 'pointer', border: 'none' }}>
                ANALIZAR ACTAS
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div onClick={() => setStep('dashboard')} style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', textAlign: 'left' }}>
                <Truck size={20} color="#2563eb" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Flotas de Transporte</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Gestión masiva de unidades.</p>
              </div>
              <div onClick={() => setStep('dashboard')} style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', cursor: 'pointer', textAlign: 'left' }}>
                <Briefcase size={20} color="#2563eb" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Estudios Jurídicos</h3>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Soporte técnico administrativo.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '900' }}>Gestión Corporativa</h1>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Panel de Control • 2026</p>
              </div>
              <label style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> IMPORTAR EXCEL
                <input type="file" style={{ display: 'none' }} onChange={handleExcelUpload} />
              </label>
            </div>

            {isUploading ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#2563eb' }} />
                <p style={{ marginTop: '15px', fontWeight: 'bold' }}>Procesando planilla de flota...</p>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Auditando vicios de forma en registros nacionales.</p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>DOMINIOS VINCULADOS</span>
                   <div style={{ display: 'flex', gap: '10px' }}>
                      <Filter size={14} color="#94a3b8" />
                      <Download size={14} color="#94a3b8" />
                   </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc', fontSize: '11px', color: '#64748b' }}>
                    <tr>
                      <th style={{ padding: '15px 20px' }}>VEHÍCULO</th>
                      <th style={{ padding: '15px 20px' }}>ESTADO</th>
                      <th style={{ padding: '15px 20px' }}>VICIOS TÉCNICOS</th>
                      <th style={{ padding: '15px 20px' }}>AHORRO ESTIMADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flotaData.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{item.dominio}</td>
                        <td style={{ padding: '15px 20px' }}>
                          <span style={{ backgroundColor: item.estado === 'Revisado' ? '#f0fdf4' : '#fff7ed', color: item.estado === 'Revisado' ? '#166534' : '#9a3412', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                            {item.estado}
                          </span>
                        </td>
                        <td style={{ padding: '15px 20px', color: '#10b981', fontWeight: 'bold' }}>{item.vicios} detectados</td>
                        <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{item.ahorro}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <p style={{ fontSize: '10px', color: '#cbd5e1', textAlign: 'center', marginTop: '30px' }}>
              SOPORTE TÉCNICO ADMINISTRATIVO • ESTE REPORTE NO REEMPLAZA EL ASESORAMIENTO LEGAL PROFESIONAL
            </p>
          </div>
        )}
      </main>
      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
    </div>
  );
}
