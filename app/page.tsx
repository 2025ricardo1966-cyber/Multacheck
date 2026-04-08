"use client";
import React, { useState, useEffect } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, Info, FileText, ShieldCheck } from 'lucide-react';

// Fuerza la actualización del despliegue v3.0
export const dynamic = 'force-dynamic';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Ingresá una patente válida (Ej: AA123BB)");
    setStep('searching');
    const steps = ["Iniciando rastreo nacional...", "Cruzando bases de datos...", "Finalizando barrido..."];
    steps.forEach((text, i) => setTimeout(() => setProgressText(text), i * 1000));
    setTimeout(() => setStep('found'), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: #020617; }
      `}</style>

      <nav className="border-b border-slate-800 py-6 px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="text-blue-500 w-8 h-8" />
            <span className="text-2xl font-black uppercase italic tracking-tighter">MultaCheck</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" /> Protección de Datos Activa
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto pt-24 px-6 pb-20">
        {step === 'input' && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h1 className="text-6xl font-black mb-6 tracking-tighter italic leading-none">
              Rastreo <span className="text-blue-500 text-shadow-glow">Nacional</span>.
            </h1>
            <p className="text-slate-400 text-xl mb-12 font-medium">No busques en cada provincia. Nosotros lo hacemos por vos.</p>
            
            <div className="relative mb-8 group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="h-8 w-8 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="AA123BB" 
                className="w-full pl-20 p-9 bg-slate-900 border-2 border-slate-800 rounded-[40px] font-mono text-5xl uppercase focus:border-blue-600 focus:ring-4 focus:ring-blue-900/20 transition-all outline-none shadow-2xl"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <button 
              onClick={handleSearch} 
              className="w-full bg-blue-600 text-white py-8 rounded-[40px] font-black text-2xl hover:bg-blue-500 transition-all shadow-3xl shadow-blue-900/40 flex items-center justify-center gap-4 italic active:scale-95"
            >
              INICIAR ESCANEO <ArrowRight size={32} />
            </button>
            
            <p className="mt-8 text-slate-600 text-[10px] uppercase font-bold tracking-[0.3em]">CABA • PBA • CORDOBA • SANTA FE • MENDOZA</p>
          </div>
        )}

        {step === 'searching' && (
          <div className="text-center py-20 space-y-10">
            <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">{progressText}</h3>
          </div>
        )}

        {step === 'found' && (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[50px] shadow-3xl animate-in zoom-in duration-500 text-center">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Info className="text-blue-500 w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black mb-4 italic uppercase">¡Atención!</h2>
            <p className="text-slate-400 text-lg mb-10">Se detectó 1 acta pendiente en la base nacional vinculada a:</p>
            <div className="bg-slate-950 p-8 rounded-3xl mb-10 border border-slate-800">
              <p className="text-6xl font-mono font-black text-white tracking-widest">{patente.toUpperCase()}</p>
            </div>
            <button 
              onClick={() => setStep('result')} 
              className="w-full bg-white text-slate-950 py-7 rounded-[30px] font-black text-2xl italic uppercase hover:bg-slate-200 transition-all"
            >
              Analizar Viabilidad Técnica
            </button>
          </div>
        )}

        {step === 'result' && (
          <div className="animate-in slide-in-from-bottom duration-700">
            <div className="bg-slate-900 border border-emerald-900/30 p-12 rounded-[50px] shadow-3xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-emerald-500/20 p-4 rounded-3xl">
                    <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                </div>
                <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">Éxito Probable</h2>
                    <p className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Inconsistencia técnica detectada</p>
                </div>
              </div>
              <p className="text-slate-300 text-xl italic border-l-4 border-blue-600 pl-8 mb-12 leading-relaxed">
                "El dispositivo de captura no registra mantenimiento vigente. Esto anula la validez del acta según Ley 24.449."
              </p>
              <button className="w-full bg-blue-600 text-white py-8 rounded-[35px] font-black text-xl flex items-center justify-center gap-3 uppercase italic shadow-2xl shadow-blue-900/50">
                <FileText size={24} /> DESCARGAR DESCARGO TÉCNICO
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
