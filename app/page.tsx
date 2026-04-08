"use client";
import React, { useState } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, Info, FileText, ShieldCheck } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Ingresá una patente válida");
    setStep('searching');
    const steps = ["Iniciando rastreo nacional...", "Cruzando bases de datos...", "Finalizando barrido..."];
    steps.forEach((text, i) => setTimeout(() => setProgressText(text), i * 1000));
    setTimeout(() => setStep('found'), 3500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      `}</style>

      <nav className="border-b border-slate-100 py-6 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="text-slate-900 w-6 h-6" />
            <span className="text-xl font-black uppercase italic">MultaCheck</span>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" /> Sistema Verificado
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto pt-20 px-6">
        {step === 'input' && (
          <div className="text-center animate-in fade-in duration-700">
            <h1 className="text-5xl font-black mb-6 tracking-tighter italic">Rastreo Nacional.</h1>
            <p className="text-slate-500 text-lg mb-10 font-medium">Ingresá tu patente para detectar infracciones en todo el país.</p>
            
            <div className="relative mb-6">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-8 h-8" />
              <input 
                type="text" 
                placeholder="AA123BB" 
                className="w-full pl-16 p-8 bg-slate-50 border-2 border-slate-100 rounded-[32px] font-mono text-4xl uppercase focus:border-slate-900 transition-all outline-none"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
              />
            </div>
            <button onClick={handleSearch} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 italic">
              BUSCAR MULTAS <ArrowRight />
            </button>
          </div>
        )}

        {step === 'searching' && (
          <div className="text-center py-20">
            <Loader2 className="h-16 w-16 text-slate-900 mx-auto animate-spin mb-6" />
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">{progressText}</h3>
          </div>
        )}

        {step === 'found' && (
          <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl animate-in zoom-in duration-500">
            <h2 className="text-3xl font-black mb-6 italic">Infracción Detectada.</h2>
            <div className="border-y border-white/10 py-6 mb-8 text-left">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Patente</p>
              <p className="text-3xl font-mono uppercase">{patente}</p>
            </div>
            <p className="text-slate-400 mb-8 font-medium">¿Deseas iniciar la evaluación técnica de viabilidad legal para esta acta?</p>
            <button onClick={() => setStep('result')} className="w-full bg-white text-slate-900 py-6 rounded-[32px] font-black text-xl italic uppercase">
              Sí, Evaluar ahora
            </button>
          </div>
        )}

        {step === 'result' && (
          <div className="animate-in slide-in-from-bottom duration-700">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Viabilidad: Alta</h2>
              </div>
              <p className="text-slate-500 text-lg italic border-l-4 border-slate-900 pl-6 mb-10">
                "Se detectó una falla técnica en el acta que permite fundamentar un descargo administrativo."
              </p>
              <button className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-2 uppercase italic">
                <FileText /> Generar Escrito de Defensa
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
