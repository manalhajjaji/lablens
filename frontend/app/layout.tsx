import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import Assistant from '@/components/assistant/Assistant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LabLens - Interactive Blood-Work Explorer',
  description: 'Analyse interactive de résultats de laboratoire',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-50 relative">
          
          {/* Barre latérale gauche */}
          <Sidebar />
          
          {/* Zone principale avec Navbar et Contenu */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>

          {/* Assistant Flottant (hors du flux principal) */}
          <Assistant />
          
        </div>
      </body>
    </html>
  )
}