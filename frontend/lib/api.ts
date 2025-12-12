import axios from 'axios'

// 1. URL : Utilise localhost:8000 (ce que voit ton navigateur)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // MODIFICATION : Mets 0 (infini) ou 300000 (5 minutes) pour éviter l'AbortError
  timeout: 300000, 
  withCredentials: false, // Parfois nécessaire de le mettre à false en local pour éviter les conflits CORS
})

// 4. Intercepteur d’erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Affiche l'erreur précise renvoyée par FastAPI (detail)
    const message = error.response?.data?.detail || error.message || "Erreur inconnue"
    console.error('❌ API Error:', message)
    return Promise.reject(error)
  }
)

// === ENDPOINTS ===

// Health Check
export const health = () => apiClient.get('/')

// Loader
export const loader = {
  // Upload fichier via navigateur (La seule méthode active maintenant)
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/loader/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // On peut surcharger le timeout spécifiquement pour l'upload si besoin
      timeout: 120000, // 2 minutes max pour l'upload
    })
  },

  // Filtrage / subset
  subset: (filters: any) =>
    apiClient.post('/loader/subset', filters),
}

// LLM Assistant
export const llm = {
  query: (prompt: string) => apiClient.post('/llm/query', { prompt }),
}

// Panels
export const panels = {
  summary: () => apiClient.get("/panels/summary"),
  topPatients: () => apiClient.get("/panels/top-patients"),
  getPatientPanels: (numorden: string) =>
    apiClient.get(`/panels/patient/${numorden}`), 
  overTime: () => apiClient.get("/panels/over-time"),
}

// Repeats
export const repeats = {
  summary: () => apiClient.get("/repeats/summary"),
  topTests: () => apiClient.get("/repeats/top-tests"),
  trend: () => apiClient.get("/repeats/trend"),
  getPatientRepeats: (numorden: string) =>
    apiClient.get(`/repeats/patient/${numorden}`),
};

// Co-ordering
export const coordering = {
  getTopPairs: () => apiClient.get('/coordering/top-pairs'),
  getMatrixByService: () => apiClient.get('/coordering/matrix-by-service'),
}

// Export
export const exportApi = {
  exportPanelsCsv: () =>
    apiClient.get("/export/panels/csv", { responseType: "blob" }), // 'blob' est mieux pour télécharger des fichiers
  exportResultsExcel: () =>
    apiClient.get('/export/results/excel', { responseType: 'blob' }),
}

// Stats
export const stats = {
  summary: () => apiClient.get("/stats/summary"),
  bySex: () => apiClient.get("/stats/by-sex"),
  byService: () => apiClient.get("/stats/by-service"),
  test: (testName: string) =>
    apiClient.get(`/stats/test/${encodeURIComponent(testName)}`),
  activityTrend: () => apiClient.get("/stats/activity-trend"),
}