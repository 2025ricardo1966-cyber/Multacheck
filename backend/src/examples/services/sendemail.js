export async function sendDefenseEmail(to, filePath) {
  try {
    console.log("📩 EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📩 TO:", to);
    console.log("📩 FILE:", filePath);

    await transporter.sendMail({
      from: `"MULTACHECK" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Tu descargo de infracción',
      text: 'Adjuntamos tu documento de defensa. También recordá que podés presentarlo ante el juzgado correspondiente.',
      attachments: [
        {
          filename: 'descargo.pdf',
          path: filePath
        }
      ]
    });

    console.log('📧 Email enviado correctamente');
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}