import React from 'react';
import { Search, ShieldCheck, AlertCircle } from 'lucide-react';

export default function MultacheckPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">MultaCheck</h1>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Beta Argentina</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-16 px-4 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">¿Te hicieron una multa injusta?</h2>
          <p className="text-lg text-slate-600 italic">Analizá tu infracción con IA y descubrí errores de procedimiento en segundos.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex flex-col space-y-4">
            <label className="text-sm font-semibold text-slate-700">Ingresá el número de acta o código de infracción:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Ej: ABC-123456" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-200">
                Analizar Acta
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white p-6 rounded-xl border border-slate-100">
            <ShieldCheck className="text-green-500 mb-4" size={32} />
            <h3 className="font-bold mb-2">Base Legal</h3>
            <p className="text-sm text-slate-500">Contrastamos el acta con la Ley Nacional de Tránsito 24.449.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100">
            <AlertCircle className="text-orange-500 mb-4" size={32} />
            <h3 className="font-bold mb-2">Errores Comunes</h3>
            <p className="text-sm text-slate-500">Detectamos falta de calibración en radares o actas mal confeccionadas.</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100">
            <div className="text-blue-600 font-bold text-2xl mb-4">98%</div>
            <h3 className="font-bold mb-2">Efectividad</h3>
            <p className="text-sm text-slate-500">De precisión en la detección de vicios formales de procedimiento.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
