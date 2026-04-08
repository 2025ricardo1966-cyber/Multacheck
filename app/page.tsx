"use client";
import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check, AlertTriangle, XCircle, FileText, Download, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); // 'input', 'analyzing', 'result'
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('Iniciando análisis...');
  const fileInputRef = useRef(null);

  const handleStartAnalysis = () => {
    if (!jurisdiccion || !fileSelected) return;
    setStep('analyzing');
    
    const steps = [
      "Conectando con bases municipales...",
      `Verificando radares en ${jurisdiccion}...`,
      "Analizando plazos de notificación...",
      "Cruzando datos con Ley 24.449...",
      "Generando diagnóstico semáforo..."
    ];

    steps.forEach((text, index) => {
      setTimeout(() => {
        setProgressText(text);
        if (index === steps.length - 1) setTimeout(() => setStep('result'), 1000);
      }, (index + 1) * 1500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        .blur-text { filter: blur(5px); user-select: none; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        .animate-progress-bar { animation: progress 7.5s linear forwards; }
      `}</style>

      {/* Navbar con Azul */}
      <nav className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Scale className="text-white w-6 h-6" /></div>
            <span className="text-xl font-bold tracking-tight text-blue-900 uppercase">MultaCheck</span>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase italic">Beta Argentina</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-12 px-4 pb-20">
        
        {step === 'input' && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-10">
              <h2 className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3 italic">Asistencia técnica y administrativa nacional</h2>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Resolvé tus infracciones con IA</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">Analizá tu multa según la Ley 24.449 y detectá vicios de forma al instante.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 mb-10">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <select className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={jurisdiccion} onChange={(e) => setJurisdiccion(e.target.value)}>
                  <option value="">Lugar de la infracción...</option>
                  <option value="CABA">CABA</option>
                  <option value="PBA">Provincia de Buenos Aires</option>
                  <option value="Cordoba">Córdoba</option>
                </select>
                <input type="text" placeholder="Patente del vehículo" className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>

              {/* Recuadro de carga con Azul */}
              <div onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${fileSelected ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'}`}>
                <input type="file" ref={fileInputRef} onChange={(e) => setFileSelected(e.target.files[0])} className="hidden" accept=".pdf,image/*" />
                {!fileSelected ? (
                  <><Upload className="mx-auto h-12 w-12 text-blue-300 hover:text-blue-500 mb-4" /><p className="text-slate-600 font-bold text-lg">Subir PDF o Imagen de la multa</p></>
                ) : (
                  <><div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="text-white w-8 h-8" /></div><p className="text-emerald-700 font-bold text-lg italic">Documento listo para análisis</p></>
                )}
              </div>

              {/* Botón Principal con Azul */}
              <button onClick={handleStartAnalysis} className={`w-full mt-6 font-bold py-5 rounded-2xl transition-all text-xl shadow-lg ${fileSelected && jurisdiccion ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Comenzar Análisis Gratuito</button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-8 animate-in zoom-in duration-500">
            <Loader2 className="h-20 w-20 text-blue-600 mx-auto animate-spin" />
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{progressText}</h3>
              <p className="text-slate-500 text-lg">Nuestros algoritmos están buscando inconsistencias legales...</p>
            </div>
            <div className="max-w-md mx-auto bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full animate-progress-bar w-full"></div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            {/* SEMAFORO RESULTADO */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-t-8 border-emerald-500">
              <div className="flex items-start gap-6">
                <div className="bg-emerald-100 p-4 rounded-2xl"><CheckCircle2 className="text-emerald-600 w-12 h-12" /></div>
                <div className="flex-grow">
                  <h2 className="text-3xl font-black text-slate-900 mb-1 italic uppercase">🟢 Alta probabilidad de anulación</h2>
                  <p className="text-slate-600 text-lg mb-4">Se han detectado <span className="font-bold text-emerald-600">3 vicios de forma</span> en el acta analizada.</p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <p className="text-emerald-800 font-medium">💡 Podrías evitar el pago total de: <span className="font-bold text-xl font-mono">$124.500,00</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVISUALIZACION Y PAYWALL CON AZUL */}
            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b pb-4"><FileText className="text-slate-400" /><span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ejemplo de tu Descargo</span></div>
                <div className="space-y-4 opacity-40 italic">
                  <p className="font-bold text-slate-900 border-b pb-2">AL SR. JUEZ DE FALTAS DE {jurisdiccion.toUpperCase()}</p>
                  <p className="text-xs">Quien suscribe, [Nombre blureado], titular del DNI [...], con relación al acta N° [...], expone:</p>
                  <p className="text-xs font-bold blur-text leading-loose">FUNDAMENTOS: Que por la presente vengo a impugnar el acta de referencia por cuanto la notificación fue extemporánea y el radar utilizado carece de homologación vigente según ANSV...</p>
                  <p className="text-xs font-bold blur-text leading-loose">PETITORIO: Solicito el archivo inmediato de las actuaciones por vicio de procedimiento irreversible...</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent flex items-center justify-center">
                   <div className="bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl text-center text-white border border-white/20 shadow-2xl max-w-xs transform -rotate-1">
                      <Lock className="mx-auto mb-2 w-8 h-8 text-amber-400" />
                      <p className="font-bold mb-2 uppercase text-xs tracking-widest">Documento Bloqueado</p>
                      <p className="text-[10px] leading-relaxed opacity-80">Finalizá el pago para descargar tu defensa legal personalizada y la guía de presentación.</p>
                   </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
                  <h3 className="text-xl font-bold mb-2 tracking-tight">Generar documento listo para presentar</h3>
                  <p className="text-sm opacity-90 mb-6">Incluye escrito personalizado, fundamentos legales y guía práctica de presentación.</p>
                  <div className="text-3xl font-black mb-6 tracking-tighter">$ 4.500 <span className="text-sm font-normal opacity-70">Pago único</span></div>
                  <button className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    Descargar Ahora <Download className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500 leading-relaxed italic italic">"La sensación de saber qué hacer ante una situación frustrante es nuestro mayor valor."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con Iconos con Azul */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 text-center border-t border-slate-200 pt-10">
            <div className="p-4 bg-white rounded-xl shadow-sm border">
                <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Contrastamos el acta con la Ley Nacional 24.449.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border">
                <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Detectamos falta de homologación en radares.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Alta precisión en vicios procedimentales.</p>
            </div>
        </div>
      </main>
    </div>
  );
}
