"use client"

import { useEffect, useState } from "react"
import { coordering } from "@/lib/api"
import dynamic from "next/dynamic"
import { AlertCircle } from "lucide-react"

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

export default function HeatmapByService() {
  const [series, setSeries] = useState<any[]>([])
  const [xAxis, setXAxis] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    coordering.getMatrixByService()
      .then((res) => {
        const data = res.data || []
        
        if (data.length === 0) {
            setLoading(false)
            return
        }

        // 1. Calculer les totaux par service pour trier
        const freq: Record<string, number> = {}
        data.forEach((d: any) => {
          freq[d.service1] = (freq[d.service1] || 0) + d.freq
          freq[d.service2] = (freq[d.service2] || 0) + d.freq
        })

        // 2. Extraire les Noms Uniques triés par fréquence
        const uniqueServices = Array.from(new Set([
            ...data.map((d: any) => d.service1),
            ...data.map((d: any) => d.service2)
        ]))
        
        const sortedServices = uniqueServices.sort((a: any, b: any) => {
            return (freq[b] || 0) - (freq[a] || 0)
        })

        // 3. Construire la matrice pour ApexCharts
        // Format: [{ name: 'ServiceA', data: [valA_A, valA_B, ...] }]
        const matrix = sortedServices.map((rowService) => ({
          name: rowService,
          data: sortedServices.map((colService) => {
            // Chercher la paire (A, B) ou (B, A) car c'est symétrique
            if (rowService === colService) return 0 // Pas de diagonale
            
            const found = data.find((d: any) => 
                (d.service1 === rowService && d.service2 === colService) ||
                (d.service1 === colService && d.service2 === rowService)
            )
            return found ? found.freq : 0
          }),
        }))

        setSeries(matrix)
        setXAxis(sortedServices)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Erreur Heatmap:", err)
        setError("Impossible de charger les données de co-occurrence.")
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="p-12 text-center bg-white rounded-xl shadow border border-gray-200">
        <p className="text-gray-500 animate-pulse">Calcul de la matrice en cours...</p>
    </div>
  )

  if (error) return (
    <div className="p-8 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
    </div>
  )

  if (series.length === 0) return (
    <div className="p-12 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
        Pas assez de données pour générer la heatmap.
    </div>
  )

  // Calcul dynamique de l'échelle de couleur
  const allValues = series.flatMap(s => s.data)
  const maxVal = Math.max(...allValues) || 10

  const options: any = {
    chart: {
      type: "heatmap",
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: '#F3F4F6', name: 'Aucun' }, // Gris clair pour 0
            { from: 1, to: maxVal * 0.25, color: '#DBEAFE', name: 'Faible' },
            { from: maxVal * 0.25, to: maxVal * 0.5, color: '#60A5FA', name: 'Moyen' },
            { from: maxVal * 0.5, to: maxVal * 0.75, color: '#2563EB', name: 'Élevé' },
            { from: maxVal * 0.75, to: maxVal + 1000, color: '#1E3A8A', name: 'Très Élevé' }
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ["#fff"] },
    xaxis: { categories: xAxis },
    title: { text: "Matrice de Co-occurence", align: 'left', style: { fontSize: '16px' } }
  }

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Interactions entre Services</h2>
        <p className="text-sm text-gray-500">Fréquence des tests réalisés conjointement par différents services.</p>
      </div>
      <ReactApexChart options={options} series={series} type="heatmap" height={500} />
    </div>
  )
}