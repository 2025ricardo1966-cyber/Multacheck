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
    if (!patente || patente.length < 6) return alert("Por favor, ingresá una patente válida.");
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

      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg"><Scale className="text-white w-6 h-6" /></div>
            <span className="text-xl font-bold tracking-tight text-slate-800 uppercase">MultaCheck</span>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest italic">Asistencia Técnica Nacional</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 px-4 pb-20">
        
        {step === 'input' && (
          <div className="animate-in fade-in duration-500 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-900">Consulta y Evaluación de Infracciones</h1>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto font-medium">Centralizamos la búsqueda en registros municipales y nacionales para detectar errores de procedimiento.</p>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 inline-block w-full text-left">
              <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Buscador por Dominio (Patente)</label>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input 
                  type="text" 
                  placeholder="AA123BB o OID469" 
                  className="flex-grow p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-2xl uppercase focus:ring-2 focus:ring-slate-400 transition-all outline-none"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-lg"
                >
                  Consultar Infracciones
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-slate-300"><span className="bg-white px-4">O analizá un acta física</span></div>
              </div>

              <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                  <Upload className="w-5 h-5" /> {fileSelected ? "Documento cargado" : "Subir PDF o Imagen de la multa"}
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
               <h2 className="text-xl font-bold text-slate-800 uppercase mb-6 flex items-center gap-2 italic">
                 <Info className="text-blue-500" /> Registro Detectado
               </h2>
               <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-bold">
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1 tracking-tighter">Patente</p><p className="text-slate-900 text-lg">{patente.toUpperCase()}</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1 tracking-tighter">Actas Pendientes</p><p className="text-slate-900 text-lg">01</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1 tracking-tighter">Jurisdicción</p><p className="text-slate-900 uppercase text-lg italic">CABA / Nacional</p></div>
                    <div><p className="text-slate-400 uppercase text-[10px] mb-1 tracking-tighter">Estado Pago</p><p className="text-amber-600 text-lg">Vencida</p></div>
                  </div>
               </div>
               <p className="text-slate-600 mb-8 leading-relaxed font-medium">Nuestro sistema detectó inconsistencias técnicas que podrían ser evaluadas para un descargo administrativo.</p>
               <button 
                onClick={handleAutoAnalysis}
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
                style={{backgroundColor: '#2563eb'}}
               >
                 Iniciar Evaluación de Viabilidad <ArrowRight />
               </button>
            </div>
          </div>
        )}

        {/* ... resto de los estados (analyzing, result) con el mismo estilo sobrio ... */}
        {step === 'analyzing' && (
          <div className="text-center py-20 space-y-8">
            <Loader2 className="h-16 w-16 text-slate-300 mx-auto animate-spin" />
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">{progressText}</h3>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
             <div className="bg-white p-8 rounded-3xl shadow-xl border-l-8 border-emerald-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight italic">Análisis Técnico Completado</h2>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black mb-4 tracking-widest uppercase">
                  Viabilidad de Impugnación: ALTA
                </div>
                <p className="text-slate-600 leading-relaxed font-medium italic border-l-2 border-slate-100 pl-4">
                  "Existen argumentos técnicos sólidos basados en la falta de certificación del cinemómetro. Se recomienda proceder con asistencia en la redacción del descargo."
                </p>
             </div>

             <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold mb-1 uppercase tracking-tight italic">Obtener Escrito de Defensa</h3>
                  <p className="text-slate-400 text-xs font-medium">Documento personalizado listo para presentar ante el Juzgado de Faltas.</p>
                </div>
                <button className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold uppercase hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-900/20" style={{backgroundColor: '#2563eb'}}>
                  <FileText size={20} /> Generar Descargo
                </button>
             </div>

             <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
               <p className="text-[10px] text-amber-700 text-center leading-relaxed font-bold uppercase tracking-[0.15em]">
                 Aviso Legal: MultaCheck ofrece asistencia técnica administrativa. La resolución final queda sujeta a la interpretación de la autoridad de juzgamiento competente según Ley 24.449.
               </p>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
