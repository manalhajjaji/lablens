import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Assistant from '@/components/assistant/Assistant'
import { DataProvider } from '@/context/DataContext'

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
        <DataProvider>
          <div className="flex h-screen bg-gray-50 relative">
            
            {/* Barre latérale gauche */}
            <Sidebar />
            
            {/* Zone principale sans la Navbar */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Le composant <Navbar /> a été supprimé ici */}
              
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>

            {/* Assistant Flottant (hors du flux principal) */}
            <Assistant />
            
          </div>
        </DataProvider>
      </body>
    </html>
  )
}