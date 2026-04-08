"use client";
import React, { useState, useEffect } from 'react';
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

  // Log inicial para confirmar que la bitácora funciona
  useEffect(() => {
    addLog("Sistema iniciado. Monitor de auditoría en línea.");
  }, []);

  const handleStart = () => {
    if (!patente) return alert("Ingresá una patente.");
    addLog(`Solicitud de auditoría para dominio: ${patente}`);
    setStep('evaluating');
    setTimeout(() => { 
      addLog("Registro nacional detectado. Analizando inconsistencias..."); 
      setStep('found'); 
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-between">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: black !important; color: white !important; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <nav className="w-full border-b border-gray-800 p-6 bg-black">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl italic tracking-tighter text-white">
            <Scale className="text-blue-500" /> MULTACHECK
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-700 px-4 py-1 rounded-full">
            Auditoría Administrativa
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="w-full max-w-2xl flex-grow flex flex-col items-center justify-center px-6">
        {step === 'input' && (
          <div className="w-full text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-6 italic tracking-tighter text-white">Evaluación Experta.</h1>
            <p className="text-gray-400 text-lg mb-10">Detección de vicios de forma en actas nacionales.</p>
            <div className="w-full relative mb-6">
              <input 
                type="text" 
                placeholder="INGRESAR PATENTE" 
                className="w-full p-8 bg-gray-900 border-2 border-gray-700 rounded-3xl font-mono text-4xl uppercase text-white placeholder-gray-600 focus:border-blue-500 outline-none transition-all"
                value={patente} 
                onChange={(e) => setPatente(e.target.value)}
              />
            </div>
            <button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-7 rounded-3xl font-black text-2xl italic uppercase transition-all shadow-lg shadow-blue-900/20">
              AUDITAR VEHÍCULO
            </button>
          </div>
        )}

        {step === 'evaluating' && (
          <div className="text-center py-20">
            <Loader2 className="h-20 w-20 text-blue-500 mx-auto animate-spin mb-8" />
            <h2 className="text-2xl font-black italic uppercase text-white animate-pulse">Sincronizando Registros...</h2>
          </div>
        )}

        {step === 'found' && (
          <div className="w-full bg-gray-900 p-10 rounded-[40px] border border-gray-700 text-center shadow-2xl">
            <h2 className="text-3xl font-black mb-6 italic uppercase text-white">Registro Detectado</h2>
            <div className="bg-black p-6 rounded-3xl mb-10 border border-gray-800 italic font-mono text-5xl text-blue-500">
              {patente.toUpperCase()}
            </div>
            <button onClick={() => setStep('input')} className="w-full bg-white text-black py-6 rounded-3xl font-black text-xl uppercase italic hover:bg-gray-200 transition-all">
              INICIAR AUDITORÍA TÉCNICA
            </button>
          </div>
        )}
      </main>

      {/* BITÁCORA / MONITOR DE FUNCIONES (Diseño reforzado) */}
      <footer className="w-full bg-black border-t-2 border-blue-900 p-6 mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em]">
              Cuaderno de Bitácora Local
            </p>
          </div>
          <div className="bg-gray-950 p-4 rounded-xl h-28 overflow-y-auto font-mono text-[12px] text-gray-400 border border-gray-800 shadow-inner flex flex-col-reverse gap-1">
            {bitacora.length === 0 ? (
              <span className="text-gray-700 italic uppercase">Esperando eventos del sistema...</span>
            ) : (
              bitacora.map((l, i) => (
                <div key={i} className="border-b border-gray-900 pb-1">
                  <span className="text-blue-900 font-bold mr-2">&gt;</span>{l}
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
