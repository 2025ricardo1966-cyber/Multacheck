"use client";
import React, { useState } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, FileText, ShieldCheck, ClipboardCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [bitacora, setBitacora] = useState([]); 

  const addLog = (msg) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] AUDITORÍA: ${msg}`;
    setBitacora(prev => [logEntry, ...prev]);
  };

  const handleStart = () => {
    if (!patente) return alert("Ingresá una patente.");
    addLog(`Iniciando verificación técnica para ${patente}`);
    setStep('evaluating');
    setTimeout(() => { addLog("Registro detectado. Analizando vicios de forma..."); setStep('found'); }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: #020617; margin: 0; }
      `}</style>

      <nav className="border-b border-slate-800 p-6 bg-slate-950/50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl italic tracking-tighter">
            <Scale className="text-blue-500" /> MULTACHECK
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800 px-4 py-1 rounded-full">
            Auditoría Administrativa Nacional
          </div>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6">
        {step === 'input' && (
          <div className="w-full max-w-xl text-center">
            <h1 className="text-6xl font-black mb-6 italic tracking-tighter">Evaluación Experta.</h1>
            <p className="text-slate-400 text-xl mb-12">Detectamos errores de procedimiento en actas de todo el país.</p>
            <div className="relative mb-6">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-8 h-8" />
              <input 
                type="text" placeholder="AA123BB" 
                className="w-full pl-16 p-8 bg-slate-900 border-2 border-slate-800 rounded-[35px] font-mono text-4xl uppercase focus:border-blue-500 outline-none"
                value={patente} onChange={(e) => setPatente(e.target.value)}
              />
            </div>
            <button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-[35px] font-black text-2xl italic uppercase transition-all">
              Verificar Patente
            </button>
          </div>
        )}

        {step === 'evaluating' && (
          <div className="text-center py-20">
            <Loader2 className="h-20 w-20 text-blue-500 mx-auto animate-spin mb-8" />
            <h2 className="text-2xl font-black italic uppercase animate-pulse">Consultando Registro Nacional...</h2>
          </div>
        )}

        {step === 'found' && (
          <div className="w-full max-w-md bg-slate-900 p-10 rounded-[45px] border border-slate-800 text-center">
            <h2 className="text-3xl font-black mb-6 italic uppercase">Registro Detectado</h2>
            <div className="bg-black/40 p-6 rounded-3xl mb-10"><p className="text-5xl font-mono text-blue-500">{patente.toUpperCase()}</p></div>
            <button onClick={() => setStep('input')} className="w-full bg-white text-black py-6 rounded-3xl font-black text-xl uppercase italic">Iniciar Auditoría Técnica</button>
          </div>
        )}
      </main>

      {/* ESTA ES LA BITÁCORA QUE NO TE APARECÍA */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Cuaderno de Bitácora / Monitor de Funciones
          </p>
          <div className="bg-black/50 p-4 rounded-xl h-24 overflow-y-auto font-mono text-[11px] text-slate-400 border border-slate-800/50 flex flex-col-reverse">
            {bitacora.length === 0 ? "Esperando actividad técnica..." : bitacora.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </footer>
    </div>
  );
}
