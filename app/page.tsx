"use client";
import React, { useState, useEffect } from 'react';
import { Scale, Loader2, Search, FileText, ShieldCheck, Users, ChevronRight, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MultaCheck() {
  const [step, setStep] = useState('input'); 
  const [patente, setPatente] = useState('');
  const [visitas, setVisitas] = useState(1240); // Simulación de contador real
  
  // Lista simulada de infracciones para la patente ingresada
  const [multas, setMultas] = useState([
    { id: 1, tipo: "Exceso de Velocidad", fecha: "12/03/2026", lugar: "Ruta 2, Km 120", monto: "$45.200" },
    { id: 2, tipo: "Luz Roja", fecha: "05/04/2026", lugar: "Av. Libertador 4500", monto: "$32.100" },
    { id: 3, tipo: "Estacionamiento Medido", fecha: "07/04/2026", lugar: "Zona Centro", monto: "$12.500" }
  ]);

  const handleSearch = () => {
    if (!patente || patente.length < 6) return alert("Por favor, ingresá una patente válida.");
    setStep('evaluating');
    console.log(`[BITÁCORA]: Iniciando auditoría nacional para ${patente.toUpperCase()}`);
    
    setTimeout(() => {
        console.log(`[BITÁCORA]: ${multas.length} registros encontrados.`);
        setStep('results');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col items-center">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        body { background-color: #020617; margin: 0; }
      `}</style>

      {/* Navbar Profesional */}
      <nav className="w-full border-b border-slate-800/60 p-5 bg-slate-950/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Scale className="text-blue-500 w-6 h-6" />
            <span className="text-xl font-black uppercase italic tracking-tighter">MULTACHECK</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full border border-blue-500/20">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{visitas.toLocaleString()} Usuarios en línea</span>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-2xl px-6 py-16 flex-grow">
        
        {/* PASO 1: BÚSQUEDA */}
        {step === 'input' && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-5xl font-black mb-4 italic tracking-tighter">Auditoría de Infracciones</h1>
            <p className="text-slate-400 mb-10 font-medium italic">Análisis técnico de vicios de forma bajo Ley 24.449</p>
            
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] shadow-2xl">
              <div className="relative mb-4">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
                <input 
                  type="text" placeholder="AA123BB" 
                  className="w-full pl-14 p-6 bg-slate-950 border-2 border-slate-800 rounded-2xl font-mono text-3xl uppercase focus:border-blue-600 outline-none transition-all shadow-inner text-white"
                  value={patente} onChange={(e) => setPatente(e.target.value)}
                />
              </div>
              <button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-lg uppercase italic transition-all flex items-center justify-center gap-2">
                Consultar Registro Nacional <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 'evaluating' && (
          <div className="text-center py-20 animate-pulse">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin mb-6" />
            <h2 className="text-xl font-black uppercase italic tracking-widest">Sincronizando Jurisdicciones...</h2>
          </div>
        )}

        {/* PASO 2: LISTADO DE MULTAS */}
        {step === 'results' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase italic">Registros Detectados</h2>
                    <p className="text-slate-500 text-sm">Dominio: <span className="text-blue-500 font-mono">{patente.toUpperCase()}</span></p>
                </div>
                <div className="text-right">
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                        {multas.length} Pendientes
                    </span>
                </div>
            </div>

            <div className="space-y-4">
              {multas.map((multa) => (
                <div key={multa.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg text-slate-200">{multa.tipo}</h3>
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{multa.fecha} • {multa.lugar}</p>
                    </div>
                    <span className="text-xl font-mono font-bold text-white">{multa.monto}</span>
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all">
                    <CheckCircle size={16} /> Analizar Viabilidad Legal
                  </button>
                </div>
              ))}
            </div>

            <button 
                className="w-full mt-8 py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold hover:bg-slate-900/50 transition-all uppercase text-xs tracking-widest"
                onClick={() => setStep('input')}
            >
                Nueva Consulta
            </button>
          </div>
        )}
      </main>

      {/* Footer Limpio (Sin bitácora visible) */}
      <footer className="w-full p-8 border-t border-slate-800/40 text-center">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">MultaCheck © 2026 • Auditoría Técnica Vehicular</p>
      </footer>
    </div>
  );
}
