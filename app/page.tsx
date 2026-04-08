"use client";
import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check, AlertTriangle, FileText, Download, Lock, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // 'input', 'analyzing', 'result'
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('Iniciando análisis...');
  const fileInputRef = useRef(null);

  const handleStartAnalysis = () => {
    if (!jurisdiccion || !fileSelected) return;
    setStep('analyzing');
    
    const steps = [
      "Conectando con bases municipales...",
      `Verificando radares en ${jurisdiccion}...`,
      "Analizando plazos de notificación...",
      "Cruzando datos con Ley 24.449...",
      "Generando diagnóstico semáforo..."
    ];

    steps.forEach((text, index) => {
      setTimeout(() => {
        setProgressText(text);
        if (index === steps.length - 1) setTimeout(() => setStep('result'), 1000);
      }, (index + 1) * 1500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        .blur-text { filter: blur(5px); user-select: none; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress-bar { animation: progress 7.5s linear forwards; }
      `}</style>

      {/* Navbar con Logo Azul */}
      <nav className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg" style={{backgroundColor: '#2563eb'}}>
                <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900 uppercase">MultaCheck</span>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">ARGENTINA</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-12 px-4 pb-20">
        
        {step === 'input' && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-10">
              <h2 className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3" style={{color: '#2563eb'}}>Plataforma Nacional de Resolución de Infracciones</h2>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">Asistencia técnica en redacción de descargos</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Analizá tu infracción según la Ley Nacional de Tránsito y detectá vicios de forma en segundos.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 mb-10">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <select className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={jurisdiccion} onChange={(e) => setJurisdiccion(e.target.value)}>
                  <option value="">Seleccionar Jurisdicción...</option>
                  <option value="CABA">CABA</option>
                  <option value="PBA">Provincia de Buenos Aires</option>
                  <option value="Cordoba">Córdoba</option>
                </select>
                <input type="text" placeholder="PATENTE DEL VEHÍCULO" className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>

              {/* Zona de Carga con estilo de diseño */}
              <div onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${fileSelected ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'}`}>
                <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" accept=".pdf,image/*" />
                {!fileSelected ? (
                  <><Upload className="mx-auto h-12 w-12 text-slate-300 mb-4" /><p className="text-slate-600 font-bold text-lg">Subir PDF o Imagen de la multa</p><p className="text-slate-400 text-sm mt-1">Hacé clic aquí para seleccionar el archivo</p></>
                ) : (
                  <><div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="text-white w-8 h-8" /></div><p className="text-emerald-700 font-bold text-lg italic">¡Archivo cargado correctamente!</p><p className="text-slate-500 text-sm mt-1 truncate max-w-xs mx-auto">{fileSelected.name}</p></>
                )}
              </div>

              {/* Botón con Azul Forzado para evitar pérdida de estilo */}
              <button 
                onClick={handleStartAnalysis} 
                className={`w-full mt-6 font-bold py-5 rounded-2xl transition-all text-xl shadow-lg border-none cursor-pointer ${fileSelected && jurisdiccion ? 'text-white' : 'text-slate-400 cursor-not-allowed'}`}
                style={{ 
                    backgroundColor: fileSelected && jurisdiccion ? '#2563eb' : '#e5e7eb',
                    boxShadow: fileSelected && jurisdiccion ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none'
                }}
              >
                Comenzar Análisis Gratuito
              </button>
            </div>
            
            {/* Beneficios Inferiores */}
            <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center"><ShieldCheck className="w-8 h-8 text-blue-600 mb-2" /><p className="text-xs font-bold uppercase text-slate-500 tracking-widest">Ley 24.449</p></div>
                <div className="flex flex-col items-center"><AlertCircle className="w-8 h-8 text-slate-400 mb-2" /><p className="text-xs font-bold uppercase text-slate-500 tracking-widest">Vicios de Forma</p></div>
                <div className="flex flex-col items-center"><CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" /><p className="text-xs font-bold uppercase text-slate-500 tracking-widest">98% Precisión</p></div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-8">
            <Loader2 className="h-20 w-20 text-blue-600 mx-auto animate-spin" style={{color: '#2563eb'}} />
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{progressText}</h3>
              <p className="text-slate-500 text-lg">Estamos verificando la viabilidad legal de tu caso...</p>
            </div>
            <div className="max-w-md mx-auto bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full animate-progress-bar" style={{backgroundColor: '#2563eb'}}></div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-emerald-500">
              <div className="flex items-start gap-6">
                <div className="bg-emerald-100 p-4 rounded-2xl">
                    <CheckCircle2 className="text-emerald-600 w-12 h-12" style={{color: '#10b981'}} />
                </div>
                <div className="flex-grow">
                  <h2 className="text-3xl font-black text-slate-900 mb-1 italic uppercase">🟢 Alta probabilidad de anulación</h2>
                  <p className="text-slate-600 text-lg mb-4">Se han detectado inconsistencias críticas en el acta analizada.</p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <p className="text-emerald-800 font-medium italic">Podrías evitar el pago total de la infracción.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b pb-4">
                    <FileText className="text-slate-400 w-5 h-5" />
                    <span className="text-sm font-bold text-slate-4
