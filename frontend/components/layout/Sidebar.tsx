'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Database, BarChart3, Layers, 
  Repeat, Network, FileUp, Microscope, 
  ChevronRight, Settings, User
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
    <aside className="w-72 bg-[#0F172A] text-white flex flex-col h-screen border-r border-gray-800 shadow-2xl z-20">
      
      {/* --- ZONE LOGO MODERNE --- */}
      <div className="p-6 pb-8 border-b border-gray-800/60">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo Icon avec effet de verre/dégradé */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform duration-300">
            <Microscope className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Texte Logo */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              LabLens
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                Blood-Work Explorer
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Menu Principal
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          const isUploadTab = item.href === '/'
          const shouldDisplay = isUploadTab || isDataLoaded
          
          if (!shouldDisplay) return null
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center justify-between px-4 py-3 rounded-xl
                transition-all duration-200 border border-transparent
                ${isActive 
                  ? 'bg-blue-600/10 text-blue-400 border-blue-600/20 shadow-sm' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              )}
            </Link>
          )
        })}
      </nav>

      
    </aside>
  )
}