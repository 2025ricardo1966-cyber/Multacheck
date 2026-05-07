import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export function generateDefense(data) {
  const docId = uuidv4();

  // RUTA ABSOLUTA CORRECTA
  const filePath = path.resolve('storage', `${docId}.pdf`);

  // CREAR STREAM
  const stream = fs.createWriteStream(filePath);

  const doc = new PDFDocument();
  doc.pipe(stream);

  doc.fontSize(16).text('DESCARGO DE INFRACCIÓN', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Patente: ${data.patente}`);
  doc.text(`Fecha: ${data.fecha}`);
  doc.text(`Lugar: ${data.lugar}`);
  doc.moveDown();

  doc.text('A quien corresponda:');
  doc.moveDown();

  doc.text(
    'Por medio de la presente, me dirijo a usted a fin de presentar formal descargo respecto a la infracción mencionada.'
  );

  doc.moveDown();

  doc.text('Fundamentos:');
  data.fundamentos.forEach(f => {
    doc.text(`- ${f}`);
  });

  doc.moveDown();

  doc.text('Solicito se tenga por presentado este descargo.');

  doc.moveDown();

  doc.text(`Nombre: ${data.nombre}`);
  doc.text(`DNI: ${data.dni}`);

  doc.moveDown();

  doc.fontSize(8).text(
    'NOTA: Las inconsistencias y vicios formales identificados han sido analizados conforme a la normativa vigente en la República Argentina. El resultado es probabilístico y queda sujeto al criterio del juez interviniente.',
    { align: 'justify' }
  );

  doc.end();

  // LOG PARA VERIFICAR
  stream.on('finish', () => {
    console.log('PDF creado en:', filePath);
  });

  return { filePath, docId };
}