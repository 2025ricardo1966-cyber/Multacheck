"use client";
import React, { useState, useRef } from 'react';
import { Search, ShieldCheck, AlertCircle, CheckCircle2, Scale, Upload, FileText, Loader2, Check } from 'lucide-react';

export default function MultaCheck() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [fileSelected, setFileSelected] = useState(null);
  const [progressText, setProgressText] = useState('Iniciando análisis...');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileSelected(e.target.files[0]);
    }
  };

  const handleStartAnalysis = () => {
    if (!jurisdiccion) {
      alert("Por favor, seleccioná primero la jurisdicción (CABA, PBA, etc.)");
      return;
    }
    if (!fileSelected) {
      alert("Por favor, seleccioná un archivo PDF o imagen de tu multa.");
      return;
    }

    setIsAnalyzing(true);
    
    const steps = [
      "Conectando con bases municipales...",
      `Verificando radares en ${jurisdiccion}...`,
      "Analizando plazos de notificación...",
      "Cruzando datos con Ley 24.449...",
      "Generando diagnóstico semáforo..."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setProgressText(step);
      }, (index + 1) * 1500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-bar {
          animation: progress 7.5s linear forwards;
        }
      `}</style>

      <nav className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900 uppercase">MultaCheck</span>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">ARGENTINA</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-12 px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Plataforma Nacional de Resolución de Infracciones</h2>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Asistencia técnica en redacción de descargos
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Analizá tu infracción según la Ley Nacional de Tránsito y detectá vicios de forma.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 mb-16 transition-all">
          {!isAnalyzing ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Lugar de la infracción</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                    value={jurisdiccion}
                    onChange={(e) => setJurisdiccion(e.target.value)}
                  >
                    <option value="">Seleccionar Jurisdicción...</option>
                    <option value="CABA">CABA</option>
                    <option value="Buenos Aires">Provincia de Buenos Aires</option>
                    <option value="Cordoba">Córdoba</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Dominio (Patente)</label>
                  <input 
                    type="text" 
                    placeholder="Patente del vehículo"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase font-semibold"
                  />
                </div>
              </div>

              {/* Botón de Carga / Zona de Arrastre */}
              <div 
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer bg-slate-50/50 group ${fileSelected ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-400'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,image/*"
                />
                {!fileSelected ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                    <p className="text-slate-600 font-bold text-lg">Subir PDF o Imagen de la multa</p>
                    <p className="text-slate-400 text-sm mt-1">Hacé clic aquí para seleccionar el archivo</p>
                  </>
                ) : (
                  <>
                    <div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="text-white w-8 h-8" />
                    </div>
                    <p className="text-emerald-700 font-bold text-lg">¡Archivo cargado!</p>
                    <p className="text-slate-500 text-sm mt-1 truncate max-w-xs mx-auto">{fileSelected.name}</p>
                  </>
                )}
              </div>

              <button 
                onClick={handleStartAnalysis}
                className={`w-full font-bold py-5 rounded-2xl shadow-lg transition-all text-xl ${fileSelected && jurisdiccion ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Comenzar Análisis Gratuito
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">{progressText}</h3>
                <p className="text-slate-500 font-medium">Procesando datos para el sistema de semáforo...</p>
              </div>
              <div className="max-w-xs mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full animate-progress-bar"></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
                <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-bold">Ley 24.449</p>
            </div>
            <div className="p-4">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-bold">Vicios de Forma</p>
            </div>
            <div className="p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold">98% Precisión</p>
            </div>
        </div>
      </main>
    </div>
  );
}
