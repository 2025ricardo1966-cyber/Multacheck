"use client";
import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check, FileText, Download, Lock, CheckCircle2, ShieldCheck, AlertCircle, Search, ArrowRight, Info } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef(null);

  const handleSearch = () => {
    if (!patente) return alert("Por favor, ingresá una patente.");
    setStep('searching');
    const searchSteps = ["Consultando registros públicos...", "Verificando estados de dominio...", "Sincronizando con bases municipales..."];
    searchSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 1000);
    });
    setTimeout(() => setStep('found'), 3500);
  };

  const handleAutoAnalysis = () => {
    setStep('analyzing');
    const analysisSteps = ["Cruzando datos con Ley 24.449...", "Revisando vigencia de cinemómetros...", "Evaluando plazos de notificación..."];
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

      {/* Navbar Sobria */}
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg"><Scale className="text-white w-6 h-6" /></div>
            <span className="text-xl font-bold tracking-tight text-slate-800 uppercase">MultaCheck</span>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Asistencia Administrativa</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 px-4 pb-20">
        
        {step === 'input' && (
          <div className="animate-in fade-in duration-500 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-900">Evaluación técnica de infracciones</h1>
            <p className="text-lg text-slate-600 mb-10">Detectamos posibles vicios de forma y errores de procedimiento según la normativa vigente.</p>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 inline-block w-full text-left">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Consulta por Dominio</label>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  type="text" 
                  placeholder="PATENTE" 
                  className="flex-grow p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-2xl uppercase focus:ring-2 focus:ring-slate-200 transition-all outline-none"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all"
                >
                  Consultar Registro
                </button>
              </div>

              <div onClick={() => fileInputRef.current.click()} className="border border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Adjuntar notificación para análisis técnico
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'searching' && (
          <div className="text-center py-20 space-y-6">
            <Loader2 className="h-16 w-16 text-slate-400 mx-auto animate-spin" />
            <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest">{progressText}</h3>
          </div>
        )}

        {step === 'found' && (
          <div className="animate-in zoom-in duration-500">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl">
               <h2 className="text-xl font-bold text-slate-800 uppercase mb-6 flex items-center gap-2">
                 <Info className="text-blue-500" /> Registro Encontrado
               </h2>
               <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1">Dominio</p><p className="text-slate-900">{patente.toUpperCase()}</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1">Acta N°</p><p className="text-slate-900">Q293844</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1">Jurisdicción</p><p className="text-slate-900 uppercase">CABA</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1">Estado</p><p className="text-amber-600">Pendiente</p></div>
                  </div>
               </div>
               <p className="text-slate-600 mb-8 leading-relaxed">Nuestro sistema puede realizar una evaluación técnica para verificar si el acta cumple con todos los requisitos formales de la Ley Nacional de Tránsito.</p>
               <button 
                onClick={handleAutoAnalysis}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
               >
                 Evaluar Viabilidad de Descargo <ArrowRight />
               </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
             <div className="bg-white p-8 rounded-3xl shadow-xl border-l-8 border-emerald-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Análisis Técnico Completado</h2>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                  PROBABILIDAD DE ÉXITO: ALTA
                </div>
                <p className="text-slate-600 leading-relaxed italic">
                  "Se han identificado posibles inconsistencias en la homologación del dispositivo de control. Esto permite fundamentar un descargo administrativo sólido."
                </p>
             </div>

             <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2 uppercase">Asistencia en Redacción</h3>
                    <p className="text-slate-400 text-sm">Obtené un borrador técnico basado en jurisprudencia y normativa vigente.</p>
                  </div>
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold uppercase hover:bg-blue-500 transition-all flex items-center gap-2 whitespace-nowrap">
                    <FileText size={18} /> Generar Escrito
                  </button>
                </div>
             </div>

             <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
               <p className="text-[10px] text-amber-700 text-center leading-relaxed font-medium uppercase tracking-wider">
                 Nota: Este informe es una evaluación técnica y no garantiza un resultado jurídico favorable. La resolución final depende de la autoridad de juzgamiento competente.
               </p>
             </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="text-center py-20 space-y-8">
            <Loader2 className="h-16 w-16 text-slate-300 mx-auto animate-spin" />
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">{progressText}</h3>
          </div>
        )}

      </main>
    </div>
  );
}
