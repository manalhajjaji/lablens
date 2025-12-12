'use client'

import { useState } from 'react'
import { Plus, Trash2, Filter } from 'lucide-react'

interface FilterCondition {
  column: string;
  operator: string;
  value: string;
}

interface FilterBuilderProps {
  onApply: (filters: { conditions: FilterCondition[]; logic: 'AND' | 'OR' }) => void;
}

const FIELDS = [
  { value: 'numorden', label: 'Numéro Ordre' },
  { value: 'sexo', label: 'Sexe' },
  { value: 'edad', label: 'Âge' },
  { value: 'nombre', label: 'Nom Test' },
  { value: 'nombre2', label: 'Service' },
  { value: 'Date', label: 'Date' },
]

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'contains', label: 'Contient' },
]

export default function FilterBuilder({ onApply }: FilterBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { column: 'sexo', operator: 'eq', value: '' }
  ])
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')

  const addCondition = () => {
    setConditions([...conditions, { column: 'sexo', operator: 'eq', value: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, key: keyof FilterCondition, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [key]: value }
    setConditions(updated)
  }

  const handleApply = () => {
    const validConditions = conditions.filter(c => c.value !== '')
    if (validConditions.length === 0) {
      alert('Ajoutez au moins une condition avec une valeur')
      return
    }
    onApply({ conditions: validConditions, logic })
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtres
        </h3>
        <select
          value={logic}
          onChange={(e) => setLogic(e.target.value as 'AND' | 'OR')}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      </div>

      {/* Conditions */}
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={condition.column}
              onChange={(e) => updateCondition(index, 'column', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              {FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              {OPERATORS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            <input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              placeholder="Valeur..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />

            <button
              onClick={() => removeCondition(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={addCondition}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
        >
          <Plus className="w-4 h-4" />
          Ajouter Condition
        </button>

        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Appliquer Filtres
        </button>
      </div>
    </div>
  )
}
