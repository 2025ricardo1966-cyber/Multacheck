"use client";
import React, { useState, useRef } from 'react';
import { Scale, Loader2, CheckCircle2, Search, ArrowRight, Info, FileText, Download, ShieldCheck } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // input, searching, found, analyzing, result
  const [patente, setPatente] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    setStep('searching');
    
    const searchSteps = [
      "Iniciando rastreo nacional...",
      "Cruzando datos CABA y PBA...",
      "Sincronizando con Córdoba y Santa Fe...",
      "Finalizando barrido ANSV..."
    ];

    searchSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 900);
    });
    setTimeout(() => setStep('found'), 3800);
  };

  const handleAutoAnalysis = () => {
    setStep('analyzing');
    const analysisSteps = [
      "Evaluando normativa 24.449...",
      "Verificando cinemómetros...",
      "Calculando viabilidad técnica..."
    ];
    
    analysisSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 1100);
    });
    setTimeout(() => setStep('result'), 3500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress-bar { animation: progress 3.5s linear forwards; }
      `}</style>

      {/* Header Minimalista */}
      <nav className="border-b border-slate-100 py-6">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="text-slate-900 w-6 h-6" />
            <span className="text-xl font-black tracking-tighter uppercase">MultaCheck</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" /> Conexión Segura
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-16 px-6 pb-20">
        
        {/* PASO 1: LA MAGIA COMIENZA AQUÍ */}
        {step === 'input' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
              <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-none italic">
                Rastreo Nacional de Infracciones.
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                Ingresá tu patente para centralizar todas tus multas pendientes en segundos. 
              </p>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-7 w-7 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="AA123BB" 
                className="w-full pl-16 p-8 bg-slate-50 border-2 border-slate-100 rounded-3xl font-mono text-4xl uppercase focus:bg-white focus:border-slate-900 transition-all outline-none shadow-sm"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                className="w-full mt-6 bg-slate-900 text-white py-6 rounded-3xl font-black text-xl hover:bg-black transition-all shadow-2xl uppercase italic tracking-tighter flex items-center justify-center gap-3"
              >
                Iniciar Búsqueda Automática <ArrowRight size={24} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: BUSCANDO EN TODO EL PAÍS */}
        {step === 'searching' && (
          <div className="text-center py-20 space-y-8 animate-pulse">
            <Loader2 className="h-20 w-20 text-slate-900 mx-auto animate-spin" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">{progressText}</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">No cierres esta ventana</p>
            </div>
          </div>
        )}

        {/* PASO 3: EL SEMÁFORO - DETECCIÓN Y AUTORIZACIÓN */}
        {step === 'found' && (
          <div className="animate-in zoom-in duration-500">
            <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black mb-6 uppercase tracking-widest">
                   <Info size={14} /> Registro Detectado
                 </div>
                 <h2 className="text-4xl font-black mb-6 italic leading-none">Hemos encontrado una infracción pendiente.</h2>
                 
                 <div className="grid grid-cols-2 gap-8 mb-10 border-y border-white/10 py-8">
                    <div><p className="text-slate-500 uppercase text-[10px] font-bold mb-1">Dominio</p><p className="text-2xl font-mono">{patente.toUpperCase()}</p></div>
                    <div><p className="text-slate-500 uppercase text-[10px] font-bold mb-1">Jurisdicción</p><p className="text-2xl font-black italic uppercase">CABA / Nacional</p></div>
                 </div>

                 <p className="text-slate-400 mb-10 text-lg font-medium">
                   ¿Estás dispuesto a realizar una evaluación técnica para verificar si el acta cumple con los requisitos legales de la Ley 24.449?
                 </p>

                 <button 
                  onClick={handleAutoAnalysis}
                  className="w-full bg-white text-slate-900 font-black py-6 rounded-3xl text-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 uppercase italic"
                 >
                   Sí, iniciar evaluación técnica <ArrowRight />
                 </button>
                 <button onClick={() => setStep('input')} className="w-full mt-4 text-white/40 font-bold text-xs uppercase hover:text-white transition-colors">Cancelar</button>
               </div>
            </div>
          </div>
        )}

        {/* PASO 4: ANALIZANDO (MOMENTO TÉCNICO) */}
        {step === 'analyzing' && (
          <div className="text-center py-20 space-y-8">
            <Loader2 className="h-16 w-16 text-slate-300 mx-auto animate-spin" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">{progressText}</h3>
            <div className="max-w-xs mx-auto h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-slate-900 h-full animate-progress-bar"></div>
            </div>
          </div>
        )}

        {/* PASO 5: RESULTADO FINAL (DESPUÉS DEL SEMÁFORO) */}
        {step === 'result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
             <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-100 p-3 rounded-2xl"><CheckCircle2 className="text-emerald-600 w-8 h-8" /></div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Viabilidad Técnica: ALTA</h2>
                </div>
                <p className="text-slate-500 text-xl leading-relaxed font-medium italic border-l-4 border-slate-900 pl-6 mb-10">
                  "El acta presenta una inconsistencia en la calibración del dispositivo emisor. Existe fundamento técnico para una revisión administrativa."
                </p>

                <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Obtener Asistencia</h3>
                    <p className="text-slate-400 text-sm">Descargá el borrador técnico para tu defensa.</p>
                  </div>
                  <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black uppercase hover:bg-slate-100 transition-all flex items-center gap-2">
                    <FileText size={18} /> Generar Escrito
                  </button>
                </div>
             </div>

             <p className="text-[10px] text-slate-300 text-center leading-relaxed font-bold uppercase tracking-widest px-10">
               Nota: Este informe provee asistencia técnica-administrativa. La resolución final depende de la autoridad de juzgamiento competente.
             </p>
          </div>
        )}

      </main>
    </div>
  );
}
