"use client";
import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check, FileText, Download, Lock, CheckCircle2, ShieldCheck, AlertCircle, Search, ArrowRight, Info } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [jurisdiccion, setJurisdiccion] = useState(''); // Ahora es opcional
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef(null);

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    setStep('searching');
    
    // Si no elige jurisdicción, el sistema avisa que busca en TODO el país
    const scope = jurisdiccion ? jurisdiccion : "todo el territorio nacional";
    const searchSteps = [
      `Iniciando barrido en ${scope}...`,
      "Consultando registros de CABA y PBA...",
      "Sincronizando con Córdoba y Santa Fe...",
      "Verificando base de datos ANSV..."
    ];

    searchSteps.forEach((text, i) => {
      setTimeout(() => setProgressText(text), i * 1000);
    });
    setTimeout(() => setStep('found'), 4000);
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
            <span className="text-xl font-bold tracking-tight text-slate-800 uppercase italic">MultaCheck</span>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Central de Consultas Nacional</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-10 px-4 pb-20">
        
        {step === 'input' && (
          <div className="animate-in fade-in duration-500 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-slate-900 leading-none italic">
              Evaluación Técnica de Infracciones
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Centralizamos la búsqueda en registros municipales y nacionales para detectar errores de procedimiento y vicios de forma.
            </p>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 inline-block w-full text-left">
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-grow">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Dominio / Patente</label>
                  <input 
                    type="text" 
                    placeholder="AA123BB" 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-2xl uppercase focus:ring-2 focus:ring-slate-400 transition-all outline-none"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value)}
                  />
                </div>
                <div className="md:w-1/3">
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Provincia (Opcional)</label>
                  <select 
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-500 outline-none"
                    value={jurisdiccion}
                    onChange={(e) => setJurisdiccion(e.target.value)}
                  >
                    <option value="">Todas (Nacional)</option>
                    <option value="CABA">CABA</option>
                    <option value="PBA">Buenos Aires</option>
                    <option value="Cordoba">Córdoba</option>
                    <option value="SantaFe">Santa Fe</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSearch}
                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl uppercase tracking-tighter italic"
              >
                Consultar Infracciones Gratis
              </button>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">¿Ya tenés el acta física?</p>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors"
                >
                  <Upload size={16} /> Subir PDF o Imagen para análisis técnico
                  <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BUSCANDO */}
        {step === 'searching' && (
          <div className="text-center py-20 space-y-6 animate-in zoom-in duration-300">
            <Loader2 className="h-16 w-16 text-slate-400 mx-auto animate-spin" />
            <h3 className="text-xl font-black text-slate-700 uppercase tracking-[0.1em] italic">{progressText}</h3>
            <p className="text-slate-400 text-sm">Estamos consolidando datos de múltiples juzgados de faltas.</p>
          </div>
        )}

        {/* RESULTADO DE BÚSQUEDA */}
        {step === 'found' && (
          <div className="animate-in zoom-in duration-500">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl">
               <h2 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2 italic">
                 <Info className="text-blue-500" /> Registro de Infracción Detectado
               </h2>
               <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-black italic">
                    <div><p className="text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Patente</p><p className="text-slate-900 text-lg uppercase">{patente}</p></div>
                    <div><p className="text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Total Actas</p><p className="text-slate-900 text-lg italic">01 Pendiente</p></div>
                    <div><p className="text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Jurisdicción</p><p className="text-slate-900 uppercase text-lg italic">{jurisdiccion || "CABA/PBA"}</p></div>
                    <div><p className="text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Estado</p><p className="text-amber-600 text-lg uppercase">Vencida</p></div>
                  </div>
               </div>
               <p className="text-slate-500 mb-8 leading-relaxed font-medium italic border-l-4 border-blue-500 pl-4">
                 Hemos detectado que el acta presenta inconsistencias técnicas preliminares según los estándares de la Ley Nacional de Tránsito.
               </p>
               <button 
                onClick={handleAutoAnalysis}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 uppercase italic tracking-tighter"
                style={{backgroundColor: '#2563eb'}}
               >
                 Iniciar Evaluación de Viabilidad Técnica <ArrowRight />
               </button>
            </div>
          </div>
        )}

        {/* ANALIZANDO LEGALMENTE */}
        {step === 'analyzing' && (
          <div className="text-center py-20 space-y-8">
            <Loader2 className="h-16 w-16 text-slate-300 mx-auto animate-spin" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">{progressText}</h3>
          </div>
        )}

        {/* VEREDICTO FINAL PROFESIONAL */}
        {step === 'result' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
             <div className="bg-white p-10 rounded-3xl shadow-xl border-l-8 border-emerald-500">
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">Diagnóstico Administrativo Completado</h2>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black mb-6 tracking-widest uppercase">
                  Viabilidad de Impugnación: PROBABLE
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border-l-2 border-slate-200">
                  <p className="text-slate-700 leading-relaxed font-medium italic">
                    "El acta analizada carece de la validación técnica semestral requerida para dispositivos cinemómetros (radares). Este vicio de forma permite fundamentar un descargo administrativo sólido."
                  </p>
                </div>
             </div>

             <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight italic">Asistencia en Redacción</h3>
                  <p className="text-slate-400 text-sm font-medium">Generamos tu escrito técnico personalizado listo para presentar ante el juzgado correspondiente.</p>
                </div>
                <button className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all flex items-center gap-3 shadow-2xl shadow-blue-900/40" style={{backgroundColor: '#2563eb'}}>
                  <FileText size={20} /> Generar Escrito
                </button>
             </div>

             <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
               <p className="text-[10px] text-amber-700 text-center leading-relaxed font-black uppercase tracking-widest">
                 Aviso Institucional: MultaCheck provee herramientas de asistencia técnica-administrativa. La resolución final queda sujeta exclusivamente al criterio de la autoridad de juzgamiento (Ley 24.449).
               </p>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
