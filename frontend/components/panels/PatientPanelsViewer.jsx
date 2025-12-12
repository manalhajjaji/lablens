"use client";

import { useState } from "react";
import { panels, exportApi } from "@/lib/api";

export default function PatientPanelsViewer() {
  const [numorden, setNumorden] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // --- Charger un patient ---
  const fetchPatient = async () => {
    if (!numorden) return;
    setLoading(true);
    try {
      const res = await panels.getPatientPanels(numorden);
      setRows(res.data);
    } catch (err) {
      console.error("❌ Erreur lors du chargement:", err);
      alert("Erreur lors du chargement du patient");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white shadow rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-black mb-4">Panels par Patient</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={numorden}
          onChange={(e) => setNumorden(e.target.value)}
          className="border px-3 py-2 rounded-md text-black"
          placeholder="Entrer Numorden..."
        />

        <button
          onClick={fetchPatient}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Chargement..." : "OK"}
        </button>

        
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-black border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left border-b">Date</th>
                <th className="px-3 py-2 text-left border-b"># Tests</th>
                <th className="px-3 py-2 text-left border-b">Liste Tests</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b">{r.Date}</td>
                  <td className="px-3 py-2 border-b">{r.n_tests}</td>
                  <td className="px-3 py-2 border-b">{r.tests_list}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && !loading && (
        <p className="text-gray-500 mt-4">Aucun panel trouvé pour ce patient.</p>
      )}
    </div>
  );
}