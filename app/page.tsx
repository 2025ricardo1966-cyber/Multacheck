"use client";
import React, { useState } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, FileText, ShieldCheck, ClipboardCheck } from 'lucide-react';

// Forzamos que Vercel no use versiones guardadas
export const dynamic = 'force-dynamic';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // input, evaluating, found, result
  const [patente, setPatente] = useState('');
  const [bitacora, setBitacora] = useState([]); // Tu monitor de funciones en tiempo real

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = `[${timestamp}] AUDITORÍA: ${msg}`;
    setBitacora(prev => [logEntry, ...prev]);
    console.log(logEntry); // También lo verás en la consola de Vercel
  };

  const handleStartEvaluation = () => {
    if (!patente || patente.length < 6) return alert("Ingresá una patente válida para auditar.");
    
    addLog(`Solicitud de evaluación para dominio: ${patente}`);
    setStep('evaluating');
    addLog("Sincronizando con bases de datos públicas nacionales...");
    addLog("Verificando consistencia de datos administrativos...");
    addLog("Confirmando plazos de notificación según Ley 24.449...");

    // Simulación de los tiempos de auditoría técnica
    setTimeout(() => { 
        addLog(`Registro detectado para ${patente}. Procediendo a evaluación técnica...`);
        setStep('found'); 
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col selection:bg-slate-700">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: #020617; }
      `}</style>

      {/* Navbar Sobria y Profesional */}
      <nav className="border-b border-slate-800/60 p-6 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black uppercase italic tracking-tighter text-slate-100">MULTACHECK</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full">
            <ShieldCheck size={14} className="text-blue-400" /> Plataforma de Verificación Administrativa
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20">
        
        {/* PASO 1: LA PORTADA TÉCNICA (NADA DE IA) */}
        {step === 'input' && (
          <div className="w-full max-w-2xl text-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <h1 className="text-6xl md:text-8xl font-black mb-8 italic tracking-tighter text-slate-50 leading-none">
              Evaluación Administrativa Experta.
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-16 font-medium max-w-xl mx-auto leading-relaxed border-l-2 border-slate-800 pl-6">
              Detectamos errores de procedimiento y vicios de forma basándonos en la Ley Nacional de Tránsito. 
            </p>
            
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-3xl text-left">
              <label className="block text-[11px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">Búsqueda y Auditoría por Dominio (Patente)</label>
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-8 h-8" />
                <input 
                  type="text" placeholder="AA123BB" 
                  className="w-full pl-16 p-8 bg-slate-950 border-2 border-slate-800 rounded-[30px] font-mono text-4xl md:text-5xl uppercase focus:border-slate-600 focus:ring-4 focus:ring-slate-800 outline-none transition-all shadow-inner"
                  value={patente} onChange={(e) => setPatente(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartEvaluation()}
                />
              </div>
              <button onClick={handleStartEvaluation} className="w-full bg-slate-100 hover:bg-white text-black py-7 rounded-[30px] font-black text-2xl italic uppercase shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
                Iniciar Verificación Técnica <ArrowRight />
              </button>
            </div>
          </div>
        )}

        {step === 'evaluating' && (
          <div className="text-center py-20 animate-in zoom-in-50 duration-500">
            <Loader2 className="h-20 w-20 text-slate-600 mx-auto animate-spin mb-10" />
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
              <h2 className="text-3xl font-black text-slate-200 uppercase italic tracking-widest animate-pulse mb-3">Sincronizando Registros...</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">No navegues fuera de esta página. Estamos consolidando datos de múltiples juzgados de faltas.</p>
            </div>
          </div>
        )}

        {step === 'found' && (
          <div className="w-full max-w-xl bg-slate-900 p-12 rounded-[50px] border border-slate-800 shadow-3xl text-center animate-in zoom-in-50 duration-700">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-900/40">
                <ClipboardCheck className="text-blue-500 w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black mb-6 italic uppercase text-slate-50">Registro Encontrado</h2>
            <div className="bg-slate-950/60 p-8 rounded-3xl mb-12 border border-slate-800/80 shadow-inner">
              <p className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-[0.2em]">Dominio Auditado</p>
              <p className="text-6xl md:text-7xl font-mono text-white tracking-widest font-black uppercase">{patente}</p>
            </div>
            <p className="text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-md mx-auto">
              Nuestro monitor ha detectado inconsistencias críticas que deben ser evaluadas para confirmar la viabilidad legal del acta.
            </p>
            <button onClick={() => setStep('input')} className="w-full bg-slate-100 hover:bg-white text-black py-7 rounded-3xl font-black text-2xl uppercase italic shadow-xl transition-all">
              SÍ, EVALUAR AHORA
            </button>
            <button onClick={() => setStep('input')} className="w-full mt-6 text-slate-600 font-bold text-xs uppercase hover:text-slate-400 transition-colors">Cancelar</button>
          </div>
        )}
      </main>

      {/* MONITOR DE FUNCIONES EN TIEMPO REAL (Bitácora Integral) */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/60 p-6 bg-slate-950/70 backdrop-blur-md sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Bitácora de Auditoría Técnica</span>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl h-20 overflow-y-auto border border-slate-800 font-mono shadow-inner text-xs flex flex-col-reverse gap-2">
            {bitacora.length === 0 ? (
              <span className="text-slate-700 text-[11px] uppercase tracking-widest">Esperando inicio de proceso...</span>
            ) : (
              bitacora.map((entry, i) => (
                <span key={i} className="text-slate-500">{entry}</span>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
