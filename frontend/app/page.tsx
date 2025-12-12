'use client'

import FileUploader from '@/components/data/FileUploader'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

const handleSuccess = (data: any) => {
    console.log('✅ Data loaded', data)
    // Petit délai pour voir l'animation de succès
    setTimeout(() => {
        // Utiliser router.refresh() avant de naviguer peut aider à invalider le cache Next.js
        router.refresh() 
        router.push('/data') 
    }, 1500)
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 py-12 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          LabLens <span className="text-blue-600">Explorer</span>
        </h1>
        <p className="text-lg text-gray-600 mt-4">
          Plateforme d'analyse intelligente pour vos résultats biologiques.
          Chargez un fichier brut, nous nous occupons du nettoyage et des statistiques.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <FileUploader onSuccess={handleSuccess} />
      </div>
      
      <p className="text-sm text-gray-400">
        Format supporté : CSV (UTF-8 ou Latin-1). Colonnes requises : numorden, sexo, edad, nombre...
      </p>
    </div>
  )
}