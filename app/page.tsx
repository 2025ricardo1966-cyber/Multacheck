"use client";
import React, { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, CheckCircle2, Scale } from 'lucide-react';

export default function MultaCheck() {
  const [inputValue, setInputValue] = useState('');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
      `}</style>
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md">
              <Scale className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-900 uppercase">MultaCheck</span>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">BETA ARGENTINA</span>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto pt-16 px-4 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">¿Te hicieron una multa injusta?</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Analizá tu infracción con IA y descubrí errores de procedimiento en segundos.</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 mb-16">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input type="text" className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-xl text-lg outline-none" placeholder="Ingresá el número de acta..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg">Analizar Acta</button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <ShieldCheck className="text-blue-600 w-10 h-10 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Base Legal</h3>
            <p className="text-slate-500 text-sm">Contrastamos el acta con la Ley 24.449.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <AlertCircle className="text-amber-600 w-10 h-10 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Errores Comunes</h3>
            <p className="text-slate-500 text-sm">Detectamos falta de calibración o fallas técnicas.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <CheckCircle2 className="text-emerald-600 w-10 h-10 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">98% Efectividad</h3>
            <p className="text-slate-500 text-sm">Alta precisión en vicios de procedimiento.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
