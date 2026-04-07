import './globals.css'

export const metadata = {
  title: 'MultaCheck - Analizador de Multas IA',
  description: 'Detectá errores en tus multas de tránsito',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
