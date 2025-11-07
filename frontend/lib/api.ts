// lib/api.ts
import axios from 'axios'

// 1. URL du backend (pour Codespaces)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://didactic-engine-r4p4749v654g3xv5g-8000.app.github.dev'

//  2. Log utile pour debug
console.log('🌍 Backend API URL:', API_BASE_URL)

//  3. Configuration Axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: false,
})

//  4. Intercepteur d’erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// === ENDPOINTS ===

//  Health Check
export const health = () => apiClient.get('/')

//  Stats
export const stats = {
  getSummary: () => apiClient.get('/stats/summary'),
  getTestStats: (testName: string) => apiClient.get(`/stats/test/${testName}`),
}

//  Loader
export const loader = {
  // Charger et nettoyer le fichier local
  uploadLocal: () => apiClient.post('/loader/upload_local'),

  // Upload fichier via navigateur
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/loader/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Filtrage / subset
  subset: (filters: any) =>
    apiClient.post('/loader/subset', filters, {
      
    }),
}

//  Panels
export const panels = {
  getPatientPanels: (numorden: string) =>
    apiClient.get(`/panels/patient/${numorden}`),
}

//  Repeats
export const repeats = {
  getPatientRepeats: (numorden: string) =>
    apiClient.get(`/repeats/patient/${numorden}`),
}

//  Co-ordering
export const coordering = {
  getTopPairs: () => apiClient.get('/coordering/top-pairs'),
}

//  Export
export const exportApi = {
  exportPanelsCsv: () =>
    apiClient.get('/export/panels/csv', { responseType: 'blob' }),
  exportResultsExcel: () =>
    apiClient.get('/export/results/excel', { responseType: 'blob' }),
}
