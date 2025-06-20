import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CALLAB AI',
  description: 'KNPU CALLAB AI ASSISTANT',
  generator: 'YOJUN',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
