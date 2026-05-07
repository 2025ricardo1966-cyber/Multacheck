import engine from './services/scoringengine.js';

console.log('🚀 MULTACHECK: Iniciando prueba de motor...');

const multa = {
  patente: 'ABC123',
  tipo_infraccion: 'velocidad',
  jurisdiccion: 'CABA',
  notificacion: 'no'
};

const resultado = await engine.analizarMulta(multa);

console.log('✅ RESULTADO DEL ANÁLISIS:');
console.log(JSON.stringify(resultado, null, 2));