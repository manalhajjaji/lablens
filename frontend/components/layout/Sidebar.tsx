'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Database, BarChart3, Layers, 
  Repeat, Network, FileUp 
} from 'lucide-react'
import { useDataContext } from '@/context/DataContext'

const menuItems = [
  { href: '/', label: 'Upload CSV', icon: FileUp },
  { href: '/data', label: 'Données', icon: Database },
  { href: '/data/dashboard', label: 'Dashboard', icon: Home },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/panels', label: 'Panels', icon: Layers },
  { href: '/repeats', label: 'Tests Répétés', icon: Repeat },
  { href: '/coorder', label: 'Co-ordering', icon: Network },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isDataLoaded } = useDataContext()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">LabLens</h1>
        <p className="text-gray-400 text-sm mt-1">Blood-Work Explorer</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          // Afficher uniquement l'onglet Upload ou tous les onglets si data est chargée
          const isUploadTab = item.href === '/'
          const shouldDisplay = isUploadTab || isDataLoaded
          
          if (!shouldDisplay) {
            return null
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg
                transition-colors duration-150
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      
    </aside>
  )
}
