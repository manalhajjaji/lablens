'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { loader } from '@/lib/api'

export default function FileUploader({ onSuccess }: { onSuccess?: (data: any) => void }) {
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
      const response = await loader.uploadFile(file)
      
      console.log('✅ Upload success:', response.data)
      setResult(response.data)
      
      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur lors de l\'upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📁 Upload Fichier CSV
      </h3>

      {/* File Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un fichier CSV
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
        </div>
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            ✅ Fichier sélectionné : <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
          disabled:bg-gray-300 disabled:cursor-not-allowed
          flex items-center justify-center gap-2 font-semibold transition"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Upload en cours...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Uploader et Traiter
          </>
        )}
      </button>

      {/* Success Message */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">{result.message}</p>
              <p className="text-sm text-green-700 mt-1">
                📊 <strong>{result.rows.toLocaleString()}</strong> lignes chargées
              </p>
              <p className="text-xs text-green-600 mt-1">
                📁 Fichier nettoyé : {result.clean_csv_path}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
