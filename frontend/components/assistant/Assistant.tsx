"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, Sparkles, Loader2, ChevronDown, ChevronUp, Database, Code, User } from "lucide-react"
import { llm } from "@/lib/api"
import { useDataContext } from "@/context/DataContext"

type Message = {
  role: "assistant" | "user"
  content: string
  data?: any
  code?: string
}

export default function FloatingAssistant() {
  const { isDataLoaded } = useDataContext()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Bonjour 👋 ! Je suis l'IA LabLens. Je peux analyser vos résultats ou répondre à vos questions sur les panels." }
  ])
  // State to track which message's data is expanded. Key is message index.
  const [expandedData, setExpandedData] = useState<Record<number, boolean>>({})
  const [expandedCode, setExpandedCode] = useState<Record<number, boolean>>({})
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleOpen = () => setIsOpen(!isOpen)

  const toggleData = (idx: number) => {
    setExpandedData(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toggleCode = (idx: number) => {
    setExpandedCode(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userText = input
    setInput("")
    setIsLoading(true)

    // 1. Ajouter le message utilisateur
    setMessages((prev) => [...prev, { role: "user", content: userText }])

    try {
      // 2. Appel API réel
      const response = await llm.query(userText)
      const { result, explanation, query_executed } = response.data

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: explanation, data: result, code: query_executed }
      ])
    } catch (error) {
      console.error("Erreur LLM:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolé, je n'ai pas réussi à traiter votre demande. Vérifiez que le backend est bien lancé." }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Ne pas afficher l'assistant tant que les données ne sont pas chargées
  if (!isDataLoaded) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      
      {/* --- FENÊTRE DE CHAT --- */}
      {isOpen && (
        <div className="mb-4 w-[380px] h-[600px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 ring-1 ring-black/5">
          
          {/* Header */}
          <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Assistant LabLens</h3>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-[10px] font-medium text-gray-500">IA Connectée</p>
                </div>
              </div>
            </div>
            <button 
              onClick={toggleOpen} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  msg.role === 'assistant' 
                    ? 'bg-white border-indigo-100 text-indigo-600' 
                    : 'bg-blue-600 border-blue-600 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bulle de message */}
                <div className={`flex flex-col max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3.5 text-sm shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm border-blue-600' 
                      : 'bg-white text-gray-700 rounded-2xl rounded-tl-sm border-gray-200'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>

                  {/* --- CODE VIEWER --- */}
                  {msg.code && (
                    <div className="w-full">
                        <button 
                            onClick={() => toggleCode(idx)}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 hover:text-indigo-600 transition-colors ml-1"
                        >
                            <Code className="w-3 h-3" />
                            {expandedCode[idx] ? "Masquer le code" : "Voir le code généré"}
                        </button>
                        {expandedCode[idx] && (
                            <div className="mt-2 p-3 bg-gray-900 text-gray-300 rounded-xl text-[10px] font-mono overflow-x-auto border border-gray-800 shadow-inner">
                                <div className="flex items-center gap-2 mb-2 text-gray-500 border-b border-gray-800 pb-1">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                  </div>
                                  <span>python</span>
                                </div>
                                <code className="block whitespace-pre">{msg.code}</code>
                            </div>
                        )}
                    </div>
                  )}

                  {/* --- DATA VIEWER --- */}
                  {msg.data !== undefined && msg.data !== null && (
                    <div className="w-full mt-1">
                      
                      {/* CAS 1 : C'est un Tableau (Liste de résultats) */}
                      {Array.isArray(msg.data) && msg.data.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          <button 
                            onClick={() => toggleData(idx)}
                            className="flex items-center justify-between w-full px-3 py-2.5 bg-gray-50/50 hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
                          >
                            <span className="flex items-center gap-2 text-indigo-600">
                              <Database className="w-3.5 h-3.5" />
                              {msg.data.length} résultats trouvés
                            </span>
                            {expandedData[idx] ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                          </button>

                          {expandedData[idx] && (
                            <div className="border-t border-gray-100 max-h-[200px] overflow-y-auto custom-scrollbar">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                                  <tr>
                                    {typeof msg.data[0] === 'object' && msg.data[0] !== null ? (
                                      Object.keys(msg.data[0]).slice(0, 4).map((key) => (
                                        <th key={key} className="px-3 py-2 font-medium border-b border-gray-100 whitespace-nowrap bg-gray-50">
                                          {key}
                                        </th>
                                      ))
                                    ) : (
                                      <th className="px-3 py-2 font-medium border-b border-gray-100 bg-gray-50">Valeur</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {msg.data.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                      {typeof row === 'object' && row !== null ? (
                                        Object.values(row).slice(0, 4).map((val: any, j: number) => (
                                          <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-600">
                                            {String(val)}
                                          </td>
                                        ))
                                      ) : (
                                        <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                                          {String(row)}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* CAS 2 : Valeur unique */
                        <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium">
                           <Database className="w-3.5 h-3.5" />
                           <span>Résultat : {typeof msg.data === 'object' ? JSON.stringify(msg.data) : String(msg.data)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "L'IA réfléchit..." : "Posez une question..."}
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 text-sm text-black bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 placeholder:text-gray-400"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              L'IA peut faire des erreurs. Vérifiez les résultats.
            </p>
          </div>
        </div>
      )}

      {/* --- BOUTON FLOTTANT (FAB) --- */}
      <button
        onClick={toggleOpen}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
          isOpen ? 'bg-gray-900 rotate-90' : 'bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 text-white" />
            {/* Petit badge de notification */}
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          </>
        )}
      </button>
    </div>
  )
}