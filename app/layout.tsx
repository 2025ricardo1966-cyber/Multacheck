import React from 'react'

export const metadata = {
  title: 'MultaCheck',
  description: 'Análisis de multas con IA',
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
