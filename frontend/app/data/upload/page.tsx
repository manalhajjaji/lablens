'use client'

import FileUploader from '@/components/data/FileUploader'
import LocalDataLoader from '@/components/data/LocalDataLoader'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const router = useRouter()

  const handleSuccess = (data: any) => {
    console.log('✅ Data loaded:', data)
    // Rediriger vers la page de visualisation après 2 secondes
    setTimeout(() => {
      router.push('/data')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Charger des Données</h1>
        <p className="text-gray-600 mt-1">
          Upload un fichier CSV ou charge les données locales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocalDataLoader onSuccess={handleSuccess} />
        <FileUploader onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
