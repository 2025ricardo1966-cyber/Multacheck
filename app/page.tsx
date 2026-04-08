"use client";
import React, { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, CheckCircle2, Scale, Upload, FileText, Loader2 } from 'lucide-react';

export default function MultaCheck() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [progressText, setProgressText] = useState('Iniciando análisis...');

  const handleStartAnalysis = () => {
    if (!jurisdiccion) {
      alert("Por favor, seleccioná la jurisdicción");
      return;
    }
    setIsAnalyzing(true);
    
    // Simulamos la lógica de "Agregador Inteligente"
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
        if (index === steps.length - 1) {
          // Aquí iría la redirección al resultado
          console.log("Análisis finalizado");
        }
      }, (index + 1) * 1500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      `}</style>

      {/* Header Profesional */}
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
            Asistencia administrativa técnica en redacción de descargos
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analizá tu multa según la Ley Nacional de Tránsito y descubrí vicios de forma en segundos.
          </p>
        </div>

        {/* COMPONENTE DE CARGA LÓGICO */}
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 mb-16 transition-all">
          {!isAnalyzing ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Jurisdicción */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Lugar de la infracción</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={jurisdiccion}
                    onChange={(e) => setJurisdiccion(e.target.value)}
                  >
                    <option value="">Seleccionar Provincia...</option>
                    <option value="CABA">CABA</option>
                    <option value="Buenos Aires">Provincia de Buenos Aires</option>
                    <option value="Cordoba">Córdoba</option>
                    <option value="Santa Fe">Santa Fe</option>
                  </select>
                </div>
                {/* Patente */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Dominio (Patente)</label>
                  <input 
                    type="text" 
                    placeholder="AA123BB"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50 group">
                <input type="file" className="hidden" id="fileUpload" />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                  <p className="text-slate-600 font-medium">Subí tu multa (PDF o Imagen)</p>
                  <p className="text-slate-400 text-sm mt-1">El análisis será 100% gratuito</p>
                </label>
              </div>

              <button 
                onClick={handleStartAnalysis}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all text-xl"
              >
                Analizar Gratis
              </button>
            </div>
          ) : (
            /* ESTADO ANALIZANDO */
            <div className="py-12 text-center space-y-6 animate-pulse">
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">{progressText}</h3>
                <p className="text-slate-500">Estamos verificando la viabilidad legal de tu caso...</p>
              </div>
              <div className="max-w-xs mx-auto bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full animate-progress-bar w-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info - Genera credibilidad */}
        <p className="text-center text-slate-400 text-sm italic">
          "El sistema asume que tiene debilidades en ciertas jurisdicciones; si no podemos confirmar tu petición, se te informará de inmediato."
        </p>
      </main>
    </div>
  );
}
