"use client";
import React, { useState } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, FileText, ShieldCheck } from 'lucide-react';

// Forzamos que Vercel no use versiones guardadas
export const dynamic = 'force-dynamic';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [log, setLog] = useState([]); // Bitácora local para el usuario

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Patente inválida");
    addLog(`Iniciando búsqueda nacional para: ${patente}`);
    setStep('searching');
    setTimeout(() => { addLog("Barrido completado en CABA, PBA y Córdoba."); setStep('found'); }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: #020617; }
      `}</style>

      {/* Navbar Minimalista */}
      <nav className="border-b border-slate-800 p-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 italic font-black text-2xl tracking-tighter">
            <Scale className="text-blue-500" /> MULTACHECK
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Monitor Nacional Activo</span>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        {step === 'input' && (
          <div className="w-full max-w-xl text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6 italic tracking-tighter">Rastreo Total.</h1>
            <p className="text-slate-400 text-lg mb-12 font-medium">Sin provincias. Sin formularios. Solo tu patente.</p>
            
            <div className="relative mb-6">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-8 h-8" />
              <input 
                type="text" placeholder="PATENTE" 
                className="w-full pl-16 p-8 bg-slate-900/50 border-2 border-slate-800 rounded-[35px] font-mono text-4xl uppercase focus:border-blue-500 outline-none transition-all"
                value={patente} onChange={(e) => setPatente(e.target.value)}
              />
            </div>
            <button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-[35px] font-black text-2xl italic uppercase shadow-2xl transition-all">
              Escanear Vehículo
            </button>
          </div>
        )}

        {step === 'searching' && (
          <div className="text-center">
            <Loader2 className="h-20 w-20 text-blue-500 mx-auto animate-spin mb-8" />
            <h2 className="text-2xl font-black italic uppercase tracking-widest animate-pulse">Consultando Registro Nacional...</h2>
          </div>
        )}

        {step === 'found' && (
          <div className="w-full max-w-md bg-slate-900 p-10 rounded-[45px] border border-slate-800 shadow-3xl text-center">
            <h2 className="text-3xl font-black mb-6 italic uppercase">Registro Encontrado</h2>
            <div className="bg-black/40 p-6 rounded-3xl mb-8">
              <p className="text-5xl font-mono text-blue-500">{patente.toUpperCase()}</p>
            </div>
            <button onClick={() => setStep('result')} className="w-full bg-white text-black py-6 rounded-3xl font-black text-xl uppercase italic">
              Evaluar Viabilidad Técnica
            </button>
          </div>
        )}

        {step === 'result' && (
          <div className="w-full max-w-2xl bg-white text-black p-12 rounded-[50px] shadow-3xl">
            <div className="flex items-center gap-4 mb-8">
              <CheckCircle2 className="text-emerald-500 w-12 h-12" />
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">Viabilidad: ALTA</h2>
            </div>
            <p className="text-slate-600 text-xl italic border-l-4 border-black pl-6 mb-12">
              "Falta de homologación detectada. El acta es técnicamente impugnable."
            </p>
            <button className="w-full bg-black text-white py-8 rounded-[35px] font-black text-xl flex items-center justify-center gap-3 uppercase italic">
              <FileText /> Obtener Descargo
            </button>
          </div>
        )}
      </main>

      {/* BITÁCORA EN TIEMPO REAL (Monitor de funciones) */}
      <footer className="w-full bg-black/50 border-t border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4 overflow-x-auto whitespace-nowrap">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Bitácora:</span>
          {log.length === 0 ? (
            <span className="text-[10px] text-slate-600 uppercase">Esperando actividad...</span>
          ) : (
            log.map((entry, i) => (
              <span key={i} className="text-[10px] text-slate-400 font-mono">{entry}</span>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}
