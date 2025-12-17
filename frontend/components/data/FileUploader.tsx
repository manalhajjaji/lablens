'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'
import { loader } from '@/lib/api'
import { useDataContext } from '@/context/DataContext'

export default function FileUploader({ onSuccess }: { onSuccess?: (data: any) => void }) {
  const { markDataAsLoaded } = useDataContext()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('📤 Uploading file:', file.name)
      
      // Appel à l'API
      const response = await loader.uploadFile(file)
      
      console.log('✅ Upload success:', response.data)
      setResult(response.data)
      
      // Marquer les données comme chargées
      markDataAsLoaded()
      
      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err)
      // Gestion améliorée des erreurs venant du backend (FastAPI)
      const msg = err.response?.data?.detail || err.message || "Erreur lors de l'upload ou du traitement."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Importer vos résultats</h3>
        <p className="text-gray-500 mt-2">Sélectionnez un fichier CSV (ex: bloodwork.csv) pour lancer l'analyse.</p>
      </div>

      {/* Zone de sélection */}
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                    <>
                        <FileText className="w-8 h-8 text-green-500 mb-2" />
                        <p className="text-sm text-gray-900 font-semibold">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                ) : (
                    <>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour upload</span></p>
                        <p className="text-xs text-gray-500">CSV uniquement</p>
                    </>
                )}
            </div>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {/* Bouton d'action */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 
          disabled:bg-gray-300 disabled:cursor-not-allowed
          flex items-center justify-center gap-3 font-semibold text-lg transition shadow-md"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Traitement en cours (Nettoyage & Indexation)...
          </>
        ) : (
          <>
            <Upload className="w-6 h-6" />
            Lancer l'analyse
          </>
        )}
      </button>

      {/* Message de Succès */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-green-900 text-lg">Succès !</p>
              <p className="text-green-800 mt-1">
                 Le fichier <strong>{result.filename}</strong> a été nettoyé et chargé.
              </p>
              <p className="text-sm text-green-700 mt-2">
                Les autres onglets et l'assistant IA sont maintenant disponibles. Vous pouvez les utiliser dès maintenant.
              </p>
      
            </div>
          </div>
        </div>
      )}

      {/* Message d'Erreur */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Une erreur est survenue</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}