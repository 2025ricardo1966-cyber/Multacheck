"use client";
import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check, FileText, Download, Lock, CheckCircle2, ShieldCheck, AlertCircle, Search, ArrowRight } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // input, searching, found, analyzing, result
  const [patente, setPatente] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef(null);

  // Simulación de búsqueda nacional
  const handleSearch = () => {
    if (!patente) return alert("Ingresá una patente válida");
    setStep('searching');
    const searchSteps = ["Consultando CABA...", "Buscando en PBA...", "Cruzando datos ANSV..."];
    
    searchSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 1000);
    });

    setTimeout(() => setStep('found'), 3500);
  };

  // Simulación de análisis legal automático
  const handleAutoAnalysis = () => {
    setStep('analyzing');
    const analysisSteps = ["Extrayendo datos del acta...", "Verificando plazos legales...", "Detectando vicios de forma..."];
    
    analysisSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 1200);
    });

    setTimeout(() => setStep('result'), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        .blur-text { filter: blur(5px); }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress-bar { animation: progress 4s linear forwards; }
      `}</style>

      <nav className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Scale className="text-white w-6 h-6" /></div>
            <span className="text-xl font-bold tracking-tight text-blue-900 uppercase">MultaCheck</span>
          </div>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">Acceso Nacional Directo</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 px-4 pb-20">
        
        {/* PASO 1: BÚSQUEDA */}
        {step === 'input' && (
          <div className="animate-in fade-in duration-500 text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter italic">Consultá y analizá <span className="text-blue-600">al instante</span></h1>
            <p className="text-lg text-slate-600 mb-10 font-medium">No navegues más. Encontramos tus multas y evaluamos si son impugnables en un solo clic.</p>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 inline-block w-full text-left">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="PATENTE (EJ: AA123BB)" 
                  className="flex-grow p-5 bg-slate-100 border-none rounded-2xl font-black text-2xl uppercase focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Buscar Multas
                </button>
              </div>

              <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> O subí un acta que ya tengas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: BUSCANDO */}
        {step === 'searching' && (
          <div className="text-center py-20 space-y-6">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">{progressText}</h3>
          </div>
        )}

        {/* PASO 3: MULTA ENCONTRADA (EL MOMENTO CLAVE) */}
        {step === 'found' && (
          <div className="animate-in zoom-in duration-500">
            <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-3xl shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={120} /></div>
               <h2 className="text-2xl font-black text-amber-900 uppercase mb-4 italic">⚠️ Infracción Detectada</h2>
               <div className="bg-white/60 backdrop-blur p-6 rounded-2xl mb-6 border border-amber-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-slate-400 uppercase font-bold text-[10px]">Dominio</p><p className="font-black text-lg">{patente.toUpperCase()}</p></div>
                    <div><p className="text-slate-400 uppercase font-bold text-[10px]">Acta N°</p><p className="font-black text-lg">Q293844</p></div>
                    <div><p className="text-slate-400 uppercase font-bold text-[10px]">Jurisdicción</p><p className="font-black text-lg uppercase">CABA</p></div>
                    <div><p className="text-slate-400 uppercase font-bold text-[10px]">Monto Est.</p><p className="font-black text-lg text-red-600">$84.200</p></div>
                  </div>
               </div>
               <p className="text-amber-800 font-medium mb-6">Hemos detectado inconsistencias técnicas preliminares en esta infracción. ¿Querés realizar un análisis legal profundo?</p>
               <button 
                onClick={handleAutoAnalysis}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-xl hover:bg-black transition-all flex items-center justify-center gap-3"
               >
                 Analizar Probabilidad de Anulación <ArrowRight />
               </button>
            </div>
          </div>
        )}

        {/* PASO 4: ANALIZANDO (IGUAL QUE ANTES) */}
        {step === 'analyzing' && (
          <div className="text-center py-20 space-y-8 animate-pulse">
            <Loader2 className="h-20 w-20 text-blue-600 mx-auto animate-spin" />
            <h3 className="text-3xl font-black uppercase">{progressText}</h3>
            <div className="max-w-md mx-auto bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full animate-progress-bar"></div>
            </div>
          </div>
        )}

        {/* PASO 5: RESULTADO (CON EL SEMÁFORO) */}
        {step === 'result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
             <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-emerald-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="text-emerald-600" /></div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Veredicto: Impugnable</h2>
                </div>
                <p className="text-slate-600 text-lg">Se detectó que el radar en CABA no contaba con la homologación vigente al momento de la captura.</p>
             </div>
             {/* Paywall Blureado */}
             <div className="bg-slate-900 p-8 rounded-3xl text-white flex justify-between items-center shadow-2xl">
                <div>
                  <p className="text-amber-400 font-bold uppercase text-xs mb-1">¡Ahorrá $84.200!</p>
                  <h3 className="text-xl font-bold">Descargá tu descargo legal personalizado</h3>
                </div>
                <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-black uppercase hover:bg-blue-50 transition-all flex items-center gap-2">
                  <Download size={18} /> Obtener Defensa
                </button>
             </div>
             <button onClick={() => setStep('input')} className="text-slate-400 font-bold text-xs uppercase mx-auto block hover:text-slate-600">Nueva Búsqueda</button>
          </div>
        )}

      </main>
    </div>
  );
}
