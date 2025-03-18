"use client";
import { useState, useEffect } from "react";

export default function NodePage() {
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [containers, setContainers] = useState<{ name: string; status: string}[]>([]);
  const [loadingConsult, setLoadingConsult] = useState(false);
  const [loadingNewNode, setLoadingNewNode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNetworks() {
      try {
        const res = await fetch("/api/docker-networks");
        if (!res.ok) throw new Error("Error al obtener redes");
        const data = await res.json();
        setNetworks(data);
      } catch (err) {
        setError("Error cargando redes");
      }
    }
    fetchNetworks();
  }, []);

  async function consultarContenedores() {
    if (!selectedNetwork) return;

    setLoadingConsult(true);
    setError("");

    try {
      const res = await fetch(`/api/docker-networks?network=${selectedNetwork}`); 
      if (!res.ok) throw new Error("Error al obtener contenedores");
      const data = await res.json();
      setContainers(data);
    } catch (err) {
      setError("Error al consultar contenedores");
    } finally {
      setLoadingConsult(false);
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "running") {
      return <span className="text-green-500">&#9679;</span>; // Círculo verde
    } else if (status === "exited") {
      return <span className="text-red-500">&#9679;</span>; // Círculo rojo
    } else {
      return <span className="text-gray-500">&#9679;</span>; // Círculo gris (desconocido)
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Node Management</h1>
      <p>View containers here</p>
      <br />

      <div className="mt-4">
        <label className="block font-semibold">Docker network</label>
        <select
          className="border p-2 w-64"
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
        >
          <option value="">-- Select  --</option>
          {networks.map((net) => (
            <option key={net} value={net}>
              {net}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={consultarContenedores}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        disabled={!selectedNetwork || loadingConsult}
      >
        {loadingConsult ? "Consulting..." : "Consult"}
      </button>

      {containers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold">Nodes/Containers in {selectedNetwork}</h2>
          <table className="border-collapse border border-gray-300 w-90 mt-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">State</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.name} className="border border-gray-300">
                  <td className="border border-gray-300 p-2">{container.name}</td>
                  <td className="border border-gray-300 p-2">
                    {getStatusIcon(container.status)} {container.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );

}