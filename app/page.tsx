"use client";
import React, { useState } from 'react';
import { Scale, Users, ChevronRight, ShieldCheck, Search, ArrowLeft, FileText, Briefcase, Truck, LayoutDashboard, PlusCircle, Filter, Download, Upload, FileSpreadsheet, X } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // input, results, diagnosis, dashboard
  const [patente, setPatente] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const flotaData = [
    { id: 1, dominio: "AF123JK", multas: 4, estado: "Revisado", vicios: 3, ahorro: "$210.000" },
    { id: 2, dominio: "AE990LL", multas: 1, estado: "Pendiente", vicios: 0, ahorro: "$0" },
    { id: 3, dominio: "AD456MM", multas: 12, estado: "Revisado", vicios: 8, ahorro: "$540.500" },
  ];

  const handleExcelUpload = () => {
    setIsUploading(true);
    // Simulación de procesamiento de datos
    setTimeout(() => {
      setIsUploading(false);
      alert("Excel procesado: 42 dominios vinculados exitosamente.");
    }, 3000);
  };

  return (
    <div style={{ backgroundColor: '#fdfbf7', minHeight: '100vh', color: '#1e293b', fontFamily: 'sans-serif' }}>
      
      <nav style={{ padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px', color: '#0f172a', cursor: 'pointer' }} onClick={() => setStep('input')}>
          <Scale size={20} color="#2563eb" /> MULTACHECK
        </div>
        <button 
          onClick={() => setStep('dashboard')}
          style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LayoutDashboard size={14} /> PANEL CORPORATIVO
        </button>
      </nav>

      <main style={{ maxWidth: step === 'dashboard' ? '1000px' : '700px', margin: '0 auto', padding: '40px 20px' }}>
        
        {step === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestión de Flotas</h1>
                <p style={{ color: '#64748b', fontSize: '14px' }}>Transportes Garín S.A. • <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Plan Empresa</span></p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={18} /> Carga Individual
                </button>
              </div>
            </div>

            {/* ZONA DE CARGA DE EXCEL */}
            <div style={{ 
              border: '2px dashed #cbd5e1', 
              borderRadius: '20px', 
              padding: '40px', 
              textAlign: 'center', 
              backgroundColor: isUploading ? '#f8fafc' : '#fff',
              marginBottom: '30px',
              transition: 'all 0.3s ease'
            }}>
              {isUploading ? (
                <div>
                  <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 15px', color: '#2563eb' }} />
                  <p style={{ fontWeight: 'bold', color: '#2563eb' }}>Procesando planilla de unidades...</p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Sincronizando con registros nacionales de tránsito.</p>
                </div>
              ) : (
                <div>
                  <div style={{ backgroundColor: '#f0fdf4', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <FileSpreadsheet color="#10b981" size={30} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Importar desde Excel / CSV</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Arrastre su archivo de flota para auditar todos los dominios en segundos.</p>
                  <label style={{ 
                    backgroundColor: '#0f172a', 
                    color: 'white', 
                    padding: '12px 25px', 
                    borderRadius: '10px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <Upload size={18} /> SELECCIONAR ARCHIVO
                    <input type="file" style={{ display: 'none' }} onChange={handleExcelUpload} accept=".xlsx, .csv" />
                  </label>
                </div>
              )}
            </div>

            {/* Stats Rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', margin: '0 0 5px 0' }}>UNIDADES ACTIVAS</p>
                <p style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>158</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', margin: '0 0 5px 0' }}>AUDITORÍAS COMPLETAS</p>
                <p style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', margin: 0 }}>1.420</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', backgroundColor: '#f0fdf4' }}>
                <p style={{ fontSize: '11px', color: '#15803d', fontWeight: 'bold', margin: '0 0 5px 0' }}>POTENCIAL RECUPERO</p>
                <p style={{ fontSize: '24px', fontWeight: '900', color: '#166534', margin: 0 }}>$2.450.000</p>
              </div>
            </div>

            {/* Tabla de Gestión */}
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Resultados de la última importación</span>
                <button style={{ color: '#2563eb', background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Descargar Reporte Completo</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '15px 20px' }}>Vehículo</th>
                    <th style={{ padding: '15px 20px' }}>Infracciones</th>
                    <th style={{ padding: '15px 20px' }}>Análisis Técnico</th>
                    <th style={{ padding: '15px 20px' }}>Viabilidad</th>
                    <th style={{ padding: '15px 20px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {flotaData.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.dominio}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: #FT-{item.id}002</div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>{item.multas} actas</td>
                      <td style={{ padding: '15px 20px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: 'bold' }}>
                            <ShieldCheck size={14} /> {item.vicios} vicios detectados
                         </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
                          <div style={{ width: '80%', height: '100%', backgroundColor: '#10b981', borderRadius: '10px' }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <button style={{ color: '#2563eb', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Ver Detalle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTAS PARTICULARES (Ocultas si estamos en Dashboard) */}
        {step === 'input' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#0f172a', fontStyle: 'italic', marginBottom: '10px' }}>Asistente Técnico</h1>
            <p style={{ color: '#64748b', marginBottom: '35px' }}>Soporte administrativo federal para el análisis de fotomultas.</p>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.03)' }}>
              <input 
                style={{ width: '100%', padding: '18px', border: '2px solid #f1f5f9', borderRadius: '15px', fontSize: '24px', textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', fontWeight: 'bold' }}
                placeholder="INGRESAR PATENTE"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
              />
              <button onClick={() => setStep('results')} style={{ width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                AUDITAR DOMINIO
              </button>
            </div>
          </div>
        )}
      </main>
      
      <style>{` @keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; } `}</style>
    </div>
  );
}
